# Dockerizing PharmFind

This guide shows how to run the PharmFind frontend (Vite) and backend microservices with Docker and Docker Compose.

## Prerequisites

- Docker Engine 24+
- Docker Compose V2 (bundled with modern Docker Desktop)
- (Optional) A `.env` file inside `server/` that overrides default backend secrets

## Build Contexts & Images

| Service        | Dockerfile                    | Port (host) |
|----------------|-------------------------------|-------------|
| Frontend       | `Dockerfile.frontend`         | `5173`      |
| Auth           | `server/Dockerfile.auth`      | `4000`      |
| Medicines      | `server/Dockerfile.medicines` | `4001`      |
| Pharmacies     | `server/Dockerfile.pharmacies`| `4002`      |
| Orders         | `server/Dockerfile.orders`    | `4003`      |
| Addresses      | `server/Dockerfile.addresses` | `4004`      |
| Favorites      | `server/Dockerfile.favorites` | `4005`      |
| Prescriptions  | `server/Dockerfile.prescriptions` | `4006`  |

All Dockerfiles accept a `NODE_VERSION` build argument (defaults to `20-alpine`). The frontend Dockerfile also accepts the `VITE_*_API_URL` build args used by the service-specific API client.

## One-command local stack

```bash
docker compose up --build
```

What happens:

- the microservice containers are built from the service-specific Dockerfiles in `server/`
- `frontend` is built from `Dockerfile.frontend` and served on `http://localhost:5173`
- the browser talks directly to the microservices on host ports `4000` through `4006`
- compose now waits for healthy backend services before starting the frontend

Stop the stack with `docker compose down` (use `-v` if you also want to delete the `pgdata` volume).

## Environment variables

Backend defaults can be overridden in `docker-compose.yml` or an optional `server/.env` file:

| Variable       | Purpose | Default in Compose |
|----------------|---------|--------------------|
| `PORT`         | API port | service-specific `4000` to `4006` |
| `JWT_SECRET`   | JWT signing key | required, no repo default |
| `FRONTEND_URL` | Used in auth emails | `http://localhost:5173` |
| `ALLOWED_ORIGINS` | Browser origins accepted by CORS | `http://localhost:5173` |
| `EMAIL_MODE`   | `console` or `smtp` | `console` |
| `DATABASE_URL` | Enables PostgreSQL driver | `postgres://pharm:pharm@postgres:5432/pharmdb` |

For the frontend, pass the service-specific `VITE_*_API_URL` build args when the browser should talk to non-localhost endpoints. Example:

```bash
docker build \
  -f Dockerfile.frontend \
  --build-arg VITE_AUTH_API_URL=https://auth.mypharmfind.com/api \
  --build-arg VITE_MEDICINES_API_URL=https://medicines.mypharmfind.com/api \
  -t pharmfind-frontend .
```

## Running services independently

Example: auth service only

```bash
docker build -f server/Dockerfile.auth -t pharmfind-auth ./server
docker run --rm -p 4000:4000 \
  -e PORT=4000 \
  -e JWT_SECRET=supersecret \
  -e FRONTEND_URL=http://localhost:5173 \
  pharmfind-auth
```

### Frontend only

```bash
docker build -t pharmfind-frontend \
  --build-arg VITE_API_BASE_URL=https://api.example.com/api \
  -f Dockerfile.frontend .
docker run --rm -p 5173:80 pharmfind-frontend
```

## Production tips

- Replace the JSON datastore with PostgreSQL and pass `DATABASE_URL` plus credentials to the backend container.
- Use a secrets manager (Docker secrets, Vault, etc.) for JWT and SMTP credentials.
- Add HTTPS termination (e.g., reverse proxy or a cloud load balancer) in front of the Nginx frontend or serve the static assets from a CDN.
- Build multi-arch images by passing `--platform` to `docker buildx build`.

