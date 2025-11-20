# PostgreSQL Migration Guide

This guide will help you migrate from JSON file-based database to PostgreSQL.

## Prerequisites

1. **PostgreSQL installed** (or use a cloud database)
   - Local: [Download PostgreSQL](https://www.postgresql.org/download/)
   - Cloud options: [Supabase](https://supabase.com), [Railway](https://railway.app), [Neon](https://neon.tech), [Render](https://render.com)

2. **Node.js dependencies**
   ```bash
   cd server
   npm install
   ```

## Step 1: Set Up PostgreSQL Database

### Option A: Local PostgreSQL

1. **Install PostgreSQL** on your machine
2. **Create a database:**
   ```bash
   # Connect to PostgreSQL
   psql -U postgres
   
   # Create database
   CREATE DATABASE pharmfind;
   
   # Exit psql
   \q
   ```

3. **Connection string format:**
   ```
   postgresql://username:password@localhost:5432/pharmfind
   ```

### Option B: Cloud Database (Recommended)

#### Supabase (Free tier available)
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings → Database
4. Copy the connection string (looks like: `postgresql://postgres:[password]@[host]:5432/postgres`)

#### Railway
1. Go to [railway.app](https://railway.app)
2. Create new project → Add PostgreSQL
3. Copy the connection string from the database settings

## Step 2: Create Database Schema

Run the SQL schema file to create all tables:

### Using psql (Command Line):
```bash
psql -U postgres -d pharmfind -f server/database/schema.sql
```

### Using pgAdmin or DBeaver:
1. Open your database tool
2. Connect to your database
3. Open `server/database/schema.sql`
4. Execute the script

### Using Node.js Script:
```bash
cd server
node database/setup.js
```
*(Create setup.js if needed - see below)*

## Step 3: Seed Sample Data

Run the seed data SQL file:

```bash
psql -U postgres -d pharmfind -f server/database/seed.sql
```

Or execute `seed.sql` in your database tool.

## Step 4: Configure Environment Variables

Create or update `server/.env` file:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/pharmfind
DATABASE_SSL=false

# For cloud databases, you might need:
# DATABASE_SSL=true
```

**Important:** Replace with your actual connection string!

### For Supabase:
```env
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
DATABASE_SSL=true
```

### For Railway/Render:
```env
DATABASE_URL=[YOUR_CONNECTION_STRING_FROM_RAILWAY]
DATABASE_SSL=true
```

## Step 5: Test the Connection

The server will automatically use PostgreSQL if `DATABASE_URL` is set.

1. **Start the server:**
   ```bash
   cd server
   npm start
   ```

2. **Check for connection message:**
   ```
   ✅ Connected to PostgreSQL database
   ```

3. **If you see errors:**
   - Check your `DATABASE_URL` is correct
   - Make sure PostgreSQL is running
   - Check firewall settings for cloud databases
   - Verify database exists and schema is created

## Step 6: Verify Migration

1. **Register a new user** via the API
2. **Check database:**
   ```sql
   SELECT * FROM users;
   ```

3. **Test all features:**
   - Search medicines
   - Create orders
   - Add favorites
   - Manage addresses

## Migration Checklist

- [ ] PostgreSQL installed/cloud database created
- [ ] Database created
- [ ] Schema SQL executed (`schema.sql`)
- [ ] Seed data loaded (`seed.sql`)
- [ ] `DATABASE_URL` set in `server/.env`
- [ ] Server starts without errors
- [ ] Can register new users
- [ ] Can query medicines
- [ ] All features working

## Switching Back to JSON Files

If you want to switch back to JSON files (for development):

1. **Remove or comment out `DATABASE_URL`** in `server/.env`
2. **Restart the server**
3. The server will automatically use JSON files

## Database Schema

The PostgreSQL schema includes:

- ✅ All tables from `DATABASE_SCHEMA.md`
- ✅ Foreign key relationships
- ✅ Indexes for performance
- ✅ Check constraints
- ✅ Auto-update triggers for `updated_at`
- ✅ Auto-create order status history

## Troubleshooting

### Error: "relation does not exist"
**Solution:** Run the `schema.sql` file to create all tables

### Error: "connection refused"
**Solution:** 
- Check PostgreSQL is running
- Verify connection string is correct
- Check firewall/network settings

### Error: "password authentication failed"
**Solution:** 
- Verify username/password in connection string
- Check PostgreSQL user permissions

### Error: "database does not exist"
**Solution:** Create the database first:
```sql
CREATE DATABASE pharmfind;
```

### SSL Connection Errors
**Solution:** Set `DATABASE_SSL=true` in `.env` for cloud databases

## Performance Tips

1. **Connection Pooling:** Already configured (max 20 connections)
2. **Indexes:** Automatically created for frequently queried columns
3. **Transactions:** Used for order creation to ensure data integrity

## Backup

To backup your PostgreSQL database:

```bash
pg_dump -U postgres pharmfind > backup.sql
```

To restore:

```bash
psql -U postgres pharmfind < backup.sql
```

## Next Steps

1. ✅ Database is now production-ready
2. ✅ Consider setting up automated backups
3. ✅ Monitor database performance
4. ✅ Set up database migrations for future schema changes

---

**Need Help?** Check the PostgreSQL documentation or your cloud provider's docs.

