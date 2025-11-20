/**
 * Database Setup Script
 * Creates the database schema and seeds initial data
 * 
 * Usage: node database/setup.js
 */

import dotenv from 'dotenv';
dotenv.config();

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const { Pool } = pg;

// Get database URL from environment
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set!');
  console.error('Set it in your .env file: DATABASE_URL=postgresql://...');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false } // required for Supabase
});

async function setupDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('📊 Setting up PharmFind database...\n');

    // Read and execute schema.sql
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('1️⃣  Creating database schema...');
    await client.query(schemaSQL);
    console.log('   ✅ Schema created successfully\n');

    // Read and execute seed.sql
    const seedPath = path.join(__dirname, 'seed.sql');
    const seedSQL = fs.readFileSync(seedPath, 'utf8');
    
    console.log('2️⃣  Seeding sample data...');
    await client.query(seedSQL);
    console.log('   ✅ Sample data seeded successfully\n');

    // Verify setup
    console.log('3️⃣  Verifying setup...');
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log(`   ✅ Found ${tables.rows.length} tables:`);
    tables.rows.forEach(row => {
      console.log(`      - ${row.table_name}`);
    });

    console.log('\n🎉 Database setup complete!');
    console.log('   You can now start your server with: npm start');

  } catch (error) {
    console.error('\n❌ Error setting up database:');
    console.error(error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

setupDatabase();

