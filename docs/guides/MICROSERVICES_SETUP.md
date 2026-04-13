# Microservices Guide

This guide explains how the PharmFind backend is split, how to run the services together or separately, and how the frontend is expected to integrate with them.

## Why The Repo Uses Microservices

The MVP is structured around service boundaries that match product responsibilities:

- auth concerns stay in auth
- catalog concerns stay in medicines
- pharmacy profile and inventory concerns stay in pharmacies
- order lifecycle concerns stay in orders
- user-owned addresses and favorites stay isolated
- prescription file handling stays separate from general order logic

This keeps service ownership clear and makes the frontend integration more explicit.

## Service Responsibilities

| Service | Port | Owns |
| --- | --- | --- |
| Auth | `4000` | users, JWTs, profile, verification, password reset |
| Medicines | `4001` | medicine catalog and search |
| Pharmacies | `4002` | pharmacy registration, pharmacy profile, inventory |
| Orders | `4003` | patient orders, pharmacist actions, driver actions |
| Addresses | `4004` | saved addresses |
| Favorites | `4005` | saved favorites |
| Prescriptions | `4006` | prescription upload and retrieval |

## Shared Backend Infrastructure

The services are intentionally thin. Common behavior lives in:

- `server/lib/env.js`: environment loading and validation
- `server/lib/http.js`: common HTTP bootstrapping and security headers
- `server/lib/auth.js`: token generation and authentication middleware
- `server/lib/rate-limit.js`: rate limiting primitives
- `server/lib/database.js`: storage-mode switch between JSON and PostgreSQL

This means service files should mostly contain service-specific route logic, not repeated bootstrapping code.

## Running The Full Service Set Locally

From `server/`:

```bash
npm install
copy .env.example .env
npm start
```

Use this when you are validating real user flows or working across service boundaries.

## Running A Single Service

From `server/`:

```bash
npm run start:auth
npm run start:medicines
npm run start:pharmacies
npm run start:orders
npm run start:addresses
npm run start:favorites
npm run start:prescriptions
```

Use this when:

- you are focused on one backend area
- you do not need a full product flow
- you want tighter logs for one service

## Data Mode Behavior

If `DATABASE_URL` is missing:

- the backend uses the JSON adapter
- data is stored under `server/data/`

If `DATABASE_URL` is present:

- the backend uses the PostgreSQL adapter
- the schema in `server/database/schema.sql` becomes the relevant contract

This selection is centralized in `server/lib/database.js`, not reimplemented in each service.

## Frontend Integration Model

The frontend does not assume a single gateway in local development. It uses service-specific base URLs from `src/services/api/config.ts`.

Default local URLs:

- `VITE_AUTH_API_URL=http://localhost:4000/api`
- `VITE_MEDICINES_API_URL=http://localhost:4001/api`
- `VITE_PHARMACIES_API_URL=http://localhost:4002/api`
- `VITE_ORDERS_API_URL=http://localhost:4003/api`
- `VITE_ADDRESSES_API_URL=http://localhost:4004/api`
- `VITE_FAVORITES_API_URL=http://localhost:4005/api`
- `VITE_PRESCRIPTIONS_API_URL=http://localhost:4006/api`

`VITE_API_BASE_URL` remains as a fallback for environments where a gateway sits in front of the services.

## Health Checks

Every service exposes:

```text
GET /api/health
```

Quick smoke checks:

```bash
curl http://localhost:4000/api/health
curl http://localhost:4003/api/health
```

## Testing In A Microservices Repo

The repo uses multiple layers of checks:

- frontend smoke tests
- backend integration tests
- Playwright browser flows against the real app

Important:

- the backend integration suite and Playwright suite should run sequentially, not in parallel, because they create local processes and share ports and data paths

## Docker And Kubernetes

If you want a containerized microservices stack instead of a local Node runtime:

- use [DOCKER.md](./DOCKER.md) for Docker Compose
- use [../../infra/README.md](../../infra/README.md) plus `infra/k8s/` for the Kubernetes baseline

## When To Change The Service Boundaries

Do not create a new service just because a feature is new. A new service only makes sense when:

- the ownership boundary is truly different
- the data model and runtime concerns are distinct
- the operational cost is justified

For most MVP work, extending an existing service is the correct move.
