// Addresses microservice (standalone)
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

// Database selection (Postgres if DATABASE_URL provided, otherwise JSON file DB)
let AddressesDatabase;
if (process.env.DATABASE_URL) {
  const postgresModule = await import('./database/postgres.js');
  AddressesDatabase = postgresModule.default;
  console.log('📊 Using PostgreSQL database (addresses-service)');
} else {
  const jsonModule = await import('./database.js');
  AddressesDatabase = jsonModule.default;
  console.log('📁 Using JSON file-based database (addresses-service)');
}

const addressesApp = express();
const ADDR_PORT = process.env.PORT || 4004;
const ADDR_JWT_SECRET = process.env.JWT_SECRET || 'pharmfind-secret-key-change-in-production';

addressesApp.use(cors());
addressesApp.use(express.json());

// Optional auth middleware
const authenticateAddrToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: { message: 'Authentication required', status: 401 } });

  jwt.verify(token, ADDR_JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: { message: 'Invalid or expired token', status: 403 } });
    req.user = user;
    next();
  });
};

const getAddrCurrentUserId = (req) => req.user?.userId || 'demo-user';

// Basic addresses endpoints
addressesApp.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'addresses', timestamp: new Date().toISOString() });
});

addressesApp.get('/api/users/me/addresses', authenticateAddrToken, (req, res) => {
  try {
    const userId = req.user?.userId || getAddrCurrentUserId(req);
    const addresses = AddressesDatabase.read('addresses') || [];
    const userAddresses = addresses.filter(a => a.userId === userId);
    res.json({ addresses: userAddresses });
  } catch (err) {
    console.error('Error fetching addresses:', err);
    res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

addressesApp.post('/api/users/me/addresses', authenticateAddrToken, (req, res) => {
  try {
    const userId = req.user?.userId || getAddrCurrentUserId(req);
    const payload = req.body;
    const newAddr = { id: uuidv4(), userId, ...payload, createdAt: new Date().toISOString() };
    AddressesDatabase.create('addresses', newAddr);
    res.status(201).json({ address: newAddr });
  } catch (err) {
    console.error('Error creating address:', err);
    res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

addressesApp.listen(ADDR_PORT, () => {
  console.log(`🚀 Addresses service running on http://localhost:${ADDR_PORT}`);
});
