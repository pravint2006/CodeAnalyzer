import { useState, useCallback, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, Upload, GitBranch, FileText, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
  content?: string;
  issues?: Array<{
    lineNumber: number;
    issue: string;
    severity: 'high' | 'medium' | 'low';
    description: string;
    fix: string;
  }>;
  fixedContent?: string;
  error?: string;
}

interface RepoAnalysisResult {
  summary: {
    totalFiles: number;
    analyzedFiles: number;
    totalIssues: number;
    highSeverity: number;
    mediumSeverity: number;
    lowSeverity: number;
  };
  files: Array<{
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
  }>;
  timestamp: string;
}

export default function RepoScanner() {
  const [repoUrl, setRepoUrl] = useState('');
  const [activeTab, setActiveTab] = useState<'scan' | 'files' | 'issues'>('scan');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [fileTree, setFileTree] = useState<FileNode | null>(null);
  const [analysisResult, setAnalysisResult] = useState<RepoAnalysisResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);
  const [currentFile, setCurrentFile] = useState('');
  const [showFixed, setShowFixed] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: async (acceptedFiles: File[]) => {
      // Handle file uploads
      const formData = new FormData();
      acceptedFiles.forEach(file => {
        formData.append('files', file);
      });
      
      try {
        const response = await fetch('/api/analyze-files', {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          throw new Error('Failed to analyze files');
        }
        
        const data = await response.json();
        // Handle the analysis results
        console.log('Analysis results:', data);
        toast.success('Files analyzed successfully');
      } catch (error) {
        console.error('Error analyzing files:', error);
        toast.error('Failed to analyze files');
      }
    },
    multiple: true
  });

  const scanRepository = useCallback(async () => {
    if (!repoUrl) {
      toast.error('Please enter a repository URL');
      return;
    }

    setIsScanning(true);
    setScanProgress(0);
    setAnalysisResult(null);
    setFileTree(null);
    setSelectedFile(null);
    setFileContent('');

    try {
      const response = await fetch('/api/scan-repository', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ repoUrl }),
      });

      if (!response.ok) {
        throw new Error('Failed to scan repository');
      }

      const result: RepoAnalysisResult = await response.json();
      setAnalysisResult(result);
      
      // Build file tree
      const tree = buildFileTree(result.files);
      setFileTree(tree);
      
      toast.success(`Repository scanned successfully. Found ${result.summary.totalIssues} issues.`);
      setActiveTab('files');
    } catch (error) {
      console.error('Error scanning repository:', error);
      toast.error(`Failed to scan repository: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsScanning(false);
      setScanProgress(0);
    }
  }, [repoUrl]);

  const buildFileTree = (files: RepoAnalysisResult['files']): FileNode => {
    const root: FileNode = { name: 'root', path: '', type: 'directory', children: [] };
    
    files.forEach(file => {
      const parts = file.relativePath.split('/');
      let current = root;
      
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const isLast = i === parts.length - 1;
        
        if (isLast) {
          current.children = current.children || [];
          current.children.push({
            name: part,
            path: file.relativePath,
            type: 'file',
            content: file.content,
            issues: file.issues,
            fixedContent: file.fixedContent,
            error: file.error
          });
        } else {
          let child = (current.children || []).find(c => c.name === part);
          
          if (!child) {
            child = {
              name: part,
              path: parts.slice(0, i + 1).join('/'),
              type: 'directory',
              children: []
            };
            current.children = [...(current.children || []), child];
          }
          
          current = child;
        }
      }
    });
    
    return root;
  };

  const renderFileTree = (node: FileNode, path: string = '') => {
    if (node.type === 'file') {
      const issues = node.issues || [];
      const hasIssues = issues.length > 0;
      const hasError = !!node.error;
      
      return (
        <div 
          key={node.path} 
          className={`flex items-center py-1 px-2 rounded cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 ${selectedFile === node.path ? 'bg-blue-100 dark:bg-blue-900' : ''}`}
          onClick={() => {
            setSelectedFile(node.path);
            setFileContent(showFixed && node.fixedContent ? node.fixedContent : node.content || '');
          }}
        >
          <FileText className="h-4 w-4 mr-2 text-blue-500" />
          <span className="truncate">{node.name}</span>
          {hasIssues && (
            <Badge variant="destructive" className="ml-2">
              {issues.length} {issues.length === 1 ? 'issue' : 'issues'}
            </Badge>
          )}
          {hasError && <AlertCircle className="h-4 w-4 ml-2 text-yellow-500" />}
        </div>
      );
    }
    
    return (
      <div key={path} className="mb-2">
        <div className="font-medium text-sm text-gray-500 dark:text-gray-400 px-2 py-1">
          {node.name || 'root'}
        </div>
        <div className="pl-4 border-l border-gray-200 dark:border-gray-700">
          {node.children?.map(child => renderFileTree(child, `${path}/${child.name}`))}
        </div>
      </div>
    );
  };

  const renderIssueBadge = (severity: 'high' | 'medium' | 'low') => {
    return (
      <Badge 
        variant={severity === 'high' ? 'destructive' : severity === 'medium' ? 'warning' : 'outline'}
        className="capitalize"
      >
        {severity}
      </Badge>
    );
  };

  const renderFileContent = () => {
    if (!selectedFile || !analysisResult) {
      return (
        <div className="flex items-center justify-center h-full text-gray-500">
          Select a file to view its content
        </div>
      );
    }
    
    const file = analysisResult.files.find(f => f.relativePath === selectedFile);
    if (!file) return null;
    
    const contentToShow = showFixed && file.fixedContent ? file.fixedContent : file.content;
    const language = selectedFile.split('.').pop() || 'text';
    
    return (
      <div className="h-full flex flex-col">
        <div className="flex justify-between items-center p-2 border-b">
          <div className="text-sm font-mono">{selectedFile}</div>
          <div className="flex space-x-2">
            {file.fixedContent && (
              <Button 
                variant={showFixed ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setShowFixed(!showFixed)}
              >
                {showFixed ? 'Show Original' : 'Show Fixed'}
              </Button>
            )}
            <Button variant="outline" size="sm">
              Download
            </Button>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto relative">
          <SyntaxHighlighter 
            language={language} 
            style={vscDarkPlus} 
            showLineNumbers
            wrapLines
            customStyle={{
              margin: 0,
              height: '100%',
              borderRadius: 0,
              backgroundColor: '#1e1e1e',
              fontSize: '14px',
              lineHeight: '1.5',
              fontFamily: 'Fira Code, monospace'
            }}
            lineNumberStyle={{
              color: '#858585',
              paddingRight: '1em',
              textAlign: 'right',
              userSelect: 'none'
            }}
          >
            {contentToShow || ''}
          </SyntaxHighlighter>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Repository Security Scanner</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Scan your repository for security vulnerabilities and get automated fixes
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Scan a Repository</CardTitle>
          <CardDescription>
            Enter a Git repository URL to scan for security vulnerabilities and code quality issues
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <Input
              type="text"
              placeholder="https://github.com/username/repository.git"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              className="flex-1"
              disabled={isScanning}
            />
            <Button 
              onClick={scanRepository} 
              disabled={isScanning || !repoUrl}
              className="min-w-[120px]"
            >
              {isScanning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Scanning...
                </>
              ) : (
                'Scan Repository'
              )}
            </Button>
          </div>
          
          {isScanning && (
            <div className="mt-4">
              <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 transition-all duration-300 ease-in-out"
                  style={{ width: `${scanProgress}%` }}
                />
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {scanProgress < 100 ? (
                  <span>Analyzing {currentFile}...</span>
                ) : (
                  <span>Finalizing analysis...</span>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {analysisResult && (
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="scan">Scan Summary</TabsTrigger>
            <TabsTrigger value="files">Files</TabsTrigger>
            <TabsTrigger value="issues">Issues ({analysisResult.summary.totalIssues})</TabsTrigger>
          </TabsList>

          <TabsContent value="scan" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Scan Summary</CardTitle>
                <CardDescription>
                  Overview of the security scan results
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <Card className="bg-background">
                    <CardHeader className="pb-2">
                      <CardDescription>Total Files</CardDescription>
                      <CardTitle className="text-3xl">{analysisResult.summary.totalFiles}</CardTitle>
                    </CardHeader>
                  </Card>
                  <Card className="bg-background">
                    <CardHeader className="pb-2">
                      <CardDescription>Analyzed Files</CardDescription>
                      <CardTitle className="text-3xl">{analysisResult.summary.analyzedFiles}</CardTitle>
                    </CardHeader>
                  </Card>
                  <Card className="bg-background">
                    <CardHeader className="pb-2">
                      <CardDescription>Total Issues</CardDescription>
                      <CardTitle className="text-3xl">{analysisResult.summary.totalIssues}</CardTitle>
                    </CardHeader>
                  </Card>
                  <Card className="bg-background">
                    <CardHeader className="pb-2">
                      <CardDescription>Scan Time</CardDescription>
                      <CardTitle className="text-lg">
                        {new Date(analysisResult.timestamp).toLocaleString()}
                      </CardTitle>
                    </CardHeader>
                  </Card>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Severity Breakdown</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="h-4 w-4 rounded-full bg-red-500 mr-2"></div>
                          <span>High Severity</span>
                        </div>
                        <span className="font-medium">{analysisResult.summary.highSeverity}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="h-4 w-4 rounded-full bg-yellow-500 mr-2"></div>
                          <span>Medium Severity</span>
                        </div>
                        <span className="font-medium">{analysisResult.summary.mediumSeverity}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="h-4 w-4 rounded-full bg-blue-500 mr-2"></div>
                          <span>Low Severity</span>
                        </div>
                        <span className="font-medium">{analysisResult.summary.lowSeverity}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="files" className="mt-0">
            <div className="grid grid-cols-12 gap-4 h-[600px]">
              <div className="col-span-3 border rounded-lg overflow-hidden">
                <div className="p-3 border-b font-medium">Files</div>
                <ScrollArea className="h-[calc(100%-50px)]">
                  {fileTree && renderFileTree(fileTree)}
                </ScrollArea>
              </div>
              <div className="col-span-9 border rounded-lg overflow-hidden">
                {renderFileContent()}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="issues" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Security Issues</CardTitle>
                <CardDescription>
                  {analysisResult.summary.totalIssues} issues found in {analysisResult.summary.analyzedFiles} files
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px] pr-4">
                  {analysisResult.files.flatMap((file, fileIndex) => 
                    file.issues?.map((issue, issueIndex) => (
                      <div key={`${fileIndex}-${issueIndex}`} className="mb-6 last:mb-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center">
                            <FileText className="h-4 w-4 mr-2 text-blue-500" />
                            <span className="font-mono text-sm">{file.relativePath}</span>
                            <span className="mx-2 text-gray-400">•</span>
                            <span className="text-sm text-gray-500">Line {issue.lineNumber}</span>
                          </div>
                          {renderIssueBadge(issue.severity)}
                        </div>
                        <div className="ml-6">
                          <h4 className="font-medium">{issue.issue}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {issue.description}
                          </p>
                          <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono whitespace-pre-wrap">
                            {issue.fix}
                          </div>
                          <div className="mt-2 flex justify-end">
                            <Button variant="outline" size="sm" className="mr-2">
                              View File
                            </Button>
                            <Button variant="default" size="sm">
                              Apply Fix
                            </Button>
                          </div>
                        </div>
                        <Separator className="my-4" />
                      </div>
                    ))
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {!analysisResult && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Or Upload Files</CardTitle>
            <CardDescription>
              Drag and drop files here or click to browse
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
                isDragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-700'
              }`}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center justify-center space-y-2">
                <Upload className="h-12 w-12 text-gray-400" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {isDragActive ? 'Drop the files here' : 'Drag and drop files here, or click to select files'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  Supports multiple files (max 10MB)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
