import { promises as fs } from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { analyzeAndFixCode } from './openai';

const execAsync = promisify(exec);

interface FileAnalysisResult {
  filePath: string;
  relativePath: string;
  content: string;
  issues: Array<{
    lineNumber: number;
    issue: string;
    severity: 'high' | 'medium' | 'low';
    description: string;
    fix: string;
  }>;
  fixedContent?: string;
  error?: string;
}

export interface RepoAnalysisResult {
  summary: {
    totalFiles: number;
    analyzedFiles: number;
    totalIssues: number;
    highSeverity: number;
    mediumSeverity: number;
    lowSeverity: number;
  };
  files: FileAnalysisResult[];
  timestamp: string;
}

const SUPPORTED_EXTENSIONS = [
  // Web
  '.js', '.jsx', '.ts', '.tsx', '.html', '.css', '.scss', '.json',
  // Backend
  '.py', '.java', '.c', '.cpp', '.cs', '.go', '.rb', '.php',
  // Config
  '.yaml', '.yml', '.toml', '.ini', '.env', '.sh'
];

const IGNORED_DIRS = [
  'node_modules',
  '.git',
  '.github',
  'dist',
  'build',
  'coverage',
  '__tests__',
  'test',
  'tests',
  'mocks',
  'fixtures',
  'tmp'
];

export async function scanRepository(repoPath: string): Promise<RepoAnalysisResult> {
  const result: RepoAnalysisResult = {
    summary: {
      totalFiles: 0,
      analyzedFiles: 0,
      totalIssues: 0,
      highSeverity: 0,
      mediumSeverity: 0,
      lowSeverity: 0
    },
    files: [],
    timestamp: new Date().toISOString()
  };

  // Check if the path exists
  try {
    await fs.access(repoPath);
  } catch (error) {
    throw new Error(`Repository path does not exist: ${repoPath}`);
  }

  // Get all files in the repository
  const files = await getAllFiles(repoPath);
  result.summary.totalFiles = files.length;

  // Analyze each file
  for (const file of files) {
    const relativePath = path.relative(repoPath, file);
    const extension = path.extname(file).toLowerCase();
    
    if (!SUPPORTED_EXTENSIONS.includes(extension)) {
      continue;
    }

    try {
      const content = await fs.readFile(file, 'utf-8');
      const language = getLanguageFromExtension(extension);
      
      const analysis = await analyzeAndFixCode(content, language);
      
      result.files.push({
        filePath: file,
        relativePath,
        content,
        issues: analysis.issues,
        fixedContent: analysis.fixedCode
      });

      // Update summary
      result.summary.analyzedFiles++;
      result.summary.totalIssues += analysis.issues.length;
      
      for (const issue of analysis.issues) {
        if (issue.severity === 'high') result.summary.highSeverity++;
        else if (issue.severity === 'medium') result.summary.mediumSeverity++;
        else result.summary.lowSeverity++;
      }
      
    } catch (error) {
      console.error(`Error analyzing ${file}:`, error);
      result.files.push({
        filePath: file,
        relativePath,
        content: '',
        issues: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return result;
}

async function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): Promise<string[]> {
  const files = await fs.readdir(dirPath, { withFileTypes: true });

  for (const file of files) {
    const fullPath = path.join(dirPath, file.name);
    
    if (file.isDirectory()) {
      // Skip ignored directories
      if (IGNORED_DIRS.includes(file.name)) {
        continue;
      }
      await getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(fullPath);
    }
  }

  return arrayOfFiles;
}

function getLanguageFromExtension(extension: string): string {
  const extensionMap: Record<string, string> = {
    '.js': 'javascript',
    '.jsx': 'javascript',
    '.ts': 'typescript',
    '.tsx': 'typescript',
    '.py': 'python',
    '.java': 'java',
    '.c': 'c',
    '.cpp': 'cpp',
    '.cs': 'csharp',
    '.go': 'go',
    '.rb': 'ruby',
    '.php': 'php',
    '.html': 'html',
    '.css': 'css',
    '.scss': 'scss',
    '.json': 'json',
    '.yaml': 'yaml',
    '.yml': 'yaml',
    '.toml': 'toml',
    '.ini': 'ini',
    '.env': 'env',
    '.sh': 'bash'
  };

  return extensionMap[extension] || 'text';
}

export async function cloneRepository(repoUrl: string, targetDir: string): Promise<string> {
  try {
    await fs.mkdir(targetDir, { recursive: true });
    await execAsync(`git clone ${repoUrl} ${targetDir}`);
    return targetDir;
  } catch (error) {
    throw new Error(`Failed to clone repository: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
