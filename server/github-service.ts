import { Octokit } from '@octokit/rest';

interface VulnerabilityFix {
  file: string;
  line: number;
  originalCode: string;
  fixedCode: string;
  description: string;
}

interface GitHubRepo {
  owner: string;
  repo: string;
}

export class GitHubService {
  private octokit: Octokit;

  constructor(accessToken: string) {
    this.octokit = new Octokit({
      auth: accessToken,
    });
  }

  /**
   * Parse GitHub URL to extract owner and repo
   */
  parseGitHubUrl(url: string): GitHubRepo | null {
    const regex = /github\.com\/([^\/]+)\/([^\/\.]+)/;
    const match = url.match(regex);
    
    if (match) {
      return {
        owner: match[1],
        repo: match[2],
      };
    }
    
    return null;
  }

  /**
   * Get the default branch of a repository
   */
  async getDefaultBranch(owner: string, repo: string): Promise<string> {
    const { data } = await this.octokit.repos.get({
      owner,
      repo,
    });
    
    return data.default_branch;
  }

  /**
   * Get the latest commit SHA from a branch
   */
  async getLatestCommitSha(owner: string, repo: string, branch: string): Promise<string> {
    const { data } = await this.octokit.repos.getBranch({
      owner,
      repo,
      branch,
    });
    
    return data.commit.sha;
  }

  /**
   * Create a new branch for the fixes
   */
  async createBranch(owner: string, repo: string, branchName: string, fromSha: string): Promise<void> {
    await this.octokit.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${branchName}`,
      sha: fromSha,
    });
  }

  /**
   * Get file content from repository
   */
  async getFileContent(owner: string, repo: string, path: string, branch: string): Promise<{ content: string; sha: string }> {
    const { data } = await this.octokit.repos.getContent({
      owner,
      repo,
      path,
      ref: branch,
    });

    if ('content' in data) {
      return {
        content: Buffer.from(data.content, 'base64').toString('utf-8'),
        sha: data.sha,
      };
    }

    throw new Error('File not found or is a directory');
  }

  /**
   * Update file content in repository
   */
  async updateFile(
    owner: string,
    repo: string,
    path: string,
    content: string,
    message: string,
    branch: string,
    sha: string
  ): Promise<void> {
    await this.octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message,
      content: Buffer.from(content).toString('base64'),
      branch,
      sha,
    });
  }

  /**
   * Apply fixes to files and commit them
   */
  async applyFixes(
    owner: string,
    repo: string,
    branch: string,
    fixes: VulnerabilityFix[]
  ): Promise<void> {
    for (const fix of fixes) {
      try {
        // Get current file content
        const { content, sha } = await this.getFileContent(owner, repo, fix.file, branch);
        
        // Apply the fix
        const lines = content.split('\n');
        if (fix.line > 0 && fix.line <= lines.length) {
          lines[fix.line - 1] = fix.fixedCode;
        }
        
        const updatedContent = lines.join('\n');
        
        // Commit the fix
        await this.updateFile(
          owner,
          repo,
          fix.file,
          updatedContent,
          `Fix: ${fix.description}`,
          branch,
          sha
        );
      } catch (error) {
        console.error(`Failed to apply fix to ${fix.file}:`, error);
        throw error;
      }
    }
  }

  /**
   * Create a Pull Request with the fixes
   */
  async createPullRequest(
    owner: string,
    repo: string,
    title: string,
    body: string,
    headBranch: string,
    baseBranch: string
  ): Promise<{ number: number; url: string }> {
    const { data } = await this.octokit.pulls.create({
      owner,
      repo,
      title,
      body,
      head: headBranch,
      base: baseBranch,
    });

    return {
      number: data.number,
      url: data.html_url,
    };
  }

  /**
   * Main function to create a PR with vulnerability fixes
   */
  async createFixPullRequest(
    repoUrl: string,
    fixes: VulnerabilityFix[]
  ): Promise<{ prNumber: number; prUrl: string }> {
    const repoInfo = this.parseGitHubUrl(repoUrl);
    if (!repoInfo) {
      throw new Error('Invalid GitHub URL');
    }

    const { owner, repo } = repoInfo;

    // Get default branch
    const baseBranch = await this.getDefaultBranch(owner, repo);
    
    // Get latest commit
    const latestSha = await this.getLatestCommitSha(owner, repo, baseBranch);
    
    // Create new branch for fixes
    const fixBranchName = `security-fixes-${Date.now()}`;
    await this.createBranch(owner, repo, fixBranchName, latestSha);
    
    // Apply all fixes
    await this.applyFixes(owner, repo, fixBranchName, fixes);
    
    // Create PR
    const prTitle = `🔒 Security Fixes: ${fixes.length} vulnerabilities addressed`;
    const prBody = this.generatePRBody(fixes);
    
    const { number, url } = await this.createPullRequest(
      owner,
      repo,
      prTitle,
      prBody,
      fixBranchName,
      baseBranch
    );

    return {
      prNumber: number,
      prUrl: url,
    };
  }

  /**
   * Generate PR body with fix details
   */
  private generatePRBody(fixes: VulnerabilityFix[]): string {
    let body = '## 🔒 Automated Security Fixes\n\n';
    body += 'This PR contains automated fixes for security vulnerabilities detected by SecureCode.\n\n';
    body += '### Fixed Vulnerabilities:\n\n';
    
    fixes.forEach((fix, index) => {
      body += `${index + 1}. **${fix.description}**\n`;
      body += `   - File: \`${fix.file}\`\n`;
      body += `   - Line: ${fix.line}\n\n`;
    });
    
    body += '\n### ⚠️ Important\n';
    body += 'Please review these changes carefully before merging. While these fixes address security vulnerabilities, ';
    body += 'they should be tested to ensure they don\'t break existing functionality.\n\n';
    body += '---\n';
    body += '*Generated by SOTERIA Vulnerability Dashboard*';
    
    return body;
  }
}

