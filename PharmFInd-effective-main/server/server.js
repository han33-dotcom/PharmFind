/**
 * PharmFind Backend API Server
 * Implements all API endpoints for the PharmFind application
 */

import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import nodemailer from 'nodemailer';

// Import database - use PostgreSQL if DATABASE_URL is set, otherwise use JSON files
let Database;
if (process.env.DATABASE_URL) {
  const postgresModule = await import('./database/postgres.js');
  Database = postgresModule.default;
  console.log('📊 Using PostgreSQL database');
} else {
  const jsonModule = await import('./database.js');
  Database = jsonModule.default;
  console.log('📁 Using JSON file-based database');
}

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'pharmfind-secret-key-change-in-production';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Email configuration
const EMAIL_CONFIG = {
  // For development: Set to 'console' to log emails instead of sending
  // For production: Configure with your SMTP settings
  mode: process.env.EMAIL_MODE || 'console', // 'console' or 'smtp'
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
  },
  from: process.env.EMAIL_FROM || 'noreply@pharmfind.com',
};

// Create email transporter
const emailTransporter = EMAIL_CONFIG.mode === 'smtp' && EMAIL_CONFIG.smtp.auth.user
  ? nodemailer.createTransport(EMAIL_CONFIG.smtp)
  : null;

// Email sending function
const sendEmail = async (to, subject, html) => {
  if (EMAIL_CONFIG.mode === 'console') {
    // Development mode: log email to console
    console.log('\n📧 EMAIL (Development Mode):');
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log('Body:', html);
    console.log('---\n');
    return true;
  }

  if (!emailTransporter) {
    console.error('Email transporter not configured. Set EMAIL_MODE=smtp and SMTP credentials.');
    return false;
  }

  try {
    await emailTransporter.sendMail({
      from: EMAIL_CONFIG.from,
      to,
      subject,
      html,
    });
    console.log(`✅ Verification email sent to ${to}`);
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
};

// Middleware
app.use(cors());
app.use(express.json());

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: { message: 'Authentication required', status: 401 } });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: { message: 'Invalid or expired token', status: 403 } });
    }
    req.user = user;
    next();
  });
};

// Helper to get current user ID from request
const getCurrentUserId = (req) => {
  return req.user?.userId || 'demo-user'; // Fallback to demo user if no auth
};

// ==================== Authentication Routes ====================

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, fullName, phone } = req.body;

    if (!email || !password || !fullName) {
      return res.status(400).json({
        error: { message: 'Email, password, and full name are required', status: 400 }
      });
    }

    // Check if user exists
    const existingUser = Database.findUserByEmail(email);
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

    Database.createUser(user);

    // Generate verification token
    const verificationToken = uuidv4();
    Database.createVerificationToken(user.id, verificationToken);

    // Send verification email
    const verificationLink = `${FRONTEND_URL}/verify-email?token=${verificationToken}`;
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

    await sendEmail(user.email, 'Verify your PharmFind account', emailHtml);

    // Generate JWT token (user can login but might need to verify email)
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

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

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password, phone } = req.body;

    if (!email && !phone) {
      return res.status(400).json({
        error: { message: 'Email or phone is required', status: 400 }
      });
    }

    // Find user by email or phone
    const users = Database.read('users');
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
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

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

