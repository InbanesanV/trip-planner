import { useState } from 'react';
import './Quiz.css';
import QuizSummary from './QuizSummary.jsx';

export default function Quiz({ topic, questions, onRetest }) {
  const total = questions.length;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [hasAnswered, setHasAnswered] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isFinished, setIsFinished] = useState(false);

  const question = questions[currentIndex];
  const score = Object.values(answers).filter((a) => a.isCorrect).length;

  function handleOptionSelect(i) {
    if (hasAnswered) return;
    setSelectedOption(i);
  }

  function handleSubmitAnswer() {
    if (selectedOption === null || hasAnswered) return;
    const isCorrect = selectedOption === question.correctIndex;
    setAnswers((prev) => ({
      ...prev,
      [question.id]: { selectedIndex: selectedOption, isCorrect },
    }));
    setHasAnswered(true);
  }

  function handleNext() {
    if (currentIndex === total - 1) {
      setIsFinished(true);
    } else {
      setCurrentIndex((i) => i + 1);
      setHasAnswered(false);
      setSelectedOption(null);
    }
  }

  function handleRetest(missedQuestions) {
    setCurrentIndex(0);
    setAnswers({});
    setHasAnswered(false);
    setSelectedOption(null);
    setIsFinished(false);
    onRetest(missedQuestions);
  }

  if (isFinished) {
    const missed = questions.filter((q) => answers[q.id] && !answers[q.id].isCorrect);
    return (
      <QuizSummary
        topic={topic}
        total={total}
        score={score}
        missedQuestions={missed}
        questions={questions}
        answers={answers}
        onRetest={handleRetest}
      />
    );
  }

  const answerRecord = answers[question.id];

  function getOptionClass(i) {
    if (!hasAnswered) return selectedOption === i ? 'option-btn option-btn--selected' : 'option-btn';
    if (i === question.correctIndex) return 'option-btn option-btn--correct';
    if (i === answerRecord?.selectedIndex) return 'option-btn option-btn--wrong';
    return 'option-btn option-btn--dimmed';
  }

  return (
    <div className="quiz">
      {/* Header */}
      <div className="quiz-header">
        <h2 className="quiz-topic">{topic}</h2>
        <div className="quiz-meta">
          <span className="quiz-progress-pill" aria-live="polite">
            {currentIndex + 1} / {total}
          </span>
          <span className="quiz-score-pill" aria-live="polite">
            ⭐ {score}/{total}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div
        className="quiz-progress-bar"
        role="progressbar"
        aria-valuenow={currentIndex + 1}
        aria-valuemin={1}
        aria-valuemax={total}
      >
        <div
          className="quiz-progress-fill"
          style={{ width: `${((currentIndex + 1) / total) * 100}%` }}
        />
      </div>

      {/* Question */}
      <div className="question-card">
        <p className="question-number">Question {currentIndex + 1}</p>
        <p className="question-text">{question.question}</p>
      </div>

      {/* Options */}
      <div className="options-list" role="group" aria-label="Answer options">
        {question.options.map((option, i) => (
          <button
            key={i}
            className={getOptionClass(i)}
            onClick={() => handleOptionSelect(i)}
            disabled={hasAnswered}
            aria-pressed={selectedOption === i}
          >
            <span className="option-letter" aria-hidden="true">
              {String.fromCharCode(65 + i)}
            </span>
            <span className="option-text">{option}</span>
            {hasAnswered && i === question.correctIndex && (
              <span className="option-badge" aria-hidden="true">✅</span>
            )}
            {hasAnswered && i === answerRecord?.selectedIndex && !answerRecord.isCorrect && (
              <span className="option-badge" aria-hidden="true">❌</span>
            )}
          </button>
        ))}
      </div>

      {/* Feedback */}
      {hasAnswered && (
        <div
          className={`feedback-panel ${answerRecord?.isCorrect ? 'feedback-panel--correct' : 'feedback-panel--wrong'}`}
          role="status"
          aria-live="polite"
        >
          <p className="feedback-result">
            {answerRecord?.isCorrect ? '✅ Correct!' : '❌ Incorrect'}
          </p>
          <p className="feedback-explanation">{question.explanation}</p>
        </div>
      )}

      {/* Actions */}
      <div className="quiz-actions">
        {!hasAnswered ? (
          <button
            className="submit-answer-btn"
            onClick={handleSubmitAnswer}
            disabled={selectedOption === null}
          >
            Submit Answer ✓
          </button>
        ) : (
          <button className="next-btn" onClick={handleNext}>
            {currentIndex === total - 1 ? 'See Results →' : 'Next Question →'}
          </button>
        )}
      </div>
    </div>
  );
}
