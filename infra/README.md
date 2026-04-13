# Infrastructure

## Active Infrastructure

- `docker/`: frontend container runtime assets
- `k8s/`: active Kubernetes manifests for the microservice deployment

## Current Expectations

- Docker Compose expects a root `JWT_SECRET` value before startup.
- Kubernetes manifests expect the `pharmfind-secrets` secret with at least:
  - `jwt-secret`
  - `database-url`
  - `allowed-origins`
  - `frontend-url`
- Backend deployments expose `/api/health` and now include readiness/liveness probes based on that endpoint.

The active application path is the frontend plus the microservices in `server/services/`.
