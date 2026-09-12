import type { CategoryId, Priority, Ticket } from '../types/ticket';

export const CATEGORIES = [
  { id: 'technical' as CategoryId, label: 'Техническая проблема', description: 'Сбои сервиса, ошибки в работе API, 500/502' },
  { id: 'billing' as CategoryId, label: 'Оплата и тарифы', description: 'Списание средств, баланс, счета и подписка' },
  { id: 'bug' as CategoryId, label: 'Баг в интерфейсе', description: 'Проблемы с отображением, кнопками или версткой' },
  { id: 'integration' as CategoryId, label: 'Интеграция / Webhook', description: 'Настройка вебхуков, ключи доступа и SDK' },
  { id: 'general' as CategoryId, label: 'Общий вопрос', description: 'Консультация по возможностям и помощь' },
];

export const PRIORITIES: Priority[] = [
  { id: 'low', label: 'Низкий', color: 'text-emerald-400', badgeBg: 'bg-emerald-500/10 border-emerald-500/20' },
  { id: 'medium', label: 'Средний', color: 'text-blue-400', badgeBg: 'bg-blue-500/10 border-blue-500/20' },
  { id: 'high', label: 'Высокий', color: 'text-amber-400', badgeBg: 'bg-amber-500/10 border-amber-500/20' },
  { id: 'urgent', label: 'Критический', color: 'text-rose-400', badgeBg: 'bg-rose-500/10 border-rose-500/20' },
];

export function generateAiResponse(ticket: Ticket): string {
  const { number, title, category, priority, description } = ticket;
  const intro = `Здравствуйте! Я проанализировал ваше обращение #${number} («${title}»). Приоритет: ${priority.toUpperCase()}.`;

  switch (category) {
    case 'technical':
      return `${intro}

Судя по описанию: «${description}», зафиксирован сбой в работе сетевого шлюза или обработчика запросов.

### Рекомендуемые действия для диагностики:
1. **Проверьте заголовки авторизации:** убедитесь, что Bearer-токен действителен и не истёк.
2. **Проверьте статус эндпоинта:**
\`\`\`bash
curl -i -X POST https://api.service.io/v1/health \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json"
\`\`\`
3. **Локальный кеш:** отправьте запрос с заголовком \`Cache-Control: no-cache\`.

Если проблема сохраняется, я могу запросить дампы серверных логов или подключить дежурного инженера.`;
    case 'billing':
      return `${intro}

Я проверил информацию по вопросу оплаты и тарифов: «${description}».

### Сводка по транзакциям:
- Транзакции за последние 24 часа могут находиться в синхронизации с банковским шлюзом.
- Счета и акты доступны в разделе «Настройки организации → Финансы».
- Для проверки блокировки средств потребуется идентификатор операции и время платежа.`;
    case 'bug':
      return `${intro}

Спасибо за отчёт об ошибке. Контекст проблемы «${description}» сохранён в тикете.

### Временный обходной путь:
1. Выполните жёсткую перезагрузку страницы: \`Ctrl+F5\` или \`Cmd+Shift+R\`.
2. Проверьте поведение в приватном окне без расширений.
3. Если ошибка повторяется, приложите скриншот и версию браузера.`;
    case 'integration':
      return `${intro}

По вопросу интеграции и вебхуков: «${description}».

Убедитесь, что принимающий сервер возвращает HTTP 200 в течение 5 секунд, иначе очередь повторов задержит следующие события:
\`\`\`json
{
  "event": "webhook.verify",
  "status": "active",
  "timestamp": "${new Date().toISOString()}"
}
\`\`\`
После проверки выполните тестовую отправку в Webhook Simulator.`;
    default:
      return `${intro}

Спасибо за подробное описание: «${description}».

Я добавил вопрос в контекст и готов продолжить диагностику. Напишите, какой результат вы ожидаете и что происходит фактически.`;
  }
}

export function generateFollowUpResponse(ticket: Ticket, question: string): string {
  const normalizedQuestion = question.toLocaleLowerCase('ru-RU');

  if (normalizedQuestion.includes('оператор')) {
    return `Подключаю специалиста к обращению #${ticket.number}. Я передал ему историю диалога, описание «${ticket.title}» и результаты диагностики.

Оператор присоединится к этому чату в течение нескольких минут. Пока ожидаете, можете добавить логи или скриншоты.`;
  }

  if (normalizedQuestion.includes('решен') || normalizedQuestion.includes('решена') || normalizedQuestion.includes('помогло')) {
    return `Отлично, отмечаю обращение #${ticket.number} как решённое. История и рекомендации останутся доступны в этом диалоге.

Если проблема повторится, создайте новое обращение и укажите этот номер тикета.`;
  }

  if (normalizedQuestion.includes('лог') || normalizedQuestion.includes('ошиб')) {
    return `По вашему уточнению «${question}» рекомендую проверить строки непосредственно перед первой ошибкой и найти идентификатор запроса.

### Что прислать для точной диагностики
1. Время возникновения сбоя с часовым поясом.
2. HTTP-статус и заголовок \`x-request-id\`.
3. Фрагмент лога без токенов и персональных данных.

Для обращения #${ticket.number} этих данных будет достаточно, чтобы локализовать источник сбоя.`;
  }

  if (normalizedQuestion.includes('как') || normalizedQuestion.includes('подробнее') || normalizedQuestion.includes('уточн')) {
    return `Уточню решение для обращения #${ticket.number}. Начните с воспроизведения проблемы в отдельной сессии, затем сравните результат с исходным сценарием «${ticket.description}».

- Выполняйте шаги по одному.
- После каждого шага сохраняйте статус и время ответа.
- Если результат изменился, напишите, на каком именно шаге это произошло.

Так я скорректирую диагностику без повторения уже выполненных проверок.`;
  }

  return `Принял уточнение: «${question}». Оно добавлено в контекст обращения #${ticket.number}.

С учётом категории «${ticket.category}» сначала проверьте, воспроизводится ли проблема в новой сессии. Затем пришлите фактический результат и время последней попытки.`;
}

export function streamAiResponse(
  fullText: string,
  onChunk: (chunk: string) => void,
  onDone: () => void,
  chunkDelayMs: number = 18,
): () => void {
  const words = fullText.split(/(\s+)/);
  let index = 0;
  let isCancelled = false;

  const intervalId = setInterval(() => {
    if (isCancelled) {
      clearInterval(intervalId);
      return;
    }

    if (index < words.length) {
      onChunk(words[index]);
      index += 1;
    } else {
      clearInterval(intervalId);
      onDone();
    }
  }, chunkDelayMs);

  return () => {
    isCancelled = true;
    clearInterval(intervalId);
  };
}
