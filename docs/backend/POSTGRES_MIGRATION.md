# PostgreSQL Migration Guide

This guide describes how to switch the backend from the JSON development datastore to PostgreSQL.

## Prerequisites

- PostgreSQL installed locally, or a hosted PostgreSQL instance
- Node.js and npm installed
- Backend dependencies installed:

```bash
cd server
npm install
```

Hosted options that work well for this project include [Supabase](https://supabase.com), [Railway](https://railway.app), [Neon](https://neon.tech), and [Render](https://render.com).

## 1. Create a Database

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

## 2. Apply the Schema

Use the checked-in schema file:

```bash
psql -U postgres -d pharmfind -f server/database/schema.sql
```

You can also run the same file from pgAdmin, DBeaver, or another database tool.

## 3. Seed Sample Data

```bash
psql -U postgres -d pharmfind -f server/database/seed.sql
```

## 4. Configure the Backend

Create or update `server/.env`:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/pharmfind
DATABASE_SSL=false
JWT_SECRET=replace-with-a-long-random-secret
FRONTEND_URL=http://localhost:5173
```

For hosted providers you may need:

```env
DATABASE_SSL=true
```

## 5. Start the Services

```bash
cd server
npm start
```

If the connection is valid, the services will use PostgreSQL automatically.

## 6. Verify the Migration

Check the basic path:

1. Register a user through the API or frontend.
2. Confirm rows are being written to PostgreSQL.
3. Exercise medicines, favorites, addresses, pharmacies, and orders.

Useful quick check:

```sql
SELECT * FROM users;
```

## Roll Back to JSON Mode

To switch back to JSON-backed development mode:

1. Remove or comment out `DATABASE_URL` in `server/.env`.
2. Restart the backend services.

Without `DATABASE_URL`, the shared database bootstrap falls back to JSON files.

## Notes

- Schema source of truth: [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)
- Runtime bootstrap: [../../server/lib/database.js](../../server/lib/database.js)
- PostgreSQL adapter: [../../server/database/postgres.js](../../server/database/postgres.js)

## Troubleshooting

### `relation does not exist`

Apply `server/database/schema.sql` before starting the services.

### `connection refused`

- Check that PostgreSQL is running.
- Check the hostname, port, username, and password in `DATABASE_URL`.
- Check firewall or hosted database network rules.

### `password authentication failed`

Verify the credentials in `DATABASE_URL`.

### `database does not exist`

Create the database first:

```sql
CREATE DATABASE pharmfind;
```
