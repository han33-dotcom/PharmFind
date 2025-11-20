/**
 * PostgreSQL Database Layer for PharmFind
 * Replaces the JSON file-based database with PostgreSQL
 */

import pkg from 'pg';
const { Pool } = pkg;

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
      INSERT INTO users (id, email, password_hash, full_name, phone, email_verified)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const values = [user.id, user.email, user.passwordHash, user.fullName, user.phone || null, user.emailVerified || false];
    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async findUserByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await this.pool.query(query, [email]);
    return result.rows[0] || null;
  }

  async findUserById(id) {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await this.pool.query(query, [id]);
    return result.rows[0] || null;
  }

  async updateUser(id, updates) {
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    
    const query = `UPDATE users SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`;
    const result = await this.pool.query(query, [id, ...values]);
    return result.rows[0] || null;
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

  // ==================== Order Operations ====================
  async createOrder(order) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Create order
      const orderQuery = `
        INSERT INTO orders (id, order_number, user_id, status, subtotal, delivery_fees, total, payment_method, delivery_address, phone_number)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `;
      const orderValues = [
        order.orderId || order.id,
        order.orderNumber || `ORD-${Date.now()}`,
        order.userId,
        order.status || 'Pending',
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
          INSERT INTO order_items (order_id, medicine_id, pharmacy_id, medicine_name, pharmacy_name, quantity, price, type)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
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
              'type', oi.type
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
              'type', oi.type
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

  async updateOrderStatus(orderId, status, note) {
    const query = `
      UPDATE orders 
      SET status = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;
    const result = await this.pool.query(query, [status, orderId]);
    if (result.rows.length === 0) return null;

    // Status history is auto-created by trigger, but add note if provided
    if (note) {
      await this.pool.query(
        'UPDATE order_status_history SET note = $1 WHERE order_id = $2 AND status = $3 AND timestamp = (SELECT MAX(timestamp) FROM order_status_history WHERE order_id = $2)',
        [note, orderId, status]
      );
    }

    return this.findOrderById(orderId);
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
    return result.rows[0];
  }

  async findVerificationToken(token) {
    const query = 'SELECT * FROM email_verifications WHERE token = $1';
    const result = await this.pool.query(query, [token]);
    return result.rows[0] || null;
  }

  async deleteVerificationToken(token) {
    const query = 'DELETE FROM email_verifications WHERE token = $1';
    await this.pool.query(query, [token]);
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

