import express from 'express';
import cors from 'cors';
import { authenticateToken } from './lib/auth.js';
import { loadDatabase } from './lib/database.js';
import { getEnv, loadServiceEnvironment } from './lib/env.js';

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
    pharmacy.hours ??
    (formatTimeValue(pharmacy.hoursOpen ?? pharmacy.hours_open) || formatTimeValue(pharmacy.hoursClose ?? pharmacy.hours_close)
      ? {
          open: formatTimeValue(pharmacy.hoursOpen ?? pharmacy.hours_open) ?? '',
          close: formatTimeValue(pharmacy.hoursClose ?? pharmacy.hours_close) ?? '',
        }
      : undefined),
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

pharmApp.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'pharmacies', timestamp: new Date().toISOString() });
});

pharmApp.post('/api/pharmacies/register', authenticateToken, async (req, res) => {
  try {
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
    const pharmacy = await PharmDatabase.findPharmacyByOwnerId(req.user.userId);
    if (!pharmacy) {
      return res.status(404).json({ error: { message: 'No pharmacy found for this user', status: 404 } });
    }

    return res.json(mapPharmacy(pharmacy));
  } catch (error) {
    console.error('Error fetching owned pharmacy:', error);
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
