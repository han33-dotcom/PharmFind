import express from 'express';
import cors from 'cors';
import { loadDatabase } from './lib/database.js';
import { getEnv, loadServiceEnvironment } from './lib/env.js';

loadServiceEnvironment();

const MedicinesDatabase = await loadDatabase('medicines-service');
const medicinesApp = express();
const MED_PORT = Number(getEnv('PORT', '4001'));

medicinesApp.use(cors());
medicinesApp.use(express.json());

const mapMedicine = (medicine) => ({
  id: Number(medicine.id),
  name: medicine.name,
  category: medicine.category,
  basePrice: Number(medicine.basePrice ?? medicine.base_price ?? 0),
  description: medicine.description ?? '',
  manufacturer: medicine.manufacturer ?? '',
  requiresPrescription: Boolean(medicine.requiresPrescription ?? medicine.requires_prescription),
});

const mapPharmacyMedicine = (medicine) => ({
  ...mapMedicine(medicine),
  pharmacyId: Number(medicine.pharmacyId ?? medicine.pharmacy_id),
  pharmacyName: medicine.pharmacyName ?? medicine.pharmacy_name ?? '',
  price: Number(medicine.price ?? medicine.basePrice ?? medicine.base_price ?? 0),
  stockStatus: medicine.stockStatus ?? medicine.stock_status ?? 'In Stock',
  lastUpdated: medicine.lastUpdated ?? medicine.last_updated ?? new Date().toISOString(),
});

const findAvailableMedicines = async (searchQuery) => {
  const pharmacies = await MedicinesDatabase.getAllPharmacies();
  const medicineEntries = await Promise.all(
    pharmacies.map((pharmacy) => MedicinesDatabase.getMedicinesByPharmacy(pharmacy.id))
  );

  const normalizedQuery = typeof searchQuery === 'string' ? searchQuery.trim().toLowerCase() : '';
  const matches = medicineEntries.flat().filter((medicine) => {
    if (!normalizedQuery) return true;

    return (
      medicine.name.toLowerCase().includes(normalizedQuery) ||
      medicine.category.toLowerCase().includes(normalizedQuery)
    );
  });

  return matches.map(mapPharmacyMedicine);
};

medicinesApp.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'medicines', timestamp: new Date().toISOString() });
});

medicinesApp.get('/api/medicines', async (req, res) => {
  try {
    const medicines = await findAvailableMedicines(req.query.search);
    return res.json(medicines);
  } catch (error) {
    console.error('Error fetching medicines:', error);
    return res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

medicinesApp.get('/api/medicines/categories', async (req, res) => {
  try {
    const medicines = await MedicinesDatabase.getAllMedicines();
    const categories = [...new Set(medicines.map((medicine) => medicine.category))].sort();
    return res.json({ categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

medicinesApp.get('/api/medicines/:id', async (req, res) => {
  try {
    const medicine = await MedicinesDatabase.findMedicineById(Number(req.params.id));
    if (!medicine) {
      return res.status(404).json({ error: { message: 'Medicine not found', status: 404 } });
    }

    return res.json(mapMedicine(medicine));
  } catch (error) {
    console.error('Error fetching medicine:', error);
    return res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

medicinesApp.listen(MED_PORT, () => {
  console.log(`Medicines service running on http://localhost:${MED_PORT}`);
});
