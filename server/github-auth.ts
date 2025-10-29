import express from 'express';

const router = express.Router();

// Store GitHub tokens in memory (in production, use a database)
const userTokens = new Map<string, string>();

/**
 * GitHub OAuth Configuration
 * You need to create a GitHub OAuth App at: https://github.com/settings/developers
 * 
 * Steps:
 * 1. Go to GitHub Settings > Developer settings > OAuth Apps
 * 2. Click "New OAuth App"
 * 3. Fill in:
 *    - Application name: SOTERIA Vulnerability Dashboard
 *    - Homepage URL: http://localhost:5000
 *    - Authorization callback URL: http://localhost:5000/api/auth/github/callback
 * 4. Copy the Client ID and Client Secret
 * 5. Add them to your .env file:
 *    GITHUB_CLIENT_ID=your_client_id
 *    GITHUB_CLIENT_SECRET=your_client_secret
 */

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || '';
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || '';
const REDIRECT_URI = process.env.GITHUB_REDIRECT_URI || 'http://localhost:5000/api/auth/github/callback';

/**
 * Step 1: Redirect user to GitHub OAuth
 */
router.get('/github', (req, res) => {
  const scope = 'repo'; // Request repo access to create PRs
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=${scope}`;
  
  res.redirect(githubAuthUrl);
});

/**
 * Step 2: Handle GitHub OAuth callback
 */
router.get('/github/callback', async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ error: 'No code provided' });
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: REDIRECT_URI,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      return res.status(400).json({ error: tokenData.error_description });
    }

    const accessToken = tokenData.access_token;

    // Get user info
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const userData = await userResponse.json();
    const userId = userData.login;

    // Store token (in production, use secure session/database)
    userTokens.set(userId, accessToken);
    // Also store with default-user key for simplicity
    userTokens.set('default-user', accessToken);

    // Redirect to dashboard with success and username
    res.redirect(`/dashboard?github_connected=true&github_user=${userId}`);
  } catch (error) {
    console.error('GitHub OAuth error:', error);
    res.status(500).json({ error: 'Failed to authenticate with GitHub' });
  }
});

/**
 * Get GitHub connection status
 */
router.get('/github/status', (req, res) => {
  // In production, get userId from session
  const userId = req.query.userId as string;
  
  if (!userId) {
    return res.json({ connected: false });
  }

  const hasToken = userTokens.has(userId);
  res.json({ connected: hasToken });
});

/**
 * Get GitHub access token for a user
 */
export function getGitHubToken(userId: string): string | null {
  return userTokens.get(userId) || null;
}

/**
 * Get user's GitHub repositories
 */
router.get('/github/repos', async (req, res) => {
  const userId = req.query.userId as string;
  
  console.log('Fetching repos for userId:', userId);
  
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  const accessToken = userTokens.get(userId);
  
  console.log('Access token found:', !!accessToken);
  console.log('Available user tokens:', Array.from(userTokens.keys()));
  
  if (!accessToken) {
    return res.status(401).json({ error: 'GitHub not connected', needsAuth: true });
  }

  try {
    // Fetch user's repositories from GitHub
    console.log('Fetching repos from GitHub API...');
    const response = await fetch('https://api.github.com/user/repos?sort=updated&per_page=100', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch repositories');
    }

    const repos = await response.json();
    
    console.log('Received repos from GitHub:', repos.length);
    
    // Format the response
    const formattedRepos = repos.map((repo: any) => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description,
      url: repo.html_url,
      cloneUrl: repo.clone_url,
      language: repo.language,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      isPrivate: repo.private,
      updatedAt: repo.updated_at,
      defaultBranch: repo.default_branch,
    }));

    res.json({ repos: formattedRepos });
  } catch (error) {
    console.error('Error fetching GitHub repos:', error);
    res.status(500).json({ error: 'Failed to fetch repositories' });
  }
});

/**
 * Disconnect GitHub
 */
router.post('/github/disconnect', (req, res) => {
  const { userId } = req.body;
  
  if (userId) {
    userTokens.delete(userId);
  }
  
  res.json({ success: true });
});

export default router;
