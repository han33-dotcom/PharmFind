# PharmFind Setup Guide

This guide is the fuller version of the quick start. It explains how the repo is expected to run in local development, how environment variables fit together, and how to move between JSON-backed and PostgreSQL-backed modes.

## Prerequisites

- Node.js 20 or newer
- npm
- optional: PostgreSQL if you want database-backed local development instead of JSON mode

## Understand The Two Local Data Modes

### JSON mode

This is the default. It is the fastest way to develop and it matches the automated backend integration test setup.

Use JSON mode when you want:

- minimal setup
- deterministic local development
- no external database dependency

### PostgreSQL mode

This is used when `DATABASE_URL` is configured. It is closer to the deployed stack and is the right choice when you want to validate schema-backed behavior.

Use PostgreSQL mode when you want:

- a database-backed local environment
- to inspect real tables and rows
- to validate migration-sensitive backend work

## 1. Install Dependencies

From the repo root:

```bash
npm install
npm --prefix server install
```

## 2. Configure The Frontend

In normal local development, no root `.env` is required. The frontend defaults to:

- auth: `http://localhost:4000/api`
- medicines: `http://localhost:4001/api`
- pharmacies: `http://localhost:4002/api`
- orders: `http://localhost:4003/api`
- addresses: `http://localhost:4004/api`
- favorites: `http://localhost:4005/api`
- prescriptions: `http://localhost:4006/api`

Create a root `.env` only if the frontend should point at different service URLs:

```bash
copy .env.example .env
```

## 3. Configure The Backend

Create the backend environment file:

```bash
cd server
copy .env.example .env
```

Recommended local defaults:

```env
NODE_ENV=development
JWT_SECRET=replace-with-a-long-random-secret
FRONTEND_URL=http://localhost:8082
ALLOWED_ORIGINS=http://localhost:8082,http://127.0.0.1:4173
EMAIL_MODE=console
```

### Optional: Enable PostgreSQL

Add:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/pharmfind
DATABASE_SSL=false
```

If PostgreSQL mode is enabled and you need the tables and seed data created locally, run:

```bash
cd server
npm run setup-db
```

## 4. Start The Backend

From `server/`:

```bash
npm start
```

This launches all backend services.

If you need to work on one service in isolation, use one of:

```bash
npm run start:auth
npm run start:medicines
npm run start:pharmacies
npm run start:orders
npm run start:addresses
npm run start:favorites
npm run start:prescriptions
```

## 5. Start The Frontend

From the repo root in a second terminal:

```bash
npm run dev
```

Open:

```text
http://localhost:8082
```

## Local Service Ports

| Service | Port |
| --- | --- |
| Auth | `4000` |
| Medicines | `4001` |
| Pharmacies | `4002` |
| Orders | `4003` |
| Addresses | `4004` |
| Favorites | `4005` |
| Prescriptions | `4006` |
| Frontend dev server | `8082` |

## Recommended Validation Workflow

From the repo root:

```bash
npm run validate:quick
```

Before merge-ready work:

```bash
npm run validate
```

The full gate includes:

- lint
- production build
- frontend smoke tests
- backend integration tests
- Playwright browser E2E tests

Important:

- run `npm test` and `npm run test:e2e` sequentially, not in parallel, because both use local service processes and shared dev ports

## Common Setup Scenarios

### I only want to browse the app locally

Use JSON mode, start the backend, then run the frontend.

### I am working on backend data behavior

Use PostgreSQL mode and run `npm run setup-db` after setting `DATABASE_URL`.

### I am working on deployment wiring

Use the Docker path described in [DOCKER.md](./DOCKER.md).

## Troubleshooting

### Frontend cannot reach the backend

Check:

- the services are actually running
- the frontend is loading from `http://localhost:8082`
- `ALLOWED_ORIGINS` includes your browser origin

### The wrong data mode is being used

- if `DATABASE_URL` is missing, the backend will fall back to JSON
- if `DATABASE_URL` is present, the backend will try PostgreSQL first

### Password reset or verification links do not send real email

That is expected in local mode when `EMAIL_MODE=console`. The link is printed in the auth service logs.

### Docker works but local dev does not

Docker uses `http://localhost:5173` for the frontend. Local Vite development uses `http://localhost:8082`. The backend CORS settings must match the mode you are running.
