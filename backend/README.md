# FastAPI Backend

A simple FastAPI server with a `/chat` endpoint.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set up environment variables:
Create a `.env` file in the backend directory with:
```bash
THESYS_API_KEY=your_thesys_api_key
EXA_API_KEY=your_exa_api_key  # Required for web search functionality
```

3. Run the server:
```bash
uvicorn main:app --reload
```

The server will be available at http://localhost:8000

## Features

- **Web Search via Exa.ai**: The LLM can now search the internet for up-to-date information using the `web_search` tool. When the LLM needs current information, it will automatically call this tool to fetch relevant web content with citations.
- **Proper UI Handling**: Tool calls show thinking states in the UI while searches are being executed, ensuring smooth rendering even when searches take time.

## API Endpoints

- `GET /`: Health check endpoint
- `POST /chat`: Chat endpoint that accepts JSON with a "message" field

## API Documentation

Once the server is running, you can access the auto-generated API documentation at:
- http://localhost:8000/docs
- http://localhost:8000/redoc
