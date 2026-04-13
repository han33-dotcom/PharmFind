# Architecture

## High-Level Shape

PharmFind is split into a frontend application and a set of backend microservices.

```text
React/Vite Frontend
        |
        +--> Auth Service
        +--> Medicines Service
        +--> Pharmacies Service
        +--> Orders Service
        +--> Addresses Service
        +--> Favorites Service
        +--> Prescriptions Service
```

The frontend talks directly to service-specific API base URLs through a shared API client and configuration layer.

## Frontend

Main stack:

- React
- TypeScript
- React Router
- Vite
- Context providers for app state
- service-layer API modules for backend communication

Important frontend areas:

- `src/pages/`: route-level UI
- `src/components/`: reusable UI pieces
- `src/contexts/`: app state providers
- `src/services/`: API contracts and client logic
- `src/types/`: shared frontend types
- `src/test/`: frontend smoke tests

The frontend is not supposed to call backend endpoints ad hoc from components. The intended path is:

1. page/component
2. context or service hook
3. `src/services/*`
4. shared API client

## Backend

The backend is microservices-first.

Service entrypoints live in:

- `server/services/auth.js`
- `server/services/medicines.js`
- `server/services/pharmacies.js`
- `server/services/orders.js`
- `server/services/addresses.js`
- `server/services/favorites.js`
- `server/services/prescriptions.js`

Shared server infrastructure lives in:

- `server/lib/auth.js`
- `server/lib/database.js`
- `server/lib/env.js`
- `server/lib/http.js`
- `server/lib/rate-limit.js`

These shared modules are responsible for:

- environment loading and validation
- JWT handling
- selecting JSON vs PostgreSQL storage
- common HTTP middleware
- basic auth rate limiting

## Data Layer

Two storage modes are supported.

### JSON Mode

Used for:

- local development
- automated tests
- simple bootstrapping without a database server

Files live under:

- `server/data/*.json`

### PostgreSQL Mode

Enabled when `DATABASE_URL` is set.

Key files:

- `server/database/postgres.js`
- `server/database/schema.sql`
- `server/database/seed.sql`

This mode is the path intended for real deployments.

## Service Responsibilities

### Auth Service

Handles:

- register
- login
- current-user lookup
- account updates
- patient account deletion
- email verification
- resend verification
- forgot/reset password

### Medicines Service

Handles:

- medicine search
- medicine catalog
- medicine details
- medicine categories

### Pharmacies Service

Handles:

- pharmacy registration
- pharmacy profile retrieval/update
- pharmacy inventory retrieval
- inventory create/update/delete
- public pharmacy listing and pharmacy medicine listing

### Orders Service

Handles:

- patient order creation and retrieval
- pharmacist order queue and status changes
- driver assignment and delivery status transitions

### Addresses Service

Handles:

- patient saved address CRUD

### Favorites Service

Handles:

- patient favorites CRUD
- favorite existence checks

### Prescriptions Service

Handles:

- prescription upload
- prescription lookup by id or order
- prescription attachment to orders

## Runtime Ports

Default local ports:

- auth: `4000`
- medicines: `4001`
- pharmacies: `4002`
- orders: `4003`
- addresses: `4004`
- favorites: `4005`
- prescriptions: `4006`
- frontend Vite dev server: `8082`
- frontend Docker/Nginx: `5173`

## Deployment Shape

### Local Development

- frontend runs with Vite
- backend microservices run with Node
- JSON storage is the default

### Docker Compose

- PostgreSQL container
- one container per backend service
- one frontend container served by Nginx
- service healthchecks and healthy dependencies configured in compose

### Kubernetes

- manifests under `infra/k8s`
- one deployment/service pair per backend microservice
- readiness and liveness probes based on `/api/health`
- shared secret expected through `pharmfind-secrets`

## Quality Architecture

The repo is structured so product changes can be validated through multiple layers:

- lint for static code quality
- frontend smoke tests for route-level regressions
- backend integration tests for service contracts
- Playwright E2E tests for role flows
- GitHub Actions CI for push/PR validation

This is part of the architecture, not an optional afterthought. The product is expected to evolve behind these gates.
