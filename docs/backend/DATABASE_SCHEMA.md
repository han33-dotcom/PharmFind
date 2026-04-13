# Database Schema

This document summarizes the active PostgreSQL schema used by the PharmFind MVP. The source of truth is [`server/database/schema.sql`](../../server/database/schema.sql); this guide exists to explain that schema in product terms.

## Data Model Overview

At a high level:

- users own accounts and roles
- pharmacists can own pharmacies
- pharmacies stock medicines through inventory rows
- patients place orders made of order items
- orders move through a tracked status history
- drivers can be assigned to orders
- users also own saved addresses, favorites, prescription files, verification tokens, and password reset tokens

## Main Tables

### `users`

Stores all account identities.

Important columns:

| Column | Notes |
| --- | --- |
| `id` | UUID primary key |
| `email` | unique login identifier |
| `password_hash` | hashed password |
| `full_name` | display and operational name |
| `phone` | optional phone number |
| `role` | `patient`, `pharmacist`, or `driver` |
| `email_verified` | current verification state |
| `created_at`, `updated_at` | lifecycle timestamps |

Key points:

- role is persisted in the database, not trusted from client-side local storage
- email verification status is stored directly on the user

### `medicines`

Stores the master medicine catalog.

Important columns:

| Column | Notes |
| --- | --- |
| `id` | serial primary key |
| `name` | medicine name |
| `category` | constrained to the supported category set |
| `base_price` | reference price |
| `description` | optional descriptive text |
| `manufacturer` | optional manufacturer |
| `requires_prescription` | whether a prescription is required |

### `pharmacies`

Stores pharmacy profiles.

Important columns:

| Column | Notes |
| --- | --- |
| `id` | serial primary key |
| `name`, `address`, `phone` | core pharmacy identity |
| `owner_user_id` | pharmacist user that owns the pharmacy |
| `license_number` | pharmacy registration detail |
| `latitude`, `longitude` | location data |
| `rating` | numeric rating value |
| `is_open` | current open state |
| `hours_open`, `hours_close` | basic opening hours |
| `delivery_time` | delivery-time text shown to users |
| `base_delivery_fee` | delivery fee base |
| `verified` | boolean verification flag |
| `verification_status` | `pending`, `approved`, or `rejected` |

Key points:

- pharmacist ownership is explicit through `owner_user_id`
- verification is modeled even though the MVP does not yet provide a full admin console

### `pharmacy_inventory`

Joins pharmacies to medicines and adds pharmacy-specific stock information.

Important columns:

| Column | Notes |
| --- | --- |
| `pharmacy_id` | owning pharmacy |
| `medicine_id` | stocked medicine |
| `price` | pharmacy-specific selling price |
| `stock_status` | `In Stock`, `Low Stock`, or `Out of Stock` |
| `quantity` | current stock quantity |
| `last_updated` | latest inventory update timestamp |

Important constraint:

- one pharmacy can only have one inventory row per medicine through `UNIQUE(pharmacy_id, medicine_id)`

### `orders`

Stores order headers.

Important columns:

| Column | Notes |
| --- | --- |
| `id` | UUID primary key |
| `order_number` | human-readable order identifier |
| `user_id` | patient who placed the order |
| `status` | current order status |
| `prescription_id` | linked prescription when relevant |
| `driver_id`, `driver_name` | assigned delivery driver |
| `assigned_at`, `picked_up_at`, `delivered_at` | delivery lifecycle timestamps |
| `subtotal`, `delivery_fees`, `total` | monetary totals |
| `payment_method` | current payment method snapshot |
| `delivery_address`, `phone_number` | order delivery/contact snapshot |
| `created_at`, `updated_at` | order lifecycle timestamps |

Canonical statuses:

- `Pending`
- `Confirmed`
- `Preparing`
- `Out for Delivery`
- `Delivered`
- `Cancelled`

### `order_items`

Stores the medicine rows inside each order.

Important columns:

