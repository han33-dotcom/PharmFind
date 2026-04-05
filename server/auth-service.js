// Auth microservice (standalone)
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import nodemailer from 'nodemailer';
import { authenticateToken, signAccessToken } from './lib/auth.js';
import { loadDatabase } from './lib/database.js';
import { getEnv, loadServiceEnvironment } from './lib/env.js';

loadServiceEnvironment();

const AuthDatabase = await loadDatabase('auth-service');

const authApp = express();
const AUTH_PORT = Number(getEnv('PORT', '4000'));
const AUTH_FRONTEND_URL = getEnv('FRONTEND_URL', 'http://localhost:5173');

authApp.use(cors());
authApp.use(express.json());

const normalizeEmail = (value) => value?.trim().toLowerCase();
const normalizePhone = (value) => value?.trim();
const USER_ROLES = new Set(['patient', 'pharmacist', 'driver']);
const normalizeRole = (value) => (USER_ROLES.has(value) ? value : 'patient');

const toPublicUser = (user) => ({
  id: user.id,
  email: user.email,
  fullName: user.fullName,
  phone: user.phone || '',
  emailVerified: Boolean(user.emailVerified),
  role: normalizeRole(user.role),
});

const EMAIL_CONFIG = {
  mode: getEnv('EMAIL_MODE', 'console'),
  smtp: {
    host: getEnv('SMTP_HOST', 'smtp.gmail.com'),
    port: parseInt(getEnv('SMTP_PORT', '587'), 10),
    secure: false,
    auth: {
      user: getEnv('SMTP_USER', ''),
      pass: getEnv('SMTP_PASS', ''),
    },
  },
  from: getEnv('EMAIL_FROM', 'noreply@pharmfind.com'),
};

const authEmailTransporter =
  EMAIL_CONFIG.mode === 'smtp' && EMAIL_CONFIG.smtp.auth.user
    ? nodemailer.createTransport(EMAIL_CONFIG.smtp)
    : null;

const sendAuthEmail = async (to, subject, html) => {
  if (EMAIL_CONFIG.mode === 'console') {
    console.log('\n[auth-service] EMAIL (development mode)');
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log('Body:', html);
    console.log('---\n');
    return true;
  }

  if (!authEmailTransporter) {
    console.error('Email transporter not configured. Set EMAIL_MODE=smtp and SMTP credentials.');
    return false;
  }

  try {
    await authEmailTransporter.sendMail({ from: EMAIL_CONFIG.from, to, subject, html });
    return true;
  } catch (err) {
    console.error('Error sending email:', err);
    return false;
  }
};

const getApiErrorMessage = (error, fallback = 'Internal server error') =>
  error instanceof Error ? error.message : fallback;

authApp.post('/api/auth/register', async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = req.body.password;
    const fullName = req.body.fullName?.trim();
    const phone = normalizePhone(req.body.phone);
    const role = normalizeRole(req.body.role);

    if (!email || !password || !fullName) {
      return res.status(400).json({
        error: { message: 'Email, password, and full name are required', status: 400 },
      });
    }

    const existingUser = await AuthDatabase.findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        error: { message: 'User already exists', status: 409 },
      });
    }

    if (phone) {
      const existingPhoneUser = await AuthDatabase.findUserByPhone(phone);
      if (existingPhoneUser) {
        return res.status(409).json({
          error: { message: 'Phone number is already in use', status: 409 },
        });
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = {
      id: uuidv4(),
      email,
      passwordHash,
      fullName,
      phone: phone || '',
      createdAt: new Date().toISOString(),
      emailVerified: false,
      role,
    };

    const createdUser = await AuthDatabase.createUser(newUser);
    const verificationToken = uuidv4();
    await AuthDatabase.createVerificationToken(createdUser.id, verificationToken);

    const verificationLink = `${AUTH_FRONTEND_URL}/verify-email?token=${verificationToken}`;
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .button { display: inline-block; padding: 12px 24px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to PharmFind!</h1>
          </div>
          <div class="content">
            <p>Hi ${createdUser.fullName},</p>
            <p>Thank you for signing up with PharmFind! Please verify your email address to complete your registration.</p>
            <p style="text-align: center;">
              <a href="${verificationLink}" class="button">Verify Email Address</a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666;">${verificationLink}</p>
            <p>This verification link will expire in 24 hours.</p>
            <p>If you didn't create an account with PharmFind, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} PharmFind. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await sendAuthEmail(createdUser.email, 'Verify your PharmFind account', emailHtml);

    return res.status(201).json({
      user: toPublicUser(createdUser),
      token: signAccessToken(createdUser),
      message: 'Account created successfully. Please check your email to verify your account.',
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      error: { message: 'Internal server error', status: 500 },
    });
  }
});

