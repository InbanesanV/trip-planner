export default function EmptyState() {
  return (
    <div className="empty-state">
      <div className="empty-icon-wrap">
        <div className="empty-icon-bg" aria-hidden="true" />
        <span className="empty-icon" aria-hidden="true">📚</span>
      </div>
      <h2 className="empty-title">Ready to study?</h2>
      <p className="empty-description">
        Paste your notes or type a topic above, pick a mode, and hit <strong>Generate</strong>.
      </p>
      <ul className="empty-examples" aria-label="Example topics">
        <li><span className="example-chip">🇫🇷 French Revolution</span></li>
        <li><span className="example-chip">🧬 DNA Replication</span></li>
        <li><span className="example-chip">⚛️ Quantum Mechanics</span></li>
        <li><span className="example-chip">📈 Supply & Demand</span></li>
        <li><span className="example-chip">🧠 Neuroscience Basics</span></li>
        <li><span className="example-chip">🌍 World War II</span></li>
      </ul>
    </div>
  );
}
