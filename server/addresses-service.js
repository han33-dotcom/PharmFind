import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { authenticateToken } from './lib/auth.js';
import { loadDatabase } from './lib/database.js';
import { getEnv, loadServiceEnvironment } from './lib/env.js';

loadServiceEnvironment();

const AddressesDatabase = await loadDatabase('addresses-service');
const addressesApp = express();
const ADDR_PORT = Number(getEnv('PORT', '4004'));

addressesApp.use(cors());
addressesApp.use(express.json());

const mapAddress = (address) => ({
  id: address.id,
  nickname: address.nickname,
  fullName: address.fullName ?? address.full_name ?? '',
  address: address.address,
  building: address.building ?? '',
  floor: address.floor ?? '',
  phoneNumber: address.phoneNumber ?? address.phone_number ?? '',
  additionalDetails: address.additionalDetails ?? address.additional_details ?? '',
});

const compactObject = (value) =>
  Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined));

addressesApp.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'addresses', timestamp: new Date().toISOString() });
});

addressesApp.get('/api/users/me/addresses', authenticateToken, async (req, res) => {
  try {
    const addresses = await AddressesDatabase.getUserAddresses(req.user.userId);
    return res.json({ data: addresses.map(mapAddress) });
  } catch (error) {
    console.error('Error fetching addresses:', error);
    return res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

addressesApp.get('/api/users/me/addresses/:id', authenticateToken, async (req, res) => {
  try {
    const address = await AddressesDatabase.findAddressById(req.params.id);
    const ownerUserId = address?.userId ?? address?.user_id;

    if (!address || ownerUserId !== req.user.userId) {
      return res.status(404).json({ error: { message: 'Address not found', status: 404 } });
    }

    return res.json(mapAddress(address));
  } catch (error) {
    console.error('Error fetching address:', error);
    return res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

addressesApp.post('/api/users/me/addresses', authenticateToken, async (req, res) => {
  try {
    const { nickname, fullName, address, building, floor, phoneNumber, additionalDetails } = req.body;

    if (!nickname || !fullName || !address || !phoneNumber) {
      return res.status(400).json({
        error: { message: 'Nickname, full name, address, and phone number are required', status: 400 },
      });
    }

    const createdAddress = await AddressesDatabase.createAddress({
      id: uuidv4(),
      userId: req.user.userId,
      nickname,
      fullName: fullName.trim(),
      address: address.trim(),
      building: building?.trim() || '',
      floor: floor?.trim() || '',
      phoneNumber: phoneNumber.trim(),
      additionalDetails: additionalDetails?.trim() || '',
    });

    return res.status(201).json(mapAddress(createdAddress));
  } catch (error) {
    console.error('Error creating address:', error);
    return res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

addressesApp.put('/api/users/me/addresses/:id', authenticateToken, async (req, res) => {
  try {
    const existingAddress = await AddressesDatabase.findAddressById(req.params.id);
    const ownerUserId = existingAddress?.userId ?? existingAddress?.user_id;

    if (!existingAddress || ownerUserId !== req.user.userId) {
      return res.status(404).json({ error: { message: 'Address not found', status: 404 } });
    }

    const updatedAddress = await AddressesDatabase.updateAddress(req.params.id, compactObject({
      nickname: req.body.nickname,
      fullName: req.body.fullName?.trim(),
      address: req.body.address?.trim(),
      building: req.body.building?.trim(),
      floor: req.body.floor?.trim(),
      phoneNumber: req.body.phoneNumber?.trim(),
      additionalDetails: req.body.additionalDetails?.trim(),
    }));

    return res.json(mapAddress(updatedAddress));
  } catch (error) {
    console.error('Error updating address:', error);
    return res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

addressesApp.delete('/api/users/me/addresses/:id', authenticateToken, async (req, res) => {
  try {
    const existingAddress = await AddressesDatabase.findAddressById(req.params.id);
    const ownerUserId = existingAddress?.userId ?? existingAddress?.user_id;

    if (!existingAddress || ownerUserId !== req.user.userId) {
      return res.status(404).json({ error: { message: 'Address not found', status: 404 } });
    }

    await AddressesDatabase.deleteAddress(req.params.id);
    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting address:', error);
    return res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

addressesApp.listen(ADDR_PORT, () => {
  console.log(`Addresses service running on http://localhost:${ADDR_PORT}`);
});
