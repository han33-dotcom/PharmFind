// Orders microservice (standalone)
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

// Database selection (Postgres if DATABASE_URL provided, otherwise JSON file DB)
let OrdersDatabase;
if (process.env.DATABASE_URL) {
  const postgresModule = await import('./database/postgres.js');
  OrdersDatabase = postgresModule.default;
  console.log('📊 Using PostgreSQL database (orders-service)');
} else {
  const jsonModule = await import('./database.js');
  OrdersDatabase = jsonModule.default;
  console.log('📁 Using JSON file-based database (orders-service)');
}

const ordersApp = express();
const ORDERS_PORT = process.env.PORT || 4003;
const ORDERS_JWT_SECRET = process.env.JWT_SECRET || 'pharmfind-secret-key-change-in-production';

ordersApp.use(cors());
ordersApp.use(express.json());

// Optional auth middleware for protected endpoints
const authenticateOrdersToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: { message: 'Authentication required', status: 401 } });

  jwt.verify(token, ORDERS_JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: { message: 'Invalid or expired token', status: 403 } });
    req.user = user;
    next();
  });
};

const getOrdersCurrentUserId = (req) => req.user?.userId || 'demo-user';

// Basic orders endpoints
ordersApp.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'orders', timestamp: new Date().toISOString() });
});

ordersApp.get('/api/orders', (req, res) => {
  try {
    const list = OrdersDatabase.read('orders') || [];
    res.json({ orders: list });
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

ordersApp.post('/api/orders', authenticateOrdersToken, (req, res) => {
  try {
    const payload = req.body;
    const newOrder = { id: uuidv4(), ...payload, createdAt: new Date().toISOString() };
    OrdersDatabase.create('orders', newOrder);
    res.status(201).json({ order: newOrder });
  } catch (err) {
    console.error('Error creating order:', err);
    res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

ordersApp.listen(ORDERS_PORT, () => {
  console.log(`🚀 Orders service running on http://localhost:${ORDERS_PORT}`);
});
