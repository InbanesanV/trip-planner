import { useState } from 'react';
import './FlashcardDeck.css';

export default function FlashcardDeck({ topic, cards }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const total = cards.length;
  const card = cards[currentIndex];

  function goNext() {
    setCurrentIndex((i) => Math.min(i + 1, total - 1));
    setIsFlipped(false);
  }

  function goPrev() {
    setCurrentIndex((i) => Math.max(i - 1, 0));
    setIsFlipped(false);
  }

  function handleFlip() { setIsFlipped((f) => !f); }

  function handleKeyDown(e) {
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); handleFlip(); }
    else if (e.key === 'ArrowRight') goNext();
    else if (e.key === 'ArrowLeft')  goPrev();
  }

  return (
    <div className="flashcard-deck">
      {/* Header */}
      <div className="deck-header">
        <h2 className="deck-topic">{topic}</h2>
        <div className="deck-progress-badge" aria-live="polite">
          Card <strong>{currentIndex + 1}</strong> / <strong>{total}</strong>
        </div>
      </div>

      {/* Progress bar */}
      <div
        className="deck-progress-bar"
        role="progressbar"
        aria-valuenow={currentIndex + 1}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-label={`Card ${currentIndex + 1} of ${total}`}
      >
        <div
          className="deck-progress-fill"
          style={{ width: `${((currentIndex + 1) / total) * 100}%` }}
        />
      </div>

      {/* Flip card */}
      <div
        className="flashcard-scene"
        onClick={handleFlip}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-label={
          isFlipped
            ? `Answer: ${card.answer}. Press space to show question.`
            : `Question: ${card.question}. Press space to reveal answer.`
        }
      >
        <div className={`flashcard ${isFlipped ? 'flashcard--flipped' : ''}`}>
          {/* Front */}
          <div className="flashcard-face flashcard-front">
            <span className="face-label">Question</span>
            <p className="face-text">{card.question}</p>
            <span className="flip-hint">
              <span className="flip-hint-icon">👆</span>
              Tap to flip
            </span>
          </div>
          {/* Back */}
          <div className="flashcard-face flashcard-back">
            <span className="face-label">Answer</span>
            <p className="face-text">{card.answer}</p>
            <span className="flip-hint">
              <span className="flip-hint-icon">👆</span>
              Tap to flip back
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="deck-nav">
        <button
          className="nav-btn"
          onClick={goPrev}
          disabled={currentIndex === 0}
          aria-label="Previous card"
        >
          ← Prev
        </button>

        <button className="flip-btn" onClick={handleFlip} aria-label={isFlipped ? 'Show question' : 'Reveal answer'}>
          🔁 {isFlipped ? 'Show Question' : 'Reveal Answer'}
        </button>

        <button
          className="nav-btn"
          onClick={goNext}
          disabled={currentIndex === total - 1}
          aria-label="Next card"
        >
          Next →
        </button>
      </div>

      {/* Keyboard hints */}
      <p className="deck-keyboard-hint" aria-hidden="true">
        <kbd className="kbd">←</kbd> <kbd className="kbd">→</kbd> navigate
        &nbsp;·&nbsp;
        <kbd className="kbd">Space</kbd> flip
      </p>
    </div>
  );
}
