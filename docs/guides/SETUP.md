# PharmFind Setup Guide

This guide will help you get the PharmFind application up and running.

## Prerequisites

- **Node.js 18+** installed ([Download Node.js](https://nodejs.org/))
- **npm** (comes with Node.js)
- A code editor (VS Code recommended)

## Quick Start

### Step 1: Install Frontend Dependencies

Open a terminal in the project root directory and run:

```bash
npm install
```

This will install all frontend dependencies.

### Step 2: Install Backend Dependencies

Navigate to the server directory and install backend dependencies:

```bash
cd server
npm install
cd ..
```

### Step 3: Configure Environment Variables

Create a `.env` file in the project root (same level as `package.json`):

```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_ENABLE_MOCK_DATA=false
```

### Step 4: Start the Backend Server

In the project root, open a terminal and run:

```bash
cd server
npm start
```

You should see:
```
🚀 PharmFind API Server running on http://localhost:3000
📝 API endpoints available at http://localhost:3000/api
💾 Database initialized with sample data
```

**Keep this terminal window open!**

### Step 5: Start the Frontend

Open a **new terminal window** (keep the backend running) and in the project root, run:

```bash
npm run dev
```

You should see:
```
VITE v5.x.x ready in xxx ms

➜  Local:   http://localhost:5173/
```

### Step 6: Open the Application

Open your browser and navigate to: `http://localhost:5173`

You should see the PharmFind login page!

## Testing the Application

### 1. Create an Account

1. On the login page, click the **"Sign Up"** tab
2. Fill in the form:
   - First Name: `John`
   - Last Name: `Doe`
   - Email: `john@example.com`
   - Phone: `+961 70 123 456`
   - Password: `password123`
3. Check the terms checkbox
4. Click **"Sign Up"**

You should be redirected to the dashboard!

### 2. Search for Medicines

1. Use the search bar to search for "Panadol" or "Vitamin C"
2. Results should appear showing medicines from different pharmacies

### 3. Add to Favorites

1. Click on a medicine card
2. Click the heart icon to add it to favorites
3. Navigate to the Favorites page to see your saved medicines

### 4. Place an Order

1. Add medicines to your cart
2. Go to the cart page
3. Proceed to checkout
4. Fill in delivery details
5. Complete the order

## Project Structure

```
PharmFInd-effective-main/
├── server/                 # Backend API server
│   ├── server.js          # Main server file
│   ├── database.js         # Database layer
│   ├── package.json       # Backend dependencies
│   ├── data/              # JSON database files (auto-generated)
│   └── README.md          # Backend documentation
├── src/                    # Frontend React application
│   ├── components/        # UI components
│   ├── pages/             # Page components
│   ├── services/          # API service layer
│   ├── contexts/          # React contexts
│   ├── types/             # TypeScript types
│   └── data/              # Mock data (for development)
├── public/                 # Static assets
├── package.json           # Frontend dependencies
├── vite.config.ts         # Vite configuration
└── .env                   # Environment variables (create this)
```

## Troubleshooting

### Backend won't start

**Error: "Port 3000 already in use"**
- Solution: Change the PORT in `server/server.js` or kill the process using port 3000
- Windows: `netstat -ano | findstr :3000` then `taskkill /PID <pid> /F`
- Mac/Linux: `lsof -ti:3000 | xargs kill`

**Error: "Cannot find module"**
- Solution: Make sure you ran `npm install` in the `server/` directory

### Frontend won't start

**Error: "Port 5173 already in use"**
- Solution: Vite will automatically use the next available port

**Error: "Cannot connect to API"**
- Solution: 
  1. Make sure the backend server is running on port 3000
  2. Check that `.env` file has `VITE_API_BASE_URL=http://localhost:3000/api`
  3. Restart the frontend dev server

### CORS Errors

If you see CORS errors in the browser console:
- The backend has CORS enabled by default
- Make sure the backend is running
- Check that `VITE_API_BASE_URL` in `.env` matches your backend URL

### Authentication Issues

**"Invalid credentials" error:**
- Make sure you registered an account first
- Check that email/password are correct
- Try creating a new account

**"Authentication required" error:**
- This means you're not logged in
- Go back to the login page and sign in
- Check browser console for errors

## Features Implemented

✅ **PF-1**: Patient account creation (Sign up)
✅ **PF-2**: User login (with email or phone)
✅ **PF-3**: User preferences (User Settings page exists)
✅ **PF-6**: Place order for pickup or delivery
✅ **PF-10**: Schedule deliveries (via order form)
✅ **PF-30**: Mark medicines as favorites and view order history

## Next Steps

1. **Test all features**: Try creating an account, searching, adding favorites, placing orders
2. **Explore the code**: Check the `src/` directory to see how everything works
3. **Customize**: Modify the backend data, add more medicines/pharmacies
4. **Deploy**: When ready, deploy the backend and frontend to production

## Need Help?

- Check `../../server/README.md` for backend documentation
- Check `../backend/BACKEND_INTEGRATION.md` for API documentation
- Check `../backend/DATABASE_SCHEMA.md` for database structure

## Development Tips

1. **Backend Logs**: Check the backend terminal for API request logs
2. **Frontend DevTools**: Use browser DevTools → Network tab to see API calls
3. **Database Files**: All data is stored in `server/data/*.json` files
4. **Hot Reload**: Both frontend and backend support hot reload on file changes

Happy coding! 🚀

