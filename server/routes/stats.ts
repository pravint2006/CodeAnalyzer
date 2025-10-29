import { Router } from 'express';
import { db } from '../db';

const router = Router();

router.get('/dashboard', async (req, res) => {
  try {
    // Get total number of scans
    const [scanCount] = await db.query('SELECT COUNT(*) as count FROM scans');
    
    // Get total number of issues found
    const [issueCount] = await db.query(
      `SELECT COUNT(*) as count FROM scan_results 
       WHERE severity IN ('high', 'medium', 'low')`
    );
    
    // Get number of fixed issues
    const [fixedCount] = await db.query(
      `SELECT COUNT(*) as count FROM scan_results 
       WHERE status = 'fixed'`
    );
    
    // Get number of connected repositories
    const [repoCount] = await db.query('SELECT COUNT(DISTINCT repo_id) as count FROM repositories');
    
    res.json({
      totalScans: scanCount[0].count,
      totalIssues: issueCount[0].count,
      fixedIssues: fixedCount[0].count,
      totalRepos: repoCount[0].count
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
