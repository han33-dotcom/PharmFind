# PharmFind

PharmFind is a React + TypeScript frontend backed by Node.js microservices for auth, medicines, pharmacies, orders, addresses, favorites, and prescriptions.

## Repo Layout

- `src/`: frontend app, routes, providers, services, contexts, and tests
- `server/`: backend services, shared server utilities, database adapters, and integration tests
- `infra/`: infrastructure assets
  - `infra/docker/`: nginx config used by the frontend image
  - `infra/k8s/`: active microservice Kubernetes manifests
- `docs/`: setup guides and backend references

## Local Development

Prerequisites:

- Node.js 20+
- npm

Install dependencies:

```sh
npm install
npm --prefix server install
```

Create the backend env file:

```sh
cd server
copy .env.example .env
```

The default local backend env expects the frontend on `http://localhost:8082`.

Start the backend microservices:

```sh
cd server
npm start
```

Start the frontend in a second terminal:

```sh
cd ..
npm run dev
```

The frontend runs on the Vite dev server and the backend services run on ports `4000` through `4006`.

For Docker Compose, create a root `.env` or export `JWT_SECRET` before running `docker compose up --build`.

## Validation

The repository is set up to run:

- `npm run lint`
- `npm run build`
- `npm test`
- `npm run test:e2e`
- `npm run validate`

`npm test` runs frontend smoke tests with Vitest plus backend integration tests.

`npm run test:e2e` runs Playwright browser coverage for:

- patient checkout
- pharmacist order acceptance
- driver delivery lifecycle

`npm run validate` runs the full merge gate locally: lint, build, smoke/integration tests, and browser E2E coverage.

The GitHub Actions workflow is in [`/.github/workflows/ci.yml`](./.github/workflows/ci.yml).

Contributor expectations are documented in [CONTRIBUTING.md](./CONTRIBUTING.md).

## Docs

See [docs/README.md](./docs/README.md) for the current documentation map.

Quick links:

- [Quick Start](./docs/guides/QUICK_START.md)
- [Local Setup](./docs/guides/SETUP.md)
- [Docker Guide](./docs/guides/DOCKER.md)
- [Microservices Guide](./docs/guides/MICROSERVICES_SETUP.md)
- [Backend Integration Reference](./docs/backend/BACKEND_INTEGRATION.md)
- [PostgreSQL Migration Guide](./docs/backend/POSTGRES_MIGRATION.md)
- [Infrastructure Overview](./infra/README.md)
- [Backend Services Readme](./server/README.md)
