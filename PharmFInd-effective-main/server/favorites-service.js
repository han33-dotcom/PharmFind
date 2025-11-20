// Favorites microservice (standalone)
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

// Database selection (Postgres if DATABASE_URL provided, otherwise JSON file DB)
let FavoritesDatabase;
if (process.env.DATABASE_URL) {
  const postgresModule = await import('./database/postgres.js');
  FavoritesDatabase = postgresModule.default;
  console.log('📊 Using PostgreSQL database (favorites-service)');
} else {
  const jsonModule = await import('./database.js');
  FavoritesDatabase = jsonModule.default;
  console.log('📁 Using JSON file-based database (favorites-service)');
}

const favApp = express();
const FAV_PORT = process.env.PORT || 4005;
const FAV_JWT_SECRET = process.env.JWT_SECRET || 'pharmfind-secret-key-change-in-production';

favApp.use(cors());
favApp.use(express.json());

// Optional auth middleware
const authenticateFavToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: { message: 'Authentication required', status: 401 } });

  jwt.verify(token, FAV_JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: { message: 'Invalid or expired token', status: 403 } });
    req.user = user;
    next();
  });
};

const getFavCurrentUserId = (req) => req.user?.userId || 'demo-user';

// Basic favorites endpoints
favApp.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'favorites', timestamp: new Date().toISOString() });
});

favApp.get('/api/users/me/favorites', authenticateFavToken, (req, res) => {
  try {
    const userId = req.user?.userId || getFavCurrentUserId(req);
    const all = FavoritesDatabase.read('favorites') || [];
    const userFavs = all.filter(f => f.userId === userId);
    res.json({ favorites: userFavs });
  } catch (err) {
    console.error('Error fetching favorites:', err);
    res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

favApp.post('/api/users/me/favorites', authenticateFavToken, (req, res) => {
  try {
    const userId = req.user?.userId || getFavCurrentUserId(req);
    const payload = req.body;
    const newFav = { id: uuidv4(), userId, ...payload, createdAt: new Date().toISOString() };
    FavoritesDatabase.create('favorites', newFav);
    res.status(201).json({ favorite: newFav });
  } catch (err) {
    console.error('Error creating favorite:', err);
    res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

favApp.delete('/api/users/me/favorites/:id', authenticateFavToken, (req, res) => {
  try {
    const userId = req.user?.userId || getFavCurrentUserId(req);
    const id = req.params.id;
    const fav = FavoritesDatabase.find('favorites', f => f.id === id && f.userId === userId);
    if (!fav) return res.status(404).json({ error: { message: 'Favorite not found', status: 404 } });
    FavoritesDatabase.delete('favorites', id);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting favorite:', err);
    res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

favApp.listen(FAV_PORT, () => {
  console.log(`🚀 Favorites service running on http://localhost:${FAV_PORT}`);
});
