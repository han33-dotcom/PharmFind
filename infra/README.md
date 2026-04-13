# Infrastructure

This directory contains the active deployment assets for the PharmFind `v1.0` MVP. The repo is organized around a microservices-first runtime, so the infrastructure docs assume the frontend plus the service set in `server/services/`.

## What Lives Here

- `docker/`: frontend container runtime assets, including the Nginx config used by the frontend image
- `k8s/`: Kubernetes manifests for the backend microservices and example secrets

## Runtime Shapes

### Local Docker Compose

The root `docker-compose.yml` is the main containerized local environment. It runs:

- PostgreSQL
- auth
- medicines
- pharmacies
- orders
- addresses
- favorites
- prescriptions
- frontend

The frontend is published on `http://localhost:5173`.

### Kubernetes

The manifests under `k8s/` are split per service. They are suitable as a baseline, not as a finished platform story. You will still need environment-specific ingress, TLS, secret management, scaling policy, logging, and monitoring around them.

## Required Secrets And Config

### Docker Compose

`docker compose up --build` requires a root `JWT_SECRET` value. Example:

```bash
JWT_SECRET=local-dev-secret docker compose up --build
```

On Windows PowerShell:

```powershell
$env:JWT_SECRET='local-dev-secret'
docker compose up --build
```

### Kubernetes

The active manifests expect a `pharmfind-secrets` secret with at least:

- `jwt-secret`
- `database-url`
- `allowed-origins`
- `frontend-url`

The auth service also needs the email-related environment if real email delivery is enabled.

See [./k8s/k8s-secrets.example.yaml](./k8s/k8s-secrets.example.yaml) for the expected structure.

## Health And Readiness

Every backend service exposes `/api/health`.

The active infrastructure assets assume:

- backend containers are healthy when `/api/health` returns success
- frontend is healthy when `/healthz` returns success
- Kubernetes readiness and liveness probes are based on those endpoints
- Docker Compose waits for healthy backend services before starting the frontend

## What This Repo Covers vs. What It Does Not

Covered:

- local Dockerized MVP stack
- baseline Kubernetes manifests for the microservices
- health checks and startup ordering
- environment wiring for service-specific frontend API URLs

Not fully solved in repo:

- production ingress design
- TLS certificates
- observability stack
- centralized secret rotation
- autoscaling policy
- production database backup and restore policy

Those are deployment decisions for the target environment, not solved generically by the repo itself.

## Recommended Reading

- [Root README](../README.md)
- [Docker Guide](../docs/guides/DOCKER.md)
- [Architecture](../docs/ARCHITECTURE.md)
- [Backend Services README](../server/README.md)
