import { useState } from 'react'

export default function SupportForm({ onSubmit, isLoading }) {
  const [text, setText] = useState('')
  const [source, setSource] = useState('CHAT')

  function handleSubmit(event) {
    event.preventDefault()
    if (text.trim()) {
      onSubmit(text.trim(), source)
    }
  }

  return (
    <form className="support-form" onSubmit={handleSubmit}>
      <label htmlFor="request-text">Что случилось?</label>
      <textarea
        id="request-text"
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Например: не подключается Wi-Fi в третьем корпусе с ноутбука..."
        rows="9"
        disabled={isLoading}
        required
      />

      <div className="form-footer">
        <label className="source-field" htmlFor="request-source">
          Источник
          <select
            id="request-source"
            value={source}
            onChange={(event) => setSource(event.target.value)}
            disabled={isLoading}
          >
            <option value="CHAT">Чат</option>
            <option value="EMAIL">Почта</option>
            <option value="TRANSCRIPT">Расшифровка</option>
          </select>
        </label>

        <button type="submit" disabled={isLoading || !text.trim()}>
          {isLoading ? 'Анализируем' : 'Разобрать обращение'}
        </button>
      </div>
    </form>
  )
}
