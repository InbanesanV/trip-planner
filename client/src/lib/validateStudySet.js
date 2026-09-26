/**
 * validateStudySet.js — Defensive client-side validation of LLM output.
 *
 * This module is intentionally independent of the Gemini schema constraint.
 * Even when the provider enforces a schema, we validate field-by-field here
 * because no provider guarantee is a substitute for defensive parsing.
 *
 * Strategy:
 *   - Drop individual malformed items when the rest of the set is usable.
 *   - Only fail the whole response when nothing usable remains.
 *
 * Returns { ok: true, data: <cleaned> } or { ok: false, reason: string }
 */

// ── Helpers ───────────────────────────────────────────────────────────────────

function isNonEmptyString(v) {
  return typeof v === 'string' && v.trim().length > 0;
}

// ── Flashcard validation ──────────────────────────────────────────────────────

/**
 * Validate a single flashcard item.
 * Returns the card if valid, null otherwise.
 */
function validateCard(card, index) {
  if (!card || typeof card !== 'object') return null;

  const id = isNonEmptyString(card.id) ? card.id.trim() : `card-${index}`;
  if (!isNonEmptyString(card.question)) return null;
  if (!isNonEmptyString(card.answer)) return null;

  return {
    id,
    question: card.question.trim(),
    answer: card.answer.trim(),
  };
}

function validateFlashcards(raw) {
  if (!raw || typeof raw !== 'object') {
    return { ok: false, reason: 'Response is not a JSON object.' };
  }

  const topic = isNonEmptyString(raw.topic) ? raw.topic.trim() : 'Study Set';

  if (!Array.isArray(raw.cards)) {
    return { ok: false, reason: 'Response is missing the "cards" array.' };
  }

  if (raw.cards.length === 0) {
    return { ok: false, reason: 'The model returned zero flashcards.' };
  }

  const validCards = [];
  const droppedReasons = [];

  raw.cards.forEach((card, i) => {
    const result = validateCard(card, i);
    if (result) {
      validCards.push(result);
    } else {
      droppedReasons.push(
        `Card at index ${i} dropped: missing or empty question/answer.`
      );
    }
  });

  if (validCards.length === 0) {
    return {
      ok: false,
      reason: `All ${raw.cards.length} cards were malformed — no usable content.`,
    };
  }

  return {
    ok: true,
    data: { topic, cards: validCards },
    dropped: droppedReasons,
  };
}

// ── Quiz validation ───────────────────────────────────────────────────────────

/**
 * Validate a single quiz question item.
 * Returns the question if valid, null otherwise.
 */
function validateQuestion(q, index) {
  if (!q || typeof q !== 'object') return null;

  const id = isNonEmptyString(q.id) ? q.id.trim() : `q-${index}`;

  if (!isNonEmptyString(q.question)) return null;

  // Options must be an array with at least 2 non-empty string entries
  if (!Array.isArray(q.options) || q.options.length < 2) return null;
  const options = q.options.filter((o) => isNonEmptyString(o)).map((o) => o.trim());
  if (options.length < 2) return null;

  // correctIndex must be a valid index into options
  const correctIndex = Number(q.correctIndex);
  if (
    !Number.isInteger(correctIndex) ||
    correctIndex < 0 ||
    correctIndex >= options.length
  ) {
    return null;
  }

  const explanation = isNonEmptyString(q.explanation)
    ? q.explanation.trim()
    : 'No explanation provided.';

  return {
    id,
    question: q.question.trim(),
    options,
    correctIndex,
    explanation,
  };
}

function validateQuiz(raw) {
  if (!raw || typeof raw !== 'object') {
    return { ok: false, reason: 'Response is not a JSON object.' };
  }

  const topic = isNonEmptyString(raw.topic) ? raw.topic.trim() : 'Quiz';

  if (!Array.isArray(raw.questions)) {
    return { ok: false, reason: 'Response is missing the "questions" array.' };
  }

  if (raw.questions.length === 0) {
    return { ok: false, reason: 'The model returned zero quiz questions.' };
  }

  const validQuestions = [];
  const droppedReasons = [];

  raw.questions.forEach((q, i) => {
    const result = validateQuestion(q, i);
    if (result) {
      validQuestions.push(result);
    } else {
      droppedReasons.push(
        `Question at index ${i} dropped: missing fields, fewer than 2 options, or invalid correctIndex.`
      );
    }
  });

  if (validQuestions.length === 0) {
    return {
      ok: false,
      reason: `All ${raw.questions.length} questions were malformed — no usable content.`,
    };
  }

  return {
    ok: true,
    data: { topic, questions: validQuestions },
    dropped: droppedReasons,
  };
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Validate a parsed JSON object from the backend.
 *
 * @param {unknown} raw   - Parsed JSON (already past JSON.parse)
 * @param {'flashcards'|'quiz'} mode
 * @returns {{ ok: true, data: object, dropped?: string[] } | { ok: false, reason: string }}
 */
export function validateStudySet(raw, mode) {
  if (mode === 'flashcards') return validateFlashcards(raw);
  if (mode === 'quiz') return validateQuiz(raw);
  return { ok: false, reason: `Unknown mode: "${mode}"` };
}
