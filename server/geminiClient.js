'use strict';

const { GoogleGenerativeAI, SchemaType } = require('@google/generative-ai');

// Backend timeout: 20 seconds
const BACKEND_TIMEOUT_MS = 20_000;

// ── Schema definitions ────────────────────────────────────────────────────────

const FLASHCARD_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    topic: { type: SchemaType.STRING },
    cards: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          id: { type: SchemaType.STRING },
          question: { type: SchemaType.STRING },
          answer: { type: SchemaType.STRING },
        },
        required: ['id', 'question', 'answer'],
      },
    },
  },
  required: ['topic', 'cards'],
};

const QUIZ_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    topic: { type: SchemaType.STRING },
    questions: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          id: { type: SchemaType.STRING },
          question: { type: SchemaType.STRING },
          options: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
          },
          correctIndex: { type: SchemaType.INTEGER },
          explanation: { type: SchemaType.STRING },
        },
        required: ['id', 'question', 'options', 'correctIndex', 'explanation'],
      },
    },
  },
  required: ['topic', 'questions'],
};

// ── Prompt builders ───────────────────────────────────────────────────────────

function buildFlashcardPrompt(userInput) {
  return `You are a study assistant. The user has provided the following topic or notes:

---
${userInput}
---

Generate a comprehensive set of flashcards to help the user study this material.
Create between 8 and 20 flashcards depending on the complexity of the topic.
Each card should have a clear question and a concise, accurate answer.
Use unique short IDs like "c1", "c2", etc.
Return ONLY valid JSON matching the schema — do NOT include markdown fences, commentary, or extra text.`;
}

function buildQuizPrompt(userInput) {
  return `You are a study assistant. The user has provided the following topic or notes:

---
${userInput}
---

Generate a multiple-choice quiz to test the user's knowledge of this material.
Create between 6 and 15 questions depending on the complexity of the topic.
Each question must have exactly 4 options. The correctIndex is the 0-based index of the correct option.
Include a short explanation (1-2 sentences) for why the answer is correct.
Use unique short IDs like "q1", "q2", etc.
Return ONLY valid JSON matching the schema — do NOT include markdown fences, commentary, or extra text.`;
}

// ── Main export ───────────────────────────────────────────────────────────────

async function generateStudyContent(userInput, mode) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const err = new Error('GEMINI_API_KEY is not configured on the server.');
    err.code = 'MISSING_API_KEY';
    err.status = 500;
    throw err;
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  const schema = mode === 'flashcards' ? FLASHCARD_SCHEMA : QUIZ_SCHEMA;
  const prompt = mode === 'flashcards'
    ? buildFlashcardPrompt(userInput)
    : buildQuizPrompt(userInput);

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: schema,
    },
  });

  // Apply backend timeout via AbortSignal
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), BACKEND_TIMEOUT_MS);

  try {
    const result = await model.generateContent(prompt, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const text = result.response.text();

    if (!text || text.trim().length === 0) {
      const err = new Error('Gemini returned an empty response.');
      err.code = 'EMPTY_RESPONSE';
      err.status = 502;
      throw err;
    }

    // Parse JSON (schema mode should return clean JSON, but be defensive)
    let parsed;
    try {
      // Strip accidental markdown fences if present despite instructions
      const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '');
      parsed = JSON.parse(cleaned);
    } catch {
      const err = new Error('Gemini returned malformed JSON that could not be parsed.');
      err.code = 'MALFORMED_JSON';
      err.status = 502;
      throw err;
    }

    return parsed;
  } catch (err) {
    clearTimeout(timeoutId);

    // Re-throw our structured errors
    if (err.code) throw err;

    // Timeout
    if (err.name === 'AbortError' || controller.signal.aborted) {
      const timeoutErr = new Error('The request to Gemini timed out after 20 seconds.');
      timeoutErr.code = 'BACKEND_TIMEOUT';
      timeoutErr.status = 504;
      throw timeoutErr;
    }

    // Generic provider error
    const providerErr = new Error(
      `Gemini API error: ${err.message || 'Unknown provider error'}`
    );
    providerErr.code = 'PROVIDER_ERROR';
    providerErr.status = 502;
    throw providerErr;
  }
}

module.exports = { generateStudyContent };
