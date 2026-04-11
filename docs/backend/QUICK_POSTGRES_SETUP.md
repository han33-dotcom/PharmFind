# Quick PostgreSQL Setup Guide

## 🚀 Quick Start (5 Minutes)

### Step 1: Get a PostgreSQL Database

**Option A: Free Cloud Database (Recommended)**
1. Go to [Supabase.com](https://supabase.com)
2. Sign up (free)
3. Create new project
4. Go to Settings → Database
5. Copy the connection string (looks like: `postgresql://postgres:[password]@db.xxx.supabase.co:5432/postgres`)

**Option B: Local PostgreSQL**
1. Install [PostgreSQL](https://www.postgresql.org/download/)
2. Create database: `createdb pharmfind`
3. Connection string: `postgresql://postgres:password@localhost:5432/pharmfind`

### Step 2: Install Dependencies

```bash
cd server
npm install
```

### Step 3: Set Up Database Schema

Create `server/.env` file:
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/pharmfind
DATABASE_SSL=false
```

For Supabase (cloud):
```env
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
DATABASE_SSL=true
```

### Step 4: Create Tables & Seed Data

**Automatic (Recommended):**
```bash
cd server
node database/setup.js
```

**Manual:**
```bash
# Using psql
psql $DATABASE_URL -f server/database/schema.sql
psql $DATABASE_URL -f server/database/seed.sql
```

### Step 5: Start Server

```bash
cd server
npm start
```

You should see:
```
✅ Connected to PostgreSQL database
🚀 PharmFind API Server running on http://localhost:3000
```

## ✅ Done!

Your app now uses PostgreSQL instead of JSON files!

## 📋 What Changed?

- ✅ **Database**: PostgreSQL (production-ready)
- ✅ **Schema**: All tables created automatically
- ✅ **Sample Data**: 8 medicines, 4 pharmacies loaded
- ✅ **Auto-switch**: Server uses PostgreSQL if `DATABASE_URL` is set

## 🔄 Switching Back to JSON Files

If you want to use JSON files again (for development):

1. Remove or comment out `DATABASE_URL` in `server/.env`
2. Restart server
3. It will automatically use JSON files

## 📁 Files Created

- `server/database/schema.sql` - Database schema
- `server/database/seed.sql` - Sample data
- `server/database/postgres.js` - PostgreSQL adapter
- `server/database/setup.js` - Setup script

## 🆘 Troubleshooting

**"connection refused"**
- Check `DATABASE_URL` is correct
- Make sure PostgreSQL is running
- Check firewall settings

**"relation does not exist"**
- Run: `node database/setup.js`

**"password authentication failed"**
- Check username/password in connection string

## 📚 Full Documentation

See `./POSTGRES_MIGRATION.md` for detailed instructions.

