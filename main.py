from dotenv import load_dotenv
import os
from langgraph.graph import StateGraph, END
from typing import TypedDict, Annotated, Sequence
from langchain_core.messages import BaseMessage, SystemMessage, HumanMessage, ToolMessage
from operator import add as add_messages
from langchain_groq import ChatGroq
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from langchain_core.tools import tool
from visualizer import visualize_response

load_dotenv()

llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    temperature=0
)

embeddings = HuggingFaceEmbeddings(
    model_name="BAAI/bge-small-en-v1.5"
)


pdf_path = "Personal_Expenses_2024.pdf"

if not os.path.exists(pdf_path):
    raise FileNotFoundError(f"PDF file not found: {pdf_path}")

pdf_loader = PyPDFLoader(pdf_path)

try:
    pages = pdf_loader.load()
    print(f"✅ PDF loaded: {len(pages)} pages")
except Exception as e:
    print(f"Error loading PDF: {e}")
    raise

# ✅ Smaller chunks = better retrieval for sentence-based text
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,     # reduced from 1000 — sentences are short
    chunk_overlap=100   # reduced from 200
)

pages_split = text_splitter.split_documents(pages)
print(f"✅ Split into {len(pages_split)} chunks")

persist_directory = r"C:\Users\rohan\Documents\programminglabs\AIML PROJECTS\agenticAI\agents\rag2"
collection_name = "personal_expenses"   

if not os.path.exists(persist_directory):
    os.makedirs(persist_directory)

try:
    vectorstore = Chroma.from_documents(
        documents=pages_split,
        embedding=embeddings,
        persist_directory=persist_directory,
        collection_name=collection_name
    )
    print(f"✅ ChromaDB vector store created with {len(pages_split)} chunks!")
except Exception as e:
    print(f"Error setting up ChromaDB: {str(e)}")
    raise

retriever = vectorstore.as_retriever(
    search_type="similarity",
    search_kwargs={"k": 6}   
)

@tool
def retriever_tool(query: str) -> str:
    """
    This tool searches and returns information from the Personal Expenses 2024 document.
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
llm = llm.bind_tools(tools)

class AgentState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], add_messages]


def should_continue(state: AgentState):
    """Check if the last message contains tool calls — max 2 iterations."""
    messages = state['messages']
    result = messages[-1]

    tool_call_count = sum(
        1 for m in messages if isinstance(m, ToolMessage)
    )
    if tool_call_count >= 2:
        return False

    return hasattr(result, 'tool_calls') and len(result.tool_calls) > 0

system_prompt = system_prompt = """
You are a personal finance assistant that answers questions about the user's expenses in 2024.

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

tools_dict = {our_tool.name: our_tool for our_tool in tools}

def call_llm(state: AgentState) -> AgentState:
    messages = list(state['messages'])
    messages = [SystemMessage(content=system_prompt)] + messages
    message = llm.invoke(messages)
    return {'messages': [message]}

def take_action(state: AgentState) -> AgentState:
    tool_calls = state['messages'][-1].tool_calls
    results = []
    for t in tool_calls:
        print(f"🔍 Calling Tool: {t['name']} | Query: {t['args'].get('query', '')}")

        if t['name'] not in tools_dict:
            result = "Incorrect Tool Name. Please retry with a valid tool."
        else:
            result = tools_dict[t['name']].invoke(t['args'].get('query', ''))
            print(f"   Result length: {len(str(result))} chars")

        results.append(ToolMessage(tool_call_id=t['id'], name=t['name'], content=str(result)))

    print("✅ Tool execution complete. Returning to LLM.")
    return {'messages': results}

graph = StateGraph(AgentState)
graph.add_node("llm", call_llm)
graph.add_node("retriever_agent", take_action)
graph.add_conditional_edges("llm", should_continue, {True: "retriever_agent", False: END})
graph.add_edge("retriever_agent", "llm")
graph.set_entry_point("llm")

rag_agent = graph.compile()

def running_agent():
    print("\n=== 💰 Personal Expense RAG Agent ===")
    print("Ask anything about your 2024 expenses.")
    print("Type 'exit' or 'quit' to stop.\n")

    while True:
        user_input = input("Your question: ").strip()
        if not user_input:
            continue
        if user_input.lower() in ['exit', 'quit']:
            print("👋 Goodbye!")
            break

        messages = [HumanMessage(content=user_input)]
        result = rag_agent.invoke({"messages": messages})
        response_text = result['messages'][-1].content

        print("\n=== ANSWER ===")
        print(response_text)

        viz = input("\n📊 Visualize this response? (y/n): ").strip().lower()
        if viz == "y":
            visualize_response(response_text, question=user_input)
        print()

running_agent()