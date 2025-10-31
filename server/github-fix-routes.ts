import express from 'express';
import { GitHubService, generateFix } from './github-service';
import { getGitHubToken } from './github-auth';

const router = express.Router();

/**
 * Create a Pull Request with vulnerability fixes
 * POST /api/github/create-fix-pr
 * 
 * Body:
 * {
 *   userId: string,
 *   repoUrl: string,
 *   vulnerabilities: Array<{
 *     id: string,
 *     type: string,
 *     file: string,
 *     line: number,
 *     codeSnippet: string,
 *     title: string
 *   }>
 * }
 */
router.post('/create-fix-pr', async (req, res) => {
  try {
    const { userId, repoUrl, vulnerabilities } = req.body;

    if (!userId || !repoUrl || !vulnerabilities) {
      return res.status(400).json({ 
        error: 'Missing required fields: userId, repoUrl, vulnerabilities' 
      });
    }

    // Get user's GitHub token
    const accessToken = getGitHubToken(userId);
    
    if (!accessToken) {
      return res.status(401).json({ 
        error: 'GitHub not connected. Please authenticate with GitHub first.',
        needsAuth: true
      });
    }

    // Initialize GitHub service
    const githubService = new GitHubService(accessToken);

    // Generate fixes for vulnerabilities
    const fixes = vulnerabilities
      .map((vuln: any) => generateFix({
        type: vuln.type || vuln.title,
        file: vuln.file,
        line: vuln.line,
        codeSnippet: vuln.codeSnippet,
      }))
      .filter((fix: any) => fix !== null);

    if (fixes.length === 0) {
      return res.status(400).json({ 
        error: 'No fixes could be generated for the provided vulnerabilities' 
      });
    }

    // Create PR with fixes
    const { prNumber, prUrl } = await githubService.createFixPullRequest(
      repoUrl,
      fixes
    );

    res.json({
      success: true,
      prNumber,
      prUrl,
      fixesApplied: fixes.length,
      message: `Successfully created PR #${prNumber} with ${fixes.length} security fixes`,
    });

  } catch (error: any) {
    console.error('Error creating fix PR:', error);
    
    res.status(500).json({
      error: error.message || 'Failed to create Pull Request',
      details: error.toString(),
    });
  }
});

/**
 * Generate fix preview for a single vulnerability
 * POST /api/github/preview-fix
 */
router.post('/preview-fix', async (req, res) => {
  try {
    console.log('Received preview-fix request with body:', JSON.stringify(req.body, null, 2));
    
    const { vulnerability } = req.body;

    if (!vulnerability) {
      console.error('No vulnerability data provided');
      return res.status(400).json({ error: 'Missing vulnerability data' });
    }

    console.log('Generating fix for vulnerability:', {
      type: vulnerability.type,
      title: vulnerability.title,
      file: vulnerability.file,
      line: vulnerability.line,
      codeSnippet: vulnerability.codeSnippet
    });

    const fix = generateFix({
      type: vulnerability.type || vulnerability.title,
      file: vulnerability.file,
      line: vulnerability.line,
      codeSnippet: vulnerability.codeSnippet,
    });

    if (!fix) {
      return res.json({
        canFix: false,
        message: 'No automatic fix available for this vulnerability type',
      });
    }

    res.json({
      canFix: true,
      fix: {
        description: fix.description,
        originalCode: fix.originalCode,
        fixedCode: fix.fixedCode,
      },
    });

  } catch (error: any) {
    console.error('Error previewing fix:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
