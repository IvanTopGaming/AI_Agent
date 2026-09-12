import { useState } from 'react'
import { analyzeSupportRequest } from './api/supportApi.js'
import AnalysisResult from './components/AnalysisResult.jsx'
import ClarificationResult from './components/ClarificationResult.jsx'
import LoadingIndicator from './components/LoadingIndicator.jsx'
import SupportForm from './components/SupportForm.jsx'
import TicketResult from './components/TicketResult.jsx'

export default function App() {
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(text, source) {
    setIsLoading(true)
    setError('')
    setResult(null)

    try {
      setResult(await analyzeSupportRequest(text, source))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="page-shell">
      <header className="page-header">
        <span className="eyebrow">Универ Helpdesk</span>
        <h1>Опиши проблему.<br />Остальное разберёт ИИ.</h1>
        <p>Помощник уточнит детали или сразу создаст заявку в техническую поддержку.</p>
      </header>

      <section className="workspace">
        <SupportForm onSubmit={handleSubmit} isLoading={isLoading} />

        <div className="result-panel" aria-live="polite">
          {!isLoading && !result && !error && (
            <div className="empty-state">
              <span>01</span>
              <p>Результат анализа появится здесь</p>
            </div>
          )}
          {isLoading && <LoadingIndicator />}
          {error && <div className="error-message">{error}</div>}
          {result && <AnalysisResult analysis={result.analysis} />}
          {result?.action === 'TICKET_CREATED' && <TicketResult ticketId={result.ticketId} />}
          {result?.action === 'CLARIFICATION_REQUIRED' && (
            <ClarificationResult question={result.clarificationQuestion} />
          )}
        </div>
      </section>
    </main>
  )
}