authApp.post('/api/auth/login', async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const phone = normalizePhone(req.body.phone);
    const password = req.body.password;

    if (!email && !phone) {
      return res.status(400).json({
        error: { message: 'Email or phone is required', status: 400 },
      });
    }

    if (!password) {
      return res.status(400).json({
        error: { message: 'Password is required', status: 400 },
      });
    }

    const user = email
      ? await AuthDatabase.findUserByEmail(email)
      : await AuthDatabase.findUserByPhone(phone);

    if (!user) {
      return res.status(401).json({
        error: { message: 'Invalid credentials', status: 401 },
      });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({
        error: { message: 'Invalid credentials', status: 401 },
      });
    }

    return res.json({
      user: toPublicUser(user),
      token: signAccessToken(user),
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      error: { message: 'Internal server error', status: 500 },
    });
  }
});

authApp.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await AuthDatabase.findUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        error: { message: 'User not found', status: 404 },
      });
    }

    return res.json(toPublicUser(user));
  } catch (error) {
    console.error('Current user lookup error:', error);
    return res.status(500).json({
      error: { message: 'Internal server error', status: 500 },
    });
  }
});

authApp.patch('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await AuthDatabase.findUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        error: { message: 'User not found', status: 404 },
      });
    }

    const updates = {};
    const fullName = req.body.fullName?.trim();
    const email = req.body.email ? normalizeEmail(req.body.email) : undefined;
    const phone = req.body.phone ? normalizePhone(req.body.phone) : undefined;
    const currentPassword = req.body.currentPassword;
    const newPassword = req.body.newPassword;

    if (fullName !== undefined) {
      if (!fullName) {
        return res.status(400).json({ error: { message: 'Full name cannot be empty', status: 400 } });
      }
      updates.fullName = fullName;
    }

    if (email !== undefined && email !== user.email) {
      const existingEmailUser = await AuthDatabase.findUserByEmail(email);
      if (existingEmailUser && existingEmailUser.id !== user.id) {
        return res.status(409).json({ error: { message: 'Email is already in use', status: 409 } });
      }
      updates.email = email;
      updates.emailVerified = false;
    }

    if (phone !== undefined && phone !== user.phone) {
      const existingPhoneUser = await AuthDatabase.findUserByPhone(phone);
      if (existingPhoneUser && existingPhoneUser.id !== user.id) {
        return res.status(409).json({ error: { message: 'Phone number is already in use', status: 409 } });
      }
      updates.phone = phone;
    }

    if (currentPassword || newPassword) {
      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          error: { message: 'Current password and new password are both required to change your password', status: 400 },
        });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({
          error: { message: 'New password must be at least 8 characters long', status: 400 },
        });
      }

      const validPassword = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!validPassword) {
        return res.status(401).json({
          error: { message: 'Current password is incorrect', status: 401 },
        });
      }

      updates.passwordHash = await bcrypt.hash(newPassword, 10);
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        error: { message: 'No valid updates provided', status: 400 },
      });
    }

    const updatedUser = await AuthDatabase.updateUser(user.id, updates);

    if (updates.email && updatedUser) {
      const verificationToken = uuidv4();
      await AuthDatabase.createVerificationToken(updatedUser.id, verificationToken);
      const verificationLink = `${AUTH_FRONTEND_URL}/verify-email?token=${verificationToken}`;
      await sendAuthEmail(
        updatedUser.email,
        'Verify your updated PharmFind email',
        `<p>Hi ${updatedUser.fullName},</p><p>Please verify your updated email address:</p><p><a href="${verificationLink}">${verificationLink}</a></p>`,
      );
    }

    return res.json({
      user: toPublicUser(updatedUser),
      message: updates.email
        ? 'Account updated successfully. Please verify your new email address.'
        : 'Account updated successfully.',
    });
  } catch (error) {
    console.error('Update account error:', error);
    return res.status(500).json({
      error: { message: getApiErrorMessage(error), status: 500 },
    });
  }
});

authApp.delete('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await AuthDatabase.findUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        error: { message: 'User not found', status: 404 },
      });
    }

    if (user.role !== 'patient') {
      return res.status(409).json({
        error: { message: 'Account deletion is only available for patient accounts right now', status: 409 },
      });
    }

    await AuthDatabase.deleteUser(user.id);
    return res.status(204).send();
  } catch (error) {
    console.error('Delete account error:', error);
    return res.status(500).json({
      error: { message: getApiErrorMessage(error), status: 500 },
    });
  }
});

