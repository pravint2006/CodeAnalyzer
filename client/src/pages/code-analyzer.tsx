import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Terminal, Loader2, AlertCircle, CheckCircle, Code2, ArrowRight, RefreshCw, Sparkles, Shield } from "lucide-react";
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

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'medium': return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
      case 'low': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="border-b bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <img src="/soteria-logo.png" alt="SOTERIA" className="h-8" />
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" onClick={() => window.location.href = '/dashboard'}>
                <ArrowRight className="mr-2 h-4 w-4 rotate-180" />
                Back to Dashboard
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl mb-4">
            <Code2 className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Code Security Analyzer
          </h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Analyze your code for security vulnerabilities, bugs, and best practice violations with AI-powered insights
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <Card className="shadow-lg">
            <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center">
                    <Terminal className="mr-2 h-5 w-5 text-blue-600" />
                    Code Input
                  </CardTitle>
                  <CardDescription>Paste your code for security analysis</CardDescription>
                </div>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Language" />
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
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <Textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder={`// Paste your ${language} code here...\n// Example:\nfunction getUserData(userId) {\n  const query = "SELECT * FROM users WHERE id = " + userId;\n  return db.query(query);\n}`}
                className="font-mono min-h-[500px] text-sm"
              />
              <div className="mt-4 flex justify-between items-center">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {code.length > 0 ? `${code.split('\n').length} lines, ${code.length} characters` : 'No code entered'}
                </div>
                <Button 
                  onClick={analyzeCode} 
                  disabled={isLoading} 
                  size="lg" 
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      Analyze Code
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results Section */}
          <div className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {isLoading && (
              <Card className="shadow-lg">
                <CardContent className="p-12">
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
                    <p className="text-lg font-medium">Analyzing your code...</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">This may take a few moments</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {result && !isLoading && (
              <div className="space-y-4">
                {/* Summary Card */}
                <Card className="shadow-lg">
                  <CardHeader className="pb-3 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 border-b">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center">
                        <Shield className="mr-2 h-5 w-5 text-green-600" />
                        Analysis Summary
                      </CardTitle>
                      {result.issues.length === 0 ? (
                        <Badge className="bg-green-600">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          No issues found
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {result.issues.length} issue{result.issues.length !== 1 ? 's' : ''} found
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <p className="text-gray-700 dark:text-gray-300">{result.summary}</p>
                  </CardContent>
                </Card>

                {/* Issues Card */}
                {result.issues.length > 0 && (
                  <Card className="shadow-lg">
                    <CardHeader className="pb-3 border-b">
                      <CardTitle className="flex items-center">
                        <AlertCircle className="mr-2 h-5 w-5 text-amber-600" />
                        Issues Found
                      </CardTitle>
                      <CardDescription>Review and fix the following security issues</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                      {result.issues.map((issue, index) => (
                        <div key={index} className="border-l-4 border-amber-500 pl-4 py-3 bg-amber-50 dark:bg-amber-950/20 rounded-r">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100">{issue.issue}</h4>
                            <Badge className={getSeverityColor(issue.severity)}>
                              {issue.severity}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                            <span className="font-medium">Line {issue.lineNumber}:</span> {issue.description}
                          </p>
                          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-200 dark:border-blue-800">
                            <p className="font-medium text-sm text-blue-900 dark:text-blue-100 mb-1">💡 Recommended Fix:</p>
                            <p className="text-sm text-blue-800 dark:text-blue-200">{issue.fix}</p>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Fixed Code Card */}
                {result.fixedCode && (
                  <Card className="shadow-lg">
                    <CardHeader className="pb-3 border-b bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
                      <CardTitle className="flex items-center">
                        <CheckCircle className="mr-2 h-5 w-5 text-green-600" />
                        Fixed Code
                      </CardTitle>
                      <CardDescription>Secure version of your code with fixes applied</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="rounded-b-lg overflow-hidden">
                        <SyntaxHighlighter 
                          language={result.language} 
                          style={vscDarkPlus}
                          showLineNumbers
                          wrapLines
                          customStyle={{
                            margin: 0,
                            borderRadius: 0,
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
            )}

            {!result && !isLoading && !error && (
              <Card className="shadow-lg">
                <CardContent className="p-12">
                  <div className="text-center space-y-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full">
                      <Terminal className="h-8 w-8 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Ready to Analyze</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Paste your code and click "Analyze Code" to check for security vulnerabilities and bugs.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
