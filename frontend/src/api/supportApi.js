export async function analyzeSupportRequest(text, source) {
  const response = await fetch('/api/support/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text, source }),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.error || 'Не удалось обработать обращение')
  }

  return data
}
