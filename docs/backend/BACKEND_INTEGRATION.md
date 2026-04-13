# Backend Integration Guide

This document describes the current PharmFind `v1.0` backend contract as used by the frontend. It is not a speculative API design document. It is the integration guide for the working MVP.

## Integration Model

The frontend talks to individual microservices through the service layer in `src/services/`. Routing is resolved in `src/services/api/config.ts`.

Default local base URLs:

| Area | Default Base URL |
| --- | --- |
| Auth | `http://localhost:4000/api` |
| Medicines | `http://localhost:4001/api` |
| Pharmacies | `http://localhost:4002/api` |
| Orders | `http://localhost:4003/api` |
| Addresses | `http://localhost:4004/api` |
| Favorites | `http://localhost:4005/api` |
| Prescriptions | `http://localhost:4006/api` |

`VITE_API_BASE_URL` remains as a fallback for environments where a gateway sits in front of the microservices.

## Cross-Cutting Rules

### Authentication

- JWTs are issued by the auth service.
- Protected requests send `Authorization: Bearer <token>`.
- Role trust is server-side. The backend does not rely on client-selected role state.

### Response Shape

The repo does not enforce one universal envelope for every endpoint. Some endpoints return entity objects directly, while others return wrapped objects such as `{ data: [...] }` or `{ categories: [...] }`.

The practical rule is:

- keep frontend service adapters aligned to the current endpoint shape
- when changing a route contract, update the corresponding frontend service in the same branch

### Error Handling

The frontend API client expects normal HTTP status codes and JSON responses. For behavioral changes, prefer explicit JSON error messages rather than silent `500` responses or HTML fallbacks.

### Mock Data

Mock mode exists only as an explicit opt-in. The default expectation for the MVP is real backend integration.

## Frontend Service Mapping

These files are the integration boundary from the frontend:

- `src/services/auth.service.ts`
- `src/services/medicines.service.ts`
- `src/services/pharmacies.service.ts`
- `src/services/orders.service.ts`
- `src/services/addresses.service.ts`
- `src/services/favorites.service.ts`
- `src/services/prescriptions.service.ts`
- `src/services/pharmacist-orders.service.ts`
- `src/services/driver.service.ts`

If a backend route changes, these are the first frontend files that usually need to change.

## Active API Surface

### Auth service

Public:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/verify-email`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `GET /api/health`

Authenticated:

- `GET /api/auth/me`
- `PATCH /api/auth/me`
- `DELETE /api/auth/me`
- `POST /api/auth/resend-verification`

Key behavior:

- registration persists the selected server-trusted role
- password reset and email verification can run in `console` or `smtp` mode
- auth rate limiting is applied on the sensitive public endpoints

### Medicines service

- `GET /api/health`
- `GET /api/medicines`
- `GET /api/medicines/categories`
- `GET /api/medicines/catalog`
- `GET /api/medicines/:id`

Key behavior:

- `GET /api/medicines` is the main search path
- `GET /api/medicines/catalog` is used for pharmacist inventory onboarding

### Pharmacies service

Public:

- `GET /api/health`
- `GET /api/pharmacies`
- `GET /api/pharmacies/:id`
- `GET /api/pharmacies/:id/medicines`

Authenticated pharmacist paths:

- `POST /api/pharmacies/register`
- `GET /api/pharmacies/me`
- `PATCH /api/pharmacies/me`
- `GET /api/pharmacies/me/inventory`
- `POST /api/pharmacies/me/inventory`
- `PATCH /api/pharmacies/me/inventory/:medicineId`
- `DELETE /api/pharmacies/me/inventory/:medicineId`
- `GET /api/pharmacies/:id/verification-status`

Key behavior:

- pharmacy registration is pharmacist-only
- inventory ownership is enforced server-side
- a newly registered pharmacy can onboard inventory through the `me/inventory` routes

### Orders service

Patient-facing:

- `GET /api/health`
- `GET /api/orders`
- `GET /api/orders/:orderId`
- `POST /api/orders`
- `PATCH /api/orders/:orderId/status`

Pharmacist-facing:

- `GET /api/orders/pharmacist`
- `GET /api/orders/pharmacist/:orderId`
- `PATCH /api/orders/pharmacist/:orderId/status`

Driver-facing:

- `GET /api/orders/driver/available`
- `GET /api/orders/driver/active`
- `GET /api/orders/driver/history`
- `GET /api/orders/driver/stats`
- `POST /api/orders/driver/:orderId/accept`
- `POST /api/orders/driver/:orderId/pickup`
- `POST /api/orders/driver/:orderId/in-transit`
- `POST /api/orders/driver/:orderId/delivered`

Canonical order statuses:

- `Pending`
- `Confirmed`
- `Preparing`
- `Out for Delivery`
- `Delivered`
- `Cancelled`

### Addresses service

- `GET /api/health`
- `GET /api/users/me/addresses`
- `GET /api/users/me/addresses/:id`
- `POST /api/users/me/addresses`
- `PUT /api/users/me/addresses/:id`
- `DELETE /api/users/me/addresses/:id`

### Favorites service

- `GET /api/health`
- `GET /api/users/me/favorites`
- `GET /api/users/me/favorites/:medicineId/exists`
- `POST /api/users/me/favorites`
- `DELETE /api/users/me/favorites/:medicineId`

### Prescriptions service

- `GET /api/health`
- `POST /api/prescriptions/upload`
- `GET /api/prescriptions/:id`
- `GET /api/prescriptions/by-order/:orderId`
- `PATCH /api/prescriptions/:id`
- `DELETE /api/prescriptions/:id`

Key behavior:

- orders can reference uploaded prescriptions
- pharmacists can retrieve the prescription linked to the order they are reviewing

## Core Product Flows And Their Service Dependencies

### Patient order flow

1. auth service registers or logs the user in
2. medicines service supports search and category browsing
3. pharmacies service supplies pharmacy inventory
4. addresses service stores delivery destinations
5. favorites service stores favorites
6. prescriptions service handles optional upload
7. orders service creates and tracks the order

### Pharmacist flow

1. auth registers a pharmacist user
2. pharmacies registers and stores the owned pharmacy
3. pharmacies manages inventory
4. orders exposes pharmacist-owned order queues and status transitions
5. prescriptions exposes order-linked prescription details

### Driver flow

1. auth registers or logs in the driver
2. orders provides available deliveries, active delivery state, history, and stats

## Contract Change Rules

When changing an API contract:

- change the backend route and the frontend service layer together
- keep server-side role enforcement intact
- update tests that cover the changed behavior
- validate with `npm test` and `npm run test:e2e` sequentially

## Recommended Verification

For backend contract changes:

```bash
npm --prefix server test
```

For repo-wide validation:

```bash
npm run validate
```

## Related Docs

- [Architecture](../ARCHITECTURE.md)
- [Database Schema](./DATABASE_SCHEMA.md)
- [Email Verification](./EMAIL_VERIFICATION.md)
- [PostgreSQL Migration](./POSTGRES_MIGRATION.md)
