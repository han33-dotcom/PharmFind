# 🚀 PharmFind Quick Start Guide

Get PharmFind up and running in 5 minutes!

## Prerequisites

- Node.js 18+ ([Download](https://nodejs.org/))

## Installation & Setup

### 1. Install Dependencies

**Frontend:**
```bash
npm install
```

**Backend:**
```bash
cd server
npm install
cd ..
```

### 2. Create Environment File

Create a `.env` file in the project root:

```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_ENABLE_MOCK_DATA=false
```

### 3. Start the Application

**Terminal 1 - Backend:**
```bash
cd server
npm start
```

You should see:
```
🚀 PharmFind API Server running on http://localhost:3000
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

You should see:
```
➜  Local:   http://localhost:5173/
```

### 4. Open in Browser

Go to: **http://localhost:5173**

## First Steps

1. **Create Account**: Click "Sign Up" and create an account
2. **Search Medicines**: Use the search bar to find medicines
3. **Add Favorites**: Click the heart icon on medicines
4. **Place Order**: Add to cart → Checkout → Complete order

## Troubleshooting

**Backend won't start?**
- Check if port 3000 is available
- Make sure you ran `npm install` in `server/` directory

**Frontend can't connect?**
- Make sure backend is running on port 3000
- Check `.env` file has correct API URL
- Restart frontend dev server

**Need more help?**
- See `SETUP.md` for detailed instructions
- Check `server/README.md` for backend docs

## What's Implemented

✅ User registration and login (PF-1, PF-2)
✅ Medicine search and browsing
✅ Pharmacy listings
✅ Add medicines to favorites (PF-30)
✅ Place orders for delivery/pickup (PF-6)
✅ Order history tracking (PF-30)
✅ Address management
✅ User settings page (PF-3)

Enjoy! 🎉

