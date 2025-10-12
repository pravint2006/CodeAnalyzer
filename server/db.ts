import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../shared/schema';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { and, desc as descFn, eq as eqFn, sql } from 'drizzle-orm';

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/vulnerability_scanner',
});

export const db = drizzle(pool, { schema });

// Initialize database with migrations
export async function initDB() {
  try {
    await migrate(db, { migrationsFolder: './migrations' });
    console.log('Database migrations completed successfully');
  } catch (error) {
    console.error('Error running migrations:', error);
    process.exit(1);
  }
}

// Scan Results
export async function createScan(scanData: schema.NewScanResult) {
  const [result] = await db
    .insert(schema.scanResults)
    .values(scanData)
    .returning();
  return result;
}

export async function updateScan(scanId: number, updateData: Partial<schema.NewScanResult>) {
  const [result] = await db
    .update(schema.scanResults)
    .set({ ...updateData, updatedAt: new Date() })
    .where(eqFn(schema.scanResults.id, scanId))
    .returning();
  return result;
}

export async function getScan(scanId: number) {
  const [result] = await db
    .select()
    .from(schema.scanResults)
    .where(eqFn(schema.scanResults.id, scanId));
  return result;
}

export async function listScans(limit = 10, offset = 0) {
  const results = await db
    .select()
    .from(schema.scanResults)
    .orderBy(sql`${schema.scanResults.createdAt} DESC`)
    .limit(limit)
    .offset(offset);
  return results;
}

// Vulnerabilities
export async function createVulnerability(vulnData: schema.NewVulnerability) {
  const [result] = await db
    .insert(schema.vulnerabilities)
    .values(vulnData)
    .returning();
  return result;
}

export async function createVulnerabilities(vulns: schema.NewVulnerability[]) {
  if (vulns.length === 0) return [];
  const results = await db
    .insert(schema.vulnerabilities)
    .values(vulns)
    .returning();
  return results;
}

export async function updateVulnerability(vulnId: number, updateData: Partial<schema.NewVulnerability>) {
  const [result] = await db
    .update(schema.vulnerabilities)
    .set({ ...updateData, updatedAt: new Date() })
    .where(eqFn(schema.vulnerabilities.id, vulnId))
    .returning();
  return result;
}

export async function getVulnerabilitiesByScan(scanId: number, status?: schema.VulnerabilityStatus) {
  const query = db
    .select()
    .from(schema.vulnerabilities)
    .where(
      status 
        ? and(
            eqFn(schema.vulnerabilities.scanId, scanId),
            eqFn(schema.vulnerabilities.status, status)
          )
        : eqFn(schema.vulnerabilities.scanId, scanId)
    );

  return await query;
}

export async function updateVulnerabilityStatus(vulnId: number, status: schema.VulnerabilityStatus) {
  const [result] = await db
    .update(schema.vulnerabilities)
    .set({ 
      status,
      updatedAt: new Date() 
    })
    .where(eqFn(schema.vulnerabilities.id, vulnId))
    .returning();
  return result;
}

// Helper functions
function eq(column: any, value: any) {
  return eq(column, value);
}

function desc(column: any) {
  return { column, order: 'desc' } as const;
}
