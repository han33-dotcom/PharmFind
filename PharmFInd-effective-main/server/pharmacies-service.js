// Pharmacies microservice (standalone)
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

// Database selection (Postgres if DATABASE_URL provided, otherwise JSON file DB)
let PharmDatabase;
if (process.env.DATABASE_URL) {
  const postgresModule = await import('./database/postgres.js');
  PharmDatabase = postgresModule.default;
  console.log('📊 Using PostgreSQL database (pharmacies-service)');
} else {
  const jsonModule = await import('./database.js');
  PharmDatabase = jsonModule.default;
  console.log('📁 Using JSON file-based database (pharmacies-service)');
}

const pharmApp = express();
const PHARM_PORT = process.env.PORT || 4002;
const PHARM_JWT_SECRET = process.env.JWT_SECRET || 'pharmfind-secret-key-change-in-production';

pharmApp.use(cors());
pharmApp.use(express.json());

// Optional auth middleware
const authenticatePharmToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: { message: 'Authentication required', status: 401 } });

  jwt.verify(token, PHARM_JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: { message: 'Invalid or expired token', status: 403 } });
    req.user = user;
    next();
  });
};

// Simple helper
const getPharmCurrentUserId = (req) => req.user?.userId || 'demo-user';

// Basic pharmacies endpoints
pharmApp.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'pharmacies', timestamp: new Date().toISOString() });
});

pharmApp.get('/api/pharmacies', (req, res) => {
  try {
    const list = PharmDatabase.read('pharmacies') || [];
    res.json({ pharmacies: list });
  } catch (err) {
    console.error('Error fetching pharmacies:', err);
    res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

pharmApp.post('/api/pharmacies', authenticatePharmToken, (req, res) => {
  try {
    const payload = req.body;
    const newPharm = { id: uuidv4(), ...payload, createdAt: new Date().toISOString() };
    PharmDatabase.create('pharmacies', newPharm);
    res.status(201).json({ pharmacy: newPharm });
  } catch (err) {
    console.error('Error creating pharmacy:', err);
    res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

pharmApp.listen(PHARM_PORT, () => {
  console.log(`🚀 Pharmacies service running on http://localhost:${PHARM_PORT}`);
});
