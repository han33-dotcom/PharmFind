# Email Verification

Email verification is implemented through the auth microservice.

## Flow

1. A user registers.
2. The auth service creates a verification token.
3. The service sends an email or logs the verification link, depending on `EMAIL_MODE`.
4. The frontend opens `/verify-email`.
5. The auth service validates the token and marks the user as verified.

## Relevant Backend Paths

- `server/services/auth.js`
- `server/database.js`
- `server/database/postgres.js`

## Relevant Frontend Paths

- `src/pages/VerifyEmail.tsx`
- `src/pages/Auth.tsx`
- `src/app/routes/AppRoutes.tsx`
- `src/services/auth.service.ts`

## Environment

Minimum local config:

```env
EMAIL_MODE=console
FRONTEND_URL=http://localhost:8082
ALLOWED_ORIGINS=http://localhost:8082,http://127.0.0.1:4173
```

SMTP example:

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

## Endpoints

- `GET /api/auth/verify-email?token=...`
- `POST /api/auth/resend-verification`

## Local Testing

1. Start the backend services.
2. Register a new user.
3. In `EMAIL_MODE=console`, copy the verification link from the auth service output.
4. Open the link in the browser.
5. Confirm the user becomes verified.
