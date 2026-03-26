const express = require("express");
const multer = require("multer");
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");
const auth = require("../middleware/auth");
const Document = require("../models/Document");

const router = express.Router();
const RAG_SERVICE_URL = process.env.RAG_SERVICE_URL || "http://python-rag:8000";

// Configure multer for PDF uploads
const uploadDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"), false);
    }
  },
});

// POST /api/documents/upload
router.post("/upload", auth, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No PDF file provided" });
    }

    const collectionName = `user_${req.user.id}`;

    // Create document record
    const doc = new Document({
      userId: req.user.id,
      filename: req.file.filename,
      originalName: req.file.originalname,
      collectionName,
      status: "processing",
    });
    await doc.save();

    // Forward to Python RAG service for ingestion
    const formData = new FormData();
    formData.append("file", fs.createReadStream(req.file.path), req.file.originalname);
    formData.append("collection_name", collectionName);

    try {
      const ragResponse = await axios.post(`${RAG_SERVICE_URL}/rag/ingest`, formData, {
        headers: formData.getHeaders(),
        timeout: 300000, // 5 min timeout for ingestion
      });

      doc.status = "ready";
      doc.pages = ragResponse.data.pages || 0;
      doc.chunks = ragResponse.data.chunks || 0;
      await doc.save();
    } catch (ragErr) {
      doc.status = "error";
      doc.errorMessage = ragErr.response?.data?.error || ragErr.message;
      await doc.save();
    }

    res.json({ document: doc });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Failed to upload document" });
  }
});

// GET /api/documents
router.get("/", auth, async (req, res) => {
  try {
    const documents = await Document.find({ userId: req.user.id })
      .sort({ uploadedAt: -1 });
    res.json({ documents });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch documents" });
  }
});

// DELETE /api/documents/:id
router.delete("/:id", auth, async (req, res) => {
  try {
    const doc = await Document.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!doc) {
      return res.status(404).json({ error: "Document not found" });
    }

    // Try to delete the file from disk
    const filePath = path.join(uploadDir, doc.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({ message: "Document deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete document" });
  }
});

module.exports = router;