authApp.get('/api/auth/verify-email', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        error: { message: 'Verification token is required', status: 400 },
      });
    }

    const verification = await AuthDatabase.findVerificationToken(token);

    if (!verification) {
      return res.status(400).json({
        error: { message: 'Invalid or expired verification token', status: 400 },
      });
    }

    if (new Date(verification.expiresAt) < new Date()) {
      await AuthDatabase.deleteVerificationToken(token);
      return res.status(400).json({
        error: { message: 'Verification token has expired', status: 400 },
      });
    }

    const user = await AuthDatabase.findUserById(verification.userId);
    if (!user) {
      return res.status(404).json({
        error: { message: 'User not found', status: 404 },
      });
    }

    await AuthDatabase.updateUser(verification.userId, { emailVerified: true });
    await AuthDatabase.deleteVerificationToken(token);

    return res.json({
      success: true,
      message: 'Email verified successfully!',
      user: {
        id: user.id,
        email: user.email,
        emailVerified: true,
      },
    });
  } catch (error) {
    console.error('Email verification error:', error);
    return res.status(500).json({
      error: { message: 'Internal server error', status: 500 },
    });
  }
});

authApp.post('/api/auth/resend-verification', authenticateToken, async (req, res) => {
  try {
    const user = await AuthDatabase.findUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        error: { message: 'User not found', status: 404 },
      });
    }

    if (user.emailVerified) {
      return res.status(400).json({
        error: { message: 'Email is already verified', status: 400 },
      });
    }

    const verificationToken = uuidv4();
    await AuthDatabase.createVerificationToken(user.id, verificationToken);

    const verificationLink = `${AUTH_FRONTEND_URL}/verify-email?token=${verificationToken}`;
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .button { display: inline-block; padding: 12px 24px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Verify Your Email</h1>
          </div>
          <div class="content">
            <p>Hi ${user.fullName},</p>
            <p>Click the button below to verify your email address:</p>
            <p style="text-align: center;">
              <a href="${verificationLink}" class="button">Verify Email Address</a>
            </p>
            <p>Or copy and paste this link:</p>
            <p style="word-break: break-all; color: #666;">${verificationLink}</p>
            <p>This link will expire in 24 hours.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await sendAuthEmail(user.email, 'Verify your PharmFind account', emailHtml);

    return res.json({
      success: true,
      message: 'Verification email sent successfully',
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    return res.status(500).json({
      error: { message: 'Internal server error', status: 500 },
    });
  }
});

authApp.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    if (!email) {
      return res.status(400).json({
        error: { message: 'Email is required', status: 400 },
      });
    }

    const user = await AuthDatabase.findUserByEmail(email);
    if (user) {
      const resetToken = uuidv4();
      await AuthDatabase.createPasswordResetToken(user.id, resetToken);

      const resetLink = `${AUTH_FRONTEND_URL}/reset-password?token=${resetToken}`;
      const emailHtml = `
        <p>Hi ${user.fullName},</p>
        <p>Use the link below to reset your PharmFind password:</p>
        <p><a href="${resetLink}">${resetLink}</a></p>
        <p>This link expires in 1 hour.</p>
      `;

      await sendAuthEmail(user.email, 'Reset your PharmFind password', emailHtml);
    }

    return res.json({
      success: true,
      message: 'If an account exists for that email, a password reset link has been sent.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({
      error: { message: 'Internal server error', status: 500 },
    });
  }
});

authApp.post('/api/auth/reset-password', async (req, res) => {
  try {
    const token = req.body.token;
    const password = req.body.password;

    if (!token || !password) {
      return res.status(400).json({
        error: { message: 'Token and password are required', status: 400 },
      });
    }

    const reset = await AuthDatabase.findPasswordResetToken(token);
    if (!reset || new Date(reset.expiresAt) < new Date()) {
      if (reset) {
        await AuthDatabase.deletePasswordResetToken(token);
      }
      return res.status(400).json({
        error: { message: 'Invalid or expired reset token', status: 400 },
      });
    }

    const user = await AuthDatabase.findUserById(reset.userId);
    if (!user) {
      return res.status(404).json({
        error: { message: 'User not found', status: 404 },
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await AuthDatabase.updateUser(user.id, { passwordHash });
    await AuthDatabase.deletePasswordResetToken(token);

    return res.json({
      success: true,
      message: 'Password reset successfully.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({
      error: { message: 'Internal server error', status: 500 },
    });
  }
});

authApp.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'auth', timestamp: new Date().toISOString() });
});

authApp.listen(AUTH_PORT, () => {
  console.log(`Auth service running on http://localhost:${AUTH_PORT}`);
});
