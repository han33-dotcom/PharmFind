/**
 * PostgreSQL Database Layer for PharmFind
 * Replaces the JSON file-based database with PostgreSQL
 */

import pkg from 'pg';
const { Pool } = pkg;

const mapUserRecord = (user) => {
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    passwordHash: user.password_hash,
    fullName: user.full_name,
    phone: user.phone,
    role: user.role || 'patient',
    createdAt: user.created_at,
    updatedAt: user.updated_at,
    emailVerified: user.email_verified,
  };
};

const mapVerificationRecord = (record) => {
  if (!record) return null;

  return {
    id: record.id,
    userId: record.user_id,
    token: record.token,
    createdAt: record.created_at,
    expiresAt: record.expires_at,
  };
};

const mapPasswordResetRecord = (record) => {
  if (!record) return null;

  return {
    id: record.id,
    userId: record.user_id,
    token: record.token,
    createdAt: record.created_at,
    expiresAt: record.expires_at,
  };
};

const mapPrescriptionRecord = (record) => {
  if (!record) return null;

  return {
    id: record.id,
    userId: record.user_id,
    orderId: record.order_id,
    fileUrl: record.file_url,
    fileName: record.file_name,
    fileType: record.file_type,
    fileSize: record.file_size,
    uploadedAt: record.uploaded_at,
    status: record.status,
    reviewedBy: record.reviewed_by,
    reviewedAt: record.reviewed_at,
    rejectionReason: record.rejection_reason,
  };
};

const USER_UPDATE_FIELDS = {
  email: 'email',
  passwordHash: 'password_hash',
  fullName: 'full_name',
  phone: 'phone',
  role: 'role',
  emailVerified: 'email_verified',
};

const PHARMACY_UPDATE_FIELDS = {
  name: 'name',
  address: 'address',
  phone: 'phone',
  ownerUserId: 'owner_user_id',
  licenseNumber: 'license_number',
  latitude: 'latitude',
  longitude: 'longitude',
  rating: 'rating',
  isOpen: 'is_open',
  hoursOpen: 'hours_open',
  hoursClose: 'hours_close',
  deliveryTime: 'delivery_time',
  baseDeliveryFee: 'base_delivery_fee',
  verified: 'verified',
  verificationStatus: 'verification_status',
};

const ORDER_UPDATE_FIELDS = {
  status: 'status',
  driverId: 'driver_id',
  driverName: 'driver_name',
  assignedAt: 'assigned_at',
  pickedUpAt: 'picked_up_at',
  deliveredAt: 'delivered_at',
};

const INVENTORY_UPDATE_FIELDS = {
  price: 'price',
  stockStatus: 'stock_status',
  quantity: 'quantity',
};

const PRESCRIPTION_UPDATE_FIELDS = {
  orderId: 'order_id',
  reviewedBy: 'reviewed_by',
  reviewedAt: 'reviewed_at',
  rejectionReason: 'rejection_reason',
  fileUrl: 'file_url',
  fileName: 'file_name',
  fileType: 'file_type',
  fileSize: 'file_size',
  uploadedAt: 'uploaded_at',
  status: 'status',
};

class PostgresDatabase {
  constructor() {
    // Create connection pool
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Test connection
    this.pool.query('SELECT NOW()', (err, res) => {
      if (err) {
        console.error('❌ Database connection error:', err);
      } else {
        console.log('✅ Connected to PostgreSQL database');
      }
    });
  }

