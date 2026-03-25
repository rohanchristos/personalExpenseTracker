# Personal Expense Tracker

A personal finance assistant powered by **Retrieval Augmented Generation (RAG)** that analyzes expense data and answers questions about spending patterns using AI.

## 🎯 Features

- **PDF Document Analysis**: Loads and processes PDF documents containing financial data
- **Vector Search**: Uses ChromaDB with HuggingFace embeddings for semantic search across expenses
- **AI-Powered Responses**: Leverages LLaMA 3.3 via Groq API for intelligent financial insights
- **Interactive Visualizations**: Generates charts (bar, pie, line) to visualize expense data
- **Tool-based Architecture**: Built with LangGraph for agentic workflows

## 📁 Project Structure

```
rag2/
├── main.py                      # Core application with RAG pipeline
├── visualizer.py                # Chart generation and data visualization
├── requirements.txt             # Python dependencies
├── .env                         # Environment variables (not included in repo)
├── .gitignore                   # Git configuration
└── Personal_Expenses_2024.pdf   # Sample financial data
```

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Groq API key (get one at [Groq Console](https://console.groq.com))

### Installation

1. Clone the repository:
```bash
git clone https://github.com/rohanchristos/personalExpenseTracker.git
cd personalExpenseTracker/rag2
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create a `.env` file in the project root:
```
GROQ_API_KEY=your_groq_api_key_here
```

5. Run the application:
```bash
python main.py
```

## 🔍 How It Works

1. **Document Ingestion**: PDFs are loaded and split into 500-token chunks with 100-token overlap
2. **Embedding**: Text is converted to vectors using BAAI/bge-small-en-v1.5 model
3. **Storage**: Vectors are stored in ChromaDB for fast similarity search
4. **Retrieval**: User queries are converted to vectors and matched against stored documents
5. **Generation**: LLaMA 3.3 generates natural language responses using retrieved context
6. **Visualization**: Results can be visualized as charts when numerical data is present

## 🛠️ Configuration

Key settings in `main.py`:
- **Chunk size**: 500 tokens (for sentence-level accuracy)
- **Chunk overlap**: 100 tokens (for context continuity)
- **Retrieval K**: 6 (returns top 6 similar chunks)
- **Max iterations**: 2 (prevents infinite tool loops)

## 📚 Technologies Used

- **LangChain**: LLM orchestration framework
- **LangGraph**: Agentic workflow engine
- **ChromaDB**: Vector database for embeddings
- **Groq**: Fast inference API for LLaMA models
- **HuggingFace**: Open-source embeddings and models
- **Matplotlib**: Data visualization

## 💡 About RAG

Retrieval Augmented Generation (RAG) is a technique that:
1. Retrieves relevant information from documents
2. Feeds it as context to an LLM
3. Generates responses based on actual document data

This ensures answers are grounded in real financial data rather than relying solely on the model's training data.

## 📄 License

MIT

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## 📧 Support

For questions or issues, please open an issue on the [GitHub repository](https://github.com/rohanchristos/personalExpenseTracker).

