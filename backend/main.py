from fastapi import FastAPI, HTTPException, Body, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from llm_runner import generate_stream, ChatRequest
from thesys_genui_sdk.fast_api import with_c1_response
from thesys_genui_sdk.context import write_content
from thread_store import thread_store
from pydantic import BaseModel
from typing import List, Dict, Any
import pandas as pd
from openai import AsyncOpenAI
import nanoid
import json
import os
import httpx 
from fastapi.responses import StreamingResponse

app = FastAPI()

c1_artifacts_client = AsyncOpenAI(
    api_key=os.getenv("THESYS_API_KEY"),
    base_url="https://api.thesys.dev/v1/artifact",
)

try:
    with open("student_transactions.csv", "r") as f:
        csv_content = f.read()
except FileNotFoundError:
    csv_content = "No transaction data available."

# --- FIX 1: Add No-Buffering Middleware ---
# This forces every response to have headers that disable buffering.
# Critical for SSE to work in Chrome/Brave and behind proxies.
class NoBufferingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        # Check if it's the chat endpoint or an event stream
        if request.url.path.endswith("/chat") or "text/event-stream" in response.headers.get("content-type", ""):
            response.headers["Cache-Control"] = "no-cache, no-transform"
            response.headers["X-Accel-Buffering"] = "no" # Fix for Nginx/Vercel
            response.headers["Connection"] = "keep-alive"
        return response

app.add_middleware(NoBufferingMiddleware)

# Enable CORS for local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "ok"}

@app.get("/transactions")
def get_transactions():
    try:
        df = pd.read_csv("student_transactions.csv")
        # Clean up data for JSON serialization (handle NaN)
        df = df.fillna(0)
        return df.to_dict(orient="records")
    except Exception as e:
        print(f"Error reading transactions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat")
@with_c1_response()
async def chat_endpoint(request: ChatRequest):
    # Ensure your llm_runner.py has 'await asyncio.sleep(0)' 
    # inside the text generation loop as well!
    await generate_stream(request)

@app.post("/generate-spending-wrapped")
@with_c1_response()
async def generate_spending_wrapped_endpoint():
    prompt = f""" You are an AI presentation generator that creates a monthly “Wrapped-style” financial storytelling deck from bank transaction data: {csv_content}.

Your goal is to turn raw financial transactions into:
- fun,
- ironic,
- emotionally relatable,
- visually engaging insights

similar to Spotify Wrapped — but for money.

You must:
1. Parse and analyze the CSV transaction data accurately.
2. Group insights month-wise.
3. Detect spending patterns, habits, categories, and trends.
4. Highlight surprises, guilty pleasures, wins, and “oops” moments.
5. Present everything as a slide-by-slide narrative, not a boring report.

Do NOT behave like a finance professor.
Behave like a witty, self-aware internet narrator who knows money is emotional.

Prioritize storytelling > charts > numbers.
Reduce cognitive load.
Make the user feel seen, attacked (lovingly), and amused.


Tone:
- Silly
- Playful
- Light sarcasm
- Internet-humor
- Self-aware irony
- Non-judgmental but honest

Language:
- Simple English
- Casual Hinglish allowed
- Emojis are encouraged 😣🤑💰📉📈🔥💀

Never shame the user.
Roast the *transactions*, not the person.

Think:
“Best friend who exposes your spending habits but still loves you.”
"""
    artifact_id = nanoid.generate(size=10)
    artifact_stream = await c1_artifacts_client.chat.completions.create(
        model="c1/artifact/v-20251030",
        messages=[{"role": "user", "content": prompt}],
        metadata={"thesys": json.dumps({"c1_artifact_type": "slides", "id": artifact_id})},
        stream=True,
    )
    async for delta in artifact_stream:
        content = delta.choices[0].delta.content
        if content:
            await write_content(content)


@app.post("/api/export-pdf")
async def export_artifact_as_pdf(request: Request):
    data = await request.json()
    export_params = data.get("exportParams")

    if not export_params:
        raise HTTPException(status_code=400, detail="exportParams not provided")

    headers = {
        "Authorization": f"Bearer {os.getenv('THESYS_API_KEY')}",
        "Content-Type": "application/json",
    }
    
    async with httpx.AsyncClient() as client:
        # Use a streaming request to handle large files
        async with client.stream(
            "POST",
            "https://api.thesys.dev/v1/artifact/pdf/export",
            headers=headers,
            json={"exportParams": export_params},
        ) as response:
            response.raise_for_status()
            
            # Stream the PDF content back to the client
            return StreamingResponse(
                response.aiter_bytes(),
                media_type="application/pdf",
                headers={"Content-Disposition": "attachment; filename=spending_wrapped.pdf"}
            )
        


# --- Thread CRUD (Unchanged) ---

class CreateThreadRequest(BaseModel):
    name: str

class UpdateThreadRequest(BaseModel):
    threadId: str
    name: str

@app.get("/threads")
def get_threads():
    return thread_store.list_threads()

@app.post("/thread")
def create_thread(req: CreateThreadRequest):
    return thread_store.create_thread(req.name)

@app.delete("/thread/{thread_id}")
def delete_thread(thread_id: str):
    thread_store.delete_thread(thread_id)
    return {"status": "deleted"}

@app.put("/thread/{thread_id}")
def update_thread(thread_id: str, req: UpdateThreadRequest):
    t = thread_store.update_thread(thread_id, req.name)
    if not t:
        raise HTTPException(status_code=404, detail="Thread not found")
    return t

@app.get("/thread/{thread_id}/messages")
def get_thread_messages(thread_id: str):
    messages = thread_store.get_messages_all(thread_id)
    ui_messages = []
    for msg in messages:
        openai_msg = msg.get('openai_message', {})
        role = openai_msg.get('role')
        tool_calls = openai_msg.get('tool_calls')
        
        if role == 'tool':
            continue
        if role == 'assistant' and tool_calls:
            continue
            
        flattened = openai_msg.copy()
        if msg.get('id'):
            flattened['id'] = msg['id']
        ui_messages.append(flattened)
        
    return ui_messages

@app.post("/thread/{thread_id}/message")
def add_message(thread_id: str, message: Dict[str, Any] = Body(...)):
    msg_id = message.get('id')
    openai_msg = message.copy()
    if 'id' in openai_msg:
        del openai_msg['id']
        
    stored_msg = {
        "openai_message": openai_msg,
        "id": msg_id
    }
    thread_store.append_message(thread_id, stored_msg)
    return {"message": "added"}

@app.put("/thread/{thread_id}/message")
def update_message(thread_id: str, message: Dict[str, Any] = Body(...)):
    msg_id = message.get('id')
    openai_msg = message.copy()
    if 'id' in openai_msg:
        del openai_msg['id']
        
    stored_msg = {
        "openai_message": openai_msg,
        "id": msg_id
    }
    thread_store.update_message(thread_id, stored_msg)
    return {"message": "updated"}