import os
import json
import csv
import asyncio
from typing import List, Literal, Optional
from pydantic import BaseModel, Field
from typing_extensions import TypedDict
from dotenv import load_dotenv
from datetime import date

# OpenAI and Exa imports
from openai import AsyncOpenAI
from openai.types.chat import ChatCompletionMessageParam, ChatCompletionToolParam
from exa_py import Exa

# Thesys imports
from thread_store import Message, thread_store
from thesys_genui_sdk.context import get_assistant_message, write_content, write_think_item

import nanoid

load_dotenv()

# 1. Initialize Clients
client = AsyncOpenAI(
    api_key=os.getenv("THESYS_API_KEY"),
    base_url="https://api.thesys.dev/v1/embed",
)

c1_artifacts_client = AsyncOpenAI(
    api_key=os.getenv("THESYS_API_KEY"),
    base_url="https://api.thesys.dev/v1/artifact",
)


# Read student transactions CSV
try:
    with open("student_transactions.csv", "r") as f:
        csv_content = f.read()
except FileNotFoundError:
    csv_content = "No transaction data available."

today = date.today()
print(today)

SYSTEM_PROMPT = {
    "role": "system",
    "content": f"""
    You are a smart, helpful AI financial assistant for international students. Your goal is to analyze their bank statements {csv_content}, identify savings opportunities, and provide clear financial insights.

    **Role & Behavior:**
    - **Audience:** Students studying abroad. Keep advice simple, jargon-free, and supportive. Try not to use emojis!
    - **Cognitive Load:** Minimize effort for the user. Be concise and use visuals.
    - **Greeting:** Always start with a polite and friendly greeting, then address the user's query directly. 
    - **Context:** The current year is 2026. and the current date is {today}
    - DONT BE TEXT HEAVY. YOU ARE SUPPOSED TO BE A GENERATIVE UI MODEL. ASK IN UI ELEMNTS.
    **Data & Currency:**
    - Use the provided transaction data to answer questions.
    - Discuss amounts in the transaction currency.
    - When relevant, also provide estimates in the user's **Country of Residence** currency (Home Currency).
    
    **Visual Representation Guidelines:**
    You must use charts to make data easy to understand:
    - **Pie Charts:** For category-wise spending analysis.
    - **Area or Bar Graphs:** For comparisons (e.g., spending over time or between categories).
    - **Line Graphs:** For simulations, projections, and trends.

    # TOOL USAGE GUIDELINES
    You have broad internal knowledge up to 2025. 
    
    **FORBIDDEN USES (Do NOT use 'web_search'):**
    
    1. General knowledge queries (e.g., "Who is Shakespeare?").
    2. Coding tasks or debugging.
    3. Creative writing or summarization.
    4. Common sense questions.

    **REQUIRED USES (Use 'web_search'):**
    1. Currency conversion (DO NOT use your internal knowledge for estimates).
    2. When the user specifically asks for **"latest"**, **"current"**, **"news"**, or **"today's"** information.
    3. For obscure or highly specific topics (e.g., a specific local restaurant menu).
    4. When the query explicitly asks to "search for" something.

    If unsure, rely on your internal knowledge first.
    """
}

# Initialize Exa
exa = Exa(api_key=os.getenv("EXA_API_KEY"))

# 2. Define the Search Tool Schema
tools: List[ChatCompletionToolParam] = [
    {
        "type": "function",
        "function": {
            "name": "web_search",
            "description": """
            Search the web for real-time information.
            
            Examples of when to use:
            - User: "What is the score of the match today?" -> USE TOOL
            - User: "What is the stock price of NVDA?" -> USE TOOL
            
            Examples of when NOT to use:
            - User: "How do I make a HTTP request in Python?" -> DO NOT USE
            - User: "What is the capital of France?" -> DO NOT USE
            """,
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "The search query."
                    }
                },
                "required": ["query"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "add_transaction",
            "description": "Add a new transaction to the student transactions file.",
            "parameters": {
                "type": "object",
                "properties": {
                    "date": {
                        "type": "string",
                        "description": "The date of the transaction (e.g., 'MM/DD/YYYY')."
                    },
                    "description": {
                        "type": "string",
                        "description": "Description of the transaction."
                    },
                    "amount": {
                        "type": "number",
                        "description": "The amount of the transaction (positive number)."
                    },
                    "transaction_type": {
                        "type": "string",
                        "enum": ["credit", "debit"],
                        "description": "Type of transaction: 'credit' (add money) or 'debit' (spend money)."
                    }
                },
                "required": ["date", "description", "amount", "transaction_type"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "generate_spending_wrapped",
            "description": "Generate a spending wrapped artifact summarizing the student's spending for the year.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": []
            }
        }
    }
]

