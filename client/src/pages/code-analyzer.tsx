import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

type Issue = {
  lineNumber: number;
  issue: string;
  severity: 'high' | 'medium' | 'low';
  description: string;
  fix: string;
};

type AnalysisResult = {
  originalCode: string;
  fixedCode: string;
  issues: Issue[];
  summary: string;
  language: string;
};

export default function CodeAnalyzer() {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('typescript');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState('');

  const analyzeCode = async () => {
    if (!code.trim()) {
      setError('Please enter some code to analyze');
      return;
    }

    setIsLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/analyze-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, language }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to analyze code');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Code Security Analyzer</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Your Code</h2>
            <div className="flex items-center space-x-2">
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="typescript">TypeScript</SelectItem>
                  <SelectItem value="javascript">JavaScript</SelectItem>
                  <SelectItem value="python">Python</SelectItem>
                  <SelectItem value="java">Java</SelectItem>
                  <SelectItem value="csharp">C#</SelectItem>
                  <SelectItem value="php">PHP</SelectItem>
                  <SelectItem value="go">Go</SelectItem>
                  <SelectItem value="ruby">Ruby</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={analyzeCode} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  'Analyze Code'
                )}
              </Button>
            </div>
          </div>
          
          <Textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={`Paste your ${language} code here...`}
            className="font-mono min-h-[400px]"
          />
          
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Analysis Results</h2>
          
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-2">Analyzing your code...</span>
            </div>
          ) : result ? (
            <div className="space-y-6">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle>Summary</CardTitle>
                    {result.issues.length === 0 ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        No issues found
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {result.issues.length} issue{result.issues.length !== 1 ? 's' : ''} found
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p>{result.summary}</p>
                </CardContent>
              </Card>

              {result.issues.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle>Issues Found</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {result.issues.map((issue, index) => (
                      <div key={index} className="border-l-4 border-amber-500 pl-4 py-2">
                        <div className="flex justify-between items-start">
                          <h4 className="font-medium">{issue.issue}</h4>
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            issue.severity === 'high' 
                              ? 'bg-red-100 text-red-800' 
                              : issue.severity === 'medium'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-blue-100 text-blue-800'
                          }`}>
                            {issue.severity}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Line {issue.lineNumber}: {issue.description}
                        </p>
                        <div className="mt-2 p-3 bg-muted/50 rounded text-sm">
                          <p className="font-medium">Fix:</p>
                          <p>{issue.fix}</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {result.fixedCode && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle>Fixed Code</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md overflow-hidden">
                      <SyntaxHighlighter 
                        language={result.language} 
                        style={vscDarkPlus}
                        showLineNumbers
                        wrapLines
                        customStyle={{
                          margin: 0,
                          borderRadius: '0.375rem',
                          fontSize: '0.875rem',
                          lineHeight: '1.5',
                        }}
                      >
                        {result.fixedCode}
                      </SyntaxHighlighter>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Alert>
              <Terminal className="h-4 w-4" />
              <AlertTitle>Ready to analyze</AlertTitle>
              <AlertDescription>
                Paste your code and click "Analyze Code" to check for security vulnerabilities and bugs.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </div>
  );
}
