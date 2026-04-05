import express from 'express';
import cors from 'cors';
import { authenticateToken } from './lib/auth.js';
import { loadDatabase } from './lib/database.js';
import { getEnv, loadServiceEnvironment } from './lib/env.js';

loadServiceEnvironment();

const OrdersDatabase = await loadDatabase('orders-service');
const ordersApp = express();
const ORDERS_PORT = Number(getEnv('PORT', '4003'));
const DRIVER_COORDINATE_FALLBACK = { lat: 33.8938, lng: 35.5018 };

ordersApp.use(cors());
ordersApp.use(express.json());

const mapOrderItem = (item) => ({
  medicineId: Number(item.medicineId ?? item.medicine_id),
  medicineName: item.medicineName ?? item.medicine_name ?? '',
  pharmacyId: Number(item.pharmacyId ?? item.pharmacy_id),
  pharmacyName: item.pharmacyName ?? item.pharmacy_name ?? '',
  quantity: Number(item.quantity ?? 0),
  price: Number(item.price ?? 0),
  type: item.type,
});

const mapStatusHistoryEntry = (entry) => ({
  status: entry.status,
  timestamp: entry.timestamp,
  note: entry.note ?? undefined,
});

const mapOrder = (order) => ({
  orderId: order.orderId ?? order.id,
  orderNumber: order.orderNumber ?? order.order_number ?? order.orderId ?? order.id,
  createdAt: order.createdAt ?? order.created_at ?? new Date().toISOString(),
  status: order.status,
  items: (order.items ?? []).map(mapOrderItem),
  subtotal: Number(order.subtotal ?? 0),
  deliveryFees: Number(order.deliveryFees ?? order.delivery_fees ?? 0),
  total: Number(order.total ?? 0),
  deliveryAddress: order.deliveryAddress ?? order.delivery_address ?? undefined,
  phoneNumber: order.phoneNumber ?? order.phone_number ?? undefined,
  paymentMethod: order.paymentMethod ?? order.payment_method ?? '',
  statusHistory: (order.statusHistory ?? []).map(mapStatusHistoryEntry),
  prescriptionId: order.prescriptionId ?? order.prescription_id ?? undefined,
  driverId: order.driverId ?? order.driver_id ?? undefined,
  driverName: order.driverName ?? order.driver_name ?? undefined,
  assignedAt: order.assignedAt ?? order.assigned_at ?? undefined,
  pickedUpAt: order.pickedUpAt ?? order.picked_up_at ?? undefined,
  deliveredAt: order.deliveredAt ?? order.delivered_at ?? undefined,
  patientName: order.patientName ?? order.patient_name ?? undefined,
  patientPhone: order.patientPhone ?? order.patient_phone ?? undefined,
  pharmacyName: order.pharmacyName ?? order.pharmacy_name ?? undefined,
  pharmacyAddress: order.pharmacyAddress ?? order.pharmacy_address ?? undefined,
  pharmacyLatitude: order.pharmacyLatitude ?? order.pharmacy_latitude ?? undefined,
  pharmacyLongitude: order.pharmacyLongitude ?? order.pharmacy_longitude ?? undefined,
  estimatedDeliveryTime: order.estimatedDeliveryTime ?? order.estimated_delivery_time ?? undefined,
});

const getOrderOwnerId = (order) => order.userId ?? order.user_id;
const getOrderDriverId = (order) => order.driverId ?? order.driver_id;

const ensureRole = async (req, res, role) => {
  const user = await OrdersDatabase.findUserById(req.user.userId);
  if (!user) {
    res.status(404).json({ error: { message: 'User not found', status: 404 } });
    return null;
  }

  if (user.role !== role) {
    res.status(403).json({ error: { message: `Only ${role} accounts can access this endpoint`, status: 403 } });
    return null;
  }

  return user;
};

const getOwnedPharmacy = async (req, res) => {
  const pharmacist = await ensureRole(req, res, 'pharmacist');
  if (!pharmacist) return null;

  const pharmacy = await OrdersDatabase.findPharmacyByOwnerId(req.user.userId);
  if (!pharmacy) {
    res.status(404).json({ error: { message: 'No pharmacy found for this user', status: 404 } });
    return null;
  }

  return pharmacy;
};

