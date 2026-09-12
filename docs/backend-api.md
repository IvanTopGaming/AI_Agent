# Backend API Contract

Фронтенд сейчас использует локальную симуляцию AI. Этот документ описывает рекомендуемый HTTP API для подключения реального бэкенда.

## Базовые настройки

- Base URL: `/api/v1`
- Формат данных: `application/json`
- Формат дат: ISO 8601 в UTC
- Формат AI-сообщений: Markdown
- Стриминг ответов: Server-Sent Events
- URL бэкенда на фронтенде: `VITE_API_URL`

## Идентификаторы

Канонический идентификатор каждого обращения — UUID v4, генерируемый PostgreSQL. Он используется во внешних ключах, URL и API.

Человекочитаемый номер вида `TK-8492` хранится отдельно в поле `number` и используется только для отображения и поиска оператором. Он не заменяет UUID.

```typescript
type UUID = string;

interface TicketIdentity {
  id: UUID;
  number: string;
}
```

Пример URL с UUID:

```text
/api/v1/tickets/3f1f7f72-9145-4f67-8a68-6e2ad15d5f31
```

## Типы

```typescript
type Category =
  | 'technical'
  | 'billing'
  | 'bug'
  | 'integration'
  | 'general';

type Priority = 'low' | 'medium' | 'high' | 'urgent';

type TicketStatus =
  | 'open'
  | 'ai_processing'
  | 'ai_answered'
  | 'resolved'
  | 'escalated';

type MessageRole = 'user' | 'assistant' | 'system';
```

## Создание тикета

`POST /api/v1/tickets`

### Запрос

```json
{
  "title": "Ошибка 500 при вызове API",
  "description": "POST /v1/chat возвращает Internal Server Error",
  "category": "technical",
  "priority": "high",
  "attachmentIds": ["91b31d20-402d-47d7-bd44-248d3c884395"]
}
```

### Ответ

Статус: `201 Created`

```json
{
  "ticket": {
    "id": "3f1f7f72-9145-4f67-8a68-6e2ad15d5f31",
    "number": "TK-8492",
    "title": "Ошибка 500 при вызове API",
    "description": "POST /v1/chat возвращает Internal Server Error",
    "category": "technical",
    "priority": "high",
    "status": "ai_processing",
    "createdAt": "2026-09-12T11:45:00.000Z",
    "updatedAt": "2026-09-12T11:45:00.000Z",
    "attachments": [
      {
        "id": "91b31d20-402d-47d7-bd44-248d3c884395",
        "name": "error.log",
        "contentType": "text/plain",
        "sizeBytes": 24576,
        "downloadUrl": "/api/v1/attachments/91b31d20-402d-47d7-bd44-248d3c884395"
      }
    ]
  }
}
```

После создания тикета бэкенд должен запустить генерацию первого ответа AI.

## Получение тикета

`GET /api/v1/tickets/{ticketUuid}`

### Ответ

Статус: `200 OK`

```json
{
  "ticket": {
    "id": "3f1f7f72-9145-4f67-8a68-6e2ad15d5f31",
    "number": "TK-8492",
    "title": "Ошибка 500 при вызове API",
    "description": "POST /v1/chat возвращает Internal Server Error",
    "category": "technical",
    "priority": "high",
    "status": "ai_answered",
    "createdAt": "2026-09-12T11:45:00.000Z",
    "updatedAt": "2026-09-12T11:46:10.000Z",
    "attachments": []
  }
}
```

## История сообщений

`GET /api/v1/tickets/{ticketUuid}/messages?cursor={cursor}&limit=50`

### Ответ

```json
{
  "items": [
    {
      "id": "b708e834-d298-45c3-9397-5e71d9978f66",
      "ticketId": "3f1f7f72-9145-4f67-8a68-6e2ad15d5f31",
      "role": "user",
      "content": "POST /v1/chat возвращает ошибку 500",
      "format": "markdown",
      "createdAt": "2026-09-12T11:45:00.000Z",
      "attachments": []
    },
    {
      "id": "c745fca4-2a21-4d49-8dd9-d8e837ef4047",
      "ticketId": "3f1f7f72-9145-4f67-8a68-6e2ad15d5f31",
      "role": "assistant",
      "content": "Проверьте заголовок `Authorization`.",
      "format": "markdown",
      "createdAt": "2026-09-12T11:45:08.000Z",
      "attachments": []
    }
  ],
  "nextCursor": null
}
```

