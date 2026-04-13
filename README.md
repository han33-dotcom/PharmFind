# PharmFind

PharmFind is a pharmacy ordering web application. It lets patients search medicines and place delivery or pickup orders, lets pharmacists manage a pharmacy and fulfill orders, and lets drivers complete deliveries. The current codebase is the `v1.0` MVP line: the first version intended to be treated as a real product baseline rather than a prototype.

## What The Product Does

PharmFind currently supports three operational roles:

- `patient`: search medicines, browse pharmacy inventory, manage favorites and addresses, place orders, upload prescriptions, track orders, and reorder previous purchases
- `pharmacist`: register a pharmacy, manage inventory, review incoming orders, and update fulfillment status
- `driver`: view available deliveries, accept one active delivery at a time, and move it through pickup, transit, and delivered states

The application is designed around a marketplace-style flow:

1. a patient searches for a medicine
2. the patient chooses a pharmacy and adds items to cart
3. checkout creates an order through the backend microservices
4. a pharmacist reviews and confirms the order
5. a driver accepts and completes the delivery

## MVP Scope

The current MVP is not a marketing shell. It includes actual working product flows and supporting engineering checks:

- API-backed patient checkout and order tracking
- API-backed pharmacist order management and inventory management
- API-backed driver assignment and delivery lifecycle
- password reset and email verification flows
- backend integration tests for critical service flows
- browser E2E coverage for patient, pharmacist, and driver journeys
- CI for lint, build, tests, and browser coverage

Useful MVP boundaries to know up front:

- the backend is microservices-first, not monolith-first
- JSON storage is still available for local development and tests
- PostgreSQL is supported when `DATABASE_URL` is configured
- there is no production-grade admin console in the current MVP
- Docker and Kubernetes assets exist, but wider production hardening is still an ongoing concern rather than a finished platform story

## Architecture At A Glance

Frontend:

- React
- TypeScript
- Vite
- Context-based state plus service-layer API access

Backend microservices:

- auth: `4000`
- medicines: `4001`
- pharmacies: `4002`
- orders: `4003`
- addresses: `4004`
- favorites: `4005`
- prescriptions: `4006`

Data layer:

- local JSON files by default for development and automated tests
- PostgreSQL when `DATABASE_URL` is set

Quality gates:

- ESLint
- frontend smoke tests with Vitest
- backend integration tests
- Playwright browser E2E flows
- GitHub Actions CI

## Repository Structure

- `src/`: frontend application code
- `server/`: backend microservices, shared server utilities, database adapters, and backend tests
- `docs/`: product, architecture, setup, testing, and backend reference docs
- `infra/`: Docker and Kubernetes deployment assets
- `public/`: static frontend assets

## Quick Start

Prerequisites:

- Node.js 20+
- npm

Install dependencies:

```bash
npm install
npm --prefix server install
```

Create the backend env file:

```bash
cd server
copy .env.example .env
```

Start the backend:

```bash
cd server
npm start
```

Start the frontend in a second terminal:

```bash
cd ..
npm run dev
```

Open:

- [http://localhost:8082](http://localhost:8082)

The default local setup expects:

- frontend origin: `http://localhost:8082`
- backend services: `http://localhost:4000` through `http://localhost:4006`

## Validation

Available commands:

- `npm run lint`
- `npm run build`
- `npm test`
- `npm run test:e2e`
- `npm run validate`
- `npm run validate:quick`

Recommended workflow:

- use `npm run validate:quick` during normal development
- use `npm run validate` before treating a branch as merge-ready

What each command does:

- `npm test`: frontend smoke tests plus backend integration tests
- `npm run test:e2e`: Playwright browser flows against the real frontend and local microservices
- `npm run validate`: full local merge gate

## Setup Options

Local development:

- use `server/.env`
- default to JSON storage
- optionally enable PostgreSQL with `DATABASE_URL`

Docker:

- root `docker-compose.yml` runs the full MVP stack
- frontend is served on `http://localhost:5173`
- requires a root `JWT_SECRET` value before startup

Kubernetes:

- manifests live in [`infra/k8s`](./infra/k8s)
- secrets are expected through `pharmfind-secrets`

## Documentation Map

Start here, depending on what you need:

- [Documentation Index](./docs/README.md)
- [Product Overview](./docs/PRODUCT_OVERVIEW.md)
- [Architecture](./docs/ARCHITECTURE.md)
- [Testing And Quality Gates](./docs/TESTING.md)
- [Quick Start](./docs/guides/QUICK_START.md)
- [Full Local Setup](./docs/guides/SETUP.md)
- [Docker Guide](./docs/guides/DOCKER.md)
- [Microservices Guide](./docs/guides/MICROSERVICES_SETUP.md)
- [Backend Services README](./server/README.md)
- [Infrastructure README](./infra/README.md)

Backend reference docs:

- [Backend Integration](./docs/backend/BACKEND_INTEGRATION.md)
- [Database Schema](./docs/backend/DATABASE_SCHEMA.md)
- [Email Verification](./docs/backend/EMAIL_VERIFICATION.md)
- [PostgreSQL Migration](./docs/backend/POSTGRES_MIGRATION.md)

## Contribution Standard

Contributor expectations are documented in [CONTRIBUTING.md](./CONTRIBUTING.md).

In short, new work is expected to be:

- API-backed where the feature is real product behavior
- correctly role-protected
- covered by tests where the change affects behavior
- validated through lint, build, and automated checks before merge
