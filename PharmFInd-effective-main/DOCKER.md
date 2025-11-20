# Dockerizing PharmFind

This guide shows how to run the PharmFind frontend (Vite) and backend (Express) microservices with Docker and Docker Compose.

## Prerequisites

- Docker Engine 24+
- Docker Compose V2 (bundled with modern Docker Desktop)
- (Optional) A `.env` file inside `server/` that overrides default backend secrets

## Build Contexts & Images

| Service    | Dockerfile          | Port (host) | Description |
|------------|---------------------|-------------|-------------|
| Frontend   | `Dockerfile.frontend` | `5173`      | Builds the Vite app and serves it via Nginx. |
| Backend    | `server/Dockerfile` | `3000`      | Runs the Express API with the JSON-based datastore. |

Both Dockerfiles accept a `NODE_VERSION` build argument (defaults to `20-alpine`). The frontend Dockerfile also accepts `VITE_API_BASE_URL` so you can point builds to different backend URLs.

## One-command local stack

```bash
docker compose up --build
```

What happens:

- `backend` is built from `server/Dockerfile`, exposes `http://localhost:3000`, and persists JSON data in the `server_data` named volume.
- `frontend` is built from `Dockerfile.frontend`, bakes in `VITE_API_BASE_URL=http://backend:3000/api`, and is served on `http://localhost:5173`.

Stop the stack with `docker compose down` (use `-v` if you also want to delete the `server_data` volume).

## Environment variables

Backend defaults can be overridden in `docker-compose.yml` or an optional `server/.env` file:

| Variable       | Purpose | Default in Compose |
|----------------|---------|--------------------|
| `PORT`         | API port | `3000` |
| `JWT_SECRET`   | JWT signing key | `CHANGEME_SUPER_SECRET` |
| `FRONTEND_URL` | Used in auth emails | `http://localhost:5173` |
| `EMAIL_MODE`   | `console` or `smtp` | `console` |
| `DATABASE_URL` | Enables PostgreSQL driver | unset |

For the frontend, pass `VITE_API_BASE_URL` as a build arg. Example:

```bash
docker build \
  -f Dockerfile.frontend \
  --build-arg VITE_API_BASE_URL=https://api.mypharmfind.com/api \
  -t pharmfind-frontend .
```

## Running microservices independently

### Backend only

```bash
docker build -t pharmfind-backend ./server
docker run --rm -p 3000:3000 \
  -e JWT_SECRET=supersecret \
  -e FRONTEND_URL=http://localhost:5173 \
  -v server_data:/app/data \
  pharmfind-backend
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

