# PharmFind Backend API Server

This is the backend API server for the PharmFind application. It provides all the necessary endpoints for authentication, medicines, pharmacies, orders, addresses, and favorites.

## Features

- ✅ User authentication (register/login with JWT)
- ✅ Medicines search and management
- ✅ Pharmacies listing and inventory
- ✅ Orders creation and tracking
- ✅ Address management
- ✅ Favorites management
- ✅ JSON file-based database (easy to use, can be replaced with real DB)

## Quick Start

### Prerequisites

- Node.js 18+ installed
- npm or yarn

### Installation

1. Navigate to the server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

The server will start on `http://localhost:3000`

### API Endpoints

All endpoints are prefixed with `/api`

#### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (requires auth)

#### Medicines
- `GET /api/medicines` - Search medicines
- `GET /api/medicines/:id` - Get medicine by ID
- `GET /api/medicines/categories` - Get all categories

#### Pharmacies
- `GET /api/pharmacies` - Get all pharmacies
- `GET /api/pharmacies/:id` - Get pharmacy by ID
- `GET /api/pharmacies/:id/medicines` - Get pharmacy inventory

#### Orders (requires authentication)
- `POST /api/orders` - Create new order
- `GET /api/orders` - Get user's orders
- `GET /api/orders/:orderId` - Get order by ID
- `PATCH /api/orders/:orderId/status` - Update order status

#### Addresses (requires authentication)
- `GET /api/users/me/addresses` - Get user addresses
- `POST /api/users/me/addresses` - Create address
- `PUT /api/users/me/addresses/:id` - Update address
- `DELETE /api/users/me/addresses/:id` - Delete address

#### Favorites (requires authentication)
- `GET /api/users/me/favorites` - Get user favorites
- `POST /api/users/me/favorites` - Add favorite
- `DELETE /api/users/me/favorites/:medicineId` - Remove favorite
- `GET /api/users/me/favorites/:medicineId/exists` - Check if favorite

## Database

The server uses a simple JSON file-based database stored in the `server/data/` directory. This is perfect for development and testing. For production, replace with a real database (PostgreSQL, MongoDB, etc.).

### Data Files

- `users.json` - User accounts
- `medicines.json` - Medicine catalog
- `pharmacies.json` - Pharmacy listings
- `pharmacy_inventory.json` - Medicine availability at pharmacies
- `orders.json` - Customer orders
- `addresses.json` - User addresses
- `favorites.json` - User favorites

The server automatically initializes sample data on first run.

## Environment Variables

Create a `.env` file in the server directory:

```env
PORT=3000
JWT_SECRET=your-secret-key-change-in-production
```

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. After successful login or registration, the client receives a token that should be included in subsequent requests:

```
Authorization: Bearer <token>
```

## Frontend Integration

1. In the frontend directory, create a `.env` file:
```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_ENABLE_MOCK_DATA=false
```

2. Start the backend server first, then start the frontend:
```bash
# Terminal 1: Backend
cd server
npm start

# Terminal 2: Frontend
cd .. # (back to project root)
npm run dev
```

## Testing

You can test the API using tools like:
- Postman
- Insomnia
- cURL
- Browser DevTools Network tab

### Example: Register a user
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "fullName": "Test User",
    "phone": "+961 70 123 456"
  }'
```

### Example: Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

## Production Deployment

For production, consider:

1. **Replace JSON database** with a real database (PostgreSQL recommended)
2. **Set strong JWT_SECRET** in environment variables
3. **Enable HTTPS** for secure connections
4. **Add rate limiting** to prevent abuse
5. **Set up logging** for monitoring
6. **Add input validation** and sanitization
7. **Enable CORS** only for your frontend domain
8. **Add database backups**

## Troubleshooting

### Port already in use
Change the PORT in `.env` or in `server.js`

### CORS errors
Make sure CORS is enabled (it is by default). For production, restrict origins.

### Database errors
Check that the `server/data/` directory exists and is writable.

## License

Part of the PharmFind project.