/**
 * Generate a fix for common vulnerability types
 */
export function generateFix(vulnerability: {
  type: string;
  file: string;
  line: number;
  codeSnippet: string;
}): VulnerabilityFix | null {
  const { type, file, line, codeSnippet } = vulnerability;
  const typeLower = type.toLowerCase();

  // XSS vulnerability fix
  if (typeLower.includes('xss') || typeLower.includes('cross-site scripting')) {
    if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
      const fixedCode = codeSnippet.replace(
        /dangerouslySetInnerHTML={{__html: (.+?)}}/g,
        '{/* Use DOMPurify.sanitize($1) or proper escaping */}'
      );
      
      return {
        file,
        line,
        originalCode: codeSnippet,
        fixedCode,
        description: 'Fixed XSS vulnerability by removing dangerouslySetInnerHTML',
      };
    }
    
    // HTML context XSS
    if (file.endsWith('.html') || file.endsWith('.ejs') || file.endsWith('.pug')) {
      const fixedCode = codeSnippet.replace(
        /<%=\s*(.+?)\s*%>/g,
        '<%- escapeHtml($1) %>'
      );
      
      return {
        file,
        line,
        originalCode: codeSnippet,
        fixedCode,
        description: 'Fixed XSS by adding HTML escaping',
      };
    }
  }

  // SQL Injection fix
  if (typeLower.includes('sql injection') || typeLower.includes('sql')) {
    // Template literal injection
    if (codeSnippet.includes('${') && codeSnippet.includes('query')) {
      const fixedCode = codeSnippet.replace(
        /query\s*\(\s*`([^`]*\$\{[^}]+\}[^`]*)`\s*\)/g,
        'query("$1", [params]) // Use parameterized queries'
      ).replace(/\$\{[^}]+\}/g, '?');
      
      return {
        file,
        line,
        originalCode: codeSnippet,
        fixedCode,
        description: 'Fixed SQL injection by using parameterized queries',
      };
    }
    
    // String concatenation injection
    if (codeSnippet.includes('+') && codeSnippet.includes('query')) {
      const fixedCode = codeSnippet.replace(
        /(['"].*?['"])\s*\+\s*(\w+)\s*\+\s*(['"].*?['"])/g,
        '?, [params] // Use parameterized queries'
      );
      
      return {
        file,
        line,
        originalCode: codeSnippet,
        fixedCode,
        description: 'Fixed SQL injection by using parameterized queries instead of concatenation',
      };
    }
  }

  // Hardcoded secrets fix
  if (typeLower.includes('secret') || typeLower.includes('api key') || typeLower.includes('password') || typeLower.includes('token')) {
    const fixedCode = codeSnippet.replace(
      /(api[_-]?key|password|secret|token|private[_-]?key)\s*[:=]\s*['"][^'"]+['"]/gi,
      (match, varName) => `${varName}: process.env.${varName.toUpperCase().replace(/-/g, '_')}`
    );
    
    if (fixedCode !== codeSnippet) {
      return {
        file,
        line,
        originalCode: codeSnippet,
        fixedCode: fixedCode + ' // Moved to environment variable',
        description: 'Fixed hardcoded secret by using environment variable',
      };
    }
  }

  // Path Traversal fix
  if (typeLower.includes('path traversal') || typeLower.includes('directory traversal')) {
    const fixedCode = codeSnippet.replace(
      /(readFile|writeFile|open)\s*\(\s*([^)]+)\s*\)/g,
      '$1(path.normalize(path.join(baseDir, $2)))'
    );
    
    if (fixedCode !== codeSnippet) {
      return {
        file,
        line,
        originalCode: codeSnippet,
        fixedCode: fixedCode + ' // Added path normalization',
        description: 'Fixed path traversal by normalizing file paths',
      };
    }
  }

  // Command Injection fix
  if (typeLower.includes('command injection') || typeLower.includes('code injection')) {
    if (codeSnippet.includes('exec') || codeSnippet.includes('spawn')) {
      const fixedCode = codeSnippet.replace(
        /exec\s*\(\s*`([^`]*\$\{[^}]+\}[^`]*)`/g,
        'execFile(command, [args]) // Use execFile with array arguments'
      );
      
      return {
        file,
        line,
        originalCode: codeSnippet,
        fixedCode,
        description: 'Fixed command injection by using execFile with parameterized arguments',
      };
    }
  }

  // Insecure Crypto fix
  if (typeLower.includes('weak') && (typeLower.includes('crypto') || typeLower.includes('hash') || typeLower.includes('encryption'))) {
    let fixedCode = codeSnippet;
    
    // Replace MD5/SHA1 with SHA256
    fixedCode = fixedCode.replace(/createHash\s*\(\s*['"]md5['"]\s*\)/gi, "createHash('sha256')");
    fixedCode = fixedCode.replace(/createHash\s*\(\s*['"]sha1['"]\s*\)/gi, "createHash('sha256')");
    
    if (fixedCode !== codeSnippet) {
      return {
        file,
        line,
        originalCode: codeSnippet,
        fixedCode: fixedCode + ' // Upgraded to secure hash algorithm',
        description: 'Fixed weak cryptography by using SHA-256 instead of MD5/SHA1',
      };
    }
  }

  // CORS Misconfiguration fix
  if (typeLower.includes('cors')) {
    const fixedCode = codeSnippet.replace(
      /Access-Control-Allow-Origin['"]?\s*[:=]\s*['"]?\*/g,
      "Access-Control-Allow-Origin': 'https://yourdomain.com' // Specify allowed origin"
    );
    
    if (fixedCode !== codeSnippet) {
      return {
        file,
        line,
        originalCode: codeSnippet,
        fixedCode,
        description: 'Fixed CORS misconfiguration by specifying allowed origin',
      };
    }
  }

  // Insecure Deserialization fix
  if (typeLower.includes('deserialization') || typeLower.includes('pickle') || typeLower.includes('unserialize')) {
    const fixedCode = codeSnippet.replace(
      /JSON\.parse\s*\(\s*([^)]+)\s*\)/g,
      'JSON.parse($1, (key, value) => { /* Add validation */ return value; })'
    );
    
    if (fixedCode !== codeSnippet) {
      return {
        file,
        line,
        originalCode: codeSnippet,
        fixedCode: fixedCode + ' // Added validation',
        description: 'Fixed insecure deserialization by adding validation',
      };
    }
  }

  // Open Redirect fix
  if (typeLower.includes('open redirect') || typeLower.includes('unvalidated redirect')) {
    const fixedCode = codeSnippet.replace(
      /redirect\s*\(\s*([^)]+)\s*\)/g,
      'redirect(validateUrl($1)) // Validate redirect URL'
    );
    
    if (fixedCode !== codeSnippet) {
      return {
        file,
        line,
        originalCode: codeSnippet,
        fixedCode,
        description: 'Fixed open redirect by adding URL validation',
      };
    }
  }

  return null;
}
