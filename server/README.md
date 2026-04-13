# PharmFind Backend Services

This directory contains the active PharmFind `v1.0` backend. It is a Node.js microservices set, not a monolith. The services support the current MVP journeys for patients, pharmacists, and drivers, and they are the source of truth for authentication, orders, pharmacies, inventory, favorites, addresses, and prescriptions.

## What Lives Here

- `bin/`: the launcher that starts the full service set
- `services/`: individual microservice entrypoints
- `lib/`: shared environment, auth, HTTP, rate limiting, and database bootstrap
- `database/`: JSON adapter, PostgreSQL adapter, schema, seeds, and setup utilities
- `tests/`: backend integration coverage for the highest-risk product flows

## Service Map

Each service owns a focused part of the product:

| Service | Port | Responsibility |
| --- | --- | --- |
| Auth | `4000` | registration, login, profile, email verification, password reset |
| Medicines | `4001` | medicine search, categories, catalog, medicine detail |
| Pharmacies | `4002` | pharmacy registration, profile, verification status, inventory |
| Orders | `4003` | patient orders, pharmacist order actions, driver delivery lifecycle |
| Addresses | `4004` | saved delivery addresses |
| Favorites | `4005` | patient favorites |
| Prescriptions | `4006` | prescription upload, fetch, review metadata |

Every service exposes `/api/health` and uses the shared bootstrapping in `lib/`.

## Architecture Notes

- Authentication is JWT-based.
- Role enforcement is server-trusted for `patient`, `pharmacist`, and `driver`.
- The frontend talks to service-specific base URLs, not to one monolithic backend URL.
- JSON storage is the default local-development mode.
- PostgreSQL becomes active automatically when `DATABASE_URL` is present.

## Quick Start

Install dependencies:

```bash
cd server
npm install
```

Create the local environment file:

```bash
copy .env.example .env
```

Start all microservices:

```bash
npm start
```

Start one service only:

```bash
npm run start:auth
```

The full backend is then available on `http://localhost:4000` through `http://localhost:4006`.

## Environment Variables

Minimum local setup:

```env
NODE_ENV=development
JWT_SECRET=replace-with-a-long-random-secret
FRONTEND_URL=http://localhost:8082
ALLOWED_ORIGINS=http://localhost:8082,http://127.0.0.1:4173
EMAIL_MODE=console
```

Common optional values:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/pharmfind
DATABASE_SSL=false
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=noreply@pharmfind.com
AUTH_REGISTER_RATE_LIMIT_MAX=20
AUTH_LOGIN_RATE_LIMIT_MAX=25
AUTH_PASSWORD_RESET_RATE_LIMIT_MAX=10
AUTH_VERIFICATION_RATE_LIMIT_MAX=10
```

Production expectations are stricter:

- `JWT_SECRET` is required
- `DATABASE_URL` is required if you want the production stack to use PostgreSQL
- `ALLOWED_ORIGINS` and `FRONTEND_URL` must match the deployed frontend
- SMTP variables are required when `EMAIL_MODE=smtp`

## Data Modes

### JSON mode

This is the default mode for local development and automated tests. Data is stored under `server/data/`.

Main JSON data files:

- `users.json`
- `medicines.json`
- `pharmacies.json`
- `pharmacy_inventory.json`
- `orders.json`
- `addresses.json`
- `favorites.json`

### PostgreSQL mode

If `DATABASE_URL` is set, the shared database layer switches to PostgreSQL automatically. Use this when you want a database-backed environment closer to production.

See:

- [PostgreSQL Migration Guide](../docs/backend/POSTGRES_MIGRATION.md)
- [Database Schema](../docs/backend/DATABASE_SCHEMA.md)

## Main Scripts

| Command | Purpose |
| --- | --- |
| `npm start` | start all microservices |
| `npm run dev` | same launcher as `start` |
| `npm test` | run backend integration tests |
| `npm run setup-db` | apply schema and seed data using the setup script |
| `npm run start:auth` | start auth service only |
| `npm run start:medicines` | start medicines service only |
| `npm run start:pharmacies` | start pharmacies service only |
| `npm run start:orders` | start orders service only |
| `npm run start:addresses` | start addresses service only |
| `npm run start:favorites` | start favorites service only |
| `npm run start:prescriptions` | start prescriptions service only |

## API Surface

All routes are prefixed with `/api`.

Main route groups:

- `/auth`
- `/medicines`
- `/pharmacies`
- `/orders`
- `/users/me/addresses`
- `/users/me/favorites`
- `/prescriptions`

For the full contract overview, use [../docs/backend/BACKEND_INTEGRATION.md](../docs/backend/BACKEND_INTEGRATION.md).

## Testing

Run the backend integration suite:

```bash
npm test
```

That executes `tests/integration.test.mjs` and covers the critical backend flows we stabilized for the MVP.

Important operational note:

- run the backend integration suite and the Playwright suite sequentially, not in parallel, because both create local service processes and use the same dev ports and data paths

## Working With The Frontend

The frontend lives in the repo root and expects the services above to be running. In a second terminal:

```bash
cd ..
npm run dev
```

The frontend uses service-specific environment variables such as `VITE_AUTH_API_URL`, `VITE_MEDICINES_API_URL`, and `VITE_ORDERS_API_URL`. If those are not set, it defaults to the local ports listed in this README.
