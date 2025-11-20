**Microservices Setup**

- **Overview:**: This project splits the backend into several small Node.js microservices located in the `server/` folder. Each microservice can run individually (via `npm` scripts) or together using `docker-compose`.

**Requirements:**
- **Docker:**: Docker Engine and Docker Compose v2+.
- **Node:**: Node 18+ (for local development) and `npm`.

**Local development (run one service at a time)**
- **Change dir:**: `cd server`
- **Install deps:**: `npm ci`
- **Start a service:**: use one of the npm scripts added to `server/package.json`.

Commands (PowerShell / Windows):
```powershell
cd server
npm ci
npm run start:auth       # start auth service on port 4000
npm run start:medicines  # start medicines service on port 4001
npm run start:pharmacies # start pharmacies service on port 4002
npm run start:orders     # start orders service on port 4003
npm run start:addresses  # start addresses service on port 4004
npm run start:favorites  # start favorites service on port 4005
# The main monolith (all routes) can still be started with:
npm start
```

- **Notes:** Each microservice reads the DB configuration from `DATABASE_URL` (if set) and will fallback to built-in JSON file DB if not provided.

**Run all services with Docker Compose**
- **Build and start everything:**
```powershell
# from repository root
docker compose up --build
```
- **Run a single service in Docker:**
```powershell
# build and start only auth service
docker compose up --build auth
```

- **Stop and remove containers:**
```powershell
docker compose down
```

**Environment and secrets**
- The compose file sets `DATABASE_URL` pointing to the `postgres` service and a placeholder `JWT_SECRET`. For local development you should create `server/.env` with secrets.

Example `server/.env` (keep out of source control):
```
DATABASE_URL=postgres://pharm:pharm@postgres:5432/pharmdb
JWT_SECRET=your_local_secret_here
SMTP_USER=
SMTP_PASS=
EMAIL_MODE=console
```

**Database initialization**
- If you use Postgres (via Docker Compose) you can run the provided setup/seed script:
```powershell
cd server
node database/setup.js
```

**Quick smoke tests (curl)**
- Health checks:
```powershell
curl http://localhost:4000/api/health
curl http://localhost:4001/api/health
```
- Example protected request (replace TOKEN):
```powershell
curl -H "Authorization: Bearer TOKEN" http://localhost:4000/api/auth/me
```

**Production notes**
- Move secrets into a secure secret store or environment variables managed by your deployment system.
- Use proper SMTP credentials and set `EMAIL_MODE=smtp` when sending real emails.
- Adjust ports, scaling and networking in `docker-compose.yml` for production use.

If you want, I can:
- Add `server/.env.example` to the repo and wire the compose file to use `env_file`.
- Add a single command script to run a local multi-service dev environment (e.g., `concurrently`).
- Create a minimal health check endpoint for the frontend to depend on.