const deriveDriverStatus = (order) => {
  const mapped = mapOrder(order);
  if (mapped.status === 'Delivered' || mapped.deliveredAt) return 'delivered';
  if (mapped.status === 'Cancelled') return 'failed';
  if (mapped.status === 'Out for Delivery') return 'in_transit';
  if (mapped.pickedUpAt) return 'picked_up';
  if (mapped.assignedAt) return 'assigned';
  return 'available';
};

const mapDriverOrder = (order) => {
  const mapped = mapOrder(order);
  const deliveryItems = mapped.items.filter((item) => item.type === 'delivery');
  const firstItem = deliveryItems[0] ?? mapped.items[0];

  return {
    id: mapped.orderId,
    orderId: mapped.orderId,
    customerName: mapped.patientName ?? 'Unknown patient',
    customerPhone: mapped.patientPhone ?? mapped.phoneNumber ?? '',
    deliveryAddress: mapped.deliveryAddress ?? 'Address unavailable',
    addressCoordinates: DRIVER_COORDINATE_FALLBACK,
    pharmacyName: mapped.pharmacyName ?? firstItem?.pharmacyName ?? 'Pharmacy',
    pharmacyAddress: mapped.pharmacyAddress ?? 'Pharmacy address unavailable',
    pharmacyCoordinates: {
      lat: Number(mapped.pharmacyLatitude ?? DRIVER_COORDINATE_FALLBACK.lat),
      lng: Number(mapped.pharmacyLongitude ?? DRIVER_COORDINATE_FALLBACK.lng),
    },
    totalAmount: mapped.total,
    deliveryFee: mapped.deliveryFees,
    status: deriveDriverStatus(mapped),
    items: deliveryItems.map((item) => ({
      name: item.medicineName,
      quantity: item.quantity,
    })),
    assignedAt: mapped.assignedAt,
    pickedUpAt: mapped.pickedUpAt,
    deliveredAt: mapped.deliveredAt,
    estimatedDeliveryTime: mapped.estimatedDeliveryTime || '20-30 min',
  };
};

ordersApp.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'orders', timestamp: new Date().toISOString() });
});

