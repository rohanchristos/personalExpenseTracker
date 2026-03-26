"""
FinanceBot RAG Engine
Adapted from the original main.py CLI — core LangChain/LangGraph pipeline.
Accepts api_key, provider, and pdf_path as parameters for multi-user support.
Supports both Groq and OpenAI as LLM providers.
"""

import os
from langgraph.graph import StateGraph, END
from typing import TypedDict, Annotated, Sequence
from langchain_core.messages import BaseMessage, SystemMessage, HumanMessage, ToolMessage
from operator import add as add_messages
from langchain_groq import ChatGroq
from langchain_openai import ChatOpenAI
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from langchain_core.tools import tool
from visualizer import extract_numbers, pick_chart_type

# Shared embedding model (loaded once)
embeddings = HuggingFaceEmbeddings(
    model_name="BAAI/bge-small-en-v1.5"
)

CHROMA_PERSIST_DIR = os.environ.get("CHROMA_PERSIST_DIR", "/app/chroma_data")

SYSTEM_PROMPT = """
You are a personal finance assistant that answers questions about the user's expenses.

IMPORTANT RULES:
- Call the retriever tool ONLY ONCE per question. Do not call it again if you already have data.
- Once you receive tool results, immediately form your answer from that data.
- Never repeat the same tool call twice.

When answering:
- Always include exact rupee amounts (e.g. Rs 22,429) from the document.
- When listing multiple data points format each on its own line as:
  Label: Amount
  For example:
  January 2024: 22429
  February 2024: 23948
- Keep labels short and consistent so they can be read by a chart tool.
- Always cite which part of the document your answer comes from.
"""


class AgentState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], add_messages]


def ingest_pdf(pdf_path: str, collection_name: str) -> dict:
    """Ingest a PDF into ChromaDB. Returns status info."""
    if not os.path.exists(pdf_path):
        return {"success": False, "error": f"PDF file not found: {pdf_path}"}

    try:
        loader = PyPDFLoader(pdf_path)
        pages = loader.load()

        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=500,
            chunk_overlap=100
        )
        chunks = text_splitter.split_documents(pages)

        vectorstore = Chroma.from_documents(
            documents=chunks,
            embedding=embeddings,
            persist_directory=CHROMA_PERSIST_DIR,
            collection_name=collection_name
        )

        return {
            "success": True,
            "pages": len(pages),
            "chunks": len(chunks),
            "collection": collection_name
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


def ask_question(question: str, api_key: str, collection_name: str, provider: str = "groq") -> dict:
    """Run the RAG pipeline for a single question. Returns structured response."""

    # Initialize LLM based on provider
    if provider == "openai":
        llm = ChatOpenAI(
            model="gpt-4o-mini",
            temperature=0,
            api_key=api_key
        )
    else:
        llm = ChatGroq(
            model="llama-3.3-70b-versatile",
            temperature=0,
            api_key=api_key
        )

    # Load the vector store for this collection
    try:
        vectorstore = Chroma(
            persist_directory=CHROMA_PERSIST_DIR,
            embedding_function=embeddings,
            collection_name=collection_name
        )
    except Exception as e:
        return {
            "answer": f"Error loading document collection: {str(e)}. Please upload a PDF first.",
            "chart_data": None,
            "chart_type": None
        }

    retriever = vectorstore.as_retriever(
        search_type="similarity",
        search_kwargs={"k": 6}
    )

    # Create the retriever tool dynamically
    @tool
    def retriever_tool(query: str) -> str:
        """
        This tool searches and returns information from the user's uploaded expense documents.
        Use it to find monthly totals, category breakdowns, payment modes, and individual transactions.
        """
        docs = retriever.invoke(query)
        if not docs:
            return "No relevant expense information found in the document."
        results = []
        for i, doc in enumerate(docs):
            results.append(f"Chunk {i+1}:\n{doc.page_content}")
        return "\n\n".join(results)

    tools = [retriever_tool]
    llm_with_tools = llm.bind_tools(tools)
    tools_dict = {t.name: t for t in tools}

    def should_continue(state: AgentState):
        messages = state['messages']
        result = messages[-1]
        tool_call_count = sum(1 for m in messages if isinstance(m, ToolMessage))
        if tool_call_count >= 2:
            return False
        return hasattr(result, 'tool_calls') and len(result.tool_calls) > 0

    def call_llm(state: AgentState) -> AgentState:
        messages = list(state['messages'])
        messages = [SystemMessage(content=SYSTEM_PROMPT)] + messages
        message = llm_with_tools.invoke(messages)
        return {'messages': [message]}

    def take_action(state: AgentState) -> AgentState:
        tool_calls = state['messages'][-1].tool_calls
        results = []
        for t in tool_calls:
            if t['name'] not in tools_dict:
                result = "Incorrect Tool Name. Please retry with a valid tool."
            else:
                result = tools_dict[t['name']].invoke(t['args'].get('query', ''))
            results.append(ToolMessage(tool_call_id=t['id'], name=t['name'], content=str(result)))
        return {'messages': results}

    # Build the graph
    graph = StateGraph(AgentState)
    graph.add_node("llm", call_llm)
    graph.add_node("retriever_agent", take_action)
    graph.add_conditional_edges("llm", should_continue, {True: "retriever_agent", False: END})
    graph.add_edge("retriever_agent", "llm")
    graph.set_entry_point("llm")
    rag_agent = graph.compile()

    # Execute
    try:
        result = rag_agent.invoke({"messages": [HumanMessage(content=question)]})
        answer = result['messages'][-1].content

        # Extract chart data from the answer
        chart_data = extract_numbers(answer)
        # Filter noise
        chart_data = {k: v for k, v in chart_data.items() if v > 500}
        chart_type = pick_chart_type(question + " " + answer) if chart_data else None

        return {
            "answer": answer,
            "chart_data": chart_data if chart_data else None,
            "chart_type": chart_type
        }
    except Exception as e:
        return {
            "answer": f"Error processing your question: {str(e)}",
            "chart_data": None,
            "chart_type": None
        }
