# Email Verification

Email verification is handled by the auth microservice and is part of the active MVP account flow.

## What It Does

When a user registers:

1. the auth service creates the user account
2. a verification token is generated and stored
3. the service either sends the verification link by email or prints it to the console, depending on `EMAIL_MODE`
4. the frontend route `/verify-email` consumes the token flow
5. the auth service marks the user as verified when the token is valid

## Relevant Endpoints

- `GET /api/auth/verify-email?token=...`
- `POST /api/auth/resend-verification`

The resend endpoint requires authentication. The verification endpoint itself is token-driven.

## Relevant Code Paths

Backend:

- `server/services/auth.js`
- `server/lib/auth.js`
- `server/lib/database.js`
- `server/database/postgres.js`

Frontend:

- `src/pages/Auth.tsx`
- `src/pages/VerifyEmail.tsx`
- `src/app/routes/AppRoutes.tsx`
- `src/services/auth.service.ts`

## Environment Configuration

### Local development

Use console mode:

```env
EMAIL_MODE=console
FRONTEND_URL=http://localhost:8082
ALLOWED_ORIGINS=http://localhost:8082,http://127.0.0.1:4173
```

In this mode, no real email is sent. The verification link is printed in the auth service logs.

### SMTP mode

Use SMTP when you want real email delivery:

```env
EMAIL_MODE=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@pharmfind.com
FRONTEND_URL=http://localhost:8082
ALLOWED_ORIGINS=http://localhost:8082
```

## Local Testing Procedure

1. start the backend services
2. register a new user from the app
3. copy the verification link from the auth service output when using `EMAIL_MODE=console`
4. open the link in the browser
5. confirm the verification page succeeds
6. call `GET /api/auth/me` with the user token or refresh the app and confirm the user is marked verified

## Operational Notes

- `FRONTEND_URL` matters because the auth service uses it when constructing verification links
- if you run the app through Docker, the frontend URL changes to `http://localhost:5173`
- if you switch environments, update both `FRONTEND_URL` and `ALLOWED_ORIGINS` so the verification flow points at the correct frontend

## Related Flows

Password reset uses a similar token-based pattern. See the auth service and [PostgreSQL Migration](./POSTGRES_MIGRATION.md) if you want to inspect the underlying token tables.
