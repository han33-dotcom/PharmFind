import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import fs from 'node:fs/promises';
import { constants as fsConstants } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverDir = path.resolve(__dirname, '..');
const dataDir = path.join(serverDir, 'data');
const dataFiles = [
  'users.json',
  'medicines.json',
  'pharmacies.json',
  'pharmacy_inventory.json',
  'orders.json',
  'addresses.json',
  'favorites.json',
  'email_verifications.json',
  'password_resets.json',
  'prescriptions.json',
];

const baseUrls = {
  auth: 'http://localhost:4000/api',
  medicines: 'http://localhost:4001/api',
  pharmacies: 'http://localhost:4002/api',
  orders: 'http://localhost:4003/api',
  addresses: 'http://localhost:4004/api',
  favorites: 'http://localhost:4005/api',
  prescriptions: 'http://localhost:4006/api',
};

const healthUrls = Object.values(baseUrls).map((baseUrl) => `${baseUrl}/health`);
const backups = new Map();
const capturedServiceLogs = [];
let microservicesProcess = null;
let microservicesExit = null;
let microservicesExitPromise = null;

const randomId = () =>
  `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;

const getJsonFilePath = (fileName) => path.join(dataDir, fileName);

const fileExists = async (filePath) => {
  try {
    await fs.access(filePath, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
};

const readJsonFile = async (fileName) =>
  JSON.parse(await fs.readFile(getJsonFilePath(fileName), 'utf8'));

const writeJsonFile = async (fileName, value) =>
  fs.writeFile(getJsonFilePath(fileName), JSON.stringify(value, null, 2));

const appendServiceLog = (source, chunk) => {
  const message = chunk.toString().trim();
  if (!message) return;

  capturedServiceLogs.push(`[${source}] ${message}`);

  if (capturedServiceLogs.length > 200) {
    capturedServiceLogs.splice(0, capturedServiceLogs.length - 200);
  }
};

const getCapturedServiceLogs = () =>
  capturedServiceLogs.length > 0
    ? `\nCaptured microservice output:\n${capturedServiceLogs.join('\n')}`
    : '';

const stopServices = async () => {
  if (!microservicesProcess) return;

  if (!microservicesExit) {
    microservicesProcess.kill('SIGTERM');
  }

  await microservicesExitPromise;
  microservicesProcess = null;
  microservicesExit = null;
  microservicesExitPromise = null;
};

const waitForHealth = async () => {
  const timeoutAt = Date.now() + 20_000;

  while (Date.now() < timeoutAt) {
    if (microservicesExit) {
      const exitReason = microservicesExit.signal
        ? `signal ${microservicesExit.signal}`
        : `code ${microservicesExit.code}`;

      throw new Error(
        `Microservices exited before becoming healthy (${exitReason}).${getCapturedServiceLogs()}`
      );
    }

    try {
      const responses = await Promise.all(
        healthUrls.map((url) => fetch(url).then((response) => response.ok)),
      );

      if (responses.every(Boolean)) {
        return;
      }
    } catch {
      // Services are still starting.
    }

    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  throw new Error(`Timed out waiting for microservices to become healthy.${getCapturedServiceLogs()}`);
};

const api = async (method, url, { body, token, expectedStatus = 200 } = {}) => {
  const headers = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  assert.equal(
    response.status,
    expectedStatus,
    `${method} ${url} returned ${response.status} instead of ${expectedStatus}`,
  );

  if (response.status === 204) {
    return null;
  }

  return response.json();
};

before(async () => {
  capturedServiceLogs.length = 0;
  microservicesExit = null;

  await fs.mkdir(dataDir, { recursive: true });

  for (const fileName of dataFiles) {
    const filePath = getJsonFilePath(fileName);
    const existingContents = (await fileExists(filePath)) ? await fs.readFile(filePath, 'utf8') : null;
    backups.set(fileName, existingContents);
    await writeJsonFile(fileName, []);
  }

  microservicesProcess = spawn(process.execPath, ['bin/microservices.js'], {
    cwd: serverDir,
    env: {
      ...process.env,
      JWT_SECRET: 'integration-test-secret',
      EMAIL_MODE: 'console',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  microservicesProcess.stdout?.on('data', (chunk) => appendServiceLog('stdout', chunk));
  microservicesProcess.stderr?.on('data', (chunk) => appendServiceLog('stderr', chunk));
  microservicesExitPromise = once(microservicesProcess, 'exit').then(([code, signal]) => {
    microservicesExit = { code, signal };
    return microservicesExit;
  });

  await waitForHealth();
});

after(async () => {
  await stopServices();

  for (const [fileName, contents] of backups.entries()) {
    const filePath = getJsonFilePath(fileName);

    if (contents === null) {
      await fs.rm(filePath, { force: true });
      continue;
    }

    await fs.writeFile(filePath, contents);
  }
});

test('auth recovery and patient account settings flow works end to end', async () => {
  const suffix = randomId();
  const email = `patient.${suffix}@example.com`;
  const initialPassword = 'StrongPass123!';
  const resetPassword = 'ResetPass456!';
  const finalPassword = 'FinalPass789!';

  const registerResponse = await api('POST', `${baseUrls.auth}/auth/register`, {
    body: {
      email,
      password: initialPassword,
      fullName: 'Patient Integration',
      phone: '+96170001111',
      role: 'patient',
    },
    expectedStatus: 201,
  });

  await api('POST', `${baseUrls.auth}/auth/forgot-password`, {
    body: { email },
  });

  const passwordResets = await readJsonFile('password_resets.json');
  const resetRecord = passwordResets.find((record) => record.userId === registerResponse.user.id);
  assert.ok(resetRecord, 'Expected a password reset token to be created');

  await api('POST', `${baseUrls.auth}/auth/reset-password`, {
    body: {
      token: resetRecord.token,
      password: resetPassword,
    },
  });

  const reloginAfterReset = await api('POST', `${baseUrls.auth}/auth/login`, {
    body: {
      email,
      password: resetPassword,
    },
  });

  const updatedAccount = await api('PATCH', `${baseUrls.auth}/auth/me`, {
    token: reloginAfterReset.token,
    body: {
      fullName: 'Updated Patient Integration',
      phone: '+96170002222',
      currentPassword: resetPassword,
      newPassword: finalPassword,
    },
  });

  assert.equal(updatedAccount.user.fullName, 'Updated Patient Integration');
  assert.equal(updatedAccount.user.phone, '+96170002222');

  const finalLogin = await api('POST', `${baseUrls.auth}/auth/login`, {
    body: {
      email,
      password: finalPassword,
    },
  });

  const me = await api('GET', `${baseUrls.auth}/auth/me`, {
    token: finalLogin.token,
  });

  assert.equal(me.fullName, 'Updated Patient Integration');
  assert.equal(me.phone, '+96170002222');

  await api('DELETE', `${baseUrls.auth}/auth/me`, {
    token: finalLogin.token,
    expectedStatus: 204,
  });

  const users = await readJsonFile('users.json');
  assert.equal(
    users.some((user) => user.email === email),
    false,
    'Expected the deleted patient account to be removed from the JSON database',
  );
});

test('pharmacist inventory management supports add, edit, filter-safe delete lifecycle', async () => {
  const suffix = randomId();

  const pharmacist = await api('POST', `${baseUrls.auth}/auth/register`, {
    body: {
      email: `inventory.pharmacist.${suffix}@example.com`,
      password: 'StrongPass123!',
      fullName: 'Inventory Pharmacist',
      phone: '+96172002222',
      role: 'pharmacist',
    },
    expectedStatus: 201,
  });

  await api('POST', `${baseUrls.pharmacies}/pharmacies/register`, {
    token: pharmacist.token,
    body: {
      name: `Inventory Pharmacy ${suffix}`,
      address: 'Inventory Street, Beirut',
      phone: '+96118880000',
      hours: { open: '08:00', close: '22:00' },
    },
    expectedStatus: 201,
  });

  const createdItem = await api('POST', `${baseUrls.pharmacies}/pharmacies/me/inventory`, {
    token: pharmacist.token,
    body: {
      medicineId: 1,
      price: 30,
      quantity: 14,
    },
    expectedStatus: 201,
  });

  assert.equal(createdItem.medicineId, 1);
  assert.equal(createdItem.stockStatus, 'In Stock');

  const updatedItem = await api('PATCH', `${baseUrls.pharmacies}/pharmacies/me/inventory/1`, {
    token: pharmacist.token,
    body: {
      price: 35,
      quantity: 4,
    },
  });

  assert.equal(updatedItem.price, 35);
  assert.equal(updatedItem.stockLevel, 4);
  assert.equal(updatedItem.stockStatus, 'Low Stock');

  const secondItem = await api('POST', `${baseUrls.pharmacies}/pharmacies/me/inventory`, {
    token: pharmacist.token,
    body: {
      medicineId: 3,
      price: 42,
      quantity: 2,
    },
    expectedStatus: 201,
  });

  assert.equal(secondItem.medicineId, 3);

  await api('DELETE', `${baseUrls.pharmacies}/pharmacies/me/inventory/3`, {
    token: pharmacist.token,
    expectedStatus: 204,
  });

  const inventory = await api('GET', `${baseUrls.pharmacies}/pharmacies/me/inventory`, {
    token: pharmacist.token,
  });

  assert.equal(inventory.data.length, 1);
  assert.equal(inventory.data[0].medicineId, 1);
  assert.equal(inventory.data[0].price, 35);
  assert.equal(inventory.data[0].stockStatus, 'Low Stock');
});

test('prescription order lifecycle works across patient, pharmacist, and driver services', async () => {
  const suffix = randomId();

  const patient = await api('POST', `${baseUrls.auth}/auth/register`, {
    body: {
      email: `order.patient.${suffix}@example.com`,
      password: 'StrongPass123!',
      fullName: 'Order Patient',
      phone: '+96171001111',
      role: 'patient',
    },
    expectedStatus: 201,
  });

  const pharmacist = await api('POST', `${baseUrls.auth}/auth/register`, {
    body: {
      email: `order.pharmacist.${suffix}@example.com`,
      password: 'StrongPass123!',
      fullName: 'Order Pharmacist',
      phone: '+96172001111',
      role: 'pharmacist',
    },
    expectedStatus: 201,
  });

  const driver = await api('POST', `${baseUrls.auth}/auth/register`, {
    body: {
      email: `order.driver.${suffix}@example.com`,
      password: 'StrongPass123!',
      fullName: 'Order Driver',
      phone: '+96173001111',
      role: 'driver',
    },
    expectedStatus: 201,
  });

  const pharmacy = await api('POST', `${baseUrls.pharmacies}/pharmacies/register`, {
    token: pharmacist.token,
    body: {
      name: `Integration Pharmacy ${suffix}`,
      address: 'Integration Street, Beirut',
      phone: '+96115550000',
      hours: { open: '08:00', close: '22:00' },
    },
    expectedStatus: 201,
  });

  const updatedPharmacy = await api('PATCH', `${baseUrls.pharmacies}/pharmacies/me`, {
    token: pharmacist.token,
    body: {
      address: 'Updated Integration Street, Beirut',
      phone: '+96115559999',
      hours: { open: '09:00', close: '21:00' },
    },
  });

  assert.equal(updatedPharmacy.address, 'Updated Integration Street, Beirut');
  assert.equal(updatedPharmacy.phone, '+96115559999');
  assert.deepEqual(updatedPharmacy.hours, { open: '09:00', close: '21:00' });

  const inventoryItem = await api('POST', `${baseUrls.pharmacies}/pharmacies/me/inventory`, {
    token: pharmacist.token,
    body: {
      medicineId: 2,
      price: 95,
      quantity: 12,
    },
    expectedStatus: 201,
  });

  assert.equal(inventoryItem.medicineId, 2);
  assert.equal(inventoryItem.stockStatus, 'In Stock');

  await api('POST', `${baseUrls.addresses}/users/me/addresses`, {
    token: patient.token,
    body: {
      nickname: 'Home',
      fullName: 'Order Patient',
      address: '123 Integration Street',
      building: 'Block A',
      floor: '4',
      phoneNumber: '+96171001111',
      additionalDetails: 'Ring the bell',
    },
    expectedStatus: 201,
  });

  await api('POST', `${baseUrls.favorites}/users/me/favorites`, {
    token: patient.token,
    body: {
      medicineId: 2,
      medicineName: 'Augmentin 1g',
      category: 'Antibiotics',
      lastPharmacyId: pharmacy.id,
      lastPharmacyName: pharmacy.name,
      lastPrice: 95,
    },
    expectedStatus: 201,
  });

  const uploadedPrescription = await api('POST', `${baseUrls.prescriptions}/prescriptions/upload`, {
    token: patient.token,
    body: {
      fileUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a9xkAAAAASUVORK5CYII=',
      fileName: 'integration-prescription.png',
      fileType: 'image/png',
      fileSize: 68,
    },
    expectedStatus: 201,
  });

  const orderId = `ORD-TEST-${suffix}`;
  const createdOrder = await api('POST', `${baseUrls.orders}/orders`, {
    token: patient.token,
    body: {
      orderId,
      items: [
        {
          medicineId: 2,
          medicineName: 'Augmentin 1g',
          pharmacyId: pharmacy.id,
          pharmacyName: pharmacy.name,
          quantity: 1,
          price: 95,
          type: 'delivery',
          requiresPrescription: true,
        },
      ],
      subtotal: 95,
      deliveryFees: 1,
      total: 96,
      deliveryAddress: '123 Integration Street, Block A, 4',
      phoneNumber: '+96171001111',
      paymentMethod: 'cash_delivery',
      prescriptionId: uploadedPrescription.id,
    },
    expectedStatus: 201,
  });

  assert.equal(createdOrder.orderId, orderId);

  const attachedPrescription = await api('PATCH', `${baseUrls.prescriptions}/prescriptions/${uploadedPrescription.id}`, {
    token: patient.token,
    body: { orderId },
  });

  assert.equal(attachedPrescription.orderId, orderId);

  const pharmacistOrder = await api('GET', `${baseUrls.orders}/orders/pharmacist/${orderId}`, {
    token: pharmacist.token,
  });
  assert.equal(pharmacistOrder.items[0].requiresPrescription, true);

  const pharmacistPrescriptionList = await api('GET', `${baseUrls.prescriptions}/prescriptions/by-order/${orderId}`, {
    token: pharmacist.token,
  });
  assert.equal(pharmacistPrescriptionList.data.length, 1);
  assert.equal(pharmacistPrescriptionList.data[0].id, uploadedPrescription.id);

  const confirmedOrder = await api('PATCH', `${baseUrls.orders}/orders/pharmacist/${orderId}/status`, {
    token: pharmacist.token,
    body: {
      status: 'Confirmed',
      note: 'Order accepted by pharmacy',
    },
  });
  assert.equal(confirmedOrder.status, 'Confirmed');

  const availableDriverOrders = await api('GET', `${baseUrls.orders}/orders/driver/available`, {
    token: driver.token,
  });
  assert.equal(
    availableDriverOrders.data.some((order) => order.orderId === orderId),
    true,
    'Expected the confirmed order to appear in the driver available orders list',
  );

  const acceptedDelivery = await api('POST', `${baseUrls.orders}/orders/driver/${orderId}/accept`, {
    token: driver.token,
  });
  assert.equal(acceptedDelivery.status, 'assigned');

  const pickedUpDelivery = await api('POST', `${baseUrls.orders}/orders/driver/${orderId}/pickup`, {
    token: driver.token,
  });
  assert.equal(pickedUpDelivery.status, 'picked_up');

  const inTransitDelivery = await api('POST', `${baseUrls.orders}/orders/driver/${orderId}/in-transit`, {
    token: driver.token,
  });
  assert.equal(inTransitDelivery.status, 'in_transit');

  const deliveredDelivery = await api('POST', `${baseUrls.orders}/orders/driver/${orderId}/delivered`, {
    token: driver.token,
  });
  assert.equal(deliveredDelivery.status, 'delivered');

  const patientFinalOrder = await api('GET', `${baseUrls.orders}/orders/${orderId}`, {
    token: patient.token,
  });
  assert.equal(patientFinalOrder.status, 'Delivered');
  assert.equal(patientFinalOrder.items[0].requiresPrescription, true);
});
