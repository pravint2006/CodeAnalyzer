import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import * as path from 'path';
import * as fs from 'fs';

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/vulnerability_scanner',
});

const db = drizzle(pool);

// Create the database if it doesn't exist
async function ensureDatabase() {
  const client = await pool.connect();
  try {
    await client.query('CREATE DATABASE vulnerability_scanner');
    console.log('Created database: vulnerability_scanner');
  } catch (error: any) {
    // Database already exists, which is fine
    if (error.code !== '42P04') {
      console.error('Error creating database:', error);
      process.exit(1);
    }
  } finally {
    await client.release();
  }
}

// Create the enum types
async function createEnums() {
  const client = await pool.connect();
  try {
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'severity') THEN
          CREATE TYPE severity AS ENUM ('critical', 'high', 'medium', 'low', 'info');
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'scan_status') THEN
          CREATE TYPE scan_status AS ENUM ('queued', 'in-progress', 'completed', 'failed');
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vulnerability_status') THEN
          CREATE TYPE vulnerability_status AS ENUM ('open', 'in-progress', 'fixed', 'false-positive', 'wont-fix');
        END IF;
      END
      $$;
    `);
    console.log('Created enum types');
  } catch (error) {
    console.error('Error creating enum types:', error);
    throw error;
  } finally {
    await client.release();
  }
}

// Run migrations
async function runMigrations() {
  console.log('Running migrations...');
  
  // Create migrations directory if it doesn't exist
  const migrationsDir = path.join(__dirname, '../migrations');
  if (!fs.existsSync(migrationsDir)) {
    fs.mkdirSync(migrationsDir, { recursive: true });
  }
  
  await migrate(db, { migrationsFolder: migrationsDir });
  console.log('Migrations completed successfully');
}

// Main function
async function main() {
  try {
    console.log('Initializing database...');
    await ensureDatabase();
    await createEnums();
    await runMigrations();
    console.log('Database initialization completed successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
