import './PromptInput.css';

export default function PromptInput({ prompt, onPromptChange, mode, onModeChange, onSubmit, isLoading }) {
  function handleKeyDown(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (!isLoading && prompt.trim()) onSubmit();
    }
  }

  return (
    <section className="prompt-input" aria-label="Study content input">
      {/* Mode toggle */}
      <div className="mode-toggle" role="group" aria-label="Study mode">
        <button
          className={`mode-btn ${mode === 'flashcards' ? 'mode-btn--active' : ''}`}
          onClick={() => onModeChange('flashcards')}
          aria-pressed={mode === 'flashcards'}
          disabled={isLoading}
        >
          <span className="mode-btn-icon">🃏</span>
          <span>Flashcards</span>
        </button>
        <button
          className={`mode-btn ${mode === 'quiz' ? 'mode-btn--active' : ''}`}
          onClick={() => onModeChange('quiz')}
          aria-pressed={mode === 'quiz'}
          disabled={isLoading}
        >
          <span className="mode-btn-icon">📝</span>
          <span>Quiz</span>
        </button>
      </div>

      {/* Label */}
      <label className="prompt-label" htmlFor="prompt-textarea">
        Topic or notes
      </label>

      {/* Textarea */}
      <textarea
        id="prompt-textarea"
        className="prompt-textarea"
        value={prompt}
        onChange={(e) => onPromptChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={
          mode === 'flashcards'
            ? 'e.g. "the French Revolution" or paste your lecture notes…'
            : 'e.g. "cell biology" or paste a chapter summary…'
        }
        rows={6}
        disabled={isLoading}
        aria-label="Topic or notes"
      />

      {/* Footer */}
      <div className="prompt-footer">
        <span className="prompt-hint">
          {prompt.trim().length > 0
            ? `${prompt.trim().length} characters`
            : <><kbd className="hint-kbd">Ctrl</kbd>+<kbd className="hint-kbd">Enter</kbd> to generate</>}
        </span>
        <button
          className="submit-btn"
          onClick={onSubmit}
          disabled={isLoading || !prompt.trim()}
          aria-label={`Generate ${mode}`}
        >
          {isLoading ? (
            <>
              <span className="submit-spinner" aria-hidden="true" />
              Generating…
            </>
          ) : (
            <>
              <span className="submit-btn-icon" aria-hidden="true">
                {mode === 'flashcards' ? '🃏' : '📝'}
              </span>
              Generate {mode === 'flashcards' ? 'Flashcards' : 'Quiz'}
            </>
          )}
        </button>
      </div>
    </section>
  );
}
