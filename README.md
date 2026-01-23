Based on the code files provided, here is a comprehensive `README.md` for the **Naaptol** project.

---

# Naaptol: AI Financial Companion for Students

**Naaptol** is an intelligent financial dashboard and AI assistant designed specifically for international students. It goes beyond simple expense tracking by combining a visual dashboard with a conversational AI that understands Purchasing Power Parity (the "Banana Index"), generates "Spotify Wrapped"-style financial stories, and performs real-time web searches to provide relevant financial advice.

Built with **Next.js** and **FastAPI**, it leverages the **Thesys GenUI SDK** to stream interactive UI components (artifacts) directly to the user.

## 🚀 Key Features

### 1. 📊 Interactive Student Dashboard

* **Visual Transaction Calendar:** A monthly calendar view that visualizes spending intensity and daily habits.
* **Smart KPI Cards:** Tracks Current Balance (USD/INR), Total Spending, and Daily Averages.
* **The "Banana Index":** A custom Purchasing Power Parity (PPP) metric that helps students understand the real value of their money (e.g., "1 USD = 1 Banana in US vs. 12 Bananas in India").

### 2. 💬 Context-Aware AI Chat

* **Financial Assistant:** Ask questions like *"Analyze my spending on food vs. transport"* or *"Can I afford a trip to Taipei?"*.
* **Tool-Use Capabilities:**
* **Web Search (Exa.ai):** Fetches real-time currency conversion rates and local prices.
* **Transaction Management:** Adds new transactions directly via chat.


* **Generative UI:** The AI doesn't just reply with text; it generates interactive charts and slides.

### 3. 🎁 Spending Wrapped

* Generates a **"Wrapped-style" storytelling deck** for your finances.
* Uses AI to analyze monthly data and present it with humor, irony, and insights (e.g., "Your top craving was Chipotle").
* Exportable to PDF.

### 4. ⚡ Real-time Streaming

* Utilizes Server-Sent Events (SSE) to stream AI responses and UI artifacts instantly without buffering.

---

## 🛠️ Tech Stack

### Frontend

* **Framework:** [Next.js 15](https://nextjs.org/) (App Router)
* **UI Library:** React 19, Tailwind CSS
* **Animation:** Framer Motion
* **AI SDK:** `@thesysai/genui-sdk`, `@crayonai/react-ui`

### Backend

* **Framework:** [FastAPI](https://fastapi.tiangolo.com/)
* **Language:** Python 3.10+
* **Data Processing:** Pandas
* **LLM Orchestration:** OpenAI SDK (connected to Thesys/Anthropic models)
* **Search Engine:** [Exa.ai](https://exa.ai/)

---

## ⚙️ Installation & Setup

### Prerequisites

* Node.js (v18+)
* Python (v3.10+)
* API Keys for **Thesys** and **Exa.ai**

### 1. Backend Setup

Navigate to the backend directory and set up the Python environment.

```bash
cd backend

# Create a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows use `venv\Scripts\activate`

# Install dependencies
pip install -r requirements.txt

```

Create a `.env` file in the `backend/` directory:

```env
THESYS_API_KEY=your_thesys_api_key_here
EXA_API_KEY=your_exa_api_key_here

```

Run the server:

```bash
uvicorn main:app --reload

```

*The backend will start at `http://localhost:8000`.*

### 2. Frontend Setup

Navigate to the root directory (where `package.json` is located).

```bash
# Install dependencies
npm install
# or
pnpm install

# Run the development server
npm run dev

```

*The frontend will start at `http://localhost:3000`.*

---

## 📂 Project Structure

```
├── backend/
│   ├── main.py              # FastAPI entry point & endpoints
│   ├── llm_runner.py        # LLM logic, tool definitions, & system prompts
│   ├── thread_store.py      # In-memory chat history management
│   ├── student_transactions.csv # Data source for transactions
│   └── requirements.txt     # Python dependencies
├── src/
│   ├── app/
│   │   ├── components/      # React components (Dashboard, Chat, KPI Cards)
│   │   │   ├── StudentDashboard.tsx # Main dashboard logic
│   │   │   └── ...
│   │   ├── hooks/           # Custom hooks (useTheme, useFileHandler)
│   │   └── page.tsx         # Main entry route
│   └── config.ts            # Chat suggestion configuration
├── public/                  # Static assets (SVGs)
└── package.json             # Frontend dependencies

```

## 🔌 API Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/transactions` | Returns the list of student transactions from CSV. |
| `POST` | `/chat` | Main chat endpoint. Streams LLM responses & tool calls. |
| `POST` | `/generate-spending-wrapped` | Triggers the creation of the financial storytelling deck. |
| `POST` | `/api/export-pdf` | Exports the generated artifact (Wrapped slides) to PDF. |
| `GET` | `/threads` | Lists active chat threads. |

## 🧠 AI System Prompt Details

The AI is configured in `backend/llm_runner.py` with specific behaviors:

* **Persona:** A witty, "internet-native" friend who roasts your spending habits lovingly.
* **Rules:**
* Always prioritizes storytelling over raw numbers.
* Uses the **Banana Index** for PPP comparisons.
* **Tool Usage:** Strictly uses `web_search` for currency/news and internal knowledge for general advice.



## 🤝 Contributing

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/amazing-feature`).
3. Commit your changes.
4. Push to the branch.
5. Open a Pull Request.

## 📄 License

This project is licensed under the MIT License.