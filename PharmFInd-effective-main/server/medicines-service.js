// Medicines microservice (standalone)
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

// Database selection (Postgres if DATABASE_URL provided, otherwise JSON file DB)
let MedicinesDatabase;
if (process.env.DATABASE_URL) {
  const postgresModule = await import('./database/postgres.js');
  MedicinesDatabase = postgresModule.default;
  console.log('📊 Using PostgreSQL database (medicines-service)');
} else {
  const jsonModule = await import('./database.js');
  MedicinesDatabase = jsonModule.default;
  console.log('📁 Using JSON file-based database (medicines-service)');
}

const medicinesApp = express();
const MED_PORT = process.env.PORT || 4001;
const MED_JWT_SECRET = process.env.JWT_SECRET || 'pharmfind-secret-key-change-in-production';

medicinesApp.use(cors());
medicinesApp.use(express.json());

// Optional auth middleware for protected endpoints
const authenticateMedToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: { message: 'Authentication required', status: 401 } });

  jwt.verify(token, MED_JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: { message: 'Invalid or expired token', status: 403 } });
    req.user = user;
    next();
  });
};

// Basic medicines endpoints
medicinesApp.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'medicines', timestamp: new Date().toISOString() });
});

medicinesApp.get('/api/medicines', (req, res) => {
  try {
    const meds = MedicinesDatabase.read('medicines') || [];
    res.json({ medicines: meds });
  } catch (err) {
    console.error('Error fetching medicines:', err);
    res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

// Example protected endpoint (requires a valid JWT)
medicinesApp.post('/api/medicines', authenticateMedToken, (req, res) => {
  try {
    const data = req.body;
    const newMed = { id: uuidv4(), ...data, createdAt: new Date().toISOString() };
    MedicinesDatabase.create('medicines', newMed);
    res.status(201).json({ medicine: newMed });
  } catch (err) {
    console.error('Error creating medicine:', err);
    res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

medicinesApp.listen(MED_PORT, () => {
  console.log(`🚀 Medicines service running on http://localhost:${MED_PORT}`);
});
