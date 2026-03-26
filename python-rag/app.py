"""
FinanceBot — Python RAG Microservice
Flask REST API wrapping the RAG engine for the Express.js backend.
"""

import os
import uuid
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
from rag_engine import ingest_pdf, ask_question

app = Flask(__name__)
CORS(app)

UPLOAD_DIR = os.environ.get("UPLOAD_DIR", "/app/uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {"pdf"}


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route("/rag/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "financebot-rag"})


@app.route("/rag/ask", methods=["POST"])
def ask():
    """
    Ask a question to the RAG agent.
    Body: { "question": str, "groq_api_key": str, "collection_name": str }
    """
    data = request.get_json()

    if not data:
        return jsonify({"error": "Request body is required"}), 400

    question = data.get("question", "").strip()
    api_key = data.get("api_key", "").strip()
    collection_name = data.get("collection_name", "default_expenses")
    provider = data.get("provider", "groq")

    if not question:
        return jsonify({"error": "Question is required"}), 400
    if not api_key:
        return jsonify({"error": "API key is required"}), 400

    try:
        result = ask_question(question, api_key, collection_name, provider)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": f"RAG processing failed: {str(e)}"}), 500


@app.route("/rag/ingest", methods=["POST"])
def ingest():
    """
    Upload and ingest a PDF document.
    Multipart form: file (PDF), collection_name (str)
    """
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["file"]
    collection_name = request.form.get("collection_name", "default_expenses")

    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400

    if not allowed_file(file.filename):
        return jsonify({"error": "Only PDF files are allowed"}), 400

    # Save file with unique name
    original_name = secure_filename(file.filename)
    unique_name = f"{uuid.uuid4().hex}_{original_name}"
    filepath = os.path.join(UPLOAD_DIR, unique_name)
    file.save(filepath)

    try:
        result = ingest_pdf(filepath, collection_name)
        if result["success"]:
            return jsonify({
                "success": True,
                "filename": unique_name,
                "original_name": original_name,
                "pages": result["pages"],
                "chunks": result["chunks"],
                "collection": result["collection"]
            })
        else:
            return jsonify({"error": result["error"]}), 500
    except Exception as e:
        return jsonify({"error": f"Ingestion failed: {str(e)}"}), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    app.run(host="0.0.0.0", port=port, debug=False)
