# 💰 FinanceBot — AI-Powered Finance Assistant

A full-stack **RAG (Retrieval Augmented Generation)** application for analyzing personal expense documents using AI. Upload PDF financial statements, ask natural language questions, and get intelligent responses with interactive visualizations.

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────┐
│              Nginx (port 80) — Reverse Proxy        │
├────────────────┬────────────────────────────────────┤
│  React SPA     │  /api/* → Express.js (port 5000)  │
│  (static)      │  /rag/* → Python Flask (port 8000) │
│                │           ↕ ChromaDB (embedded)    │
│                │  MongoDB (port 27017)              │
└────────────────┴────────────────────────────────────┘
```

## ✨ Features

- **Chat Interface** — Dashboard-style chat with conversation history
- **RAG Pipeline** — LangChain + LangGraph + ChromaDB
- **Multi-Provider LLM** — Supports **Groq** (LLaMA 3.3, free) and **OpenAI** (GPT-4o-mini)
- **Interactive Charts** — Bar, Pie, Line charts via Recharts (separate Visualizations tab)
- **PDF Upload** — Drag-and-drop document ingestion
- **JWT Auth** — Secure user registration and login
- **Dark/Light Theme** — Toggle with localStorage persistence
- **API Key Management** — Users bring their own Groq or OpenAI API key
- **Docker-Ready** — Full production deployment with 5 containerized services

## 🚀 Quick Start (Local Development)

### Prerequisites
- **Node.js** 18+ and npm
- **Python** 3.10+
- **MongoDB** installed and running locally
- A **Groq** ([console.groq.com](https://console.groq.com)) or **OpenAI** ([platform.openai.com](https://platform.openai.com/api-keys)) API key

### Step 1 — Start MongoDB
```bash
# Verify MongoDB is running
mongosh
# If not running:
net start MongoDB
```

### Step 2 — Python RAG Service (Terminal 1)
```bash
cd python-rag
pip install -r requirements.txt
python app.py
# ✅ Running on http://127.0.0.1:8000
```

### Step 3 — Express.js Backend (Terminal 2)
```powershell
cd backend
npm install
$env:MONGO_URI="mongodb://localhost:27017/financebot"
$env:RAG_SERVICE_URL="http://localhost:8000"
$env:JWT_SECRET="financebot_secret_key"
npm start
# ✅ FinanceBot Backend running on port 5000
```

### Step 4 — React Frontend (Terminal 3)
```bash
cd frontend
npm install
npm run dev
# ✅ Local: http://localhost:3000/
```

### Step 5 — Open & Configure
1. Open **http://localhost:3000**
2. **Register** — Create your account
3. **Settings** — Select provider (Groq or OpenAI) and enter your API key
4. **Documents** — Upload an expense PDF
5. **Chat** — Ask questions about your expenses!

## 🐳 Docker Deployment (Production)

```bash
# Requires Docker Desktop running
cp .env.example .env
docker-compose up --build -d
# Open http://localhost
```

## 📁 Project Structure

```
personalExpenseTracker/
├── frontend/            # React 18 (Vite) — Dashboard UI
│   └── src/
│       ├── components/  # Chat, Visualizations, Documents, Settings, Auth, Layout
│       ├── contexts/    # ThemeContext, AuthContext
│       └── services/    # Axios API client
├── backend/             # Express.js — REST API
│   └── src/
│       ├── models/      # User, ChatSession, Document (Mongoose)
│       ├── routes/      # auth, chat, documents, settings
│       └── middleware/   # JWT auth
├── python-rag/          # Python Flask — RAG Microservice
│   ├── app.py           # Flask REST API
│   ├── rag_engine.py    # LangGraph RAG pipeline (Groq + OpenAI)
│   └── visualizer.py    # Chart data extraction
├── nginx/               # Nginx reverse proxy config
├── docker-compose.yml   # Docker orchestration (5 services)
├── .env.example         # Environment variables template
└── README.md
```

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Recharts, Lucide Icons, React Router |
| Backend | Express.js, Mongoose, JWT, Multer, Axios |
| AI/RAG | LangChain, LangGraph, ChromaDB, HuggingFace Embeddings |
| LLM Providers | **Groq** (LLaMA 3.3 70B) · **OpenAI** (GPT-4o-mini) |
| Database | MongoDB 7 |
| Infrastructure | Docker, Nginx |

## 🔧 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Sign in (returns JWT) |
| GET | `/api/auth/me` | Current user info |
| POST | `/api/chat/ask` | Ask a question (→ RAG) |
| GET | `/api/chat/sessions` | List chat sessions |
| POST | `/api/documents/upload` | Upload PDF |
| GET | `/api/documents` | List uploaded documents |
| PUT | `/api/settings/api-key` | Save API key & provider |
| GET | `/api/settings/api-key` | Get masked key & provider |

## 📄 License

MIT

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.