app.get('/api/auth/me', authenticateToken, (req, res) => {
  const user = Database.findUserById(req.user.userId);
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
app.get('/api/auth/verify-email', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        error: { message: 'Verification token is required', status: 400 }
      });
    }

    // Find verification token
    const verification = Database.findVerificationToken(token);

    if (!verification) {
      return res.status(400).json({
        error: { message: 'Invalid or expired verification token', status: 400 }
      });
    }

    // Check if token expired
    if (new Date(verification.expiresAt) < new Date()) {
      Database.deleteVerificationToken(token);
      return res.status(400).json({
        error: { message: 'Verification token has expired', status: 400 }
      });
    }

    // Update user email as verified
    const user = Database.findUserById(verification.userId);
    if (!user) {
      return res.status(404).json({
        error: { message: 'User not found', status: 404 }
      });
    }

    Database.updateUser(verification.userId, { emailVerified: true });
    Database.deleteVerificationToken(token);

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
app.post('/api/auth/resend-verification', authenticateToken, async (req, res) => {
  try {
    const user = Database.findUserById(req.user.userId);
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
    Database.createVerificationToken(user.id, verificationToken);

    // Send verification email
    const verificationLink = `${FRONTEND_URL}/verify-email?token=${verificationToken}`;
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

    await sendEmail(user.email, 'Verify your PharmFind account', emailHtml);

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

// ==================== Medicines Routes ====================

app.get('/api/medicines', (req, res) => {
  try {
    const { search, category } = req.query;

    let medicines = Database.getAllMedicines();
    const inventory = Database.getPharmacyInventory();
    const pharmacies = Database.getAllPharmacies();

    // Filter by search query
    if (search) {
      medicines = Database.searchMedicines(search);
    }

    // Filter by category
    if (category) {
      medicines = medicines.filter(m => m.category === category);
    }

    // Convert to PharmacyMedicine format with availability
    const result = medicines.flatMap(medicine => {
      const availableInventory = inventory.filter(inv => inv.medicineId === medicine.id);
      if (availableInventory.length === 0) return [];

      return availableInventory.map(inv => {
        const pharmacy = pharmacies.find(p => p.id === inv.pharmacyId);
        return {
          ...medicine,
          pharmacyId: inv.pharmacyId,
          pharmacyName: pharmacy?.name || 'Unknown',
          price: inv.price || medicine.basePrice,
          stockStatus: inv.stockStatus || 'In Stock',
          lastUpdated: inv.lastUpdated || new Date().toISOString(),
        };
      });
    });

    res.json(result);
  } catch (error) {
    console.error('Medicines error:', error);
    res.status(500).json({
      error: { message: 'Internal server error', status: 500 }
    });
  }
});

app.get('/api/medicines/:id', (req, res) => {
  try {
    const medicine = Database.findMedicineById(parseInt(req.params.id));
    if (!medicine) {
      return res.status(404).json({
        error: { message: 'Medicine not found', status: 404 }
      });
    }
    res.json(medicine);
  } catch (error) {
    console.error('Medicine error:', error);
    res.status(500).json({
      error: { message: 'Internal server error', status: 500 }
    });
  }
});

app.get('/api/medicines/categories', (req, res) => {
  try {
    const medicines = Database.getAllMedicines();
    const categories = [...new Set(medicines.map(m => m.category))];
    res.json({ categories });
  } catch (error) {
    console.error('Categories error:', error);
    res.status(500).json({
      error: { message: 'Internal server error', status: 500 }
    });
  }
});

// ==================== Pharmacies Routes ====================

app.get('/api/pharmacies', (req, res) => {
  try {
    const pharmacies = Database.getAllPharmacies();
    // Only return verified pharmacies for public listing
    // (unverified pharmacies should only be visible to their owners)
    // Default to verified: true for existing pharmacies without the field (backward compatibility)
    const verifiedPharmacies = pharmacies.filter(p => p.verified !== false);
    res.json({ data: verifiedPharmacies });
  } catch (error) {
    console.error('Pharmacies error:', error);
    res.status(500).json({
      error: { message: 'Internal server error', status: 500 }
    });
  }
});

app.get('/api/pharmacies/:id', (req, res) => {
  try {
    const pharmacy = Database.findPharmacyById(parseInt(req.params.id));
    if (!pharmacy) {
      return res.status(404).json({
        error: { message: 'Pharmacy not found', status: 404 }
      });
    }
    res.json(pharmacy);
  } catch (error) {
    console.error('Pharmacy error:', error);
    res.status(500).json({
      error: { message: 'Internal server error', status: 500 }
    });
  }
});

app.get('/api/pharmacies/:id/medicines', (req, res) => {
  try {
    const pharmacyId = parseInt(req.params.id);
    const medicines = Database.getMedicinesByPharmacy(pharmacyId);
    res.json({ pharmacyId, pharmacyName: Database.findPharmacyById(pharmacyId)?.name, medicines });
  } catch (error) {
    console.error('Pharmacy medicines error:', error);
    res.status(500).json({
      error: { message: 'Internal server error', status: 500 }
    });
  }
});

app.get('/api/medicines/:medicineId/pharmacies', (req, res) => {
  try {
    const medicineId = parseInt(req.params.medicineId);
    const inventory = Database.getPharmacyInventory();
    const pharmacies = Database.getAllPharmacies();
    
    const pharmacyIds = inventory
      .filter(inv => inv.medicineId === medicineId)
      .map(inv => inv.pharmacyId);

    // Only return verified pharmacies (default to verified for backward compatibility)
    const result = pharmacies.filter(p => 
      pharmacyIds.includes(p.id) && p.verified !== false
    );
    res.json(result);
  } catch (error) {
    console.error('Medicine pharmacies error:', error);
    res.status(500).json({
      error: { message: 'Internal server error', status: 500 }
    });
  }
});

// Pharmacy registration endpoint
app.post('/api/pharmacies/register', authenticateToken, (req, res) => {
  try {
    const userId = getCurrentUserId(req);
    const { name, address, phone, latitude, longitude, hours, baseDeliveryFee, licenseNumber } = req.body;

    if (!name || !address || !phone) {
      return res.status(400).json({
        error: { message: 'Name, address, and phone are required', status: 400 }
      });
    }

    // Check if user already has a pharmacy
    const existingPharmacy = Database.findPharmacyByOwnerId(userId);
    if (existingPharmacy) {
      return res.status(409).json({
        error: { message: 'You already have a registered pharmacy', status: 409 }
      });
    }

    // Create pharmacy (auto-verified since there's no admin dashboard)
    const pharmacy = Database.createPharmacy({
      name,
      address,
      phone,
      latitude: latitude || null,
      longitude: longitude || null,
      hours: hours || { open: "08:00", close: "22:00" },
      baseDeliveryFee: baseDeliveryFee || 15.00,
      deliveryFee: baseDeliveryFee || 15.00,
      licenseNumber: licenseNumber || null,
      ownerUserId: userId,
      rating: 0,
      isOpen: true,
      distance: "0 km",
      deliveryTime: "20-30 min",
    });

    // Auto-verify the pharmacy (no admin dashboard)
    const verifiedPharmacy = Database.verifyPharmacy(pharmacy.id, true);

    res.status(201).json({
      ...verifiedPharmacy,
      message: 'Pharmacy registered and verified successfully! You can now receive orders.',
    });
  } catch (error) {
    console.error('Pharmacy registration error:', error);
    res.status(500).json({
      error: { message: 'Internal server error', status: 500 }
    });
  }
});

// Get pharmacy by owner (for pharmacist dashboard)
app.get('/api/pharmacies/me', authenticateToken, (req, res) => {
  try {
    const userId = getCurrentUserId(req);
    const pharmacy = Database.findPharmacyByOwnerId(userId);
    
    if (!pharmacy) {
      return res.status(404).json({
        error: { message: 'No pharmacy found for this user', status: 404 }
      });
    }

    res.json(pharmacy);
  } catch (error) {
    console.error('Get pharmacy error:', error);
    res.status(500).json({
      error: { message: 'Internal server error', status: 500 }
    });
  }
});

// Get pharmacy verification status
app.get('/api/pharmacies/:id/verification-status', authenticateToken, (req, res) => {
  try {
    const pharmacy = Database.findPharmacyById(parseInt(req.params.id));
    if (!pharmacy) {
      return res.status(404).json({
        error: { message: 'Pharmacy not found', status: 404 }
      });
    }

    // Check if user owns this pharmacy
    const userId = getCurrentUserId(req);
    if (pharmacy.ownerUserId !== userId) {
      return res.status(403).json({
        error: { message: 'Access denied', status: 403 }
      });
    }

    res.json({
      verified: pharmacy.verified || false,
      verificationStatus: pharmacy.verificationStatus || 'pending',
      message: pharmacy.verified 
        ? 'Your pharmacy is verified and can receive orders.'
        : pharmacy.verificationStatus === 'rejected'
        ? 'Your pharmacy verification was rejected. Please contact support.'
        : 'Your pharmacy registration is pending verification. You will be notified once verified.',
    });
  } catch (error) {
    console.error('Verification status error:', error);
    res.status(500).json({
      error: { message: 'Internal server error', status: 500 }
    });
  }
});

// Admin endpoint to verify pharmacy (for future admin panel)
app.post('/api/pharmacies/:id/verify', authenticateToken, (req, res) => {
  try {
    const { verified } = req.body;
    const pharmacy = Database.findPharmacyById(parseInt(req.params.id));
    
    if (!pharmacy) {
      return res.status(404).json({
        error: { message: 'Pharmacy not found', status: 404 }
      });
    }

    // TODO: Add admin check here
    // For now, allow any authenticated user to verify (for testing)
    
    const updatedPharmacy = Database.verifyPharmacy(pharmacy.id, verified !== false);
    
    res.json({
      ...updatedPharmacy,
      message: updatedPharmacy.verified 
        ? 'Pharmacy verified successfully'
        : 'Pharmacy verification rejected',
    });
  } catch (error) {
    console.error('Verify pharmacy error:', error);
    res.status(500).json({
      error: { message: 'Internal server error', status: 500 }
    });
  }
});

// ==================== Orders Routes ====================

app.post('/api/orders', authenticateToken, (req, res) => {
  try {
    const userId = getCurrentUserId(req);
    const orderData = req.body;

    // Check if order contains pharmacy IDs and verify they are verified
    if (orderData.items && Array.isArray(orderData.items)) {
      const pharmacyIds = [...new Set(orderData.items.map(item => item.pharmacyId).filter(Boolean))];
      
      for (const pharmacyId of pharmacyIds) {
        const pharmacy = Database.findPharmacyById(pharmacyId);
        if (!pharmacy) {
          return res.status(404).json({
            error: { message: `Pharmacy with ID ${pharmacyId} not found`, status: 404 }
          });
        }
        // Check verification status (default to verified for backward compatibility)
        if (pharmacy.verified === false) {
          return res.status(403).json({
            error: { 
              message: `Pharmacy "${pharmacy.name}" is not verified and cannot receive orders. Please select a verified pharmacy.`, 
              status: 403 
            }
          });
        }
      }
    }

    const order = {
      ...orderData,
      userId,
      status: 'Pending',
      createdAt: new Date().toISOString(),
      statusHistory: [
        {
          status: 'Pending',
          timestamp: new Date().toISOString(),
          note: 'Order placed successfully',
        },
      ],
    };

    const createdOrder = Database.createOrder(order);
    res.status(201).json(createdOrder);
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      error: { message: 'Internal server error', status: 500 }
    });
  }
});

app.get('/api/orders', authenticateToken, (req, res) => {
  try {
    const userId = getCurrentUserId(req);
    const orders = Database.getUserOrders(userId);
    
    // Sort by creation date (newest first)
    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ data: orders });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      error: { message: 'Internal server error', status: 500 }
    });
  }
});

