import express from 'express';
import cors from 'cors';
import { authenticateToken } from './lib/auth.js';
import { loadDatabase } from './lib/database.js';
import { getEnv, loadServiceEnvironment } from './lib/env.js';

loadServiceEnvironment();

const OrdersDatabase = await loadDatabase('orders-service');
const ordersApp = express();
const ORDERS_PORT = Number(getEnv('PORT', '4003'));

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
});

const getOrderOwnerId = (order) => order.userId ?? order.user_id;

ordersApp.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'orders', timestamp: new Date().toISOString() });
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
