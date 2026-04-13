# PharmFind Quick Start

Get PharmFind running locally with the current microservices setup.

## Prerequisites

- Node.js 20+
- npm

## 1. Install Dependencies

From the repo root:

```bash
npm install
npm --prefix server install
```

## 2. Create Environment Files

Frontend `.env`:

```env
VITE_API_BASE_URL=http://localhost:4000/api
VITE_ENABLE_MOCK_DATA=false
```

Backend `server/.env`:

```env
JWT_SECRET=replace-with-a-long-random-secret
FRONTEND_URL=http://localhost:8082
ALLOWED_ORIGINS=http://localhost:8082,http://127.0.0.1:4173
EMAIL_MODE=console
```

## 3. Start the Application

Terminal 1, backend:

```bash
cd server
npm start
```

Terminal 2, frontend:

```bash
npm run dev
```

## 4. Open the App

Open:

```text
http://localhost:8082
```

Backend services run on:

- `http://localhost:4000` auth
- `http://localhost:4001` medicines
- `http://localhost:4002` pharmacies
- `http://localhost:4003` orders
- `http://localhost:4004` addresses
- `http://localhost:4005` favorites
- `http://localhost:4006` prescriptions

## Troubleshooting

- If the backend does not start, make sure ports `4000` through `4006` are available.
- If the frontend does not connect, confirm the backend services are healthy and restart Vite.
- For more detail, see [SETUP.md](./SETUP.md) and [../../server/README.md](../../server/README.md).
