'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { generateStudyContent } = require('./geminiClient');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ── Health check ──────────────────────────────────────────────────────────────
// Always responds 200 even if GEMINI_API_KEY is not set.
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// ── Generate study content ────────────────────────────────────────────────────
app.post('/api/generate', async (req, res) => {
  const { prompt, mode } = req.body || {};

  // Validate request body first (400 even if key is missing)
  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    return res.status(400).json({
      error: 'Request body must include a non-empty "prompt" string.',
      code: 'MISSING_PROMPT',
    });
  }

  if (!mode || !['flashcards', 'quiz'].includes(mode)) {
    return res.status(400).json({
      error: 'Request body must include "mode": "flashcards" or "quiz".',
      code: 'INVALID_MODE',
    });
  }

  // Validate API key presence (after body validation)
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({
      error: 'Server configuration error: GEMINI_API_KEY is not set.',
      code: 'MISSING_API_KEY',
    });
  }

  try {
    const data = await generateStudyContent(prompt.trim(), mode);
    return res.json({ data });
  } catch (err) {
    // geminiClient throws structured errors
    const status = err.status || 500;
    return res.status(status).json({
      error: err.message || 'An unexpected error occurred.',
      code: err.code || 'INTERNAL_ERROR',
    });
  }
});

// ── Start server ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[server] Recall backend running on http://localhost:${PORT}`);
  if (!process.env.GEMINI_API_KEY) {
    console.warn('[server] WARNING: GEMINI_API_KEY is not set — /api/generate will return 500.');
  }
});
module.exports = app;
