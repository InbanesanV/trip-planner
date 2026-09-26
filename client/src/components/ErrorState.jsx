const ERROR_META = {
  timeout: {
    icon: '⏱️',
    title: 'Request timed out',
    description: 'The server took longer than 25 seconds to respond. The topic may be complex or the service is busy.',
  },
  network: {
    icon: '🔌',
    title: 'Network error',
    description: 'Could not reach the server. Make sure the backend is running on port 3001 and try again.',
  },
  server: {
    icon: '🚨',
    title: 'Server error',
    description: 'The server encountered an error while processing your request.',
  },
  parse: {
    icon: '⚠️',
    title: 'Malformed response',
    description: 'The AI returned a response that couldn\'t be parsed as JSON. Retrying usually fixes this.',
  },
  shape: {
    icon: '🔧',
    title: 'Unexpected structure',
    description: 'The AI response had an unexpected structure. Retrying may produce a correctly formatted result.',
  },
  empty: {
    icon: '🈳',
    title: 'Empty response',
    description: 'The AI returned an empty response. Try rephrasing your topic or adding more detail.',
  },
};

export default function ErrorState({ errorKind, message, onRetry }) {
  const meta = ERROR_META[errorKind] || { icon: '❌', title: 'Something went wrong', description: '' };

  return (
    <div className="error-state" role="alert">
      <div className="error-icon-wrap">
        <span className="error-icon" aria-hidden="true">{meta.icon}</span>
      </div>
      <h2 className="error-title">{meta.title}</h2>
      <p className="error-description">{meta.description}</p>
      {message && (
        <details className="error-details">
          <summary>Technical details</summary>
          <p className="error-message-text">{message}</p>
        </details>
      )}
      <button className="retry-btn" onClick={onRetry}>
        ↩ Try again
      </button>
    </div>
  );
}
