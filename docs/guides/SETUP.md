# PharmFind Setup Guide

This guide matches the current repo: React frontend on Vite plus seven backend microservices.

## Prerequisites

- Node.js 20+
- npm

## Install dependencies

From the repo root:

```bash
npm install
npm --prefix server install
```

## Configure the backend

Create `server/.env` from the example:

```bash
cd server
copy .env.example .env
```

Important local defaults:

```env
JWT_SECRET=replace-with-a-long-random-secret
FRONTEND_URL=http://localhost:8082
ALLOWED_ORIGINS=http://localhost:8082,http://127.0.0.1:4173
EMAIL_MODE=console
```

If you want PostgreSQL instead of JSON development storage, add:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/pharmfind
DATABASE_SSL=false
```

## Start the app

Terminal 1, backend:

```bash
cd server
npm start
```

Terminal 2, frontend:

```bash
cd ..
npm run dev
```

Open:

```text
http://localhost:8082
```

## Backend ports

- `4000` auth
- `4001` medicines
- `4002` pharmacies
- `4003` orders
- `4004` addresses
- `4005` favorites
- `4006` prescriptions

## Validation commands

Run these from the repo root:

```bash
npm run lint
npm run build
npm test
npm run test:e2e
```

## Common issues

### Frontend cannot reach the backend

- confirm the backend services are running
- confirm your browser origin is included in `ALLOWED_ORIGINS`
- confirm the frontend is on `http://localhost:8082` for normal local dev

### Docker works but local dev does not

- Docker serves the frontend on `http://localhost:5173`
- local Vite dev serves the frontend on `http://localhost:8082`
- use the correct `FRONTEND_URL` and `ALLOWED_ORIGINS` for the mode you are running

### Production boot fails

In production the services now require:

- `JWT_SECRET`
- `DATABASE_URL`
- `ALLOWED_ORIGINS` or `FRONTEND_URL`

The auth service also requires `FRONTEND_URL`, and if `EMAIL_MODE=smtp`, the SMTP variables must be set.
