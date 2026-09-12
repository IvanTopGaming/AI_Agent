const labels = {
  WIFI: 'Wi-Fi',
  ACCOUNT: 'Учётная запись',
  EDUCATION_PLATFORM: 'Образовательная платформа',
  OTHER: 'Другое',
  LOW: 'Низкий',
  MEDIUM: 'Средний',
  HIGH: 'Высокий',
  CRITICAL: 'Критический',
}

export default function AnalysisResult({ analysis }) {
  if (!analysis) {
    return null
  }

  return (
    <div className="analysis-card">
      <div className="result-heading">
        <span>Анализ</span>
        <span className={`priority priority-${analysis.priority?.toLowerCase()}`}>
          {labels[analysis.priority] || analysis.priority}
        </span>
      </div>
      <h2>{labels[analysis.category] || analysis.category}</h2>
      <p>{analysis.problemDescription}</p>
      {analysis.missingFields?.length > 0 && (
        <div className="missing-fields">
          Не хватает: {analysis.missingFields.join(', ')}
        </div>
      )}
    </div>
  )
}
