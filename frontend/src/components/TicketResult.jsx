export default function TicketResult({ ticketId }) {
  return (
    <div className="action-result success-result">
      <span>Заявка создана</span>
      <strong>#{ticketId}</strong>
    </div>
  )
}
