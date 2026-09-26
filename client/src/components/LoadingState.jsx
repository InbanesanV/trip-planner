export default function LoadingState({ mode }) {
  return (
    <div className="loading-state" role="status" aria-live="polite">
      <div className="loading-spinner-wrap">
        <div className="loading-spinner" aria-hidden="true" />
        <div className="loading-spinner-ring" aria-hidden="true" />
      </div>
      <p className="loading-title">
        Generating your {mode === 'flashcards' ? 'flashcards' : 'quiz'}…
      </p>
      <div className="loading-dots" aria-hidden="true">
        <span /><span /><span />
      </div>
      <p className="loading-subtitle">This may take up to 25 seconds</p>
    </div>
  );
}