# Types from your original code
class Prompt(TypedDict):
    role: Literal["user"]
    content: str
    id: str

class ChatRequest(BaseModel):
    prompt: Prompt
    threadId: str
    responseId: str

    class Config:
        extra = "allow"



class CreatePresentationParams(BaseModel):
    instructions: str = Field(..., description="The instructions to generate the presentation.")

create_presentation_tool = {
    "type": "function",
    "function": {
        "name": "create_presentation",
        "description": "Creates a slide presentation based on a instructions.",
        "parameters": CreatePresentationParams.model_json_schema(),
    },
}

async def add_transaction_to_csv(date: str, description: str, amount: float, transaction_type: str):
    await write_think_item(
        title="Adding transaction...",
        description=f"Adding {transaction_type} of ${amount} for '{description}'"
    )

    try:
        rows = []
        with open("student_transactions.csv", "r") as f:
            reader = csv.DictReader(f)
            rows = list(reader)
        
        last_balance = 0.0
        if rows:
            # Handle potential empty strings or malformed data in CSV
            try:
                last_balance = float(rows[-1]['Balance'])
            except ValueError:
                last_balance = 0.0
        
        debit_val = ""
        credit_val = ""
        amount = float(amount)
        
        if transaction_type.lower() == 'debit':
            debit_val = f"-{amount:.2f}"
            new_balance = last_balance - amount
        else:
            credit_val = f"{amount:.2f}"
            new_balance = last_balance + amount
            
        new_row = {
            "Date": date,
            "Description": description,
            "Debit": debit_val,
            "Credit": credit_val,
            "Balance": f"{new_balance:.2f}"
        }
        
        with open("student_transactions.csv", "a", newline='') as f:
            writer = csv.DictWriter(f, fieldnames=["Date","Description","Debit","Credit","Balance"])
            writer.writerow(new_row)
            
        return json.dumps({"status": "success", "message": f"Added transaction. New Balance: {new_balance:.2f}"})

    except Exception as e:
        return json.dumps({"error": str(e)})

async def generate_spending_wrapped():
    artifact_id = nanoid.generate(size=10)
    message_id = nanoid.generate(size=10)
    instructions = f"Create slides summarizing the student's spending for 2025 based on the following transactions: {csv_content}"
    artifact_stream = await c1_artifacts_client.chat.completions.create(
        model="c1/artifact/v-20251030",
        messages=[{"role": "user", "content": instructions}],
        metadata={"thesys": json.dumps({"c1_artifact_type": "slides", "id": artifact_id})},
        stream=True,
    )
    async for delta in artifact_stream:
        content = delta.choices[0].delta.content
        if content:
            await write_content(content)
    return f"Spending wrapped created with artifact_id: {artifact_id}, version: {message_id}"

async def web_search(query: str):
    await write_think_item(
        title="Searching the web...",
        description=f"Looking for information on '{query}'"
    )

    print(f"Searching Exa for: {query}")
    
    try:
        # Exa Search Execution
        search_response = exa.search_and_contents(
            query,
            num_results=3,
            text=True,
            highlights=True
        )
        
        # Serialize results for LLM
        return json.dumps([
            {
                "title": r.title, 
                "url": r.url, 
                "snippet": r.highlights[0] if r.highlights else r.text[:300]
            } 
            for r in search_response.results
        ])
    except Exception as e:
        return json.dumps({"error": str(e)})

