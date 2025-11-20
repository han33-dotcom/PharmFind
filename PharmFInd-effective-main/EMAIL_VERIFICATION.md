# Email Verification Implementation

Email verification has been successfully implemented! When users sign up, they will receive a confirmation email.

## How It Works

### 1. **User Registration**
- When a user signs up, a verification token is generated
- A verification email is sent to the user's email address
- User can still log in, but their email is marked as `emailVerified: false`

### 2. **Email Sent**
- The email contains a verification link
- The link looks like: `http://localhost:5173/verify-email?token=xxxx-xxxx-xxxx`
- The link expires in 24 hours

### 3. **User Clicks Link**
- User clicks the link in their email
- Frontend redirects to `/verify-email` page
- Backend verifies the token and marks email as verified

### 4. **Verification Complete**
- User's email is marked as `emailVerified: true`
- User is redirected to dashboard
- Success message is shown

## Email Modes

### Development Mode (Default)
By default, emails are logged to the **console** instead of being sent. This is perfect for development.

**Backend Console Output:**
```
📧 EMAIL (Development Mode):
To: user@example.com
Subject: Verify your PharmFind account
Body: [HTML email content]
---
```

**To see verification link:**
1. Start the backend server
2. Register a new user
3. Check the backend console for the email content
4. Copy the verification link from the console

### Production Mode (Real Email Sending)

To send real emails, configure SMTP settings:

1. **Create/Update `.env` file in `server/` directory:**
```env
EMAIL_MODE=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@pharmfind.com
FRONTEND_URL=http://localhost:5173
```

2. **For Gmail:**
   - Enable 2-factor authentication
   - Generate an "App Password" (not your regular password)
   - Use the app password in `SMTP_PASS`

3. **For other email providers:**
   - Update `SMTP_HOST`, `SMTP_PORT`, and credentials accordingly

## New API Endpoints

### Verify Email
```
GET /api/auth/verify-email?token={verificationToken}
```
Verifies the email address using the token from the email link.

### Resend Verification Email
```
POST /api/auth/resend-verification
Authorization: Bearer {token}
```
Allows users to request a new verification email if they didn't receive it.

## Frontend Pages

### `/verify-email`
New page that handles email verification when users click the link from their email.

**Features:**
- Shows loading state while verifying
- Shows success message if verified
- Shows error if token is invalid/expired
- Auto-redirects to dashboard on success

## Testing Email Verification

### Step 1: Register a User
1. Go to http://localhost:5173
2. Click "Sign Up"
3. Fill in the form and submit

### Step 2: Check Backend Console
You'll see the email logged in the backend terminal:
```
📧 EMAIL (Development Mode):
To: user@example.com
Subject: Verify your PharmFind account
Body: [HTML with verification link]
---
```

### Step 3: Copy Verification Link
Copy the verification link from the console (it will look like):
```
http://localhost:5173/verify-email?token=xxxx-xxxx-xxxx
```

### Step 4: Verify Email
1. Open the verification link in your browser
2. You'll see a success message
3. You'll be redirected to the dashboard

## Example Email Content

The email includes:
- ✅ Welcome message
- ✅ Verification button (styled HTML)
- ✅ Verification link (can copy/paste)
- ✅ Expiration notice (24 hours)
- ✅ Professional styling

## Database Changes

New collection in database:
- `email_verifications.json` - Stores verification tokens

Each token has:
- `userId` - User ID
- `token` - Unique verification token
- `createdAt` - When token was created
- `expiresAt` - When token expires (24 hours)

## Security Features

✅ **Token Expiration**: Tokens expire after 24 hours
✅ **One-Time Use**: Token is deleted after verification
✅ **Unique Tokens**: Each user gets a new unique token
✅ **Expired Token Cleanup**: Old tokens are automatically removed

## User Experience

1. **Sign Up** → User receives message: "Please check your email to verify your account"
2. **Check Email** → User receives verification email (or sees it in console for development)
3. **Click Link** → User clicks verification link
4. **Verification Page** → Shows loading, then success/error
5. **Auto Redirect** → User is redirected to dashboard on success

## Optional: Require Email Verification

Currently, users can use the app even if their email isn't verified. If you want to require email verification:

1. Check `user.emailVerified` in protected routes
2. Redirect unverified users to verification page
3. Show a banner reminding users to verify their email

## Troubleshooting

**Email not showing in console?**
- Make sure backend server is running
- Check backend terminal for email logs
- Make sure `EMAIL_MODE=console` (default)

**Verification link not working?**
- Check that token hasn't expired (24 hours)
- Make sure frontend is running on the same URL as `FRONTEND_URL`
- Check backend logs for errors

**Want to send real emails?**
- Set `EMAIL_MODE=smtp` in server `.env`
- Configure SMTP credentials
- Restart backend server

## Files Modified/Created

**Backend:**
- ✅ `server/server.js` - Added email sending and verification endpoints
- ✅ `server/database.js` - Added verification token storage
- ✅ `server/package.json` - Added nodemailer dependency

**Frontend:**
- ✅ `src/pages/VerifyEmail.tsx` - New verification page
- ✅ `src/pages/Auth.tsx` - Updated to show verification message
- ✅ `src/App.tsx` - Added `/verify-email` route
- ✅ `src/services/auth.service.ts` - Updated AuthResponse interface

---

**Status**: ✅ Email verification fully implemented and working!

