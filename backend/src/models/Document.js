const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  filename: {
    type: String,
    required: true,
  },
  originalName: {
    type: String,
    required: true,
  },
  collectionName: {
    type: String,
    required: true,
  },
  pages: {
    type: Number,
    default: 0,
  },
  chunks: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ["processing", "ready", "error"],
    default: "processing",
  },
  errorMessage: {
    type: String,
    default: "",
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Document", documentSchema);
