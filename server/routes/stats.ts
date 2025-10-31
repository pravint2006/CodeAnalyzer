import { Router } from 'express';
import { db } from '../db';
import { sql } from 'drizzle-orm';
import * as schema from '../shared/schema';

const router = Router();

router.get('/dashboard', async (req, res) => {
  try {
    // Get total number of scans
    const scanCountRows = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(schema.scanResults);
    const totalScans = scanCountRows[0]?.count ?? 0;

    // Get total number of issues found
    const issueCountRows = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(schema.scanResults)
      .where(sql`severity IN ('high', 'medium', 'low')`);
    const totalIssues = issueCountRows[0]?.count ?? 0;

    // Get number of fixed issues
    const fixedCountRows = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(schema.scanResults)
      .where(sql`status = 'fixed'`);
    const fixedIssues = fixedCountRows[0]?.count ?? 0;

    // Get number of connected repositories
    const repoCountRows = await db
      .select({ count: sql<number>`COUNT(DISTINCT repo_id)` })
      .from(schema.repositories);
    const totalRepos = repoCountRows[0]?.count ?? 0;

    res.json({
      totalScans,
      totalIssues,
      fixedIssues,
      totalRepos
    });
    
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch dashboard statistics',
      details: error.message 
    });
  }
});

export default router;
