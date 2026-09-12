# AI Support Assistant

Минимальный прототип ИИ-помощника технической поддержки вуза.

## Запуск

1. Создай локальный файл переменных окружения:

   ```bash
   cp .env.example .env
   ```

2. Укажи в `.env` URL, ключ и модель LLM.

3. Запусти приложение:

   ```bash
   docker compose up --build
   ```

Frontend: http://localhost:3000

Backend: http://localhost:8080

PostgreSQL: `localhost:5432`, база `support`, пользователь `support`, пароль `support`.

## Основной сценарий

Frontend отправляет обращение в `POST /api/support/analyze`:

```json
{
  "text": "Не работает Wi-Fi в третьем корпусе с ноутбука, сеть STUDENT",
  "source": "CHAT"
}
```

Если данных достаточно, backend создаёт запись в `tickets` и возвращает `TICKET_CREATED`. Если данных не хватает, заявка не создаётся, а ответ содержит `CLARIFICATION_REQUIRED` и уточняющий вопрос.

## Формат LLM API

Текущий `LlmClient` отправляет OpenAI-совместимый запрос с полями `model`, `messages` и `temperature`. Он поддерживает два формата ответа:

- JSON анализа непосредственно в теле ответа;
- JSON анализа в `choices[0].message.content`.

Если API организаторов отличается, менять нужно только `backend/src/main/java/ru/university/support/service/LlmClient.java`.

## Локальная разработка

PostgreSQL можно поднять отдельно:

```bash
docker compose up postgres
```

Backend:

```bash
cd backend
mvn spring-boot:run
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Vite проксирует `/api` на `http://localhost:8080`. Таблица `tickets` создаётся Hibernate автоматически.
