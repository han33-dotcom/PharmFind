import express from 'express';
import cors from 'cors';
import { authenticateToken } from '../lib/auth.js';
import { loadDatabase } from '../lib/database.js';
import { getEnv, loadServiceEnvironment } from '../lib/env.js';

loadServiceEnvironment();

const PharmDatabase = await loadDatabase('pharmacies-service');
const pharmApp = express();
const PHARM_PORT = Number(getEnv('PORT', '4002'));

pharmApp.use(cors());
pharmApp.use(express.json());

const formatTimeValue = (value) => {
  if (!value) return undefined;
  return String(value).slice(0, 5);
};

const mapPharmacy = (pharmacy) => ({
  id: Number(pharmacy.id),
  name: pharmacy.name,
  address: pharmacy.address,
  phone: pharmacy.phone,
  rating: Number(pharmacy.rating ?? 0),
  distance: pharmacy.distance ?? '',
  deliveryTime: pharmacy.deliveryTime ?? pharmacy.delivery_time ?? '',
  deliveryFee: Number(pharmacy.deliveryFee ?? pharmacy.baseDeliveryFee ?? pharmacy.base_delivery_fee ?? 0),
  isOpen: Boolean(pharmacy.isOpen ?? pharmacy.is_open),
  latitude: pharmacy.latitude !== undefined && pharmacy.latitude !== null ? Number(pharmacy.latitude) : undefined,
  longitude: pharmacy.longitude !== undefined && pharmacy.longitude !== null ? Number(pharmacy.longitude) : undefined,
  hours:
    formatTimeValue(pharmacy.hoursOpen ?? pharmacy.hours_open) || formatTimeValue(pharmacy.hoursClose ?? pharmacy.hours_close)
      ? {
          open: formatTimeValue(pharmacy.hoursOpen ?? pharmacy.hours_open) ?? '',
          close: formatTimeValue(pharmacy.hoursClose ?? pharmacy.hours_close) ?? '',
        }
      : pharmacy.hours,
  verified: Boolean(pharmacy.verified ?? false),
  verificationStatus: pharmacy.verificationStatus ?? (pharmacy.verified ? 'approved' : 'pending'),
  ownerUserId: pharmacy.ownerUserId ?? pharmacy.owner_user_id ?? undefined,
  licenseNumber: pharmacy.licenseNumber ?? pharmacy.license_number ?? undefined,
  createdAt: pharmacy.createdAt ?? pharmacy.created_at ?? undefined,
  updatedAt: pharmacy.updatedAt ?? pharmacy.updated_at ?? undefined,
});

const mapPharmacyMedicine = (medicine) => ({
  id: Number(medicine.id),
  name: medicine.name,
  category: medicine.category,
  basePrice: Number(medicine.basePrice ?? medicine.base_price ?? 0),
  description: medicine.description ?? '',
  manufacturer: medicine.manufacturer ?? '',
  requiresPrescription: Boolean(medicine.requiresPrescription ?? medicine.requires_prescription),
  pharmacyId: Number(medicine.pharmacyId ?? medicine.pharmacy_id),
  pharmacyName: medicine.pharmacyName ?? medicine.pharmacy_name ?? '',
  price: Number(medicine.price ?? 0),
  stockStatus: medicine.stockStatus ?? medicine.stock_status ?? 'In Stock',
  lastUpdated: medicine.lastUpdated ?? medicine.last_updated ?? new Date().toISOString(),
});

const mapInventoryItem = (item) => ({
  id: String(item.medicineId ?? item.medicine_id ?? item.id),
  medicineId: Number(item.medicineId ?? item.medicine_id ?? item.id),
  medicineName: item.name,
  scientificName: item.description ?? item.manufacturer ?? item.name,
  category: item.category,
  stockLevel: Number(item.quantity ?? (item.stockStatus === 'Out of Stock' ? 0 : item.stockStatus === 'Low Stock' ? 5 : 50)),
  minStockLevel: Number(item.minStockLevel ?? 10),
  price: Number(item.price ?? item.basePrice ?? item.base_price ?? 0),
  expiryDate: item.expiryDate ?? '',
  lastUpdated: item.lastUpdated ?? item.last_updated ?? new Date().toISOString(),
  stockStatus: item.stockStatus ?? item.stock_status ?? 'In Stock',
});

const deriveStockStatus = (quantity) => {
  if (quantity <= 0) return 'Out of Stock';
  if (quantity < 10) return 'Low Stock';
  return 'In Stock';
};

const ensurePharmacistAccount = async (req, res) => {
  const user = await PharmDatabase.findUserById(req.user.userId);
  if (!user) {
    res.status(404).json({ error: { message: 'User not found', status: 404 } });
    return null;
  }

  if (user.role !== 'pharmacist') {
    res.status(403).json({ error: { message: 'Only pharmacist accounts can access this endpoint', status: 403 } });
    return null;
  }

  return user;
};