  // ==================== User Operations ====================
  async createUser(user) {
    const query = `
      INSERT INTO users (id, email, password_hash, full_name, phone, role, email_verified)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const values = [user.id, user.email, user.passwordHash, user.fullName, user.phone || null, user.role || 'patient', user.emailVerified || false];
    const result = await this.pool.query(query, values);
    return mapUserRecord(result.rows[0]);
  }

  async findUserByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await this.pool.query(query, [email]);
    return mapUserRecord(result.rows[0]);
  }

  async findUserByPhone(phone) {
    const query = 'SELECT * FROM users WHERE phone = $1';
    const result = await this.pool.query(query, [phone]);
    return mapUserRecord(result.rows[0]);
  }

  async findUserById(id) {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await this.pool.query(query, [id]);
    return mapUserRecord(result.rows[0]);
  }

  async updateUser(id, updates) {
    const fields = Object.keys(updates);
    if (fields.length === 0) return this.findUserById(id);

    const mappedFields = fields.map((field) => USER_UPDATE_FIELDS[field] || field);
    const values = Object.values(updates);
    const setClause = mappedFields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    
    const query = `UPDATE users SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`;
    const result = await this.pool.query(query, [id, ...values]);
    return mapUserRecord(result.rows[0]);
  }

  async deleteUser(id) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const ownedPharmaciesResult = await client.query(
        'SELECT id FROM pharmacies WHERE owner_user_id = $1',
        [id],
      );
      const ownedPharmacyIds = ownedPharmaciesResult.rows.map((row) => row.id);

      if (ownedPharmacyIds.length > 0) {
        await client.query('DELETE FROM pharmacy_inventory WHERE pharmacy_id = ANY($1::int[])', [ownedPharmacyIds]);
        await client.query('DELETE FROM pharmacies WHERE id = ANY($1::int[])', [ownedPharmacyIds]);
      }

      await client.query('DELETE FROM users WHERE id = $1', [id]);
      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // ==================== Medicine Operations ====================
  async getAllMedicines() {
    const query = 'SELECT * FROM medicines ORDER BY name';
    const result = await this.pool.query(query);
    return result.rows;
  }

  async findMedicineById(id) {
    const query = 'SELECT * FROM medicines WHERE id = $1';
    const result = await this.pool.query(query, [id]);
    return result.rows[0] || null;
  }

  async searchMedicines(query) {
    const searchQuery = `%${query}%`;
    const sql = `
      SELECT * FROM medicines 
      WHERE name ILIKE $1 OR category ILIKE $1
      ORDER BY name
    `;
    const result = await this.pool.query(sql, [searchQuery]);
    return result.rows;
  }

  // ==================== Pharmacy Operations ====================
  async getAllPharmacies() {
    const query = 'SELECT * FROM pharmacies ORDER BY name';
    const result = await this.pool.query(query);
    return result.rows;
  }

  async findPharmacyById(id) {
    const query = 'SELECT * FROM pharmacies WHERE id = $1';
    const result = await this.pool.query(query, [id]);
    return result.rows[0] || null;
  }

  async findPharmacyByOwnerId(ownerUserId) {
    const query = 'SELECT * FROM pharmacies WHERE owner_user_id = $1 LIMIT 1';
    const result = await this.pool.query(query, [ownerUserId]);
    return result.rows[0] || null;
  }

  async createPharmacy(pharmacy) {
    const query = `
      INSERT INTO pharmacies (
        name,
        address,
        phone,
        owner_user_id,
        license_number,
        latitude,
        longitude,
        rating,
        is_open,
        hours_open,
        hours_close,
        delivery_time,
        base_delivery_fee,
        verified,
        verification_status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `;
    const values = [
      pharmacy.name,
      pharmacy.address,
      pharmacy.phone,
      pharmacy.ownerUserId || null,
      pharmacy.licenseNumber || null,
      pharmacy.latitude ?? null,
      pharmacy.longitude ?? null,
      pharmacy.rating ?? 0,
      pharmacy.isOpen ?? true,
      pharmacy.hours?.open ?? pharmacy.hoursOpen ?? null,
      pharmacy.hours?.close ?? pharmacy.hoursClose ?? null,
      pharmacy.deliveryTime ?? null,
      pharmacy.baseDeliveryFee ?? 15,
      pharmacy.verified ?? false,
      pharmacy.verificationStatus ?? 'pending',
    ];
    const result = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  async updatePharmacy(id, updates) {
    const fields = Object.keys(updates);
    if (fields.length === 0) return this.findPharmacyById(id);

    const mappedFields = fields.map((field) => PHARMACY_UPDATE_FIELDS[field] || field);
    const values = Object.values(updates);
    const setClause = mappedFields.map((field, index) => `${field} = $${index + 2}`).join(', ');

    const query = `UPDATE pharmacies SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`;
    const result = await this.pool.query(query, [id, ...values]);
    return result.rows[0] || null;
  }

  async verifyPharmacy(id, verified = true) {
    return this.updatePharmacy(id, {
      verified,
      verificationStatus: verified ? 'approved' : 'rejected',
    });
  }

  async getMedicinesByPharmacy(pharmacyId) {
    const query = `
      SELECT 
        m.*,
        pi.pharmacy_id,
        p.name as pharmacy_name,
        pi.price,
        pi.stock_status,
        pi.last_updated
      FROM pharmacy_inventory pi
      JOIN medicines m ON pi.medicine_id = m.id
      JOIN pharmacies p ON pi.pharmacy_id = p.id
      WHERE pi.pharmacy_id = $1
      ORDER BY m.name
    `;
    const result = await this.pool.query(query, [pharmacyId]);
    return result.rows;
  }

  async getInventoryByPharmacyId(pharmacyId) {
    const query = `
      SELECT
        m.id,
        m.name,
        m.category,
        m.base_price,
        m.description,
        m.manufacturer,
        m.requires_prescription,
        pi.pharmacy_id,
        pi.medicine_id,
        pi.price,
        pi.stock_status,
        pi.quantity,
        pi.last_updated
      FROM pharmacy_inventory pi
      JOIN medicines m ON pi.medicine_id = m.id
      WHERE pi.pharmacy_id = $1
      ORDER BY m.name
    `;
    const result = await this.pool.query(query, [pharmacyId]);
    return result.rows;
  }

  async updateInventoryItem(pharmacyId, medicineId, updates) {
    const fields = Object.keys(updates);
    if (fields.length === 0) {
      const result = await this.pool.query(
        'SELECT * FROM pharmacy_inventory WHERE pharmacy_id = $1 AND medicine_id = $2',
        [pharmacyId, medicineId]
      );
      return result.rows[0] || null;
    }

    const mappedFields = fields.map((field) => INVENTORY_UPDATE_FIELDS[field] || field);
    const setClause = mappedFields.map((field, index) => `${field} = $${index + 3}`).join(', ');
    const values = Object.values(updates);
    const query = `
      UPDATE pharmacy_inventory
      SET ${setClause}, last_updated = NOW()
      WHERE pharmacy_id = $1 AND medicine_id = $2
      RETURNING *
    `;
    const result = await this.pool.query(query, [pharmacyId, medicineId, ...values]);
    return result.rows[0] || null;
  }

  async createInventoryItem(item) {
    const query = `
      INSERT INTO pharmacy_inventory (pharmacy_id, medicine_id, price, stock_status, quantity, last_updated)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *
    `;
    const values = [
      item.pharmacyId,
      item.medicineId,
      item.price,
      item.stockStatus,
      item.quantity ?? 0,
    ];
    const result = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  // ==================== Order Operations ====================
  async createOrder(order) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Create order
      const orderQuery = `
        INSERT INTO orders (id, order_number, user_id, status, prescription_id, subtotal, delivery_fees, total, payment_method, delivery_address, phone_number)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `;
      const orderValues = [
        order.orderId || order.id,
        order.orderNumber || `ORD-${Date.now()}`,
        order.userId,
        order.status || 'Pending',
        order.prescriptionId || null,
        order.subtotal,
        order.deliveryFees || 0,
        order.total,
        order.paymentMethod,
        order.deliveryAddress || null,
        order.phoneNumber || null,
      ];
      const orderResult = await client.query(orderQuery, orderValues);
      const createdOrder = orderResult.rows[0];

      // Create order items
      if (order.items && order.items.length > 0) {
        const itemQuery = `
          INSERT INTO order_items (order_id, medicine_id, pharmacy_id, medicine_name, pharmacy_name, quantity, price, type, requires_prescription)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `;
        for (const item of order.items) {
          await client.query(itemQuery, [
            createdOrder.id,
            item.medicineId,
            item.pharmacyId,
            item.medicineName,
            item.pharmacyName,
            item.quantity,
            item.price,
            item.type,
            item.requiresPrescription ?? false,
          ]);
        }
      }

      // Create initial status history
      await client.query(
        'INSERT INTO order_status_history (order_id, status, note) VALUES ($1, $2, $3)',
        [createdOrder.id, createdOrder.status, 'Order placed successfully']
      );

      await client.query('COMMIT');
      return createdOrder;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getOrdersByPharmacyId(pharmacyId) {
    const query = `
      SELECT
        o.*,
        u.full_name AS patient_name,
        COALESCE(u.phone, o.phone_number, '') AS patient_phone,
        COALESCE(
          json_agg(
            json_build_object(
              'id', oi.id,
              'medicineId', oi.medicine_id,
              'medicineName', oi.medicine_name,
              'pharmacyId', oi.pharmacy_id,
              'pharmacyName', oi.pharmacy_name,
              'quantity', oi.quantity,
              'price', oi.price,
              'type', oi.type,
              'requiresPrescription', oi.requires_prescription
            )
          ) FILTER (WHERE oi.id IS NOT NULL),
          '[]'
        ) AS items
      FROM orders o
      JOIN users u ON u.id = o.user_id
      LEFT JOIN order_items oi
        ON oi.order_id = o.id
        AND oi.pharmacy_id = $1
      WHERE EXISTS (
        SELECT 1
        FROM order_items oi_match
        WHERE oi_match.order_id = o.id
          AND oi_match.pharmacy_id = $1
      )
      GROUP BY o.id, u.full_name, u.phone
      ORDER BY o.created_at DESC
    `;
    const result = await this.pool.query(query, [pharmacyId]);
    return result.rows.map((row) => ({
      ...row,
      orderId: row.id,
      patientName: row.patient_name,
      patientPhone: row.patient_phone,
      items: row.items || [],
      statusHistory: [],
    }));
  }

  async getUserOrders(userId) {
    const query = `
      SELECT o.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', oi.id,
              'medicineId', oi.medicine_id,
              'medicineName', oi.medicine_name,
              'pharmacyId', oi.pharmacy_id,
              'pharmacyName', oi.pharmacy_name,
              'quantity', oi.quantity,
              'price', oi.price,
              'type', oi.type,
              'requiresPrescription', oi.requires_prescription
            )
          ) FILTER (WHERE oi.id IS NOT NULL),
          '[]'
        ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.user_id = $1
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `;
    const result = await this.pool.query(query, [userId]);
    return result.rows.map(row => ({
      ...row,
      orderId: row.id,
      items: row.items || [],
      statusHistory: [], // Will be loaded separately if needed
    }));
  }

  async findOrderById(orderId) {
    const query = `
      SELECT o.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', oi.id,
              'medicineId', oi.medicine_id,
              'medicineName', oi.medicine_name,
              'pharmacyId', oi.pharmacy_id,
              'pharmacyName', oi.pharmacy_name,
              'quantity', oi.quantity,
              'price', oi.price,
              'type', oi.type,
              'requiresPrescription', oi.requires_prescription
            )
          ) FILTER (WHERE oi.id IS NOT NULL),
          '[]'
        ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.id = $1
      GROUP BY o.id
    `;
    const result = await this.pool.query(query, [orderId]);
    if (result.rows.length === 0) return null;
    
    const order = result.rows[0];
    // Get status history
    const historyQuery = 'SELECT * FROM order_status_history WHERE order_id = $1 ORDER BY timestamp';
    const historyResult = await this.pool.query(historyQuery, [orderId]);
    
    return {
      ...order,
      orderId: order.id,
      items: order.items || [],
      statusHistory: historyResult.rows.map(h => ({
        status: h.status,
        timestamp: h.timestamp,
        note: h.note,
      })),
    };
  }

  async updateOrder(orderId, updates, note) {
    const fields = Object.keys(updates);
    if (fields.length === 0) return this.findOrderById(orderId);

    const mappedFields = fields.map((field) => ORDER_UPDATE_FIELDS[field] || field);
    const values = Object.values(updates);
    const setClause = mappedFields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    const query = `
      UPDATE orders
      SET ${setClause}, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    const result = await this.pool.query(query, [orderId, ...values]);
    if (result.rows.length === 0) return null;

    if (updates.status) {
      const latestHistoryResult = await this.pool.query(
        `
          SELECT id
          FROM order_status_history
          WHERE order_id = $1
          ORDER BY timestamp DESC, id DESC
          LIMIT 1
        `,
        [orderId]
      );

      if (note && latestHistoryResult.rows[0]) {
        await this.pool.query('UPDATE order_status_history SET note = $1 WHERE id = $2', [
          note,
          latestHistoryResult.rows[0].id,
        ]);
      }
    }

    return this.findOrderById(orderId);
  }

  async updateOrderStatus(orderId, status, note) {
    return this.updateOrder(orderId, { status }, note);
  }

  async getAvailableDriverOrders() {
    const query = `
      SELECT
        o.*,
        u.full_name AS patient_name,
        COALESCE(u.phone, o.phone_number, '') AS patient_phone,
        COALESCE(MAX(p.name), '') AS pharmacy_name,
        COALESCE(MAX(p.address), '') AS pharmacy_address,
        MAX(p.latitude) AS pharmacy_latitude,
        MAX(p.longitude) AS pharmacy_longitude,
        COALESCE(MAX(p.delivery_time), '') AS pharmacy_delivery_time,
        COALESCE(
          json_agg(
            json_build_object(
              'id', oi.id,
              'medicineId', oi.medicine_id,
              'medicineName', oi.medicine_name,
              'pharmacyId', oi.pharmacy_id,
              'pharmacyName', oi.pharmacy_name,
              'quantity', oi.quantity,
              'price', oi.price,
              'type', oi.type,
              'requiresPrescription', oi.requires_prescription
            )
          ) FILTER (WHERE oi.id IS NOT NULL),
          '[]'
        ) AS items
      FROM orders o
      JOIN users u ON u.id = o.user_id
      LEFT JOIN order_items oi ON oi.order_id = o.id
      LEFT JOIN pharmacies p ON p.id = oi.pharmacy_id
      WHERE o.status IN ('Confirmed', 'Preparing')
        AND o.driver_id IS NULL
        AND EXISTS (
          SELECT 1
          FROM order_items oi_delivery
          WHERE oi_delivery.order_id = o.id
            AND oi_delivery.type = 'delivery'
        )
      GROUP BY o.id, u.full_name, u.phone
      ORDER BY o.created_at DESC
    `;
    const result = await this.pool.query(query);
    return result.rows.map((row) => ({
      ...row,
      orderId: row.id,
      patientName: row.patient_name,
      patientPhone: row.patient_phone,
      pharmacyName: row.pharmacy_name,
      pharmacyAddress: row.pharmacy_address,
      pharmacyLatitude: row.pharmacy_latitude,
      pharmacyLongitude: row.pharmacy_longitude,
      estimatedDeliveryTime: row.pharmacy_delivery_time,
      items: row.items || [],
      statusHistory: [],
    }));
  }

  async getDriverOrders(driverId) {
    const query = `
      SELECT
        o.*,
        u.full_name AS patient_name,
        COALESCE(u.phone, o.phone_number, '') AS patient_phone,
        COALESCE(MAX(p.name), '') AS pharmacy_name,
        COALESCE(MAX(p.address), '') AS pharmacy_address,
        MAX(p.latitude) AS pharmacy_latitude,
        MAX(p.longitude) AS pharmacy_longitude,
        COALESCE(MAX(p.delivery_time), '') AS pharmacy_delivery_time,
        COALESCE(
          json_agg(
            json_build_object(
              'id', oi.id,
              'medicineId', oi.medicine_id,
              'medicineName', oi.medicine_name,
              'pharmacyId', oi.pharmacy_id,
              'pharmacyName', oi.pharmacy_name,
              'quantity', oi.quantity,
              'price', oi.price,
              'type', oi.type,
              'requiresPrescription', oi.requires_prescription
            )
          ) FILTER (WHERE oi.id IS NOT NULL),
          '[]'
        ) AS items
      FROM orders o
      JOIN users u ON u.id = o.user_id
      LEFT JOIN order_items oi ON oi.order_id = o.id
      LEFT JOIN pharmacies p ON p.id = oi.pharmacy_id
      WHERE o.driver_id = $1
      GROUP BY o.id, u.full_name, u.phone
      ORDER BY o.created_at DESC
    `;
    const result = await this.pool.query(query, [driverId]);
    return result.rows.map((row) => ({
      ...row,
      orderId: row.id,
      patientName: row.patient_name,
      patientPhone: row.patient_phone,
      pharmacyName: row.pharmacy_name,
      pharmacyAddress: row.pharmacy_address,
      pharmacyLatitude: row.pharmacy_latitude,
      pharmacyLongitude: row.pharmacy_longitude,
      estimatedDeliveryTime: row.pharmacy_delivery_time,
      items: row.items || [],
      statusHistory: [],
    }));
  }

  async assignDriver(orderId, driver) {
    return this.updateOrder(
      orderId,
      {
        driverId: driver.id,
        driverName: driver.fullName,
        assignedAt: new Date().toISOString(),
      },
      `Assigned to driver ${driver.fullName}`
    );
  }

  // ==================== Address Operations ====================
  async getUserAddresses(userId) {
    const query = 'SELECT * FROM user_addresses WHERE user_id = $1 ORDER BY created_at DESC';
    const result = await this.pool.query(query, [userId]);
    return result.rows;
  }

  async createAddress(address) {
    const query = `
      INSERT INTO user_addresses (id, user_id, nickname, full_name, address, building, floor, phone_number, additional_details)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    const values = [
      address.id,
      address.userId,
      address.nickname,
      address.fullName,
      address.address,
      address.building || null,
      address.floor || null,
      address.phoneNumber,
      address.additionalDetails || null,
    ];
    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async findAddressById(id) {
    const query = 'SELECT * FROM user_addresses WHERE id = $1';
    const result = await this.pool.query(query, [id]);
    return result.rows[0] || null;
  }

  async updateAddress(id, updates) {
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    
    const query = `UPDATE user_addresses SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`;
    const result = await this.pool.query(query, [id, ...values]);
    return result.rows[0] || null;
  }

  async deleteAddress(id) {
    const query = 'DELETE FROM user_addresses WHERE id = $1';
    await this.pool.query(query, [id]);
    return true;
  }

  // ==================== Favorite Operations ====================
  async getUserFavorites(userId) {
    const query = `
      SELECT 
        f.*,
        m.name as medicine_name,
        m.category,
        p.name as pharmacy_name
      FROM favorites f
      JOIN medicines m ON f.medicine_id = m.id
      LEFT JOIN pharmacies p ON f.last_pharmacy_id = p.id
      WHERE f.user_id = $1
      ORDER BY f.added_at DESC
    `;
    const result = await this.pool.query(query, [userId]);
    return result.rows;
  }

  async createFavorite(favorite) {
    const query = `
      INSERT INTO favorites (user_id, medicine_id, last_pharmacy_id, last_price, added_at)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (user_id, medicine_id)
      DO UPDATE SET last_pharmacy_id = $3, last_price = $4, added_at = $5
      RETURNING *
    `;
    const values = [
      favorite.userId,
      favorite.medicineId,
      favorite.lastPharmacyId || null,
      favorite.lastPrice || null,
      favorite.addedAt || new Date().toISOString(),
    ];
    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async removeFavorite(userId, medicineId) {
    const query = 'DELETE FROM favorites WHERE user_id = $1 AND medicine_id = $2';
    await this.pool.query(query, [userId, medicineId]);
    return true;
  }

  async isFavorite(userId, medicineId) {
    const query = 'SELECT 1 FROM favorites WHERE user_id = $1 AND medicine_id = $2 LIMIT 1';
    const result = await this.pool.query(query, [userId, medicineId]);
    return result.rows.length > 0;
  }

  // ==================== Email Verification Operations ====================
  async createVerificationToken(userId, token) {
    // Delete old tokens for this user
    await this.pool.query('DELETE FROM email_verifications WHERE user_id = $1', [userId]);
    
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    const query = `
      INSERT INTO email_verifications (user_id, token, expires_at)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const result = await this.pool.query(query, [userId, token, expiresAt]);
    return mapVerificationRecord(result.rows[0]);
  }

  async findVerificationToken(token) {
    const query = 'SELECT * FROM email_verifications WHERE token = $1';
    const result = await this.pool.query(query, [token]);
    return mapVerificationRecord(result.rows[0]);
  }

  async deleteVerificationToken(token) {
    const query = 'DELETE FROM email_verifications WHERE token = $1';
    await this.pool.query(query, [token]);
    return true;
  }

  async createPasswordResetToken(userId, token) {
    await this.pool.query('DELETE FROM password_resets WHERE user_id = $1', [userId]);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    const result = await this.pool.query(
      `
        INSERT INTO password_resets (user_id, token, expires_at)
        VALUES ($1, $2, $3)
        RETURNING *
      `,
      [userId, token, expiresAt]
    );
    return mapPasswordResetRecord(result.rows[0]);
  }

  async findPasswordResetToken(token) {
    const result = await this.pool.query('SELECT * FROM password_resets WHERE token = $1', [token]);
    return mapPasswordResetRecord(result.rows[0]);
  }

  async deletePasswordResetToken(token) {
    await this.pool.query('DELETE FROM password_resets WHERE token = $1', [token]);
    return true;
  }

  async createPrescription(prescription) {
    const result = await this.pool.query(
      `
        INSERT INTO prescriptions (
          id, user_id, order_id, file_url, file_name, file_type, file_size, status, reviewed_by, reviewed_at, rejection_reason
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `,
      [
        prescription.id,
        prescription.userId,
        prescription.orderId || null,
        prescription.fileUrl,
        prescription.fileName,
        prescription.fileType,
        prescription.fileSize,
        prescription.status,
        prescription.reviewedBy || null,
        prescription.reviewedAt || null,
        prescription.rejectionReason || null,
      ]
    );
    return mapPrescriptionRecord(result.rows[0]);
  }

  async findPrescriptionById(id) {
    const result = await this.pool.query('SELECT * FROM prescriptions WHERE id = $1', [id]);
    return mapPrescriptionRecord(result.rows[0]);
  }

  async updatePrescription(id, updates) {
    const fields = Object.keys(updates);
    if (fields.length === 0) return this.findPrescriptionById(id);

    const mappedFields = fields.map((field) => PRESCRIPTION_UPDATE_FIELDS[field] || field);
    const setClause = mappedFields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    const values = Object.values(updates);
    const result = await this.pool.query(
      `UPDATE prescriptions SET ${setClause} WHERE id = $1 RETURNING *`,
      [id, ...values]
    );
    return mapPrescriptionRecord(result.rows[0]);
  }

  async getPrescriptionsByOrderId(orderId) {
    const result = await this.pool.query(
      'SELECT * FROM prescriptions WHERE order_id = $1 ORDER BY uploaded_at DESC',
      [orderId]
    );
    return result.rows.map(mapPrescriptionRecord);
  }

  async deletePrescription(id) {
    await this.pool.query('DELETE FROM prescriptions WHERE id = $1', [id]);
    return true;
  }

  // Close connection pool
  async close() {
    await this.pool.end();
  }
}

// Create singleton instance
const db = new PostgresDatabase();

export default db;