| Column | Notes |
| --- | --- |
| `order_id` | parent order |
| `medicine_id`, `pharmacy_id` | item ownership references |
| `medicine_name`, `pharmacy_name` | snapshot names at order time |
| `quantity`, `price` | item quantity and unit price |
| `type` | `delivery` or `reservation` |
| `requires_prescription` | snapshot of prescription requirement |

### `order_status_history`

Stores the audit trail of status transitions.

Important columns:

| Column | Notes |
| --- | --- |
| `order_id` | parent order |
| `status` | status at that moment |
| `note` | optional comment |
| `timestamp` | time of change |

### `user_addresses`

Stores patient-saved addresses.

Important columns:

| Column | Notes |
| --- | --- |
| `user_id` | owning user |
| `nickname` | `Home`, `Work`, `Mom's`, or `Other` |
| `full_name` | recipient name |
| `address`, `building`, `floor` | delivery location details |
| `phone_number` | contact phone |
| `additional_details` | free-form delivery detail |

### `favorites`

Stores saved favorite medicines for a user.

Important columns:

| Column | Notes |
| --- | --- |
| `user_id` | owning user |
| `medicine_id` | favorited medicine |
| `last_pharmacy_id` | last known pharmacy used |
| `last_price` | last known price snapshot |
| `added_at` | created timestamp |

Important constraint:

- one favorite per `(user_id, medicine_id)`

### `email_verifications`

Stores verification tokens used by the auth service.

Important columns:

- `user_id`
- `token`
- `created_at`
- `expires_at`

### `password_resets`

Stores password reset tokens used by the auth service.

Important columns:

- `user_id`
- `token`
- `created_at`
- `expires_at`

### `prescriptions`

Stores uploaded prescription metadata.

Important columns:

| Column | Notes |
| --- | --- |
| `id` | UUID primary key |
| `user_id` | uploading user |
| `order_id` | linked order when attached |
| `file_url`, `file_name`, `file_type`, `file_size` | file metadata |
| `uploaded_at` | upload time |
| `status` | `pending`, `approved`, or `rejected` |
| `reviewed_by`, `reviewed_at` | pharmacist review metadata |
| `rejection_reason` | optional rejection note |

## Relationships

Key relationships:

- one user can have many addresses, favorites, and orders
- one pharmacist user can own a pharmacy
- one pharmacy can stock many medicines through inventory rows
- one order can contain many order items and status-history rows
- one order can reference one prescription
- one driver can be assigned to many orders over time

## Indexing And Constraints

The schema already includes the important MVP-level protections:

- unique user emails
- indexed medicine name and category lookups
- indexed pharmacy ownership and location lookups
- unique pharmacy inventory rows per medicine
- indexed order lookup by user, order number, and status
- unique favorite rows per user and medicine
- token indexes for verification and password reset flows

## Triggers

The schema defines two important triggers:

- `update_updated_at_column()`
  - updates `updated_at` automatically for the main mutable tables
- `create_order_status_history()`
  - inserts a history row whenever an order status changes

These triggers help keep the application model consistent without repeating timestamp and history logic in every caller.

## JSON Mode vs. PostgreSQL Mode

Even though local development can use JSON storage, the JSON adapter is expected to mirror the same domain model closely enough that frontend behavior remains consistent.

Use PostgreSQL when you need:

- schema-backed validation
- direct SQL inspection
- deployment-like persistence

Use JSON when you need:

- fast local startup
- deterministic local testing
- no external dependency

## Related Files

- Schema source: [../../server/database/schema.sql](../../server/database/schema.sql)
- Seed data: [../../server/database/seed.sql](../../server/database/seed.sql)
- PostgreSQL adapter: [../../server/database/postgres.js](../../server/database/postgres.js)
- Database bootstrap: [../../server/lib/database.js](../../server/lib/database.js)
- PostgreSQL migration guide: [./POSTGRES_MIGRATION.md](./POSTGRES_MIGRATION.md)
