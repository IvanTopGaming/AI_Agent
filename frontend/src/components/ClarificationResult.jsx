export default function ClarificationResult({ question }) {
  return (
    <div className="action-result clarification-result">
      <span>Нужно уточнение</span>
      <strong>{question}</strong>
    </div>
  )
}