async def generate_stream(chat_request: ChatRequest):
    # 1. Setup History
    conversation_history: List[ChatCompletionMessageParam] = thread_store.get_messages(chat_request.threadId)
    
    # --- CRITICAL CHANGE: Ensure System Prompt is always at index 0 ---
    if not conversation_history or conversation_history[0].get("role") != "system":
        # If no history, or first message isn't system, insert it.
        # Note: If history exists but lacks system prompt, this injects it safely.
        conversation_history.insert(0, SYSTEM_PROMPT)
    
    conversation_history.append(chat_request.prompt)
    
    # Store user message immediately
    thread_store.append_message(chat_request.threadId, Message(
        openai_message=chat_request.prompt,
        id=chat_request.prompt['id']
    ))

    # 2. Loop for Tool Calling (Action -> Observation -> Answer)
    # We use a loop to handle cases where the model searches, gets results, and then generates the final answer.
    max_turns = 10
    current_turn = 0
    final_assistant_content = ""

    print(f"Starting generation loop for thread {chat_request.threadId}")

    while current_turn < max_turns:
        current_turn += 1
        print(f"Turn {current_turn}/{max_turns}")
        
        # Call the LLM with tools enabled
        stream = await client.chat.completions.create(
            messages=conversation_history,
            model="c1/anthropic/claude-sonnet-4/v-20250815",
            stream=True,
            tools=tools, 
        )

        tool_calls_buffer = {}
        finish_reason = None
        has_content = False
        
        # Iterate over the stream
        async for chunk in stream:
            delta = chunk.choices[0].delta
            finish_reason = chunk.choices[0].finish_reason

            # Case A: Model is speaking text (Final Answer)
            if delta.content:
                has_content = True
                final_assistant_content += delta.content
                await write_content(delta.content)
                await asyncio.sleep(0)

            # Case B: Model is calling a tool (Accumulate chunks)
            if delta.tool_calls:
                for tool_chunk in delta.tool_calls:

                    index = tool_chunk.index
                    
                    if index not in tool_calls_buffer:
                        tool_calls_buffer[index] = {
                            "id": tool_chunk.id,
                            "function": {"name": "", "arguments": ""},
                            "type": "function"
                        }
                    
                    if tool_chunk.id:
                        tool_calls_buffer[index]["id"] = tool_chunk.id
                    if tool_chunk.function.name:
                        tool_calls_buffer[index]["function"]["name"] += tool_chunk.function.name
                    if tool_chunk.function.arguments:
                        tool_calls_buffer[index]["function"]["arguments"] += tool_chunk.function.arguments

        print(f"Turn {current_turn} finished. Reason: {finish_reason}. Content length: {len(final_assistant_content)}")

        # 3. Handle End of Turn Logic
        if finish_reason == "tool_calls":
            print("Processing tool calls...")
            # The model wants to search. 
            
            # Reconstruct list of tool calls from buffer
            complete_tool_calls = [
                {
                    "id": val["id"],
                    "type": "function",
                    "function": {
                        "name": val["function"]["name"],
                        "arguments": val["function"]["arguments"]
                    }
                } 
                for val in tool_calls_buffer.values()
            ]

            # A. Add the Assistant's "Tool Call" request to history
            conversation_history.append({
                "role": "assistant",
                "content": None,
                "tool_calls": complete_tool_calls
            })

            # B. Execute Tools
            for tool_call in complete_tool_calls:
                fn_name = tool_call['function']['name']
                fn_args = json.loads(tool_call['function']['arguments'])

                if fn_name == "web_search":
                    tool_output = await web_search(query=fn_args.get("query"))
                    print(tool_output)
                    # C. Add the "Tool Result" to history
                    conversation_history.append({
                        "role": "tool",
                        "tool_call_id": tool_call['id'],
                        "content": tool_output
                    })
                    await asyncio.sleep(1)
                
                elif fn_name == "add_transaction":
                    tool_output = await add_transaction_to_csv(
                        date=fn_args.get("date"),
                        description=fn_args.get("description"),
                        amount=fn_args.get("amount"),
                        transaction_type=fn_args.get("transaction_type")
                    )
                    print(tool_output)
                    conversation_history.append({
                        "role": "tool",
                        "tool_call_id": tool_call['id'],
                        "content": tool_output
                    })
                    await asyncio.sleep(1)
                
                elif fn_name == "generate_spending_wrapped":
                    tool_output = await generate_spending_wrapped()
                    print(tool_output)
                    conversation_history.append({
                        "role": "tool",
                        "tool_call_id": tool_call['id'],
                        "content": tool_output
                    })
                    await asyncio.sleep(1)

            # D. Loop continues -> The LLM will now see the search results and generate the text response
            continue
        
        elif finish_reason == "stop":
            print("Generation finished.")
            # The model is done generating the final answer.
            
            # Construct final assistant message for storage
            final_msg = {
                "role": "assistant",
                "content": final_assistant_content
            }
            
            # Add to history if not already there (it might be redundant if we just streamed it)
            if conversation_history[-1].get("role") != "assistant":
                conversation_history.append(final_msg)
            
            # Save to persistent storage
            thread_store.append_message(chat_request.threadId, Message(
                openai_message=final_msg,
                id=chat_request.responseId
            ))
            
            break
        
        else:
            print(f"Unknown finish reason: {finish_reason}. Breaking loop.")
            break
    
    if current_turn >= max_turns:
        print("Max turns reached.")