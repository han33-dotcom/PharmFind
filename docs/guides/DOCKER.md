# Docker Guide

This guide explains how to run the full PharmFind MVP in containers. The Docker path is useful when you want a stack closer to deployment than the default local JSON-backed development flow.

## What The Compose Stack Runs

The root `docker-compose.yml` starts:

- PostgreSQL
- auth
- medicines
- pharmacies
- orders
- addresses
- favorites
- prescriptions
- frontend

The frontend is served from Nginx on:

```text
http://localhost:5173
```

## Prerequisites

- Docker Engine 24 or newer
- Docker Compose V2

## Required Secret

The compose file does not ship a default JWT secret. Set one before startup.

PowerShell:

```powershell
$env:JWT_SECRET='local-dev-secret'
docker compose up --build
```

Bash:

```bash
JWT_SECRET=local-dev-secret docker compose up --build
```

## What Compose Configures For You

- PostgreSQL is used automatically through `DATABASE_URL`
- backend services wait for PostgreSQL health before starting
- the frontend waits for the backend services to become healthy
- frontend build arguments point at the correct service-specific local URLs
- health checks are wired for both backend services and the frontend container

## Host Ports

| Service | Host Port |
| --- | --- |
| Frontend | `5173` |
| Auth | `4000` |
| Medicines | `4001` |
| Pharmacies | `4002` |
| Orders | `4003` |
| Addresses | `4004` |
| Favorites | `4005` |
| Prescriptions | `4006` |
| PostgreSQL | internal only by default |

## Dockerfiles In Use

| Component | Dockerfile |
| --- | --- |
| Frontend | `Dockerfile.frontend` |
| Auth | `server/Dockerfile.auth` |
| Medicines | `server/Dockerfile.medicines` |
| Pharmacies | `server/Dockerfile.pharmacies` |
| Orders | `server/Dockerfile.orders` |
| Addresses | `server/Dockerfile.addresses` |
| Favorites | `server/Dockerfile.favorites` |
| Prescriptions | `server/Dockerfile.prescriptions` |

All service images accept `NODE_VERSION` as a build argument. The frontend image also accepts `VITE_*_API_URL` values for environments where the browser should not use the default localhost ports.

## Common Commands

Start the full stack:

```bash
docker compose up --build
```

Run in the background:

```bash
docker compose up --build -d
```

Stop the stack:

```bash
docker compose down
```

Stop and remove the PostgreSQL volume too:

```bash
docker compose down -v
```

Inspect the generated configuration:

```bash
docker compose config
```

## Environment Behavior

The compose stack sets:

- `NODE_ENV=production`
- `DATABASE_URL=postgres://pharm:pharm@postgres:5432/pharmdb`
- `FRONTEND_URL=http://localhost:5173`
- `ALLOWED_ORIGINS=http://localhost:5173`
- `EMAIL_MODE=console`

That means:

- the containerized stack uses PostgreSQL, not JSON files
- browser-origin CORS is aligned to the Docker frontend URL
- email verification and password reset links are still emitted to logs by default

## Building Images For Other Environments

Example frontend build with non-local service URLs:

```bash
docker build \
  -f Dockerfile.frontend \
  --build-arg VITE_AUTH_API_URL=https://auth.example.com/api \
  --build-arg VITE_MEDICINES_API_URL=https://medicines.example.com/api \
  --build-arg VITE_PHARMACIES_API_URL=https://pharmacies.example.com/api \
  --build-arg VITE_ORDERS_API_URL=https://orders.example.com/api \
  --build-arg VITE_ADDRESSES_API_URL=https://addresses.example.com/api \
  --build-arg VITE_FAVORITES_API_URL=https://favorites.example.com/api \
  --build-arg VITE_PRESCRIPTIONS_API_URL=https://prescriptions.example.com/api \
  -t pharmfind-frontend .
```

Example single service image build:

```bash
docker build -f server/Dockerfile.auth -t pharmfind-auth ./server
```

## Operational Notes

- the compose stack is appropriate for local integration and demo environments
- it is not a full production platform by itself
- production deployments still need proper secret management, TLS, logging, and monitoring
- if you use SMTP in containers, provide the SMTP env variables explicitly instead of relying on the default console mode

## Troubleshooting

### Frontend is up but API requests fail

Check:

- the backend containers are healthy
- `JWT_SECRET` was provided before startup
- no other local processes are already binding ports `4000` through `4006`

### I want to reset the database

Run:

```bash
docker compose down -v
docker compose up --build
```

### I want the browser to use a different API hostname

Rebuild the frontend image with the appropriate `VITE_*_API_URL` build arguments.