## Отправка сообщения

`POST /api/v1/tickets/{ticketUuid}/messages`

### Запрос

```json
{
  "content": "Какие логи нужно прислать?",
  "attachmentIds": ["98264261-873b-48df-8208-042ffca234dd"]
}
```

### Ответ

Статус: `202 Accepted`

```json
{
  "message": {
    "id": "d444b1ca-f4e4-4b6c-9444-3cc29bb743c8",
    "ticketId": "3f1f7f72-9145-4f67-8a68-6e2ad15d5f31",
    "role": "user",
    "content": "Какие логи нужно прислать?",
    "format": "markdown",
    "createdAt": "2026-09-12T11:48:00.000Z",
    "attachments": []
  },
  "status": "ai_processing"
}
```

AI-ответ приходит через поток SSE.

## Стриминг AI

`GET /api/v1/tickets/{ticketUuid}/events`

### Заголовки ответа

```http
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
X-Accel-Buffering: no
```

### Начало генерации

```text
id: 101
event: message.started
data: {"messageId":"e54bbf86-2b96-413f-b212-909bd7e4b481","role":"assistant","createdAt":"2026-09-12T11:48:01.000Z"}
```

### Часть ответа

```text
id: 102
event: message.delta
data: {"messageId":"e54bbf86-2b96-413f-b212-909bd7e4b481","delta":"Для диагностики "}
```

```text
id: 103
event: message.delta
data: {"messageId":"e54bbf86-2b96-413f-b212-909bd7e4b481","delta":"пришлите заголовок `x-request-id`."}
```

### Завершение сообщения

```text
id: 104
event: message.completed
data: {"messageId":"e54bbf86-2b96-413f-b212-909bd7e4b481","content":"Для диагностики пришлите заголовок `x-request-id`.","format":"markdown","createdAt":"2026-09-12T11:48:04.000Z"}
```

### Обновление тикета

```text
id: 105
event: ticket.updated
data: {"ticketId":"3f1f7f72-9145-4f67-8a68-6e2ad15d5f31","status":"ai_answered","updatedAt":"2026-09-12T11:48:04.000Z"}
```

### Ошибка генерации

```text
id: 106
event: message.failed
data: {"messageId":"e54bbf86-2b96-413f-b212-909bd7e4b481","code":"AI_PROVIDER_ERROR","message":"Не удалось сформировать ответ"}
```

SSE-эндпоинт должен поддерживать `Last-Event-ID`, чтобы клиент мог восстановить поток после переподключения.

## Загрузка файлов

`POST /api/v1/attachments`

Content-Type: `multipart/form-data`

Поле с файлом: `file`.

### Ответ

Статус: `201 Created`

```json
{
  "attachment": {
    "id": "91b31d20-402d-47d7-bd44-248d3c884395",
    "name": "error.log",
    "contentType": "text/plain",
    "sizeBytes": 24576,
    "downloadUrl": "/api/v1/attachments/91b31d20-402d-47d7-bd44-248d3c884395"
  }
}
```

Размер файла должен возвращаться числом в байтах. Форматирование в `24 KB` или `1.2 MB` выполняется на фронтенде.

## Изменение статуса

`PATCH /api/v1/tickets/{ticketUuid}`

### Закрытие обращения

```json
{
  "status": "resolved"
}
```

### Вызов оператора

```json
{
  "status": "escalated"
}
```

### Ответ

```json
{
  "ticket": {
    "id": "3f1f7f72-9145-4f67-8a68-6e2ad15d5f31",
    "number": "TK-8492",
    "status": "escalated",
    "updatedAt": "2026-09-12T11:50:00.000Z"
  }
}
```

## Оценка ответа AI

`POST /api/v1/messages/{messageUuid}/feedback`

### Положительная оценка

