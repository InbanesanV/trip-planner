import './QuizSummary.css';

export default function QuizSummary({ topic, total, score, missedQuestions, questions, answers, onRetest }) {
  const isPerfect = missedQuestions.length === 0;
  const pct = Math.round((score / total) * 100);

  function getGrade() {
    if (pct === 100) return { label: 'Perfect Score! 🏆', className: 'grade--perfect' };
    if (pct >= 80)  return { label: 'Great Job! 🎉',    className: 'grade--great' };
    if (pct >= 60)  return { label: 'Good Effort 👍',   className: 'grade--good' };
    return                  { label: 'Keep Studying 📚', className: 'grade--low' };
  }

  const grade = getGrade();

  // SVG ring parameters
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (pct / 100) * circumference;

  return (
    <div className="quiz-summary">
      {/* Score banner */}
      <div className={`summary-banner ${grade.className}`}>
        <p className="summary-grade-label">{grade.label}</p>
        <p className="summary-topic">{topic}</p>

        <div className="summary-score-ring" aria-label={`Score: ${score} out of ${total} (${pct}%)`}>
          <svg className="score-ring-svg" viewBox="0 0 100 100" aria-hidden="true">
            <defs>
              <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="var(--primary)" />
                <stop offset="100%" stopColor="var(--accent)" />
              </linearGradient>
            </defs>
            <circle className="score-ring-bg" cx="50" cy="50" r={radius} />
            <circle
              className="score-ring-fill"
              cx="50" cy="50" r={radius}
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
            />
          </svg>
          <div className="score-ring-inner">
            <span className="score-fraction">{score}/{total}</span>
            <span className="score-pct">{pct}%</span>
          </div>
        </div>
      </div>

      {isPerfect ? (
        <div className="perfect-state">
          <div className="perfect-icon" aria-hidden="true">🌟</div>
          <p className="perfect-message">
            You answered every question correctly!<br />
            Nothing to retest — you've mastered this topic.
          </p>
        </div>
      ) : (
        <div className="missed-section">
          <div className="missed-header">
            <h3 className="missed-title">Review Missed Questions</h3>
            <span className="missed-count-badge">{missedQuestions.length} missed</span>
          </div>

          <ul className="missed-list">
            {missedQuestions.map((q) => {
              const userAnswer = answers[q.id];
              return (
                <li key={q.id} className="missed-item">
                  <p className="missed-question">{q.question}</p>
                  <div className="missed-answers">
                    <p className="missed-correct">
                      <span className="missed-label">✅ Correct:</span>
                      {q.options[q.correctIndex]}
                    </p>
                    {userAnswer && (
                      <p className="missed-yours">
                        <span className="missed-label">❌ Yours:</span>
                        {q.options[userAnswer.selectedIndex] ?? '(unanswered)'}
                      </p>
                    )}
                  </div>
                  <p className="missed-explanation">{q.explanation}</p>
                </li>
              );
            })}
          </ul>

          <div className="summary-actions">
            <button className="retest-btn" onClick={() => onRetest(missedQuestions)}>
              🔁 Retest {missedQuestions.length} wrong answer{missedQuestions.length !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
