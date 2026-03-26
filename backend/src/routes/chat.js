const express = require("express");
const axios = require("axios");
const auth = require("../middleware/auth");
const ChatSession = require("../models/ChatSession");
const User = require("../models/User");

const router = express.Router();
const RAG_SERVICE_URL = process.env.RAG_SERVICE_URL || "http://python-rag:8000";

// POST /api/chat/ask
router.post("/ask", auth, async (req, res) => {
  try {
    const { question, sessionId, documentCollection } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({ error: "Question is required" });
    }

    // Get user's API key
    const user = await User.findById(req.user.id);
    if (!user || !user.groqApiKey) {
      return res.status(400).json({
        error: "Please set your Groq API key in Settings before asking questions",
      });
    }

    // Get or create session
    let session;
    if (sessionId) {
      session = await ChatSession.findOne({ _id: sessionId, userId: req.user.id });
      if (!session) {
        return res.status(404).json({ error: "Chat session not found" });
      }
    } else {
      session = new ChatSession({
        userId: req.user.id,
        title: question.substring(0, 80),
        messages: [],
      });
    }

    // Add user message
    session.messages.push({
      role: "user",
      content: question,
    });

    // Call RAG service
    const ragResponse = await axios.post(`${RAG_SERVICE_URL}/rag/ask`, {
      question,
      api_key: user.groqApiKey,
      collection_name: documentCollection || `user_${req.user.id}`,
      provider: user.llmProvider || "groq",
    }, {
      timeout: 120000, // 2 min timeout for LLM calls
    });

    const { answer, chart_data, chart_type } = ragResponse.data;

    // Add assistant message
    session.messages.push({
      role: "assistant",
      content: answer,
      chartData: chart_data,
      chartType: chart_type,
    });

    await session.save();

    res.json({
      sessionId: session._id,
      answer,
      chartData: chart_data,
      chartType: chart_type,
    });
  } catch (err) {
    console.error("Chat error:", err.response?.data || err.message);
    const errorMsg = err.response?.data?.error || "Failed to process your question";
    res.status(500).json({ error: errorMsg });
  }
});

// GET /api/chat/sessions
router.get("/sessions", auth, async (req, res) => {
  try {
    const sessions = await ChatSession.find({ userId: req.user.id })
      .select("_id title createdAt updatedAt")
      .sort({ updatedAt: -1 })
      .limit(50);
    res.json({ sessions });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch chat sessions" });
  }
});

// GET /api/chat/sessions/:id
router.get("/sessions/:id", auth, async (req, res) => {
  try {
    const session = await ChatSession.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }
    res.json({ session });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch session" });
  }
});

// DELETE /api/chat/sessions/:id
router.delete("/sessions/:id", auth, async (req, res) => {
  try {
    await ChatSession.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });
    res.json({ message: "Session deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete session" });
  }
});

module.exports = router;