```json
{
  "rating": "positive"
}
```

### Отрицательная оценка

```json
{
  "rating": "negative",
  "comment": "Ответ не относится к ошибке авторизации"
}
```

Ответ: `204 No Content`.

## Формат ошибок

Все эндпоинты должны возвращать ошибки в едином формате:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Некорректные параметры обращения",
    "fields": {
      "title": "Поле обязательно"
    },
    "requestId": "req_01JXYZ"
  }
}
```

Рекомендуемые HTTP-коды:

- `400 Bad Request`
- `401 Unauthorized`
- `403 Forbidden`
- `404 Not Found`
- `409 Conflict`
- `413 Payload Too Large`
- `422 Unprocessable Entity`
- `429 Too Many Requests`
- `500 Internal Server Error`

## Схема PostgreSQL

Ниже приведена базовая схема для PostgreSQL 15+. UUID генерируются расширением `pgcrypto`. Поле `ticket_number` используется для формирования отображаемого номера `TK-8492`, а `tickets.id` остаётся каноническим идентификатором.

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE ticket_category AS ENUM (
    'technical',
    'billing',
    'bug',
    'integration',
    'general'
);

CREATE TYPE ticket_priority AS ENUM (
    'low',
    'medium',
    'high',
    'urgent'
);

CREATE TYPE ticket_status AS ENUM (
    'open',
    'ai_processing',
    'ai_answered',
    'resolved',
    'escalated'
);

CREATE TYPE message_role AS ENUM (
    'user',
    'assistant',
    'system'
);

CREATE TYPE message_status AS ENUM (
    'queued',
    'streaming',
    'completed',
    'failed'
);

CREATE TYPE ai_run_status AS ENUM (
    'queued',
    'running',
    'completed',
    'failed',
    'cancelled'
);

CREATE TABLE users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id text UNIQUE,
    email text UNIQUE,
    display_name text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE tickets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_number bigint GENERATED ALWAYS AS IDENTITY (START WITH 1000),
    requester_id uuid REFERENCES users(id) ON DELETE SET NULL,
    title varchar(100) NOT NULL,
    description text NOT NULL,
    category ticket_category NOT NULL,
    priority ticket_priority NOT NULL DEFAULT 'medium',
    status ticket_status NOT NULL DEFAULT 'open',
    assigned_operator_id uuid REFERENCES users(id) ON DELETE SET NULL,
    resolved_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT tickets_ticket_number_unique UNIQUE (ticket_number),
    CONSTRAINT tickets_title_not_blank CHECK (length(btrim(title)) > 0),
    CONSTRAINT tickets_description_not_blank CHECK (length(btrim(description)) > 0),
    CONSTRAINT tickets_resolved_at_check CHECK (
        status <> 'resolved' OR resolved_at IS NOT NULL
    )
);

CREATE TABLE messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id uuid NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    author_id uuid REFERENCES users(id) ON DELETE SET NULL,
    role message_role NOT NULL,
    status message_status NOT NULL DEFAULT 'completed',
    content text NOT NULL DEFAULT '',
    format varchar(20) NOT NULL DEFAULT 'markdown',
    error_code text,
    error_message text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    completed_at timestamptz,
    CONSTRAINT messages_format_check CHECK (format IN ('plain', 'markdown')),
    CONSTRAINT messages_author_check CHECK (
        role <> 'user' OR author_id IS NOT NULL
    )
);

CREATE TABLE attachments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id uuid REFERENCES users(id) ON DELETE SET NULL,
    storage_key text NOT NULL UNIQUE,
    original_name text NOT NULL,
    content_type text NOT NULL,
    size_bytes bigint NOT NULL,
    checksum_sha256 char(64),
    created_at timestamptz NOT NULL DEFAULT now(),
    expires_at timestamptz,
    CONSTRAINT attachments_size_check CHECK (size_bytes > 0)
);

CREATE TABLE ticket_attachments (
    ticket_id uuid NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    attachment_id uuid NOT NULL REFERENCES attachments(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (ticket_id, attachment_id),
    CONSTRAINT ticket_attachments_attachment_unique UNIQUE (attachment_id)
);

CREATE TABLE message_attachments (
    message_id uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    attachment_id uuid NOT NULL REFERENCES attachments(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (message_id, attachment_id),
    CONSTRAINT message_attachments_attachment_unique UNIQUE (attachment_id)
);

CREATE TABLE message_feedback (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating smallint NOT NULL,
    comment text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT message_feedback_rating_check CHECK (rating IN (-1, 1)),
    CONSTRAINT message_feedback_unique UNIQUE (message_id, user_id)
);

CREATE TABLE ticket_status_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id uuid NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    previous_status ticket_status,
    next_status ticket_status NOT NULL,
    changed_by uuid REFERENCES users(id) ON DELETE SET NULL,
    reason text,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT ticket_status_changed_check CHECK (
        previous_status IS NULL OR previous_status <> next_status
    )
);

CREATE TABLE ai_runs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id uuid NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    request_message_id uuid REFERENCES messages(id) ON DELETE SET NULL,
    response_message_id uuid REFERENCES messages(id) ON DELETE SET NULL,
    provider text NOT NULL,
    model text NOT NULL,
    status ai_run_status NOT NULL DEFAULT 'queued',
    prompt_tokens integer,
    completion_tokens integer,
    error_code text,
    error_message text,
    started_at timestamptz,
    completed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT ai_runs_prompt_tokens_check CHECK (
        prompt_tokens IS NULL OR prompt_tokens >= 0
    ),
    CONSTRAINT ai_runs_completion_tokens_check CHECK (
        completion_tokens IS NULL OR completion_tokens >= 0
    )
);

CREATE TABLE stream_events (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ticket_id uuid NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    event_type text NOT NULL,
    payload jsonb NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT stream_events_type_check CHECK (
        event_type IN (
            'message.started',
            'message.delta',
            'message.completed',
            'message.failed',
            'ticket.updated'
        )
    )
);

CREATE INDEX tickets_requester_created_idx
    ON tickets (requester_id, created_at DESC);

CREATE INDEX tickets_status_priority_idx
    ON tickets (status, priority, created_at DESC);

CREATE INDEX tickets_operator_status_idx
    ON tickets (assigned_operator_id, status)
    WHERE assigned_operator_id IS NOT NULL;

CREATE INDEX messages_ticket_created_idx
    ON messages (ticket_id, created_at, id);

CREATE INDEX attachments_owner_created_idx
    ON attachments (owner_id, created_at DESC);

CREATE INDEX ticket_status_history_ticket_created_idx
    ON ticket_status_history (ticket_id, created_at DESC);

CREATE INDEX ai_runs_ticket_created_idx
    ON ai_runs (ticket_id, created_at DESC);

CREATE INDEX ai_runs_active_idx
    ON ai_runs (status, created_at)
    WHERE status IN ('queued', 'running');

CREATE INDEX stream_events_ticket_id_idx
    ON stream_events (ticket_id, id);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER users_set_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER tickets_set_updated_at
BEFORE UPDATE ON tickets
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER messages_set_updated_at
BEFORE UPDATE ON messages
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER message_feedback_set_updated_at
BEFORE UPDATE ON message_feedback
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
```

Отображаемый номер формируется бэкендом без использования его как первичного ключа:

```sql
SELECT
    id,
    'TK-' || ticket_number AS number,
    title,
    status
FROM tickets
WHERE id = $1::uuid;
```

При создании обращения в одной транзакции нужно создать `tickets`, первое пользовательское сообщение в `messages`, связи с вложениями и запись в `ticket_status_history`.

При смене статуса обновление `tickets` и добавление строки в `ticket_status_history` также должны выполняться в одной транзакции.

Таблица `stream_events` позволяет повторно отправить события после переподключения клиента по значению `Last-Event-ID`. Старые события следует удалять фоновой задачей после окончания установленного срока хранения.

## CORS

Если фронтенд и бэкенд работают на разных origin, бэкенд должен разрешить запросы как минимум от:

- `http://localhost:5173` для Vite dev server
- `http://localhost:8081` для Docker-версии

Для production следует разрешить origin реального домена фронтенда.
