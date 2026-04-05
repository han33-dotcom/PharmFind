import express from 'express';
import cors from 'cors';
import { authenticateToken } from './lib/auth.js';
import { loadDatabase } from './lib/database.js';
import { getEnv, loadServiceEnvironment } from './lib/env.js';

loadServiceEnvironment();

const FavoritesDatabase = await loadDatabase('favorites-service');
const favApp = express();
const FAV_PORT = Number(getEnv('PORT', '4005'));

favApp.use(cors());
favApp.use(express.json());

const mapFavorite = (favorite) => ({
  medicineId: Number(favorite.medicineId ?? favorite.medicine_id),
  medicineName: favorite.medicineName ?? favorite.medicine_name ?? '',
  category: favorite.category ?? '',
  lastPharmacyId: Number(favorite.lastPharmacyId ?? favorite.last_pharmacy_id ?? 0),
  lastPharmacyName: favorite.lastPharmacyName ?? favorite.pharmacy_name ?? '',
  lastPrice: Number(favorite.lastPrice ?? favorite.last_price ?? 0),
  addedAt: favorite.addedAt ?? favorite.added_at ?? new Date().toISOString(),
});

favApp.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'favorites', timestamp: new Date().toISOString() });
});

favApp.get('/api/users/me/favorites', authenticateToken, async (req, res) => {
  try {
    const favorites = await FavoritesDatabase.getUserFavorites(req.user.userId);
    return res.json({ data: favorites.map(mapFavorite) });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

favApp.get('/api/users/me/favorites/:medicineId/exists', authenticateToken, async (req, res) => {
  try {
    const exists = await FavoritesDatabase.isFavorite(req.user.userId, Number(req.params.medicineId));
    return res.json({ exists });
  } catch (error) {
    console.error('Error checking favorite:', error);
    return res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

favApp.post('/api/users/me/favorites', authenticateToken, async (req, res) => {
  try {
    const { medicineId, medicineName, category, lastPharmacyId, lastPharmacyName, lastPrice } = req.body;

    if (!medicineId || !medicineName || !category) {
      return res.status(400).json({
        error: { message: 'medicineId, medicineName, and category are required', status: 400 },
      });
    }

    await FavoritesDatabase.createFavorite({
      userId: req.user.userId,
      medicineId: Number(medicineId),
      medicineName,
      category,
      lastPharmacyId: lastPharmacyId ? Number(lastPharmacyId) : null,
      lastPharmacyName: lastPharmacyName ?? '',
      lastPrice: lastPrice !== undefined ? Number(lastPrice) : null,
      addedAt: new Date().toISOString(),
    });

    const favorites = await FavoritesDatabase.getUserFavorites(req.user.userId);
    const favorite = favorites.find((entry) => Number(entry.medicineId ?? entry.medicine_id) === Number(medicineId));

    return res.status(201).json(
      mapFavorite(
        favorite ?? {
          medicineId,
          medicineName,
          category,
          lastPharmacyId,
          lastPharmacyName,
          lastPrice,
          addedAt: new Date().toISOString(),
        }
      )
    );
  } catch (error) {
    console.error('Error creating favorite:', error);
    return res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

favApp.delete('/api/users/me/favorites/:medicineId', authenticateToken, async (req, res) => {
  try {
    await FavoritesDatabase.removeFavorite(req.user.userId, Number(req.params.medicineId));
    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting favorite:', error);
    return res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

favApp.listen(FAV_PORT, () => {
  console.log(`Favorites service running on http://localhost:${FAV_PORT}`);
});
