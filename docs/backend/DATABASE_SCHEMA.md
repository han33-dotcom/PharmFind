# Database Schema Documentation

This document outlines the expected database structure for the PharmFind application. Backend developers should implement these tables with appropriate relationships and constraints.

## Entity Relationship Overview

```
users (1) ----< (M) user_addresses
users (1) ----< (M) favorites
users (1) ----< (M) orders
orders (1) ----< (M) order_items
pharmacies (1) ----< (M) pharmacy_inventory
pharmacies (1) ----< (M) order_items
medicines (1) ----< (M) pharmacy_inventory
medicines (1) ----< (M) order_items
medicines (1) ----< (M) favorites
```

## Tables

### users
Stores user account information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique user identifier |
| email | VARCHAR(255) | UNIQUE, NOT NULL | User email address |
| password_hash | VARCHAR(255) | NOT NULL | Hashed password |
| full_name | VARCHAR(255) | NOT NULL | User's full name |
| phone | VARCHAR(20) | | User's phone number |
| created_at | TIMESTAMP | DEFAULT NOW() | Account creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |
| email_verified | BOOLEAN | DEFAULT FALSE | Email verification status |

**Indexes:**
- `idx_users_email` on `email`

---

### medicines
Master list of all available medicines.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Medicine identifier |
| name | VARCHAR(255) | NOT NULL | Medicine name |
| category | VARCHAR(100) | NOT NULL | Medicine category |
| base_price | DECIMAL(10,2) | NOT NULL | Base/reference price |
| description | TEXT | | Medicine description |
| manufacturer | VARCHAR(255) | | Manufacturer name |
| requires_prescription | BOOLEAN | DEFAULT FALSE | Whether prescription is needed |
| created_at | TIMESTAMP | DEFAULT NOW() | Record creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_medicines_name` on `name`
- `idx_medicines_category` on `category`

**Categories (ENUM or CHECK constraint):**
- Pain Relief
- Antibiotics
- Vitamins
- Cold & Flu
- Allergy
- Digestive Health
- First Aid
- Hygiene

---

### pharmacies
List of all pharmacies in the system.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Pharmacy identifier |
| name | VARCHAR(255) | NOT NULL | Pharmacy name |
| address | TEXT | NOT NULL | Full address |
| phone | VARCHAR(20) | NOT NULL | Contact phone |
| latitude | DECIMAL(10,8) | | GPS latitude |
| longitude | DECIMAL(11,8) | | GPS longitude |
| rating | DECIMAL(2,1) | CHECK >= 0 AND <= 5 | Average rating |
| is_open | BOOLEAN | DEFAULT TRUE | Current open/closed status |
| hours_open | TIME | | Opening time |
| hours_close | TIME | | Closing time |
| base_delivery_fee | DECIMAL(10,2) | DEFAULT 15.00 | Base delivery fee |
| created_at | TIMESTAMP | DEFAULT NOW() | Record creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_pharmacies_location` on `latitude, longitude` (for geospatial queries)
- `idx_pharmacies_is_open` on `is_open`

---

### pharmacy_inventory
Tracks which medicines are available at which pharmacies and their prices.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Inventory record identifier |
| pharmacy_id | INTEGER | FK -> pharmacies.id, NOT NULL | Reference to pharmacy |
| medicine_id | INTEGER | FK -> medicines.id, NOT NULL | Reference to medicine |
| price | DECIMAL(10,2) | NOT NULL | Current price at this pharmacy |
| stock_status | VARCHAR(20) | NOT NULL | Stock availability status |
| quantity | INTEGER | DEFAULT 0 | Available quantity |
| last_updated | TIMESTAMP | DEFAULT NOW() | Last stock update |

**Indexes:**
- `idx_pharmacy_inventory_pharmacy` on `pharmacy_id`
- `idx_pharmacy_inventory_medicine` on `medicine_id`
- `UNIQUE(pharmacy_id, medicine_id)` - One record per medicine per pharmacy

**Stock Status (ENUM or CHECK constraint):**
- In Stock
- Low Stock
- Out of Stock

---

### orders
Customer orders.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Order identifier |
| user_id | UUID | FK -> users.id, NOT NULL | Reference to user |
| order_number | VARCHAR(50) | UNIQUE, NOT NULL | Human-readable order number (e.g., ORD-1234567890) |
| status | VARCHAR(50) | NOT NULL | Current order status |
| subtotal | DECIMAL(10,2) | NOT NULL | Sum of all items |
| delivery_fees | DECIMAL(10,2) | DEFAULT 0 | Total delivery fees |
| total | DECIMAL(10,2) | NOT NULL | Final total amount |
| payment_method | VARCHAR(50) | NOT NULL | Payment method used |
| delivery_address | TEXT | | Full delivery address (if delivery) |
| phone_number | VARCHAR(20) | | Contact phone for this order |
| created_at | TIMESTAMP | DEFAULT NOW() | Order placement time |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update time |

**Indexes:**
- `idx_orders_user` on `user_id`
- `idx_orders_order_number` on `order_number`
- `idx_orders_status` on `status`
- `idx_orders_created_at` on `created_at DESC`

**Order Status (ENUM or CHECK constraint):**
- Pending
- Confirmed
- Preparing
- Out for Delivery
- Delivered
- Cancelled

---