app.get('/api/orders/:orderId', authenticateToken, (req, res) => {
  try {
    const order = Database.findOrderById(req.params.orderId);
    if (!order) {
      return res.status(404).json({
        error: { message: 'Order not found', status: 404 }
      });
    }

    // Verify ownership (unless admin)
    const userId = getCurrentUserId(req);
    if (order.userId !== userId) {
      return res.status(403).json({
        error: { message: 'Access denied', status: 403 }
      });
    }

    res.json(order);
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      error: { message: 'Internal server error', status: 500 }
    });
  }
});

app.patch('/api/orders/:orderId/status', authenticateToken, (req, res) => {
  try {
    const { status, note } = req.body;
    const order = Database.findOrderById(req.params.orderId);

    if (!order) {
      return res.status(404).json({
        error: { message: 'Order not found', status: 404 }
      });
    }

    const validStatuses = ['Pending', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: { message: 'Invalid status', status: 400 }
      });
    }

    const updatedOrder = Database.updateOrderStatus(req.params.orderId, status, note);
    res.json(updatedOrder);
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      error: { message: 'Internal server error', status: 500 }
    });
  }
});

// ==================== Addresses Routes ====================

app.get('/api/users/me/addresses', authenticateToken, (req, res) => {
  try {
    const userId = getCurrentUserId(req);
    const addresses = Database.getUserAddresses(userId);
    res.json({ data: addresses });
  } catch (error) {
    console.error('Get addresses error:', error);
    res.status(500).json({
      error: { message: 'Internal server error', status: 500 }
    });
  }
});

