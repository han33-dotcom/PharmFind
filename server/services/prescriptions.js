import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { authenticateToken } from '../lib/auth.js';
import { loadDatabase } from '../lib/database.js';
import { getEnv, loadServiceEnvironment } from '../lib/env.js';

loadServiceEnvironment();

const PrescriptionsDatabase = await loadDatabase('prescriptions-service');
const prescriptionsApp = express();
const PRESCRIPTIONS_PORT = Number(getEnv('PORT', '4006'));

prescriptionsApp.use(cors());
prescriptionsApp.use(express.json({ limit: '15mb' }));

const mapPrescription = (prescription) => ({
  id: prescription.id,
  orderId: prescription.orderId ?? prescription.order_id ?? undefined,
  fileUrl: prescription.fileUrl ?? prescription.file_url,
  fileName: prescription.fileName ?? prescription.file_name,
  fileType: prescription.fileType ?? prescription.file_type,
  fileSize: Number(prescription.fileSize ?? prescription.file_size ?? 0),
  uploadedAt: prescription.uploadedAt ?? prescription.uploaded_at ?? new Date().toISOString(),
  status: prescription.status ?? 'pending',
  reviewedBy: prescription.reviewedBy ?? prescription.reviewed_by ?? undefined,
  reviewedAt: prescription.reviewedAt ?? prescription.reviewed_at ?? undefined,
  rejectionReason: prescription.rejectionReason ?? prescription.rejection_reason ?? undefined,
});

const getAuthenticatedUser = async (userId) => PrescriptionsDatabase.findUserById(userId);

const userOwnsPrescription = (prescription, userId) =>
  (prescription.userId ?? prescription.user_id) === userId;

const pharmacistCanAccessPrescription = async (userId, prescription) => {
  const user = await getAuthenticatedUser(userId);
  if (!user || user.role !== 'pharmacist') {
    return false;
  }

  const orderId = prescription.orderId ?? prescription.order_id;
  if (!orderId) {
    return false;
  }

  const pharmacy = await PrescriptionsDatabase.findPharmacyByOwnerId(userId);
  if (!pharmacy) {
    return false;
  }

  const order = await PrescriptionsDatabase.findOrderById(orderId);
  if (!order) {
    return false;
  }

  return (order.items ?? []).some(
    (item) => Number(item.pharmacyId ?? item.pharmacy_id) === Number(pharmacy.id),
  );
};

const canAccessPrescription = async (userId, prescription) => {
  if (userOwnsPrescription(prescription, userId)) {
    return true;
  }

  return pharmacistCanAccessPrescription(userId, prescription);
};

prescriptionsApp.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'prescriptions', timestamp: new Date().toISOString() });
});

prescriptionsApp.post('/api/prescriptions/upload', authenticateToken, async (req, res) => {
  try {
    const { fileUrl, fileName, fileType, fileSize } = req.body;

    if (!fileUrl || !fileName || !fileType || !fileSize) {
      return res.status(400).json({
        error: { message: 'fileUrl, fileName, fileType, and fileSize are required', status: 400 },
      });
    }

    const prescription = await PrescriptionsDatabase.createPrescription({
      id: uuidv4(),
      userId: req.user.userId,
      fileUrl,
      fileName,
      fileType,
      fileSize,
      status: 'pending',
      uploadedAt: new Date().toISOString(),
    });

    return res.status(201).json(mapPrescription(prescription));
  } catch (error) {
    console.error('Error uploading prescription:', error);
    return res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

prescriptionsApp.get('/api/prescriptions/:id', authenticateToken, async (req, res) => {
  try {
    const prescription = await PrescriptionsDatabase.findPrescriptionById(req.params.id);
    if (!prescription || !(await canAccessPrescription(req.user.userId, prescription))) {
      return res.status(404).json({ error: { message: 'Prescription not found', status: 404 } });
    }

    return res.json(mapPrescription(prescription));
  } catch (error) {
    console.error('Error fetching prescription:', error);
    return res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

prescriptionsApp.get('/api/prescriptions/by-order/:orderId', authenticateToken, async (req, res) => {
  try {
    const prescriptions = await PrescriptionsDatabase.getPrescriptionsByOrderId(req.params.orderId);
    const accessResults = await Promise.all(
      prescriptions.map(async (prescription) => ({
        prescription,
        allowed: await canAccessPrescription(req.user.userId, prescription),
      })),
    );
    const filtered = accessResults.filter((entry) => entry.allowed).map((entry) => entry.prescription);
    return res.json({ data: filtered.map(mapPrescription) });
  } catch (error) {
    console.error('Error fetching order prescriptions:', error);
    return res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

prescriptionsApp.patch('/api/prescriptions/:id', authenticateToken, async (req, res) => {
  try {
    const prescription = await PrescriptionsDatabase.findPrescriptionById(req.params.id);
    if (!prescription || !userOwnsPrescription(prescription, req.user.userId)) {
      return res.status(404).json({ error: { message: 'Prescription not found', status: 404 } });
    }

    const updates = {};
    if (req.body.orderId !== undefined) {
      updates.orderId = req.body.orderId || null;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: { message: 'No valid updates provided', status: 400 } });
    }

    const updatedPrescription = await PrescriptionsDatabase.updatePrescription(req.params.id, updates);
    return res.json(mapPrescription(updatedPrescription));
  } catch (error) {
    console.error('Error updating prescription:', error);
    return res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

prescriptionsApp.delete('/api/prescriptions/:id', authenticateToken, async (req, res) => {
  try {
    const prescription = await PrescriptionsDatabase.findPrescriptionById(req.params.id);
    if (!prescription || (prescription.userId ?? prescription.user_id) !== req.user.userId) {
      return res.status(404).json({ error: { message: 'Prescription not found', status: 404 } });
    }

    await PrescriptionsDatabase.deletePrescription(req.params.id);
    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting prescription:', error);
    return res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

prescriptionsApp.listen(PRESCRIPTIONS_PORT, () => {
  console.log(`Prescriptions service running on http://localhost:${PRESCRIPTIONS_PORT}`);
});
