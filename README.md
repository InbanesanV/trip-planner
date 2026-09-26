# 🧠 Recall — AI Study Assistant

Turn your notes or a topic name into interactive **flashcards** or a **multiple-choice quiz** powered by Gemini 2.0 Flash.

---

## Setup

### Prerequisites
- Node.js 18+ installed
- A [Google AI Studio](https://aistudio.google.com/) API key for Gemini

### Installation

```bash
# 1. Clone the repo
git clone <repo-url>
cd recall-study-assistant

# 2. Install all dependencies (root + client)
npm install
npm install --prefix client

# 3. Create your .env file from the example
cp .env.example .env

# 4. Add your Gemini API key to .env
#    GEMINI_API_KEY=your_key_here

# 5. Start both servers
npm start
```

The app will be available at **http://localhost:5173**.  
The Express backend runs on **http://localhost:3001**.

---

## Usage

1. **Type a topic** (e.g. `"the French Revolution"`) or **paste lecture notes** directly into the text area.
2. **Choose a mode** using the segmented toggle at the top of the input:
   - 🃏 **Flashcards** — generates a deck of question/answer cards. Click or tap a card to flip it; use Prev/Next buttons (or ← → arrow keys, Space to flip) to navigate.
   - 📝 **Quiz** — generates multiple-choice questions. Pick an option, hit **Submit Answer** to see instant feedback with an explanation, then advance with **Next Question**.
3. Click **Generate** (or press `Ctrl+Enter`).
4. After a quiz, the **summary screen** shows your score and lists any missed questions. Click **Retest wrong answers** to practice only the ones you got wrong — no extra API call, just local state.

### Mode switching
Switching the mode toggle *before* clicking Generate changes what the model is asked to produce. Switching after generation starts a fresh request for the new mode.

---

## Architecture

### Request flow

```
User types prompt + picks mode
         │
         ▼
    App.jsx (handleSubmit)
    ├── increments requestIdRef
    ├── aborts previous AbortController
    ├── sets uiState = 'loading'
         │
         ▼
    lib/api.js (generateStudySet)
    ├── fetch POST /api/generate  ←── Vite proxy ──►  Express :3001
    ├── 25s client-side AbortController timeout
    └── returns { ok, data } | { ok, errorKind, message }
         │
         ▼
    lib/validateStudySet.js (validateStudySet)
    ├── field-by-field validation (independent of provider schema)
    ├── drops malformed individual cards/questions
    └── returns { ok, data } | { ok, reason }
         │
         ▼
    App.jsx checks requestIdRef === myRequestId  (stale guard)
    └── sets uiState = 'success' | 'error'
         │
         ▼
    <FlashcardDeck> or <Quiz>   (pure rendering, no model calls)
```

### Backend flow

```
POST /api/generate
  │
  ▼
server/index.js
├── validates prompt + mode (400 on bad input)
├── checks GEMINI_API_KEY (500 if missing)
└── delegates to geminiClient.js
       │
       ▼
server/geminiClient.js
├── builds mode-specific system prompt
├── sets responseSchema + responseMimeType: "application/json"
├── calls Gemini 2.0 Flash
├── 20s backend AbortSignal timeout
├── strips accidental markdown fences
└── returns parsed JSON  →  server sends { data: ... }
```

### Retest logic (pure local state)

When the quiz finishes, `QuizSummary` receives the full `questions` array and the `answers` map. It computes `missedQuestions = questions.filter(q => !answers[q.id].isCorrect)` and passes them back to `App.jsx` via `onRetest(missedQuestions)`. `App.jsx` calls `setStudySet(prev => ({ ...prev, questions: missedQuestions }))`. The `Quiz` component re-mounts (keyed on question IDs) with only the missed set — **zero model calls**.

---

## Failure Modes

| # | Name | Detection | UI |
|---|------|-----------|-----|
| 1 | **Malformed JSON** | `JSON.parse` throws (including ````json` fences stripped first) | `ErrorState kind='parse'` + retry |
| 2 | **Wrong shape** | `validateStudySet` field-by-field check fails; malformed items dropped; whole-set failure if nothing usable | `ErrorState kind='shape'` + retry |
| 3 | **Empty response** | empty `cards`/`questions` array or zero usable items after dropping | `ErrorState kind='empty'` + retry |
| 4 | **Slow response** | 25s client `AbortController` (+ 20s backend `AbortSignal`) | `LoadingState` while waiting → `ErrorState kind='timeout'` + retry |
| 5 | **Failed request** | non-200 HTTP → `ErrorState kind='server'`; network error → `ErrorState kind='network'`; each with an honest, specific message | `ErrorState` with per-kind message + retry |
| 6 | **Stale response** | `requestIdRef` incremented on each submit; result discarded if id doesn't match; in-flight fetch aborted via `AbortController` | Silently discarded — UI shows the newer request's state |

---

## Known Limitations

- **No streaming** — the full response is buffered before rendering; there is no progressive token display.
- **No session persistence** — refreshing the page clears the generated study set.
- **Single provider** — only Gemini 2.0 Flash is wired up; no OpenAI/Anthropic fallback.
- **No partial-credit or typed-answer questions** — only multiple-choice format is supported.
- **No card/question editing** — users cannot add, remove, or edit individual cards or questions after generation.
- **No export** — there is no way to download the flashcards or quiz as a file.

---

## AI-Usage Note

> **[Placeholder — please fill in yourself]**  
> Describe honestly what AI tools (if any) you used during development, which parts of the code they generated or suggested, and how you reviewed and integrated that output.

---

## Time Spent

> **[Placeholder — please fill in yourself]**  
> Break down roughly how long you spent on each major area (setup, backend, flashcard UI, quiz logic, error handling, styling, testing, etc.).
