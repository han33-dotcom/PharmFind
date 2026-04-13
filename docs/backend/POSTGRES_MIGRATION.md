# PostgreSQL Migration Guide

This guide explains how to move the backend from the default JSON-backed development mode to PostgreSQL.

## When To Use PostgreSQL

Use PostgreSQL when you want:

- a deployment-like persistence model
- direct SQL visibility into the app state
- validation against the actual schema and constraints
- a better environment for backend changes that depend on indexes, relationships, or triggers

Use JSON mode when you want the lightest local setup.

## Prerequisites

- PostgreSQL available locally or through a hosted provider
- Node.js and npm installed
- backend dependencies installed

```bash
cd server
npm install
```

Hosted providers that fit this repo well include [Supabase](https://supabase.com), [Railway](https://railway.app), [Neon](https://neon.tech), and [Render](https://render.com).

## 1. Create The Database

Local example:

```bash
psql -U postgres
CREATE DATABASE pharmfind;
\q
```

Typical connection string format:

```text
postgresql://username:password@localhost:5432/pharmfind
```

## 2. Configure `server/.env`

Create or update the backend env file:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/pharmfind
DATABASE_SSL=false
JWT_SECRET=replace-with-a-long-random-secret
FRONTEND_URL=http://localhost:8082
ALLOWED_ORIGINS=http://localhost:8082,http://127.0.0.1:4173
EMAIL_MODE=console
```

For hosted providers, SSL is often required:

```env
DATABASE_SSL=true
```

## 3. Apply Schema And Seed Data

Recommended path:

```bash
cd server
npm run setup-db
```

That uses the checked-in setup utility and applies the schema and seed data.

Manual alternative:

```bash
psql -U postgres -d pharmfind -f server/database/schema.sql
psql -U postgres -d pharmfind -f server/database/seed.sql
```

## 4. Start The Services

```bash
cd server
npm start
```

If the connection succeeds, the backend will automatically use the PostgreSQL adapter instead of the JSON adapter.

## 5. Verify The Migration

Recommended verification:

1. register a user from the frontend
2. confirm the user row appears in PostgreSQL
3. browse medicines and a pharmacy
4. create an address and a favorite
5. place an order
6. confirm related rows are created in `orders`, `order_items`, and `order_status_history`

Useful checks:

```sql
SELECT id, email, role FROM users;
SELECT order_number, status FROM orders ORDER BY created_at DESC;
SELECT pharmacy_id, medicine_id, quantity FROM pharmacy_inventory;
```

## Roll Back To JSON Mode

To switch back:

1. remove or comment out `DATABASE_URL` from `server/.env`
2. restart the backend services

Without `DATABASE_URL`, the shared backend bootstrap falls back to JSON files automatically.

## Notes About The Current MVP

- PostgreSQL is supported by the active service layer and schema
- local automated backend tests still default to JSON mode because that is faster and more deterministic
- Docker Compose already uses PostgreSQL by default

## Troubleshooting

### `relation does not exist`

The schema was not applied. Run:

```bash
cd server
npm run setup-db
```

### `connection refused`

Check:

- PostgreSQL is running
- the host and port in `DATABASE_URL` are correct
- firewall or hosted-provider network rules allow the connection

### `password authentication failed`

The credentials inside `DATABASE_URL` are wrong.

### `database does not exist`

Create the database first:

```sql
CREATE DATABASE pharmfind;
```

## Related Docs

- [Database Schema](./DATABASE_SCHEMA.md)
- [Backend Services README](../../server/README.md)
- [Microservices Guide](../guides/MICROSERVICES_SETUP.md)
