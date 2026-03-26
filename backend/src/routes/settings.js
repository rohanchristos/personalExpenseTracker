const express = require("express");
const auth = require("../middleware/auth");
const User = require("../models/User");

const router = express.Router();

// PUT /api/settings/api-key
router.put("/api-key", auth, async (req, res) => {
  try {
    const { apiKey, provider } = req.body;

    if (!apiKey || !apiKey.trim()) {
      return res.status(400).json({ error: "API key is required" });
    }

    const updateFields = { groqApiKey: apiKey.trim() };
    if (provider && ["groq", "openai"].includes(provider)) {
      updateFields.llmProvider = provider;
    }

    await User.findByIdAndUpdate(req.user.id, updateFields);

    res.json({ message: "API key saved successfully" });
  } catch (err) {
    console.error("Settings error:", err);
    res.status(500).json({ error: "Failed to save API key" });
  }
});

// GET /api/settings/api-key
router.get("/api-key", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const apiKey = user.groqApiKey || "";
    const masked = apiKey
      ? `${"•".repeat(Math.max(0, apiKey.length - 4))}${apiKey.slice(-4)}`
      : "";

    res.json({
      hasKey: !!apiKey,
      maskedKey: masked,
      provider: user.llmProvider || "groq",
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch API key" });
  }
});

module.exports = router;
