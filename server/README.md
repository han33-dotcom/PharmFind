# PharmFind Backend Services

This directory contains the active PharmFind backend microservices plus shared server utilities, database adapters, and integration tests.

## Runtime Layout

- `bin/`: service launcher
- `services/`: individual microservice entrypoints
- `lib/`: shared auth, env, and database bootstrap code
- `database/`: JSON and PostgreSQL adapters plus schema and seed files
- `tests/`: backend integration tests

## Features

- User authentication with JWT
- Medicines search and catalog APIs
- Pharmacies and inventory APIs
- Orders, addresses, favorites, and prescriptions APIs
- JSON-backed development mode
- PostgreSQL support when `DATABASE_URL` is set

## Quick Start

1. Install dependencies:

```bash
cd server
npm install
```

2. Create your local env file:

```bash
copy .env.example .env
```

3. Start all backend services:

```bash
npm start
```

To start a single service instead:

```bash
npm run start:auth
```

The services listen on `http://localhost:4000` through `http://localhost:4006`.

## Database

By default, the backend uses JSON files under `server/data/` for development and automated tests.

If `DATABASE_URL` is set, the shared database layer switches to PostgreSQL. See [../docs/backend/POSTGRES_MIGRATION.md](../docs/backend/POSTGRES_MIGRATION.md) for the migration guide.

Main JSON data files:

- `users.json`
- `medicines.json`
- `pharmacies.json`
- `pharmacy_inventory.json`
- `orders.json`
- `addresses.json`
- `favorites.json`

## Environment Variables

Create `server/.env` with at least:

```env
JWT_SECRET=replace-with-a-long-random-secret
FRONTEND_URL=http://localhost:5173
EMAIL_MODE=console
```

Optional:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/pharmfind
DATABASE_SSL=false
```

## API Surface

All endpoints are prefixed with `/api`.

Main groups:

- `/auth`
- `/medicines`
- `/pharmacies`
- `/orders`
- `/users/me/addresses`
- `/users/me/favorites`
- `/prescriptions`

## Testing

Run backend integration tests with:

```bash
npm test
```

That executes `tests/integration.test.mjs`.

## Frontend Integration

The frontend lives in the repo root. Start the backend first, then in a second terminal:

```bash
cd ..
npm run dev
```

The frontend uses service-specific API base URLs for auth, medicines, pharmacies, orders, addresses, favorites, and prescriptions.
