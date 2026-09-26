import './App.css';
import { useState, useRef, useCallback } from 'react';
import { generateStudySet } from './lib/api.js';
import { validateStudySet } from './lib/validateStudySet.js';
import PromptInput from './components/PromptInput.jsx';
import LoadingState from './components/LoadingState.jsx';
import ErrorState from './components/ErrorState.jsx';
import EmptyState from './components/EmptyState.jsx';
import FlashcardDeck from './components/FlashcardDeck.jsx';
import Quiz from './components/Quiz.jsx';

export default function App() {
  const [mode, setMode] = useState('flashcards');
  const [uiState, setUiState] = useState('idle');
  const [studySet, setStudySet] = useState(null);
  const [errorInfo, setErrorInfo] = useState(null);
  const [prompt, setPrompt] = useState('');

  const requestIdRef = useRef(0);
  const abortControllerRef = useRef(null);

  const handleSubmit = useCallback(async () => {
    if (!prompt.trim()) return;

    if (abortControllerRef.current) abortControllerRef.current.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const myRequestId = ++requestIdRef.current;
    setUiState('loading');
    setStudySet(null);
    setErrorInfo(null);

    const apiResult = await generateStudySet(prompt.trim(), mode, controller.signal);

    if (requestIdRef.current !== myRequestId) return;
    if (!apiResult.ok && apiResult.errorKind === 'aborted') return;

    if (!apiResult.ok) {
      setErrorInfo({ errorKind: apiResult.errorKind, message: apiResult.message });
      setUiState('error');
      return;
    }

    const validation = validateStudySet(apiResult.data, mode);
    if (!validation.ok) {
      setErrorInfo({ errorKind: 'shape', message: `Unexpected structure: ${validation.reason}` });
      setUiState('error');
      return;
    }

    if (validation.dropped?.length) console.warn('[Recall] Dropped items:', validation.dropped);

    setStudySet(validation.data);
    setUiState('success');
  }, [prompt, mode]);

  const handleRetry = useCallback(() => handleSubmit(), [handleSubmit]);

  const handleRetest = useCallback((missedQuestions) => {
    setStudySet((prev) => ({ ...prev, questions: missedQuestions }));
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-inner">
          <div className="app-logo-wrap">
            <div className="app-logo-glow" aria-hidden="true" />
            <span className="app-logo">🧠</span>
          </div>
          <div className="app-brand">
            <h1 className="app-title">Recall</h1>
            <p className="app-tagline">AI Study Assistant</p>
          </div>
          <div className="app-header-badge">
            <span className="badge-dot" aria-hidden="true" />
            Gemini 2.5 Flash
          </div>
        </div>
      </header>

      <main className="app-main">
        <PromptInput
          prompt={prompt}
          onPromptChange={setPrompt}
          mode={mode}
          onModeChange={setMode}
          onSubmit={handleSubmit}
          isLoading={uiState === 'loading'}
        />

        <section className="app-output" aria-live="polite" aria-label="Study content">
          {uiState === 'idle'    && <EmptyState />}
          {uiState === 'loading' && <LoadingState mode={mode} />}
          {uiState === 'error'   && errorInfo && (
            <ErrorState
              errorKind={errorInfo.errorKind}
              message={errorInfo.message}
              onRetry={handleRetry}
            />
          )}
          {uiState === 'success' && studySet && mode === 'flashcards' && (
            <FlashcardDeck topic={studySet.topic} cards={studySet.cards} />
          )}
          {uiState === 'success' && studySet && mode === 'quiz' && (
            <Quiz
              key={studySet.questions.map((q) => q.id).join(',')}
              topic={studySet.topic}
              questions={studySet.questions}
              onRetest={handleRetest}
            />
          )}
        </section>
      </main>

      <footer className="app-footer">
        <span className="footer-gem">✨</span>
        Powered by Gemini 2.5 Flash · Built with React + Vite
      </footer>
    </div>
  );
}
