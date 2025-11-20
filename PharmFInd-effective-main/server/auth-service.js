// Auth microservice (standalone)
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import nodemailer from 'nodemailer';

// Database selection (Postgres if DATABASE_URL provided, otherwise JSON file DB)
let AuthDatabase;
if (process.env.DATABASE_URL) {
  const postgresModule = await import('./database/postgres.js');
  AuthDatabase = postgresModule.default;
  console.log('📊 Using PostgreSQL database (auth-service)');
} else {
  const jsonModule = await import('./database.js');
  AuthDatabase = jsonModule.default;
  console.log('📁 Using JSON file-based database (auth-service)');
}

const authApp = express();
const AUTH_PORT = process.env.PORT || 4000;
const AUTH_JWT_SECRET = process.env.JWT_SECRET || 'pharmfind-secret-key-change-in-production';
const AUTH_FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

authApp.use(cors());
authApp.use(express.json());

// Email configuration
const EMAIL_CONFIG = {
  mode: process.env.EMAIL_MODE || 'console',
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
  },
  from: process.env.EMAIL_FROM || 'noreply@pharmfind.com',
};

const authEmailTransporter = EMAIL_CONFIG.mode === 'smtp' && EMAIL_CONFIG.smtp.auth.user
  ? nodemailer.createTransport(EMAIL_CONFIG.smtp)
  : null;

const sendAuthEmail = async (to, subject, html) => {
  if (EMAIL_CONFIG.mode === 'console') {
    console.log('\n📧 EMAIL (Development Mode):');
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

// Auth middleware
const authenticateAuthToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: { message: 'Authentication required', status: 401 } });
  }

  jwt.verify(token, AUTH_JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: { message: 'Invalid or expired token', status: 403 } });
    req.user = user;
    next();
  });
};

const getAuthCurrentUserId = (req) => req.user?.userId || 'demo-user';

// ==================== Authentication Routes ====================
authApp.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, fullName, phone } = req.body;

    if (!email || !password || !fullName) {
      return res.status(400).json({
        error: { message: 'Email, password, and full name are required', status: 400 }
      });
    }

    // Check if user exists
    const existingUser = AuthDatabase.findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        error: { message: 'User already exists', status: 409 }
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = {
      id: uuidv4(),
      email,
      passwordHash,
      fullName,
      phone: phone || '',
      createdAt: new Date().toISOString(),
      emailVerified: false,
    };

    AuthDatabase.createUser(user);

    // Generate verification token
    const verificationToken = uuidv4();
    AuthDatabase.createVerificationToken(user.id, verificationToken);

    // Send verification email
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
            <p>Hi ${user.fullName},</p>
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
            <p>© ${new Date().getFullYear()} PharmFind. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await sendAuthEmail(user.email, 'Verify your PharmFind account', emailHtml);

    // Generate JWT token (user can login but might need to verify email)
    const token = jwt.sign({ userId: user.id, email: user.email }, AUTH_JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        emailVerified: false,
      },
      token,
      message: 'Account created successfully. Please check your email to verify your account.',
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: { message: 'Internal server error', status: 500 }
    });
  }
});

authApp.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password, phone } = req.body;

    if (!email && !phone) {
      return res.status(400).json({
        error: { message: 'Email or phone is required', status: 400 }
      });
    }

    // Find user by email or phone
    const users = AuthDatabase.read('users');
    const user = users.find(u => 
      (email && u.email === email) || (phone && u.phone === phone)
    );

    if (!user) {
      return res.status(401).json({
        error: { message: 'Invalid credentials', status: 401 }
      });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({
        error: { message: 'Invalid credentials', status: 401 }
      });
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user.id, email: user.email }, AUTH_JWT_SECRET, { expiresIn: '7d' });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: { message: 'Internal server error', status: 500 }
    });
  }
});

authApp.get('/api/auth/me', authenticateAuthToken, (req, res) => {
  const user = AuthDatabase.findUserById(req.user.userId);
  if (!user) {
    return res.status(404).json({
      error: { message: 'User not found', status: 404 }
    });
  }

  res.json({
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    phone: user.phone,
    emailVerified: user.emailVerified || false,
  });
});

// Email verification endpoint
authApp.get('/api/auth/verify-email', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        error: { message: 'Verification token is required', status: 400 }
      });
    }

    // Find verification token
    const verification = AuthDatabase.findVerificationToken(token);

    if (!verification) {
      return res.status(400).json({
        error: { message: 'Invalid or expired verification token', status: 400 }
      });
    }

    // Check if token expired
    if (new Date(verification.expiresAt) < new Date()) {
      AuthDatabase.deleteVerificationToken(token);
      return res.status(400).json({
        error: { message: 'Verification token has expired', status: 400 }
      });
    }

    // Update user email as verified
    const user = AuthDatabase.findUserById(verification.userId);
    if (!user) {
      return res.status(404).json({
        error: { message: 'User not found', status: 404 }
      });
    }

    AuthDatabase.updateUser(verification.userId, { emailVerified: true });
    AuthDatabase.deleteVerificationToken(token);

    res.json({
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
    res.status(500).json({
      error: { message: 'Internal server error', status: 500 }
    });
  }
});

// Resend verification email endpoint
authApp.post('/api/auth/resend-verification', authenticateAuthToken, async (req, res) => {
  try {
    const user = AuthDatabase.findUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        error: { message: 'User not found', status: 404 }
      });
    }

    if (user.emailVerified) {
      return res.status(400).json({
        error: { message: 'Email is already verified', status: 400 }
      });
    }

    // Generate new verification token
    const verificationToken = uuidv4();
    AuthDatabase.createVerificationToken(user.id, verificationToken);

    // Send verification email
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

    res.json({
      success: true,
      message: 'Verification email sent successfully',
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({
      error: { message: 'Internal server error', status: 500 }
    });
  }
});


// Example healthcheck for this microservice
authApp.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'auth', timestamp: new Date().toISOString() });
});

// Start auth service
authApp.listen(AUTH_PORT, () => {
  console.log(`🚀 Auth service running on http://localhost:${AUTH_PORT}`);
});