ordersApp.get('/api/orders/pharmacist', authenticateToken, async (req, res) => {
  try {
    const pharmacy = await getOwnedPharmacy(req, res);
    if (!pharmacy) return;

    const pharmacyId = Number(pharmacy.id);
    const orders = await OrdersDatabase.getOrdersByPharmacyId(pharmacyId);
    return res.json({ data: orders.map(mapOrder) });
  } catch (error) {
    console.error('Error fetching pharmacist orders:', error);
    return res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

ordersApp.get('/api/orders/pharmacist/:orderId', authenticateToken, async (req, res) => {
  try {
    const pharmacy = await getOwnedPharmacy(req, res);
    if (!pharmacy) return;

    const order = await OrdersDatabase.findOrderById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ error: { message: 'Order not found', status: 404 } });
    }

    const pharmacyItems = (order.items ?? []).filter(
      (item) => Number(item.pharmacyId ?? item.pharmacy_id) === Number(pharmacy.id)
    );

    if (pharmacyItems.length === 0) {
      return res.status(404).json({ error: { message: 'Order not found', status: 404 } });
    }

    const patient = await OrdersDatabase.findUserById(getOrderOwnerId(order));
    return res.json(
      mapOrder({
        ...order,
        items: pharmacyItems,
        patientName: patient?.fullName,
        patientPhone: order.phoneNumber ?? order.phone_number ?? patient?.phone,
      })
    );
  } catch (error) {
    console.error('Error fetching pharmacist order:', error);
    return res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

ordersApp.patch('/api/orders/pharmacist/:orderId/status', authenticateToken, async (req, res) => {
  try {
    const pharmacy = await getOwnedPharmacy(req, res);
    if (!pharmacy) return;

    const { status, note } = req.body;
    if (!status) {
      return res.status(400).json({ error: { message: 'status is required', status: 400 } });
    }

    const order = await OrdersDatabase.findOrderById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ error: { message: 'Order not found', status: 404 } });
    }

    const belongsToPharmacy = (order.items ?? []).some(
      (item) => Number(item.pharmacyId ?? item.pharmacy_id) === Number(pharmacy.id)
    );

    if (!belongsToPharmacy) {
      return res.status(404).json({ error: { message: 'Order not found', status: 404 } });
    }

    const updatedOrder = await OrdersDatabase.updateOrderStatus(req.params.orderId, status, note);
    return res.json(mapOrder(updatedOrder));
  } catch (error) {
    console.error('Error updating pharmacist order status:', error);
    return res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

ordersApp.get('/api/orders/driver/available', authenticateToken, async (req, res) => {
  try {
    const driver = await ensureRole(req, res, 'driver');
    if (!driver) return;

    const orders = await OrdersDatabase.getAvailableDriverOrders();
    return res.json({ data: orders.map(mapDriverOrder) });
  } catch (error) {
    console.error('Error fetching available driver orders:', error);
    return res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

ordersApp.get('/api/orders/driver/active', authenticateToken, async (req, res) => {
  try {
    const driver = await ensureRole(req, res, 'driver');
    if (!driver) return;

    const orders = await OrdersDatabase.getDriverOrders(driver.id);
    const activeOrder = orders.find((order) => {
      const driverStatus = deriveDriverStatus(order);
      return ['assigned', 'picked_up', 'in_transit'].includes(driverStatus);
    });

    return res.json(activeOrder ? mapDriverOrder(activeOrder) : null);
  } catch (error) {
    console.error('Error fetching active driver order:', error);
    return res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

ordersApp.get('/api/orders/driver/history', authenticateToken, async (req, res) => {
  try {
    const driver = await ensureRole(req, res, 'driver');
    if (!driver) return;

    const orders = await OrdersDatabase.getDriverOrders(driver.id);
    const history = orders.filter((order) => ['delivered', 'failed'].includes(deriveDriverStatus(order)));
    return res.json({ data: history.map(mapDriverOrder) });
  } catch (error) {
    console.error('Error fetching driver history:', error);
    return res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

ordersApp.get('/api/orders/driver/stats', authenticateToken, async (req, res) => {
  try {
    const driver = await ensureRole(req, res, 'driver');
    if (!driver) return;

    const availableOrders = await OrdersDatabase.getAvailableDriverOrders();
    const driverOrders = await OrdersDatabase.getDriverOrders(driver.id);
    const activeOrder = driverOrders.find((order) => {
      const driverStatus = deriveDriverStatus(order);
      return ['assigned', 'picked_up', 'in_transit'].includes(driverStatus);
    });

    const today = new Date().toDateString();
    const deliveredToday = driverOrders.filter((order) => {
      const deliveredAt = order.deliveredAt ?? order.delivered_at;
      return deliveredAt && new Date(deliveredAt).toDateString() === today;
    });

    return res.json({
      todayDeliveries: deliveredToday.length,
      todayEarnings: deliveredToday.reduce(
        (sum, order) => sum + Number(order.deliveryFees ?? order.delivery_fees ?? 0),
        0
      ),
      activeDelivery: activeOrder ? mapDriverOrder(activeOrder) : null,
      availableOrders: availableOrders.length,
    });
  } catch (error) {
    console.error('Error fetching driver stats:', error);
    return res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

ordersApp.post('/api/orders/driver/:orderId/accept', authenticateToken, async (req, res) => {
  try {
    const driver = await ensureRole(req, res, 'driver');
    if (!driver) return;

    const existingAssignments = await OrdersDatabase.getDriverOrders(driver.id);
    const activeAssignment = existingAssignments.find((order) => {
      const driverStatus = deriveDriverStatus(order);
      return ['assigned', 'picked_up', 'in_transit'].includes(driverStatus);
    });

    if (activeAssignment) {
      return res.status(409).json({
        error: { message: 'Complete your current delivery before accepting a new one', status: 409 },
      });
    }

    const order = await OrdersDatabase.findOrderById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ error: { message: 'Order not found', status: 404 } });
    }

    if (getOrderDriverId(order)) {
      return res.status(409).json({ error: { message: 'Order is already assigned', status: 409 } });
    }

    const updatedOrder = await OrdersDatabase.assignDriver(req.params.orderId, driver);
    return res.json(mapDriverOrder(updatedOrder));
  } catch (error) {
    console.error('Error accepting driver order:', error);
    return res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

ordersApp.post('/api/orders/driver/:orderId/pickup', authenticateToken, async (req, res) => {
  try {
    const driver = await ensureRole(req, res, 'driver');
    if (!driver) return;

    const order = await OrdersDatabase.findOrderById(req.params.orderId);
    if (!order || getOrderDriverId(order) !== driver.id) {
      return res.status(404).json({ error: { message: 'Order not found', status: 404 } });
    }

    const updatedOrder = await OrdersDatabase.updateOrder(req.params.orderId, {
      pickedUpAt: new Date().toISOString(),
      status: 'Preparing',
    }, 'Order picked up from pharmacy');

    return res.json(mapDriverOrder(updatedOrder));
  } catch (error) {
    console.error('Error marking pickup:', error);
    return res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

ordersApp.post('/api/orders/driver/:orderId/in-transit', authenticateToken, async (req, res) => {
  try {
    const driver = await ensureRole(req, res, 'driver');
    if (!driver) return;

    const order = await OrdersDatabase.findOrderById(req.params.orderId);
    if (!order || getOrderDriverId(order) !== driver.id) {
      return res.status(404).json({ error: { message: 'Order not found', status: 404 } });
    }

    const updatedOrder = await OrdersDatabase.updateOrderStatus(
      req.params.orderId,
      'Out for Delivery',
      'Driver is on the way to the customer'
    );

    return res.json(mapDriverOrder(updatedOrder));
  } catch (error) {
    console.error('Error marking in transit:', error);
    return res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

ordersApp.post('/api/orders/driver/:orderId/delivered', authenticateToken, async (req, res) => {
  try {
    const driver = await ensureRole(req, res, 'driver');
    if (!driver) return;

    const order = await OrdersDatabase.findOrderById(req.params.orderId);
    if (!order || getOrderDriverId(order) !== driver.id) {
      return res.status(404).json({ error: { message: 'Order not found', status: 404 } });
    }

    const updatedOrder = await OrdersDatabase.updateOrder(req.params.orderId, {
      deliveredAt: new Date().toISOString(),
      status: 'Delivered',
    }, 'Order delivered successfully');

    return res.json(mapDriverOrder(updatedOrder));
  } catch (error) {
    console.error('Error completing delivery:', error);
    return res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

ordersApp.get('/api/orders', authenticateToken, async (req, res) => {
  try {
    const orders = await OrdersDatabase.getUserOrders(req.user.userId);
    return res.json({ data: orders.map(mapOrder) });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

ordersApp.get('/api/orders/:orderId', authenticateToken, async (req, res) => {
  try {
    const order = await OrdersDatabase.findOrderById(req.params.orderId);

    if (!order || getOrderOwnerId(order) !== req.user.userId) {
      return res.status(404).json({ error: { message: 'Order not found', status: 404 } });
    }

    return res.json(mapOrder(order));
  } catch (error) {
    console.error('Error fetching order:', error);
    return res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

ordersApp.post('/api/orders', authenticateToken, async (req, res) => {
  try {
    const { orderId, items, subtotal, deliveryFees, total, deliveryAddress, phoneNumber, paymentMethod, prescriptionId } = req.body;

    if (!orderId || !Array.isArray(items) || items.length === 0 || !paymentMethod || subtotal === undefined || total === undefined) {
      return res.status(400).json({
        error: { message: 'orderId, items, subtotal, total, and paymentMethod are required', status: 400 },
      });
    }

    const createdOrder = await OrdersDatabase.createOrder({
      orderId,
      userId: req.user.userId,
      items,
      subtotal,
      deliveryFees,
      total,
      deliveryAddress,
      phoneNumber,
      paymentMethod,
      prescriptionId,
      status: 'Pending',
      createdAt: new Date().toISOString(),
      statusHistory: [
        {
          status: 'Pending',
          timestamp: new Date().toISOString(),
          note: 'Order placed successfully',
        },
      ],
    });

    const fullOrder = await OrdersDatabase.findOrderById(createdOrder.orderId ?? createdOrder.id ?? orderId);
    return res.status(201).json(mapOrder(fullOrder ?? createdOrder));
  } catch (error) {
    console.error('Error creating order:', error);
    return res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

ordersApp.patch('/api/orders/:orderId/status', authenticateToken, async (req, res) => {
  try {
    if (!req.body.status) {
      return res.status(400).json({
        error: { message: 'status is required', status: 400 },
      });
    }

    const existingOrder = await OrdersDatabase.findOrderById(req.params.orderId);

    if (!existingOrder || getOrderOwnerId(existingOrder) !== req.user.userId) {
      return res.status(404).json({ error: { message: 'Order not found', status: 404 } });
    }

    const updatedOrder = await OrdersDatabase.updateOrderStatus(
      req.params.orderId,
      req.body.status,
      req.body.note
    );

    return res.json(mapOrder(updatedOrder));
  } catch (error) {
    console.error('Error updating order status:', error);
    return res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

ordersApp.listen(ORDERS_PORT, () => {
  console.log(`Orders service running on http://localhost:${ORDERS_PORT}`);
});