const ensureOwnedPharmacy = async (req, res) => {
  const user = await ensurePharmacistAccount(req, res);
  if (!user) return null;

  const pharmacy = await PharmDatabase.findPharmacyByOwnerId(req.user.userId);
  if (!pharmacy) {
    res.status(404).json({ error: { message: 'No pharmacy found for this user', status: 404 } });
    return null;
  }

  return pharmacy;
};

pharmApp.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'pharmacies', timestamp: new Date().toISOString() });
});

pharmApp.post('/api/pharmacies/register', authenticateToken, async (req, res) => {
  try {
    const user = await ensurePharmacistAccount(req, res);
    if (!user) return;

    const existingPharmacy = await PharmDatabase.findPharmacyByOwnerId(req.user.userId);
    if (existingPharmacy) {
      return res.status(409).json({
        error: { message: 'You already have a registered pharmacy', status: 409 },
      });
    }

    const { name, address, phone, latitude, longitude, hours, baseDeliveryFee, licenseNumber } = req.body;

    if (!name || !address || !phone) {
      return res.status(400).json({
        error: { message: 'Pharmacy name, address, and phone are required', status: 400 },
      });
    }

    const pharmacy = await PharmDatabase.createPharmacy({
      name: name.trim(),
      address: address.trim(),
      phone: phone.trim(),
      latitude: latitude ?? null,
      longitude: longitude ?? null,
      hours,
      baseDeliveryFee: baseDeliveryFee ?? 15,
      licenseNumber: licenseNumber?.trim() || null,
      ownerUserId: req.user.userId,
      rating: 0,
      isOpen: true,
      deliveryTime: '20-30 min',
      verified: false,
      verificationStatus: 'pending',
    });

    const verifiedPharmacy = await PharmDatabase.verifyPharmacy(pharmacy.id, true);
    return res.status(201).json({
      ...mapPharmacy(verifiedPharmacy),
      message: 'Pharmacy registered and verified successfully! You can now receive orders.',
    });
  } catch (error) {
    console.error('Error registering pharmacy:', error);
    return res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

pharmApp.get('/api/pharmacies', async (req, res) => {
  try {
    const pharmacies = await PharmDatabase.getAllPharmacies();
    return res.json({ data: pharmacies.map(mapPharmacy) });
  } catch (error) {
    console.error('Error fetching pharmacies:', error);
    return res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

pharmApp.get('/api/pharmacies/me', authenticateToken, async (req, res) => {
  try {
    const pharmacy = await ensureOwnedPharmacy(req, res);
    if (!pharmacy) return;

    return res.json(mapPharmacy(pharmacy));
  } catch (error) {
    console.error('Error fetching owned pharmacy:', error);
    return res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

pharmApp.patch('/api/pharmacies/me', authenticateToken, async (req, res) => {
  try {
    const pharmacy = await ensureOwnedPharmacy(req, res);
    if (!pharmacy) return;

    const updates = {};

    if (req.body.name !== undefined) {
      const name = req.body.name?.trim();
      if (!name) {
        return res.status(400).json({ error: { message: 'Pharmacy name cannot be empty', status: 400 } });
      }
      updates.name = name;
    }

    if (req.body.address !== undefined) {
      const address = req.body.address?.trim();
      if (!address) {
        return res.status(400).json({ error: { message: 'Address cannot be empty', status: 400 } });
      }
      updates.address = address;
    }

    if (req.body.phone !== undefined) {
      const phone = req.body.phone?.trim();
      if (!phone) {
        return res.status(400).json({ error: { message: 'Phone number cannot be empty', status: 400 } });
      }
      updates.phone = phone;
    }

    if (req.body.hours !== undefined) {
      updates.hoursOpen = formatTimeValue(req.body.hours?.open) ?? null;
      updates.hoursClose = formatTimeValue(req.body.hours?.close) ?? null;
    }

    if (req.body.baseDeliveryFee !== undefined) {
      updates.baseDeliveryFee = Number(req.body.baseDeliveryFee);
    }

    if (req.body.isOpen !== undefined) {
      updates.isOpen = Boolean(req.body.isOpen);
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: { message: 'No valid updates provided', status: 400 } });
    }

    const updatedPharmacy = await PharmDatabase.updatePharmacy(Number(pharmacy.id), updates);
    return res.json(mapPharmacy(updatedPharmacy));
  } catch (error) {
    console.error('Error updating owned pharmacy:', error);
    return res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

pharmApp.get('/api/pharmacies/:id', async (req, res) => {
  try {
    const pharmacy = await PharmDatabase.findPharmacyById(Number(req.params.id));
    if (!pharmacy) {
      return res.status(404).json({ error: { message: 'Pharmacy not found', status: 404 } });
    }

    return res.json(mapPharmacy(pharmacy));
  } catch (error) {
    console.error('Error fetching pharmacy:', error);
    return res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

pharmApp.get('/api/pharmacies/:id/verification-status', authenticateToken, async (req, res) => {
  try {
    const user = await ensurePharmacistAccount(req, res);
    if (!user) return;

    const pharmacy = await PharmDatabase.findPharmacyById(Number(req.params.id));
    if (!pharmacy) {
      return res.status(404).json({ error: { message: 'Pharmacy not found', status: 404 } });
    }

    const ownerUserId = pharmacy.ownerUserId ?? pharmacy.owner_user_id;
    if (ownerUserId !== req.user.userId) {
      return res.status(403).json({ error: { message: 'Access denied', status: 403 } });
    }

    const verified = Boolean(pharmacy.verified);
    const verificationStatus = pharmacy.verificationStatus ?? pharmacy.verification_status ?? 'pending';

    return res.json({
      verified,
      verificationStatus,
      message: verified
        ? 'Your pharmacy is verified and can receive orders.'
        : verificationStatus === 'rejected'
          ? 'Your pharmacy verification was rejected. Please contact support.'
          : 'Your pharmacy registration is pending verification. You will be notified once verified.',
    });
  } catch (error) {
    console.error('Error fetching verification status:', error);
    return res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

pharmApp.get('/api/pharmacies/me/inventory', authenticateToken, async (req, res) => {
  try {
    const pharmacy = await ensureOwnedPharmacy(req, res);
    if (!pharmacy) return;

    const inventory = await PharmDatabase.getInventoryByPharmacyId(Number(pharmacy.id));
    return res.json({ data: inventory.map(mapInventoryItem) });
  } catch (error) {
    console.error('Error fetching owned pharmacy inventory:', error);
    return res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

pharmApp.patch('/api/pharmacies/me/inventory/:medicineId', authenticateToken, async (req, res) => {
  try {
    const pharmacy = await ensureOwnedPharmacy(req, res);
    if (!pharmacy) return;

    const medicineId = Number(req.params.medicineId);
    const updates = {};

    if (req.body.price !== undefined) {
      updates.price = Number(req.body.price);
    }

    if (req.body.stockStatus !== undefined) {
      updates.stockStatus = req.body.stockStatus;
    }

    if (req.body.quantity !== undefined) {
      updates.quantity = Number(req.body.quantity);
    }

    const updatedItem = await PharmDatabase.updateInventoryItem(Number(pharmacy.id), medicineId, updates);
    if (!updatedItem) {
      return res.status(404).json({ error: { message: 'Inventory item not found', status: 404 } });
    }

    const inventory = await PharmDatabase.getInventoryByPharmacyId(Number(pharmacy.id));
    const fullItem = inventory.find(
      (item) => Number(item.medicineId ?? item.medicine_id ?? item.id) === medicineId
    );

    return res.json(mapInventoryItem(fullItem ?? updatedItem));
  } catch (error) {
    console.error('Error updating owned pharmacy inventory:', error);
    return res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

pharmApp.post('/api/pharmacies/me/inventory', authenticateToken, async (req, res) => {
  try {
    const pharmacy = await ensureOwnedPharmacy(req, res);
    if (!pharmacy) return;

    const medicineId = Number(req.body.medicineId);
    const price = Number(req.body.price);
    const quantity = Number(req.body.quantity);

    if (!Number.isFinite(medicineId) || !Number.isFinite(price) || !Number.isFinite(quantity)) {
      return res.status(400).json({ error: { message: 'medicineId, price, and quantity are required', status: 400 } });
    }

    const medicine = await PharmDatabase.findMedicineById(medicineId);
    if (!medicine) {
      return res.status(404).json({ error: { message: 'Medicine not found', status: 404 } });
    }

    const existingInventory = await PharmDatabase.getInventoryByPharmacyId(Number(pharmacy.id));
    const exists = existingInventory.some(
      (item) => Number(item.medicineId ?? item.medicine_id ?? item.id) === medicineId
    );

    if (exists) {
      return res.status(409).json({ error: { message: 'Medicine already exists in pharmacy inventory', status: 409 } });
    }

    await PharmDatabase.createInventoryItem({
      pharmacyId: Number(pharmacy.id),
      medicineId,
      price,
      quantity,
      stockStatus: deriveStockStatus(quantity),
    });

    const refreshedInventory = await PharmDatabase.getInventoryByPharmacyId(Number(pharmacy.id));
    const createdItem = refreshedInventory.find(
      (item) => Number(item.medicineId ?? item.medicine_id ?? item.id) === medicineId
    );

    return res.status(201).json(mapInventoryItem(createdItem));
  } catch (error) {
    console.error('Error creating owned pharmacy inventory item:', error);
    return res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

pharmApp.get('/api/pharmacies/:id/medicines', async (req, res) => {
  try {
    const pharmacy = await PharmDatabase.findPharmacyById(Number(req.params.id));
    if (!pharmacy) {
      return res.status(404).json({ error: { message: 'Pharmacy not found', status: 404 } });
    }

    const medicines = await PharmDatabase.getMedicinesByPharmacy(Number(req.params.id));
    return res.json({
      pharmacyId: Number(req.params.id),
      pharmacyName: pharmacy.name,
      medicines: medicines.map(mapPharmacyMedicine),
    });
  } catch (error) {
    console.error('Error fetching pharmacy medicines:', error);
    return res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

pharmApp.listen(PHARM_PORT, () => {
  console.log(`Pharmacies service running on http://localhost:${PHARM_PORT}`);
});
