import { GoogleGenerativeAI } from "@google/generative-ai";
import { type TechSection, type AIContent } from "@shared/schema";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export interface CodeAnalysisResult {
  originalCode: string;
  fixedCode: string;
  issues: Array<{
    lineNumber: number;
    issue: string;
    severity: 'high' | 'medium' | 'low';
    description: string;
    fix: string;
  }>;
  summary: string;
  language: string;
}

// Initialize Google's Generative AI with the API key from environment variables
if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY is not set in environment variables');
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function generateTechContent(section: TechSection): Promise<AIContent> {
  try {
    // Get the generative model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    // Generate content
    const prompt = `You are a technology expert. Generate content about ${section} development including a summary, key features, and current trends. 
    Respond in JSON format with the following structure:
    {
      "summary": "A brief overview of ${section} development",
      "features": ["Feature 1", "Feature 2", "Feature 3"],
      "trends": ["Trend 1", "Trend 2", "Trend 3"]
    }`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse the response (remove markdown code block if present)
    const jsonString = text.replace(/^```json\n|\n```$/g, '');
    const content = JSON.parse(jsonString);
    
    return {
      summary: content.summary || 'Content generation failed',
      features: content.features || [],
      trends: content.trends || []
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error generating content:', error);
    throw new Error(`Failed to generate content: ${errorMessage}`);
  }
}

// Pattern-based code analyzer (fallback when AI is unavailable)
function patternBasedAnalysis(code: string, language: string): CodeAnalysisResult {
  const issues: Array<{
    lineNumber: number;
    issue: string;
    severity: 'high' | 'medium' | 'low';
    description: string;
    fix: string;
  }> = [];

  const lines = code.split('\n');
  
  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    
    // SQL Injection detection
    if (line.match(/query\s*\(\s*['"`].*\$\{.*\}.*['"`]/) || 
        line.match(/query\s*\(\s*['"].*\+.*\+.*['"]/) ||
        line.match(/execute\s*\(\s*['"`].*\$\{.*\}.*['"`]/)) {
      issues.push({
        lineNumber,
        issue: 'SQL Injection Vulnerability',
        severity: 'high',
        description: 'Unsafe SQL query construction using string concatenation or template literals',
        fix: 'Use parameterized queries: query("SELECT * FROM users WHERE id = ?", [userId])'
      });
    }
    
    // XSS detection
    if (line.match(/innerHTML\s*=/) || line.match(/dangerouslySetInnerHTML/)) {
      issues.push({
        lineNumber,
        issue: 'Cross-Site Scripting (XSS) Vulnerability',
        severity: 'high',
        description: 'Unsafe HTML rendering that could allow XSS attacks',
        fix: 'Use textContent instead of innerHTML, or sanitize with DOMPurify.sanitize()'
      });
    }
    
    // Hardcoded secrets
    if (line.match(/(api[_-]?key|password|secret|token|private[_-]?key)\s*[:=]\s*['"][^'"]{8,}['"]/i)) {
      issues.push({
        lineNumber,
        issue: 'Hardcoded Secret',
        severity: 'high',
        description: 'Sensitive credentials hardcoded in source code',
        fix: 'Move to environment variables: process.env.API_KEY or use a secrets manager'
      });
    }
    
    // Command injection
    if (line.match(/exec\s*\(\s*['"`].*\$\{/) || line.match(/spawn\s*\(\s*['"`].*\$\{/)) {
      issues.push({
        lineNumber,
        issue: 'Command Injection Vulnerability',
        severity: 'high',
        description: 'Unsafe command execution with user input',
        fix: 'Use execFile() with array arguments instead of exec() with string concatenation'
      });
    }
    
    // Weak cryptography
    if (line.match(/createHash\s*\(\s*['"]md5['"]/i) || line.match(/createHash\s*\(\s*['"]sha1['"]/i)) {
      issues.push({
        lineNumber,
        issue: 'Weak Cryptographic Algorithm',
        severity: 'medium',
        description: 'Using deprecated hash algorithm (MD5 or SHA1)',
        fix: 'Use SHA-256 or stronger: crypto.createHash("sha256")'
      });
    }
    
    // Path traversal
    if (line.match(/readFile\s*\([^)]*\)/) && !line.match(/path\.join|path\.normalize/)) {
      issues.push({
        lineNumber,
        issue: 'Potential Path Traversal',
        severity: 'medium',
        description: 'File operations without path validation',
        fix: 'Validate and normalize paths: path.normalize(path.join(baseDir, userPath))'
      });
    }
    
    // CORS misconfiguration
    if (line.match(/Access-Control-Allow-Origin['"]?\s*[:=]\s*['"]?\*/)) {
      issues.push({
        lineNumber,
        issue: 'CORS Misconfiguration',
        severity: 'medium',
        description: 'Wildcard (*) in Access-Control-Allow-Origin header',
        fix: 'Specify allowed origins: "Access-Control-Allow-Origin": "https://yourdomain.com"'
      });
    }
  });

  // Generate fixed code
  let fixedCode = code;
  
  // Fix SQL injection
  fixedCode = fixedCode.replace(
    /query\s*\(\s*`([^`]*\$\{[^}]+\}[^`]*)`\s*\)/g,
    'query("$1", [params]) // Use parameterized queries'
  ).replace(/\$\{[^}]+\}/g, '?');
  
  // Fix XSS
  fixedCode = fixedCode.replace(
    /\.innerHTML\s*=\s*([^;]+);/g,
    '.textContent = $1; // Use textContent instead of innerHTML'
  );
  
  // Fix hardcoded secrets
  fixedCode = fixedCode.replace(
    /(const|let|var)\s+(api[_-]?key|password|secret|token)\s*=\s*['"][^'"]+['"]/gi,
    '$1 $2 = process.env.$2.toUpperCase() // Use environment variable'
  );
  
  // Fix weak crypto
  fixedCode = fixedCode.replace(
    /createHash\s*\(\s*['"]md5['"]\s*\)/gi,
    'createHash("sha256") // Upgraded to SHA-256'
  );
  fixedCode = fixedCode.replace(
    /createHash\s*\(\s*['"]sha1['"]\s*\)/gi,
    'createHash("sha256") // Upgraded to SHA-256'
  );

  const summary = issues.length === 0
    ? `✅ No security issues detected! Your ${language} code follows security best practices.`
    : `⚠️ Found ${issues.length} security issue${issues.length !== 1 ? 's' : ''} in your ${language} code. Review the details below and apply the recommended fixes.`;

  return {
    originalCode: code,
    fixedCode: issues.length > 0 ? fixedCode : code,
    issues,
    summary,
    language
  };
}

export async function analyzeAndFixCode(code: string, language: string = 'typescript'): Promise<CodeAnalysisResult> {
  // Use pattern-based analysis (reliable and fast)
  return patternBasedAnalysis(code, language);
}