app.get('/api/users/me/addresses/:id', authenticateToken, (req, res) => {
  try {
    const address = Database.findAddressById(req.params.id);
    if (!address) {
      return res.status(404).json({
        error: { message: 'Address not found', status: 404 }
      });
    }

    const userId = getCurrentUserId(req);
    if (address.userId !== userId) {
      return res.status(403).json({
        error: { message: 'Access denied', status: 403 }
      });
    }

    res.json(address);
  } catch (error) {
    console.error('Get address error:', error);
    res.status(500).json({
      error: { message: 'Internal server error', status: 500 }
    });
  }
});

app.post('/api/users/me/addresses', authenticateToken, (req, res) => {
  try {
    const userId = getCurrentUserId(req);
    const addressData = req.body;

    const address = {
      ...addressData,
      id: uuidv4(),
      userId,
    };

    const createdAddress = Database.createAddress(address);
    res.status(201).json(createdAddress);
  } catch (error) {
    console.error('Create address error:', error);
    res.status(500).json({
      error: { message: 'Internal server error', status: 500 }
    });
  }
});

app.put('/api/users/me/addresses/:id', authenticateToken, (req, res) => {
  try {
    const address = Database.findAddressById(req.params.id);
    if (!address) {
      return res.status(404).json({
        error: { message: 'Address not found', status: 404 }
      });
    }

    const userId = getCurrentUserId(req);
    if (address.userId !== userId) {
      return res.status(403).json({
        error: { message: 'Access denied', status: 403 }
      });
    }

    const updatedAddress = Database.updateAddress(req.params.id, req.body);
    res.json(updatedAddress);
  } catch (error) {
    console.error('Update address error:', error);
    res.status(500).json({
      error: { message: 'Internal server error', status: 500 }
    });
  }
});

