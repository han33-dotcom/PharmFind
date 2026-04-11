# Backend Integration Guide

This document provides comprehensive guidance for backend developers to integrate the PharmFind frontend with a backend API.

## Quick Start

1. **Review Database Schema**: See `DATABASE_SCHEMA.md` for complete database structure
2. **Check Service Files**: All API calls are centralized in `src/services/*.service.ts`
3. **Feature Flag**: Set `VITE_ENABLE_MOCK_DATA=false` in `.env` when your API is ready
4. **Test Endpoints**: Use the provided endpoint documentation below

---

## Architecture Overview

```
┌─────────────┐      ┌──────────────┐      ┌────────────┐
│   React     │─────▶│   Services   │─────▶│  Backend   │
│ Components  │      │    Layer     │      │    API     │
└─────────────┘      └──────────────┘      └────────────┘
      │                     │                     │
      │                     │                     │
      ▼                     ▼                     ▼
  UI/UX Only         API Calls            Database
  (You don't         (Replace mock        (Implement
   touch this)        implementations)     schema)
```

### Key Principles

1. **Frontend Components** (`src/pages/`, `src/components/`) - **DO NOT MODIFY**
   - All UI/UX is complete and should not be changed
   - Components consume data through Context providers

2. **Service Layer** (`src/services/`) - **REPLACE MOCK IMPLEMENTATIONS**
   - Each service file contains TODO comments marking where to add real API calls
   - Currently returns mock data when `API_CONFIG.useMockData = true`
   - Replace mock logic with real HTTP calls to your backend

3. **Context Providers** (`src/contexts/`) - **MAY NEED MINOR UPDATES**
   - Already set up to call service layer
   - May need minor adjustments if your API responses differ from expected format

---

## API Endpoints Reference

All endpoints should be prefixed with your API base URL (configured in `.env`).

### Authentication (Future Feature)

```http
POST   /auth/register          # Register new user
POST   /auth/login             # Login user
POST   /auth/logout            # Logout user
GET    /auth/me                # Get current user profile
POST   /auth/forgot-password   # Request password reset
POST   /auth/reset-password    # Reset password with token
```

**Note**: Authentication is not currently implemented in frontend. You may add this as next phase.

---

### Medicines API

#### Search Medicines
```http
GET /medicines?search={query}&category={category}&page={page}&limit={limit}
```

**Query Parameters:**
- `search` (optional): Medicine name to search
- `category` (optional): Filter by category
- `page` (optional): Page number for pagination
- `limit` (optional): Results per page

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Panadol Extra",
      "category": "Pain Relief",
      "basePrice": 25.00,
      "description": "Fast relief from headaches and pain",
      "manufacturer": "GSK",
      "requiresPrescription": false,
      "pharmacyId": 1,
      "pharmacyName": "El Ezaby Pharmacy",
      "price": 27.50,
      "stockStatus": "In Stock",
      "lastUpdated": "2025-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

#### Get Medicine by ID
```http
GET /medicines/{id}
```

**Response:**
```json
{
  "id": 1,
  "name": "Panadol Extra",
  "category": "Pain Relief",
  "basePrice": 25.00,
  "description": "Fast relief from headaches and pain",
  "manufacturer": "GSK",
  "requiresPrescription": false
}
```

#### Get Medicine Categories
```http
GET /medicines/categories
```

**Response:**
```json
{
  "categories": [
    "Pain Relief",
    "Antibiotics",
    "Vitamins",
    "Cold & Flu",
    "Allergy",
    "Digestive Health",
    "First Aid",
    "Hygiene"
  ]
}
```

---

### Pharmacies API

#### Search Pharmacies
```http
GET /pharmacies?lat={latitude}&lng={longitude}&radius={radius}&open={boolean}
```

