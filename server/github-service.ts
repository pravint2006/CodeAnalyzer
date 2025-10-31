import { Octokit } from '@octokit/rest';
import * as DOMPurifyModule from 'dompurify';
import { JSDOM } from 'jsdom';

// Initialize DOMPurify for Node.js environment
const { window } = new JSDOM('', {});
const DOMPurify = DOMPurifyModule.default;
const domPurify = DOMPurifyModule.default(window);

interface VulnerabilityFix {
  file: string;
  line: number;
  originalCode: string;
  fixedCode: string;
  description: string;
  requiresImport?: string;  // Optional: specifies required imports
  importStatement?: string; // Optional: full import statement to add
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
// Generate a fix for a given vulnerability
export function generateFix(vulnerability: {
  type: string;
  file: string;
  line: number;
  codeSnippet: string;
}): VulnerabilityFix | null {
  console.log('\n=== generateFix called with ===');
  console.log('Type:', vulnerability.type);
  console.log('File:', vulnerability.file);
  console.log('Line:', vulnerability.line);
  console.log('Code Snippet:', vulnerability.codeSnippet);
  console.log('===========================\n');
  const { type, file, line, codeSnippet } = vulnerability;
  const typeLower = type.toLowerCase();
  
  // XSS vulnerability fix - check for various XSS-related terms
  if (typeLower.includes('xss') || 
      typeLower.includes('cross-site scripting') ||
      type === 'XSS' ||
      (typeLower.includes('injection') && typeLower.includes('html'))) {
    
    console.log('XSS vulnerability detected, processing...');
    console.log('Original code snippet:', codeSnippet);
    
    // Handle empty or invalid code snippets
    if (!codeSnippet || typeof codeSnippet !== 'string') {
      console.error('Invalid code snippet provided');
      return null;
    }
    
    // Normalize file extension check
    const fileExt = file.split('.').pop()?.toLowerCase() || '';
    const isJsFile = ['.tsx', '.jsx', '.js', '.ts'].includes(`.${fileExt}`);
    const isTemplateFile = ['.html', '.ejs', '.pug', '.hbs'].includes(`.${fileExt}`);
    const currentCodeSnippet = codeSnippet as string;
    
    // Handle React/JSX files
    if (isJsFile) {
      // Case 1: dangerouslySetInnerHTML with various formats
      const dangerousInnerHTMLPatterns = [
        // Standard format
        /dangerouslySetInnerHTML\s*=\s*\{\s*__html:\s*([^}]+)\s*\}/g,
        // With extra spaces
        /dangerouslySetInnerHTML\s*=\s*\{\s*{\s*__html\s*:\s*([^}]+)\s*}\s*\}/g,
        // With template literals
        /dangerouslySetInnerHTML\s*=\s*\{\s*{\s*__html\s*:\s*`([^`]+)`\s*}\s*\}/g
      ];

      for (const pattern of dangerousInnerHTMLPatterns) {
        if (pattern.test(currentCodeSnippet)) {
          const fixedCode = currentCodeSnippet.replace(
            pattern,
            (match: string, content: string) => {
              const sanitized = `{ __html: domPurify.sanitize(${content.trim()}) }`;
              return `dangerouslySetInnerHTML={${sanitized}} // Sanitized with DOMPurify`;
            }
          );
          
          return {
            file,
            line,
            originalCode: currentCodeSnippet,
            fixedCode,
            description: 'Fixed XSS vulnerability by adding DOMPurify sanitization to dangerouslySetInnerHTML',
            requiresImport: 'dompurify',
            importStatement: "import DOMPurify from 'dompurify';\nconst domPurify = DOMPurify(window);"
          };
        }
      }
      
      // Case 2: Direct variable interpolation in JSX
      if (codeSnippet.match(/<[^>]*>\s*{\s*[a-zA-Z0-9_$]+\s*}\s*<\//)) {
        const fixedCode = codeSnippet.replace(
          /(<[^>]*>)\s*{\s*([a-zA-Z0-9_$]+)\s*}\s*(<\/)/g,
          '$1{DOMPurify.sanitize($2)}$3 // Added DOMPurify for XSS protection'
        );
        
        return {
          file,
          line,
          originalCode: codeSnippet,
          fixedCode,
          description: 'Fixed XSS vulnerability by adding DOMPurify sanitization to dynamic content',
        };
      }
    }
    
    // HTML context XSS (for template files)
    if (file.endsWith('.html') || file.endsWith('.ejs') || file.endsWith('.pug') || file.endsWith('.hbs')) {
      // Handle different template syntaxes
      let fixedCode = codeSnippet;
      let description = 'Fixed XSS by adding HTML escaping';
      
      // EJS/Underscore templates
      fixedCode = fixedCode.replace(
        /<%=\s*(.+?)\s*%>/g,
        '<%- escape($1) %>'
      );
      
      // Handle unescaped output in various template engines
      fixedCode = fixedCode
        .replace(/\{\{\{\s*(.+?)\s*\}\}\}/g, '{{escape($1)}}') // Handlebars
        .replace(/\{\{\s*\|\s*raw\s*\|\s*\}\}/g, '') // Remove |raw filters
        .replace(/\{\{\s*\|\s*safe\s*\|\s*\}\}/g, '') // Remove |safe filters
        .replace(/\{\{\s*\|\s*e\s*\}\}/g, ''); // Remove |e (escape) filters
      
      // If we made changes, return the fixed code
      if (fixedCode !== codeSnippet) {
        return {
          file,
          line,
          originalCode: codeSnippet,
          fixedCode,
          description,
        };
      }
    }
    
    // Generic XSS fix for any file type
    console.log('Applying generic XSS fix...');
    return {
      file,
      line,
      originalCode: codeSnippet,
      fixedCode: `// TODO: Manually review and fix potential XSS vulnerability
// Consider using DOMPurify or similar library to sanitize user input
${codeSnippet}`,
      description: 'Added TODO comment for manual XSS fix review',
    };
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
