# WoodTech AI Assistant Service

Microservice exposing a single `/assistant/chat` endpoint that forwards chat history to OpenAI Responses API and returns a reply string.

## Quick start

```bash
cp .env.example .env
npm install
npm run dev
```

## Environment

- `PORT` (default `3007`)
- `CORS_ORIGINS` comma‑separated list (e.g. `http://localhost:5173`)
- `OPENAI_API_KEY` **required**
- `OPENAI_MODEL` (default `gpt-4o-mini`)
- `OPENAI_ENDPOINT` (default `https://api.openai.com/v1/responses`)
- `OPENAI_SYSTEM_PROMPT` custom system prompt (optional)

## API

- `POST /assistant/chat` with body:

```json
{
  "messages": [
    { "role": "user", "content": "Bonjour" }
  ],
  "prompt": "optional override of system prompt"
}
```

Response:

```json
{
  "success": true,
  "data": { "reply": "…" }
}
```

Healthcheck: `GET /health`.
