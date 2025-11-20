# PostgreSQL Setup - Simple Guide

## What You Need to Do

You need a **PostgreSQL database** to store your data. Think of it like a cloud spreadsheet that your app can use.

## 🎯 Option 1: Free Cloud Database (EASIEST - Recommended)

### Step 1: Sign Up for Supabase (Free)

1. **Go to:** https://supabase.com
2. **Click:** "Start your project" or "Sign up"
3. **Create account:** Use your email/GitHub/Google
4. **Create new project:**
   - Click "New Project"
   - Give it a name: `pharmfind` (or anything you want)
   - Choose a password (remember this!)
   - Wait 2-3 minutes for it to create

### Step 2: Get Your Connection String

1. **In your Supabase project**, click **Settings** (gear icon on left)
2. **Click:** "Database" in the left menu
3. **Scroll down** to "Connection string"
4. **Look for:** "URI" or "Connection string"
5. **Copy the string** - it looks like this:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxxx.supabase.co:5432/postgres
   ```
   ⚠️ **Important:** Replace `[YOUR-PASSWORD]` with the password you created!

### Step 3: Save It

Copy this connection string - you'll need it in Step 3!

**Example:**
```
postgresql://postgres:MyPassword123@db.abcdefghijkl.supabase.co:5432/postgres
```

---

## 🖥️ Option 2: Local PostgreSQL (On Your Computer)

### Step 1: Install PostgreSQL

1. **Download:** https://www.postgresql.org/download/windows/
2. **Install it** (use default settings)
3. **Remember the password** you set during installation (usually `postgres`)

### Step 2: Create Database

1. **Open:** "SQL Shell (psql)" from Start Menu
2. **Press Enter** 4 times (use defaults)
3. **Enter password** when asked
4. **Type:** `CREATE DATABASE pharmfind;`
5. **Press Enter**
6. **Type:** `\q` to exit

### Step 3: Connection String

Your connection string will be:
```
postgresql://postgres:YOUR_PASSWORD@localhost:5432/pharmfind
```

Replace `YOUR_PASSWORD` with the password you set during installation.

---

## 🎯 What You'll Have After Step 1

You'll have a **connection string** that looks like one of these:

**Cloud (Supabase):**
```
postgresql://postgres:MyPassword@db.xxx.supabase.co:5432/postgres
```

**Local:**
```
postgresql://postgres:postgres@localhost:5432/pharmfind
```

**This connection string is what you need for Step 2!**

---

## 📋 Quick Summary

**Easiest Way:**
1. Go to https://supabase.com
2. Sign up (free)
3. Create new project
4. Copy connection string from Settings → Database
5. Done! ✅

**Takes:** ~5 minutes

---

## 💡 Which Option Should I Choose?

- **New to databases?** → Use **Option 1 (Supabase)** - It's free and easy
- **Want to learn?** → Use **Option 2 (Local)** - Install on your computer
- **Production/Deployment?** → Use **Option 1 (Cloud)** - Better for hosting

---

## 🆘 Troubleshooting

**"I don't see connection string"**
- Make sure you're in Settings → Database
- Look for "Connection string" or "URI"
- It might be under "Connection pooling"

**"I forgot my password"**
- In Supabase: Project Settings → Database → Reset password
- Local: You'll need to reinstall or reset PostgreSQL password

**"What's a connection string?"**
- It's like an address to your database
- It tells your app where to find the database and how to connect
- Like: `postgresql://username:password@host:port/database`

---

**Next Step:** Once you have your connection string, go to Step 2 in the main guide!

