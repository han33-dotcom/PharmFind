# PharmFind Quick Start

This is the shortest path to seeing the MVP running locally.

## Prerequisites

- Node.js 20 or newer
- npm

## 1. Install Dependencies

From the repo root:

```bash
npm install
npm --prefix server install
```

## 2. Create The Backend Environment File

The frontend already knows how to talk to the local microservices by default, so the only required env file for normal local development is the backend one.

```bash
cd server
copy .env.example .env
```

Minimum values are already in the example:

```env
NODE_ENV=development
JWT_SECRET=replace-with-a-long-random-secret
FRONTEND_URL=http://localhost:8082
ALLOWED_ORIGINS=http://localhost:8082,http://127.0.0.1:4173
EMAIL_MODE=console
```

## 3. Start The Backend

In the `server/` directory:

```bash
npm start
```

That starts:

- auth on `4000`
- medicines on `4001`
- pharmacies on `4002`
- orders on `4003`
- addresses on `4004`
- favorites on `4005`
- prescriptions on `4006`

## 4. Start The Frontend

In a second terminal from the repo root:

```bash
npm run dev
```

## 5. Open The App

Open:

```text
http://localhost:8082
```

## Optional Frontend Environment

You only need a root `.env` if the frontend should talk to non-default service URLs. Copy `.env.example` and change the `VITE_*_API_URL` values when targeting another environment.

## Quick Health Check

Examples:

```bash
curl http://localhost:4000/api/health
curl http://localhost:4001/api/health
```

If both return success, the frontend should be able to load.

## What To Do First In The UI

The MVP supports three working roles:

- register as a `patient` to search medicines and place orders
- register as a `pharmacist` to create a pharmacy and manage inventory
- register as a `driver` to accept and complete deliveries

## If Something Fails

- If the backend does not start, check that ports `4000` through `4006` are free.
- If the frontend loads but API calls fail, check `ALLOWED_ORIGINS` in `server/.env`.
- If email flows are being tested locally, keep `EMAIL_MODE=console` and copy links from the auth service logs.

For the full local setup, use [SETUP.md](./SETUP.md).