**Query Parameters:**
- `lat` (optional): User's latitude
- `lng` (optional): User's longitude  
- `radius` (optional): Search radius in km (default: 10)
- `open` (optional): Filter by open/closed status

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "El Ezaby Pharmacy",
      "address": "123 Main St, Nasr City, Cairo",
      "phone": "+20 2 1234 5678",
      "rating": 4.5,
      "distance": "0.8 km",
      "deliveryTime": "20-30 min",
      "deliveryFee": 15.00,
      "isOpen": true,
      "latitude": 30.0444,
      "longitude": 31.2357,
      "hours": {
        "open": "08:00",
        "close": "23:00"
      }
    }
  ]
}
```

#### Get Pharmacy by ID
```http
GET /pharmacies/{id}
```

**Response:** Same structure as search result item

#### Get Pharmacy Inventory
```http
GET /pharmacies/{pharmacyId}/medicines?category={category}&inStock={boolean}
```

**Response:**
```json
{
  "pharmacyId": 1,
  "pharmacyName": "El Ezaby Pharmacy",
  "medicines": [
    {
      "id": 1,
      "name": "Panadol Extra",
      "category": "Pain Relief",
      "price": 27.50,
      "stockStatus": "In Stock",
      "requiresPrescription": false
    }
  ]
}
```

---

### Orders API

#### Create Order
```http
POST /orders
```

**Request Body:**
```json
{
  "orderId": "ORD-1737891234567",
  "items": [
    {
      "medicineId": 1,
      "medicineName": "Panadol Extra",
      "pharmacyId": 1,
      "pharmacyName": "El Ezaby Pharmacy",
      "quantity": 2,
      "price": 27.50,
      "type": "delivery"
    }
  ],
  "subtotal": 55.00,
  "deliveryFees": 15.00,
  "total": 70.00,
  "deliveryAddress": "123 Main St, Cairo",
  "phoneNumber": "+20 1234567890",
  "paymentMethod": "Cash on Delivery"
}
```

**Response:**
```json
{
  "orderId": "ORD-1737891234567",
  "status": "Pending",
  "createdAt": "2025-01-26T14:30:00Z",
  "statusHistory": [
    {
      "status": "Pending",
      "timestamp": "2025-01-26T14:30:00Z",
      "note": "Order placed successfully"
    }
  ],
  "items": [...],
  "subtotal": 55.00,
  "deliveryFees": 15.00,
  "total": 70.00,
  "deliveryAddress": "123 Main St, Cairo",
  "phoneNumber": "+20 1234567890",
  "paymentMethod": "Cash on Delivery"
}
```

#### Get All Orders (for current user)
```http
GET /orders?status={status}&page={page}&limit={limit}
```

**Query Parameters:**
- `status` (optional): Filter by order status
- `page` (optional): Page number
- `limit` (optional): Results per page

**Response:**
```json
{
  "data": [
    {
      "orderId": "ORD-1737891234567",
      "status": "Delivered",
      "createdAt": "2025-01-26T14:30:00Z",
      "items": [...],
      "total": 70.00
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}
```

#### Get Order by ID
```http
GET /orders/{orderId}
```

**Response:** Same structure as create order response

#### Update Order Status
```http
PATCH /orders/{orderId}/status
```

**Request Body:**
```json
{
  "status": "Confirmed",
  "note": "Order confirmed by pharmacy"
}
```

**Valid Status Values:**
- `Pending`
- `Confirmed`
- `Preparing`
- `Out for Delivery`
- `Delivered`
- `Cancelled`

**Response:**
```json
{
  "orderId": "ORD-1737891234567",
  "status": "Confirmed",
  "statusHistory": [
    {
      "status": "Pending",
      "timestamp": "2025-01-26T14:30:00Z"
    },
    {
      "status": "Confirmed",
      "timestamp": "2025-01-26T14:35:00Z",
      "note": "Order confirmed by pharmacy"
    }
  ]
}
```

#### Cancel Order
```http
DELETE /orders/{orderId}
# OR
PATCH /orders/{orderId}/status
{
  "status": "Cancelled",
  "reason": "Customer requested cancellation"
}
```

---

### Addresses API (User-specific)

#### Get All Addresses
```http
GET /users/me/addresses
```

**Response:**
```json
{
  "data": [
    {
      "id": "addr-123",
      "nickname": "Home",
      "fullName": "John Doe",
      "address": "123 Main St",
      "building": "Building 5",
      "floor": "3rd Floor",
      "phoneNumber": "+20 1234567890",
      "additionalDetails": "Apartment 302"
    }
  ]
}
```

#### Get Address by ID
```http
GET /users/me/addresses/{id}
```

#### Create Address
```http
POST /users/me/addresses
```

**Request Body:**
```json
{
  "nickname": "Home",
  "fullName": "John Doe",
  "address": "123 Main St",
  "building": "Building 5",
  "floor": "3rd Floor",
  "phoneNumber": "+20 1234567890",
  "additionalDetails": "Apartment 302"
}
```

**Valid Nickname Values:**
- `Home`
- `Work`
- `Mom's`
- `Other`

#### Update Address
```http
PUT /users/me/addresses/{id}
```

**Request Body:** Same as create

#### Delete Address
```http
DELETE /users/me/addresses/{id}
```

**Response:**
```json
{
  "success": true,
  "message": "Address deleted successfully"
}
```

---

### Favorites API (User-specific)

#### Get All Favorites
```http
GET /users/me/favorites?sort={field}&order={asc|desc}
```

**Response:**
```json
{
  "data": [
    {
      "medicineId": 1,
      "medicineName": "Panadol Extra",
      "category": "Pain Relief",
      "lastPharmacyId": 1,
      "lastPharmacyName": "El Ezaby Pharmacy",
      "lastPrice": 27.50,
      "addedAt": "2025-01-20T10:00:00Z"
    }
  ]
}
```

#### Add to Favorites
```http
POST /users/me/favorites
```

**Request Body:**
```json
{
  "medicineId": 1,
  "medicineName": "Panadol Extra",
  "category": "Pain Relief",
  "lastPharmacyId": 1,
  "lastPharmacyName": "El Ezaby Pharmacy",
  "lastPrice": 27.50
}
```

**Note:** If medicine already in favorites, update the pharmacy/price info

#### Remove from Favorites
```http
DELETE /users/me/favorites/{medicineId}
```

#### Check if Medicine is Favorite
```http
GET /users/me/favorites/{medicineId}/exists
```

**Response:**
```json
{
  "exists": true
}
```

---

### Cart API (Optional - may stay client-side only)

If you decide to implement server-side cart synchronization:

```http
GET    /cart                    # Get user's cart
POST   /cart/items              # Add item to cart
PATCH  /cart/items/{medicineId} # Update quantity
DELETE /cart/items/{medicineId} # Remove item
DELETE /cart                    # Clear cart
```

**Note:** Current implementation uses `localStorage` for cart. You may choose to keep it client-side or sync with server.

---

## Implementation Guide

### Step 1: Set Up Your Backend

1. Choose your stack (Node.js/Express, Python/FastAPI, Go/Gin, etc.)
2. Implement database schema from `DATABASE_SCHEMA.md`
3. Set up authentication (JWT recommended)
4. Create API routes matching the endpoints above

### Step 2: Update Service Files

For each service file in `src/services/`, replace the mock implementations:

**Example - `medicines.service.ts`:**

```typescript
// BEFORE (Mock implementation)
static async searchMedicines(query: string): Promise<PharmacyMedicine[]> {
  if (API_CONFIG.useMockData) {
    return mockMedicines.filter(m => 
      m.name.toLowerCase().includes(query.toLowerCase())
    );
  }
  
  return apiClient.get<PharmacyMedicine[]>(`/medicines`, { search: query });
}

// AFTER (Your backend is ready)
static async searchMedicines(query: string): Promise<PharmacyMedicine[]> {
  // Mock implementation removed, always use real API
  return apiClient.get<PharmacyMedicine[]>(`/medicines`, { search: query });
}
```

### Step 3: Configure Environment

Update `.env`:

```bash
# Point to your backend API
VITE_API_BASE_URL=https://api.pharmfind.com

# Disable mock data
VITE_ENABLE_MOCK_DATA=false
```

### Step 4: Test Integration

1. Start your backend server
2. Start frontend dev server: `npm run dev`
3. Open browser DevTools → Network tab
4. Test each feature and verify API calls
5. Check for errors in console

### Step 5: Handle Errors

Ensure your API returns consistent error responses:

```json
{
  "error": {
    "message": "Medicine not found",
    "status": 404,
    "code": "MEDICINE_NOT_FOUND"
  }
}
```

Frontend `apiClient` expects this format.

---

## Authentication Flow (Future)

When implementing authentication:

1. **Login**:
   - User submits credentials to `POST /auth/login`
   - Backend returns JWT token
   - Frontend stores token in `localStorage.setItem('auth_token', token)`
   - `apiClient` automatically includes token in subsequent requests

2. **Protected Routes**:
   - Check for token in localStorage before rendering protected pages
   - Redirect to login if token missing/expired

3. **Logout**:
   - Call `POST /auth/logout`
   - Remove token from localStorage
   - Redirect to login page

---

## Testing Checklist

### Medicines
- [ ] Search medicines by name
- [ ] Filter by category
- [ ] Get medicine details
- [ ] View pharmacy availability

### Pharmacies
- [ ] Search nearby pharmacies
- [ ] View pharmacy details
- [ ] View pharmacy inventory

### Orders
- [ ] Create new order
- [ ] View order history
- [ ] Track specific order
- [ ] Update order status (admin)

### Addresses
- [ ] List saved addresses
- [ ] Add new address
- [ ] Edit address
- [ ] Delete address

### Favorites
- [ ] Add to favorites
- [ ] Remove from favorites
- [ ] View favorites list

### Cart (if server-side)
- [ ] Add items
- [ ] Update quantities
- [ ] Remove items
- [ ] Calculate totals
- [ ] Clear cart

---

## Common Issues & Solutions

### Issue: CORS Errors
**Solution:** Configure CORS on backend to allow requests from frontend origin:
```javascript
// Example for Express.js
app.use(cors({
  origin: 'http://localhost:5173', // Vite dev server
  credentials: true
}));
```

### Issue: 401 Unauthorized on all requests
**Solution:** Check that JWT token is being sent correctly in Authorization header

### Issue: Data format mismatch
**Solution:** Ensure your API responses match the TypeScript interfaces in `src/types/`

### Issue: Images not loading
**Solution:** Ensure image URLs are absolute or properly configured CORS for asset server

---

## Performance Considerations

1. **Pagination**: Implement pagination for large datasets (medicines, orders)
2. **Caching**: Consider caching medicine/pharmacy data (changes infrequently)
3. **Debouncing**: Search requests should be debounced (already implemented in frontend)
4. **Indexes**: Add database indexes on frequently queried columns (see DATABASE_SCHEMA.md)

---

## Security Checklist

- [ ] Implement rate limiting on API endpoints
- [ ] Validate all input data
- [ ] Sanitize user-generated content
- [ ] Use HTTPS in production
- [ ] Implement proper authentication & authorization
- [ ] Set up Row-Level Security (RLS) for user data
- [ ] Hash passwords with bcrypt/argon2
- [ ] Implement CSRF protection
- [ ] Set secure headers (helmet.js for Express)
- [ ] Log security events

---

## Deployment

### Backend Deployment Options
- **Node.js**: Heroku, Railway, Render, AWS Elastic Beanstalk
- **Python**: Heroku, Railway, Google Cloud Run
- **Go**: Railway, Fly.io, Google Cloud Run
- **Database**: PostgreSQL on Supabase, Railway, or AWS RDS

### Frontend Deployment
Frontend is already configured for deployment on Lovable platform.

---

## Support & Questions

For questions about:
- **API Design**: Review this document and `DATABASE_SCHEMA.md`
- **TypeScript Types**: Check `src/types/` folder
- **Service Layer**: Review `src/services/*.service.ts` files
- **Frontend Behavior**: Check component files (but don't modify them!)

---

## Next Steps

1. ✅ Review this document and `DATABASE_SCHEMA.md`
2. ✅ Implement database schema
3. ✅ Create API endpoints
4. ✅ Update service files to use real API
5. ✅ Configure `.env` with your API URL
6. ✅ Test integration
7. ✅ Deploy backend
8. ✅ Update production `.env` with production API URL
9. ✅ Monitor and optimize

Good luck with the backend implementation! 🚀
