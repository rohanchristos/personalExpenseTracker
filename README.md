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
- **RAG Pipeline** — LangChain + LangGraph + Groq (LLaMA 3.3) + ChromaDB
- **Interactive Charts** — Bar, Pie, Line charts via Recharts
- **PDF Upload** — Drag-and-drop document ingestion
- **JWT Auth** — Secure user registration and login
- **Dark/Light Theme** — Toggle with localStorage persistence
- **API Key Management** — Users bring their own Groq API key
- **Docker-Ready** — Full production deployment with 5 containerized services

## 🚀 Quick Start

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running
- A [Groq API key](https://console.groq.com) (entered in-app after registration)

### Run

```bash
# 1. Clone the repo
git clone https://github.com/rohanchristos/personalExpenseTracker.git
cd personalExpenseTracker

# 2. Copy environment file
cp .env.example .env

# 3. Build and start all services
docker-compose up --build -d

# 4. Open in browser
open http://localhost
```

### First-Time Setup
1. **Register** — Create your account at `http://localhost`
2. **Settings** — Go to Settings and enter your Groq API key
3. **Upload** — Navigate to Documents and upload a PDF expense file
4. **Chat** — Ask questions like *"What were my expenses in January?"*

## 📁 Project Structure

```
personalExpenseTracker/
├── frontend/            # React (Vite) — Dashboard UI
├── backend/             # Express.js — REST API
├── python-rag/          # Python Flask — RAG Microservice
├── nginx/               # Nginx reverse proxy config
├── docker-compose.yml   # Docker orchestration
└── .env.example         # Environment variables template
```

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Recharts, Lucide Icons |
| Backend | Express.js, Mongoose, JWT, Multer |
| AI/RAG | LangChain, LangGraph, Groq (LLaMA 3.3), ChromaDB |
| Embeddings | HuggingFace BAAI/bge-small-en-v1.5 |
| Database | MongoDB 7 |
| Infrastructure | Docker, Nginx |

## 🔧 Development

To run services individually for development:

```bash
# Backend
cd backend && npm install && npm run dev

# Frontend
cd frontend && npm install && npm run dev

# Python RAG
cd python-rag && pip install -r requirements.txt && python app.py
```

## 📄 License

MIT
