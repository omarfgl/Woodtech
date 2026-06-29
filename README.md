# WoodTech

<p align="center">
  <img src="woodtech-frontend/public/img/logo.png" alt="WoodTech logo" width="120">
</p>

WoodTech is a full-stack web application for a custom woodworking business. It includes a public storefront, catalogue browsing, cart and order flow, user authentication with email verification, contact/invoice emails, an AI assistant, and an admin dashboard for products and orders.

## Features

- Public React storefront with catalogue, product detail pages, cart, contact page, and AI assistant
- Admin dashboard for product and order management
- JWT authentication with refresh tokens and email verification
- Catalogue, cart, order, mail, auth, and AI assistant services
- MongoDB persistence for users, products, carts, and orders
- Email delivery through Resend or SMTP
- Optional Python RAG workspace using LlamaIndex

## Architecture

| Folder | Purpose | Stack | Default port |
| --- | --- | --- | --- |
| `woodtech-frontend` | Public site and admin UI | React, TypeScript, Vite, Tailwind CSS | `5173` |
| `woodtech-backend-auth` | Registration, login, refresh tokens, email verification, OpenAPI docs | Express, TypeScript, MongoDB | `4001` |
| `woodtech-backend-catalogue` | Product catalogue and product admin routes | Express, MongoDB | `4100` |
| `woodtech-backend-cart` | User cart management | Express, MongoDB | `4200` |
| `woodtech-backend-admin` | Orders and admin operations | Express, MongoDB | `4300` |
| `woodtech-backend-mail` | Contact, verification, and invoice emails | Express, Resend/SMTP, PDFKit | `4500` |
| `woodtech-backend-ai-assistant` | Chat endpoint backed by OpenAI | Express | `3007` |
| `RAG` | Optional document indexing / retrieval workspace | Python, LlamaIndex | N/A |

## Prerequisites

- Node.js 20+ and npm
- MongoDB database, local or hosted
- Python 3.11+ for the optional `RAG` workspace
- Optional service keys:
  - OpenAI API key for the AI assistant
  - Resend API key or SMTP credentials for mail delivery
  - Stripe publishable key for checkout UI

## Environment Variables

Do not commit real `.env` files or production secrets. The repository `.gitignore` already excludes `.env` files.

Frontend example:

```env
# woodtech-frontend/.env
VITE_API_GATEWAY_URL=http://localhost:4001
VITE_CATALOGUE_SERVICE_URL=http://localhost:4100
VITE_ADMIN_SERVICE_URL=http://localhost:4300
VITE_MAIL_SERVICE_URL=http://localhost:4500
VITE_ASSISTANT_SERVICE_URL=http://localhost:3007
VITE_STRIPE_PUBLIC_KEY=pk_test_replace_me
```

Auth service example:

```env
# woodtech-backend-auth/.env
PORT=4001
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/woodtech-auth
JWT_ACCESS_SECRET=replace-with-at-least-32-characters
JWT_REFRESH_SECRET=replace-with-at-least-32-characters
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL=7d
CORS_ORIGINS=http://localhost:5173
COOKIE_SECURE=false
MAIL_SERVICE_URL=http://localhost:4500
FRONTEND_URL=http://localhost:5173
```

Catalogue, cart, and admin services use the same basic shape:

```env
PORT=4100
MONGODB_URI=mongodb://localhost:27017/woodtech
CORS_ORIGINS=http://localhost:5173
ALLOW_SEED=true
```

Use `PORT=4100` for catalogue, `PORT=4200` for cart, and `PORT=4300` for admin. `ALLOW_SEED` is only needed by the catalogue service.

Mail service example:

```env
# woodtech-backend-mail/.env
PORT=4500
ALLOW_ORIGINS=http://localhost:5173
RESEND_API_KEY=re_replace_me
MAIL_FROM=WoodTech <notifications@example.com>
MAIL_TO=contact@example.com

# Optional SMTP fallback
EMAIL_USER=
EMAIL_PASS=
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
```

AI assistant example:

```env
# woodtech-backend-ai-assistant/.env
PORT=3007
CORS_ORIGINS=http://localhost:5173
OPENAI_API_KEY=sk_replace_me
OPENAI_MODEL=gpt-4o-mini
```

## Installation

Install dependencies inside each Node service:

```bash
cd woodtech-frontend
npm install

cd ../woodtech-backend-auth
npm install

cd ../woodtech-backend-catalogue
npm install

cd ../woodtech-backend-cart
npm install

cd ../woodtech-backend-admin
npm install

cd ../woodtech-backend-mail
npm install

cd ../woodtech-backend-ai-assistant
npm install
```

Optional RAG setup:

```bash
cd RAG
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

## Running Locally

Start the services in separate terminals:

```bash
cd woodtech-backend-auth
npm run dev
```

```bash
cd woodtech-backend-catalogue
npm run dev
```

```bash
cd woodtech-backend-cart
npm run dev
```

```bash
cd woodtech-backend-admin
npm run dev
```

```bash
cd woodtech-backend-mail
npm run dev
```

```bash
cd woodtech-backend-ai-assistant
npm run dev
```

Then start the frontend:

```bash
cd woodtech-frontend
npm run dev
```

Open the app at `http://localhost:5173`.

## Useful Endpoints

| Service | Endpoints |
| --- | --- |
| Auth | `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `POST /auth/verify-email`, `GET /auth/me`, `GET /docs`, `GET /health` |
| Catalogue | `GET /catalogue/products`, `GET /catalogue/products/:id`, `POST /catalogue/products`, `PUT /catalogue/products/:id`, `DELETE /catalogue/products/:id`, `POST /catalogue/seed` |
| Cart | `GET /cart/:userId`, `POST /cart/:userId/items`, `DELETE /cart/:userId/items/:productId`, `DELETE /cart/:userId` |
| Admin | `GET /orders`, `GET /orders/:id`, `POST /orders`, `PATCH /orders/:id` |
| Mail | `POST /mail/contact`, `POST /mail/verification`, `POST /mail/invoice` |
| AI assistant | `POST /assistant/chat` |

## Scripts

Frontend:

```bash
npm run dev
npm run build
npm run lint
npm run preview
```

Auth service:

```bash
npm run dev
npm run build
npm test
npm run lint
npm run seed:admin
```

Other Node services:

```bash
npm run dev
npm start
```

## Project Structure

```text
WoodTech/
  woodtech-frontend/              React client and admin dashboard
  woodtech-backend-auth/          Authentication service
  woodtech-backend-catalogue/     Product catalogue service
  woodtech-backend-cart/          Cart service
  woodtech-backend-admin/         Orders/admin service
  woodtech-backend-mail/          Mail and invoice service
  woodtech-backend-ai-assistant/  AI assistant service
  RAG/                            Optional retrieval/indexing workspace
  figma/                          Design and visual assets
```

## License

This project is licensed under the MIT License.