### order_items
Individual items within an order.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Order item identifier |
| order_id | UUID | FK -> orders.id, NOT NULL | Reference to order |
| medicine_id | INTEGER | FK -> medicines.id, NOT NULL | Reference to medicine |
| pharmacy_id | INTEGER | FK -> pharmacies.id, NOT NULL | Reference to pharmacy |
| medicine_name | VARCHAR(255) | NOT NULL | Medicine name (snapshot) |
| pharmacy_name | VARCHAR(255) | NOT NULL | Pharmacy name (snapshot) |
| quantity | INTEGER | NOT NULL, CHECK > 0 | Quantity ordered |
| price | DECIMAL(10,2) | NOT NULL | Price per unit at time of order |
| type | VARCHAR(20) | NOT NULL | Order type (delivery/reservation) |

**Indexes:**
- `idx_order_items_order` on `order_id`
- `idx_order_items_medicine` on `medicine_id`
- `idx_order_items_pharmacy` on `pharmacy_id`

**Order Type (ENUM or CHECK constraint):**
- delivery
- reservation

---

### order_status_history
Tracks the history of status changes for orders.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | History record identifier |
| order_id | UUID | FK -> orders.id, NOT NULL | Reference to order |
| status | VARCHAR(50) | NOT NULL | Status at this point |
| note | TEXT | | Optional status note |
| timestamp | TIMESTAMP | DEFAULT NOW() | When status changed |

**Indexes:**
- `idx_order_status_history_order` on `order_id`
- `idx_order_status_history_timestamp` on `timestamp DESC`

---

### user_addresses
Saved delivery addresses for users.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Address identifier |
| user_id | UUID | FK -> users.id, NOT NULL | Reference to user |
| nickname | VARCHAR(20) | NOT NULL | Address nickname |
| full_name | VARCHAR(255) | NOT NULL | Recipient name |
| address | TEXT | NOT NULL | Street address |
| building | VARCHAR(50) | | Building number/name |
| floor | VARCHAR(50) | | Floor number |
| phone_number | VARCHAR(20) | NOT NULL | Contact phone |
| additional_details | TEXT | | Additional delivery instructions |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_user_addresses_user` on `user_id`

**Nickname (ENUM or CHECK constraint):**
- Home
- Work
- Mom's
- Other

---

### favorites
User's favorite medicines.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Favorite record identifier |
| user_id | UUID | FK -> users.id, NOT NULL | Reference to user |
| medicine_id | INTEGER | FK -> medicines.id, NOT NULL | Reference to medicine |
| last_pharmacy_id | INTEGER | FK -> pharmacies.id | Last pharmacy used |
| last_price | DECIMAL(10,2) | | Last known price |
| added_at | TIMESTAMP | DEFAULT NOW() | When added to favorites |

**Indexes:**
- `idx_favorites_user` on `user_id`
- `idx_favorites_medicine` on `medicine_id`
- `UNIQUE(user_id, medicine_id)` - One favorite per medicine per user

---

## Relationships Summary

### One-to-Many Relationships
- `users` → `orders` (One user can have many orders)
- `users` → `user_addresses` (One user can have many addresses)
- `users` → `favorites` (One user can have many favorites)
- `orders` → `order_items` (One order can have many items)
- `orders` → `order_status_history` (One order can have many status changes)
- `pharmacies` → `pharmacy_inventory` (One pharmacy can stock many medicines)
- `medicines` → `pharmacy_inventory` (One medicine can be at many pharmacies)

### Many-to-Many Relationships
- `medicines` ↔ `pharmacies` (through `pharmacy_inventory`)

---

## Recommended Database Features

### Triggers
1. **update_updated_at**: Auto-update `updated_at` timestamp on row updates
2. **create_order_status_history**: Auto-create history record when order status changes

### Views (Optional)
1. **v_medicines_with_availability**: Join medicines with pharmacy inventory for quick availability checks
2. **v_orders_with_items**: Join orders with order items for easy retrieval
3. **v_pharmacies_nearby**: Geospatial view for location-based queries

### Stored Procedures (Optional)
1. **sp_create_order**: Handle order creation with transaction management
2. **sp_update_order_status**: Update status and create history in single operation
3. **sp_search_medicines**: Full-text search across medicine names and categories

---

## Sample Data Requirements

For testing, backend should populate:
- At least 50 medicines across all categories
- At least 10 pharmacies with varying locations
- Pharmacy inventory linking medicines to pharmacies
- Test user accounts

---

## Security Considerations

1. **Row-Level Security (RLS)**: Users should only access their own:
   - Orders
   - Addresses
   - Favorites

2. **Soft Deletes**: Consider using `deleted_at` instead of hard deletes for:
   - Orders (for history)
   - User addresses (for recovery)

3. **Data Validation**: Enforce constraints at database level:
   - Price values must be positive
   - Quantities must be positive
   - Email format validation
   - Phone number format validation

4. **Audit Logging**: Consider tracking:
   - Order modifications
   - Price changes in inventory
   - User data access

---

## Migration Strategy

1. Create tables in this order (respecting foreign keys):
   1. users
   2. medicines
   3. pharmacies
   4. pharmacy_inventory
   5. user_addresses
   6. favorites
   7. orders
   8. order_items
   9. order_status_history

2. Add indexes after table creation

3. Seed with sample data

4. Test all relationships and constraints
