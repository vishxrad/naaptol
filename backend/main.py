from fastapi import FastAPI, HTTPException, Body, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from llm_runner import generate_stream, ChatRequest
from thesys_genui_sdk.fast_api import with_c1_response
from thread_store import thread_store
from pydantic import BaseModel
from typing import List, Dict, Any
import pandas as pd

app = FastAPI()

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