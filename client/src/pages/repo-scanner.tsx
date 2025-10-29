import { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import { 
  Loader2, 
  Upload, 
  GitBranch, 
  FileText, 
  CheckCircle2, 
  ShieldAlert, 
  Clock, 
  RefreshCw 
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle, 
  CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface FileIssue {
  lineNumber: number;
  issue: string;
  severity: 'high' | 'medium' | 'low';
  description: string;
  fix: string;
}

interface FileAnalysisResult {
  filePath: string;
  relativePath: string;
  content: string;
  issues: FileIssue[];
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
  files: FileAnalysisResult[];
  timestamp: string;
}

export default function RepoScanner() {
  const [repoUrl, setRepoUrl] = useState('');
  const [activeTab, setActiveTab] = useState<'scan' | 'files' | 'issues'>('scan');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<RepoAnalysisResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState('');
  const [scanComplete, setScanComplete] = useState(false);
  const [scanStartTime, setScanStartTime] = useState<number | null>(null);
  const [scanDuration, setScanDuration] = useState<number | null>(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: async (acceptedFiles: File[]) => {
      if (isScanning) return;
      
      const formData = new FormData();
      acceptedFiles.forEach(file => {
        formData.append('files', file);
      });
      
      try {
        setIsScanning(true);
        setScanProgress(0);
        setScanStartTime(Date.now());
        
        // Simulate progress
        const progressInterval = setInterval(() => {
          setScanProgress(prev => Math.min(prev + 10, 90));
        }, 500);

        const response = await fetch('/api/analyze-files', {
          method: 'POST',
          body: formData,
        });
        
        clearInterval(progressInterval);
        setScanProgress(100);
        
        if (!response.ok) throw new Error('Failed to analyze files');
        
        const result = await response.json();
        setAnalysisResult(result);
        setScanComplete(true);
        setScanDuration(Date.now() - (scanStartTime || Date.now()));
        setActiveTab('files');
        toast.success('Analysis completed successfully');
      } catch (error) {
        console.error('Error analyzing files:', error);
        toast.error('Failed to analyze files');
      } finally {
        setIsScanning(false);
      }
    },
    multiple: true,
    accept: {
      'text/*': ['.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.c', '.cpp', '.go', '.rb', '.php']
    }
  });

  const startAnalysis = async () => {
    if (!repoUrl.trim()) {
      toast.error('Please enter a repository URL');
      return;
    }

    setIsScanning(true);
    setScanComplete(false);
    setScanProgress(0);
    setAnalysisResult(null);
    setScanStartTime(Date.now());

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setScanProgress(prev => Math.min(prev + 5, 90));
      }, 500);

      const response = await fetch('/api/analyze-repo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl }),
      });

      clearInterval(progressInterval);
      setScanProgress(100);

      if (!response.ok) throw new Error('Failed to analyze repository');

      const result = await response.json();
      setAnalysisResult(result);
      setScanComplete(true);
      setScanDuration(Date.now() - (scanStartTime || Date.now()));
      setActiveTab('files');
      toast.success('Repository analysis completed');
    } catch (error) {
      console.error('Error analyzing repository:', error);
      toast.error('Failed to analyze repository');
    } finally {
      setIsScanning(false);
    }
  };

  const renderIssueBadge = (severity: 'high' | 'medium' | 'low') => {
    const variantMap = {
      high: 'destructive',
      medium: 'secondary',
      low: 'outline'
    } as const;

    return (
      <Badge 
        variant={variantMap[severity]}
        className={`capitalize ${severity === 'medium' ? 'bg-yellow-500 hover:bg-yellow-600 text-white' : ''}`}
      >
        {severity}
      </Badge>
    );
  };

  const renderFileContent = () => {
    if (!analysisResult || !selectedFile) {
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          Select a file to view its content
        </div>
      );
    }

    const file = analysisResult.files.find(f => f.relativePath === selectedFile);
    if (!file) return null;

    return (
      <div className="h-full overflow-auto p-4">
        <pre className="whitespace-pre-wrap text-sm">{file.content}</pre>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen">
      <header className="border-b">
        <div className="container flex h-16 items-center px-4">
          <div className="flex items-center space-x-4">
            <GitBranch className="h-6 w-6" />
            <h1 className="text-xl font-bold">Repository Scanner</h1>
          </div>
        </div>
      </header>

      <div className="flex-1 p-6">
        {isScanning && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  Analyzing Repository
                </CardTitle>
                <CardDescription>
                  Scanning files for vulnerabilities...
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    <span className="truncate flex-1">{currentFile || 'Preparing to scan...'}</span>
                    <span>{scanProgress}%</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-300 ease-in-out"
                      style={{ width: `${scanProgress}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="scan">Scan Repository</TabsTrigger>
            <TabsTrigger value="files" disabled={!analysisResult}>Files</TabsTrigger>
            <TabsTrigger value="issues" disabled={!analysisResult}>Issues</TabsTrigger>
          </TabsList>

          <TabsContent value="scan" className="flex-1 flex flex-col items-center justify-center p-8">
            {!scanComplete ? (
              <div className="w-full max-w-2xl space-y-8">
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
                  }`}
                >
                  <input {...getInputProps()} />
                  <div className="space-y-4">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                      <Upload className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium">Drag and drop files here</h3>
                      <p className="text-sm text-muted-foreground">
                        Or click to browse files (Supports .js, .ts, .jsx, .tsx, .py, .java, .c, .cpp, .go, .rb, .php)
                      </p>
                    </div>
                  </div>
                </div>

                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Or enter repository URL (e.g., https://github.com/username/repo)"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    className="pr-32"
                    onKeyDown={(e) => e.key === 'Enter' && startAnalysis()}
                  />
                  <Button
                    onClick={startAnalysis}
                    disabled={isScanning || !repoUrl.trim()}
                    className="absolute right-1 top-1/2 -translate-y-1/2"
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
              </div>
            ) : (
              <div className="w-full max-w-4xl space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Scan Results</CardTitle>
                        <CardDescription>
                          Analysis completed at {new Date().toLocaleString()}
                        </CardDescription>
                      </div>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setScanComplete(false);
                          setRepoUrl('');
                          setAnalysisResult(null);
                        }}
                      >
                        New Scan
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {analysisResult && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex flex-col items-center p-4 bg-background rounded-lg border">
                          <div className="flex items-center gap-2 text-lg font-medium">
                            <FileText className="h-5 w-5 text-blue-500" />
                            Files Scanned
                          </div>
                          <div className="text-3xl font-bold mt-2">
                            {analysisResult.summary.analyzedFiles}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            out of {analysisResult.summary.totalFiles} total files
                          </div>
                        </div>

                        <div className="flex flex-col items-center p-4 bg-background rounded-lg border">
                          <div className="flex items-center gap-2 text-lg font-medium">
                            <ShieldAlert className="h-5 w-5 text-red-500" />
                            Issues Found
                          </div>
                          <div className="text-3xl font-bold mt-2">
                            {analysisResult.summary.totalIssues}
                          </div>
                          <div className="flex gap-4 text-sm">
                            <span className="text-red-500">{analysisResult.summary.highSeverity} High</span>
                            <span className="text-yellow-500">{analysisResult.summary.mediumSeverity} Medium</span>
                            <span className="text-blue-500">{analysisResult.summary.lowSeverity} Low</span>
                          </div>
                        </div>

                        <div className="flex flex-col items-center p-4 bg-background rounded-lg border">
                          <div className="flex items-center gap-2 text-lg font-medium">
                            <Clock className="h-5 w-5 text-purple-500" />
                            Scan Duration
                          </div>
                          <div className="text-3xl font-bold mt-2">
                            {scanDuration ? `${(scanDuration / 1000).toFixed(1)}s` : 'N/A'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Last scanned just now
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="border-t px-6 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                      <Button 
                        variant="outline" 
                        className="h-24 flex flex-col items-center justify-center gap-2"
                        onClick={() => setActiveTab('files')}
                      >
                        <FileText className="h-6 w-6" />
                        <span>View All Files</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        className="h-24 flex flex-col items-center justify-center gap-2"
                        onClick={() => setActiveTab('issues')}
                      >
                        <ShieldAlert className="h-6 w-6 text-red-500" />
                        <span>View All Issues</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        className="h-24 flex flex-col items-center justify-center gap-2"
                        onClick={startAnalysis}
                      >
                        <RefreshCw className="h-6 w-6" />
                        <span>Rescan Repository</span>
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="files" className="mt-6">
            {analysisResult ? (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="md:col-span-1">
                  <CardHeader>
                    <CardTitle>Files</CardTitle>
                    <CardDescription>
                      {analysisResult.summary.analyzedFiles} files analyzed
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
                      {analysisResult.files.map((file, index) => (
                        <div
                          key={index}
                          className={`p-3 rounded-md cursor-pointer hover:bg-muted/50 ${
                            selectedFile === file.relativePath ? 'bg-muted' : ''
                          }`}
                          onClick={() => {
                            setSelectedFile(file.relativePath);
                            setFileContent(file.content);
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 truncate">
                              <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <span className="truncate text-sm">{file.relativePath}</span>
                            </div>
                            {file.issues?.length ? (
                              <Badge variant="destructive" className="flex-shrink-0">
                                {file.issues.length} {file.issues.length === 1 ? 'issue' : 'issues'}
                              </Badge>
                            ) : (
                              <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                <Card className="md:col-span-3">
                  <CardHeader>
                    <CardTitle>
                      {selectedFile || 'Select a file to view content'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-[calc(100vh-300px)] overflow-auto">
                    {selectedFile ? (
                      <pre className="whitespace-pre-wrap text-sm">
                        {fileContent}
                      </pre>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        Select a file to view its content
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>No Scan Results</CardTitle>
                  <CardDescription>
                    Please run a scan to view files
                  </CardDescription>
                </CardHeader>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="issues" className="mt-6">
            {analysisResult ? (
              <Card>
                <CardHeader>
                  <CardTitle>Security Issues</CardTitle>
                  <CardDescription>
                    {analysisResult.summary.totalIssues} issues found in{' '}
                    {analysisResult.summary.analyzedFiles} files
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {analysisResult.files.flatMap((file, fileIndex) =>
                      file.issues?.map((issue, issueIndex) => (
                        <div key={`${fileIndex}-${issueIndex}`} className="mb-6 last:mb-0">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              {renderIssueBadge(issue.severity)}
                              <span className="font-mono text-sm">
                                {file.relativePath}:{issue.lineNumber}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{issue.issue}</p>
                          <div className="bg-muted/50 p-3 rounded-md text-sm">
                            <h4 className="font-medium mb-1">Description:</h4>
                            <p className="text-muted-foreground mb-2">{issue.description}</p>
                            <h4 className="font-medium mb-1">Suggested Fix:</h4>
                            <p className="text-muted-foreground">{issue.fix}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>No Issues Found</CardTitle>
                  <CardDescription>
                    No security issues detected in the scanned files
                  </CardDescription>
                </CardHeader>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
     </div>
  );
}