app.delete('/api/users/me/addresses/:id', authenticateToken, (req, res) => {
  try {
    const address = Database.findAddressById(req.params.id);
    if (!address) {
      return res.status(404).json({
        error: { message: 'Address not found', status: 404 }
      });
    }

    const userId = getCurrentUserId(req);
    if (address.userId !== userId) {
      return res.status(403).json({
        error: { message: 'Access denied', status: 403 }
      });
    }

    Database.deleteAddress(req.params.id);
    res.json({ success: true, message: 'Address deleted successfully' });
  } catch (error) {
    console.error('Delete address error:', error);
    res.status(500).json({
      error: { message: 'Internal server error', status: 500 }
    });
  }
});

// ==================== Favorites Routes ====================

app.get('/api/users/me/favorites', authenticateToken, (req, res) => {
  try {
    const userId = getCurrentUserId(req);
    const favorites = Database.getUserFavorites(userId);
    
    // Get medicine details
    const medicines = Database.getAllMedicines();
    const pharmacies = Database.getAllPharmacies();
    
    const result = favorites.map(fav => {
      const medicine = medicines.find(m => m.id === fav.medicineId);
      const pharmacy = pharmacies.find(p => p.id === fav.lastPharmacyId);
      
      return {
        medicineId: fav.medicineId,
        medicineName: medicine?.name || 'Unknown',
        category: medicine?.category || '',
        lastPharmacyId: fav.lastPharmacyId || 0,
        lastPharmacyName: pharmacy?.name || 'Unknown',
        lastPrice: fav.lastPrice || 0,
        addedAt: fav.addedAt,
      };
    });

    // Sort by added date (newest first)
    result.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));

    res.json({ data: result });
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({
      error: { message: 'Internal server error', status: 500 }
    });
  }
});

app.post('/api/users/me/favorites', authenticateToken, (req, res) => {
  try {
    const userId = getCurrentUserId(req);
    const favoriteData = req.body;

    const favorite = {
      ...favoriteData,
      userId,
      addedAt: new Date().toISOString(),
    };

    const createdFavorite = Database.createFavorite(favorite);
    
    // Get medicine and pharmacy details for response
    const medicines = Database.getAllMedicines();
    const pharmacies = Database.getAllPharmacies();
    const medicine = medicines.find(m => m.id === favoriteData.medicineId);
    const pharmacy = pharmacies.find(p => p.id === favoriteData.lastPharmacyId);

    res.status(201).json({
      medicineId: favoriteData.medicineId,
      medicineName: medicine?.name || 'Unknown',
      category: medicine?.category || '',
      lastPharmacyId: favoriteData.lastPharmacyId || 0,
      lastPharmacyName: pharmacy?.name || 'Unknown',
      lastPrice: favoriteData.lastPrice || 0,
      addedAt: favorite.addedAt,
    });
  } catch (error) {
    console.error('Create favorite error:', error);
    res.status(500).json({
      error: { message: 'Internal server error', status: 500 }
    });
  }
});

app.delete('/api/users/me/favorites/:medicineId', authenticateToken, (req, res) => {
  try {
    const userId = getCurrentUserId(req);
    const medicineId = parseInt(req.params.medicineId);

    Database.removeFavorite(userId, medicineId);
    res.json({ success: true, message: 'Favorite removed successfully' });
  } catch (error) {
    console.error('Delete favorite error:', error);
    res.status(500).json({
      error: { message: 'Internal server error', status: 500 }
    });
  }
});

app.get('/api/users/me/favorites/:medicineId/exists', authenticateToken, (req, res) => {
  try {
    const userId = getCurrentUserId(req);
    const medicineId = parseInt(req.params.medicineId);

    const exists = Database.isFavorite(userId, medicineId);
    res.json({ exists });
  } catch (error) {
    console.error('Check favorite error:', error);
    res.status(500).json({
      error: { message: 'Internal server error', status: 500 }
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 PharmFind API Server running on http://localhost:${PORT}`);
  console.log(`📝 API endpoints available at http://localhost:${PORT}/api`);
  console.log(`💾 Database initialized with sample data`);
});

