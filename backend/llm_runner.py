import os
import json
import asyncio
from typing import List, Literal, Optional
from pydantic import BaseModel
from typing_extensions import TypedDict
from dotenv import load_dotenv

# OpenAI and Exa imports
from openai import AsyncOpenAI
from openai.types.chat import ChatCompletionMessageParam, ChatCompletionToolParam
from exa_py import Exa

# Thesys imports
from thread_store import Message, thread_store
from thesys_genui_sdk.context import get_assistant_message, write_content, write_think_item

load_dotenv()

# 1. Initialize Clients
client = AsyncOpenAI(
    api_key=os.getenv("THESYS_API_KEY"),
    base_url="https://api.thesys.dev/v1/embed",
)


# Read student transactions CSV
try:
    with open("student_transactions.csv", "r") as f:
        csv_content = f.read()
except FileNotFoundError:
    csv_content = "No transaction data available."

SYSTEM_PROMPT = {
    "role": "system",
    "content": f"""
    You are a helpful AI assistant with access to a web search tool.
    
    # STUDENT TRANSACTIONS DATA
    You have access to the following student transaction data in CSV format:
    
    {csv_content}
    
    When answering questions about student transactions, use this data.

    # TOOL USAGE GUIDELINES
    You generally have broad knowledge up to 2025. You MUST NOT use the search tool for:
    1. General knowledge questions (e.g., "What is mitochondria?", "Who is Shakespeare?").
    2. Coding tasks (e.g., "Write a Python script for...", "Debug this code").
    3. Creative writing or summarization of text provided in the chat.
    4. Questions that can be answered with common sense.

    # WHEN TO USE SEARCH
    ONLY use the 'web_search' tool if:
    1. The user specifically asks for "latest", "current", "news", or "today's" information.
    2. The topic is obscure or highly specific (e.g., a specific local restaurant menu).
    3. The query explicitly asks to "search for" something.
    
    If you are unsure, answer without searching first.
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