## WoodTech Mail Microservice

Lightweight Express service that sends messages from the WoodTech contact forms directly to `ceowoodtech0@gmail.com`.

### Features

- Single `/mail/contact` endpoint for both hero and contact page forms
- Zod validation (name, message, phone/email requirement)
- Resend email transport (use any domain verified in Resend)
- Helmet, CORS, health-check endpoint

### Quick start

```bash
cd woodtech-backend-mail
cp .env.example .env  # update values (RESEND_API_KEY, MAIL_FROM, MAIL_TO)
npm install
npm run dev           # or `npm start` for production
```

### Environment variables

| key | description |
| --- | --- |
| `PORT` | HTTP port (default 4500) |
| `ALLOW_ORIGINS` | Comma-separated list of allowed origins |
| `RESEND_API_KEY` | API key from https://resend.com |
| `MAIL_FROM` | Sender shown in received emails (e.g. `WoodTech <notifications@woodtech.fr>`) |
| `MAIL_TO` | Recipient (defaults to `ceowoodtech0@gmail.com`) |

### Endpoint

`POST /mail/contact`

```jsonc
{
  "name": "Jeanne Dupont",
  "email": "jeanne@example.com",
  "phone": "+33 2 00 00 00 00",
  "message": "Description de mon projet...",
  "projectType": "Bibliotheque murale",
  "budget": "3000-4000 €",
  "source": "contact-page"
}
```

Response:

```json
{ "success": true }
```

At least one of `email` or `phone` must be provided. Additional fields are simply appended to the e-mail body.

### Testing

You can quickly test the service once it's running:

```bash
curl -X POST http://localhost:4500/mail/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","message":"Un test de notification."}'
```

Check the inbox (`ceowoodtech0@gmail.com`) to confirm delivery (or whatever you set in `MAIL_TO`).
