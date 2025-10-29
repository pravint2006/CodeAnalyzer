import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GitHubConnect } from "@/components/GitHubConnect";
import { GitHubReposList } from "@/components/GitHubReposList";
import { 
  Shield, 
  Code, 
  ArrowRight, 
  FileCode, 
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  GitBranch
} from "lucide-react";

export default function DashboardPage() {
  const [isGitHubConnected, setIsGitHubConnected] = useState(false);

  useEffect(() => {
    checkGitHubConnection();
  }, []);

  const checkGitHubConnection = async () => {
    try {
      const response = await fetch('/api/auth/github/status?userId=default-user');
      const data = await response.json();
      setIsGitHubConnected(data.connected);
    } catch (error) {
      console.error('Error checking GitHub connection:', error);
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
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => window.open('https://github.com/yourusername/soteria-docs', '_blank')}
              >
                <FileCode className="mr-2 h-4 w-4" />
                Documentation
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.location.href = '/settings'}
              >
                Settings
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Welcome to SOTERIA</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Choose a tool to start analyzing and securing your codebase
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Scans</p>
                  <p className="text-2xl font-bold">127</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Issues Found</p>
                  <p className="text-2xl font-bold">35</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Fixed</p>
                  <p className="text-2xl font-bold">92</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Repositories</p>
                  <p className="text-2xl font-bold">8</p>
                </div>
                <GitBranch className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tools Section */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Vulnerability Scanner */}
          <Card className="border-2 hover:border-blue-500 transition-all hover:shadow-xl group cursor-pointer">
            <Link href="/vulnerability-scanner">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                  <Badge variant="secondary">Most Popular</Badge>
                </div>
                <CardTitle className="text-2xl">Vulnerability Scanner</CardTitle>
                <CardDescription>
                  Comprehensive security scanning for your repositories
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle className="h-3 w-3 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">Detect Security Vulnerabilities</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Find XSS, SQL injection, and other critical security issues
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle className="h-3 w-3 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">Dependency Scanning</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Check for known vulnerabilities in your dependencies
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle className="h-3 w-3 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">Real-time Alerts</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Get instant notifications about security issues
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border">
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">EXAMPLE OUTPUT</p>
                  <div className="space-y-2 font-mono text-xs">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="text-red-600">Critical: XSS vulnerability detected</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span className="text-yellow-600">High: Outdated dependency found</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-blue-600">Medium: Weak password policy</span>
                    </div>
                  </div>
                </div>

                <Button className="w-full group-hover:bg-blue-600" size="lg">
                  Start Vulnerability Scan
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Link>
          </Card>

          {/* Code Analyzer */}
          <Card className="border-2 hover:border-purple-500 transition-all hover:shadow-xl group cursor-pointer">
            <Link href="/code-analyzer">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Code className="h-6 w-6 text-white" />
                  </div>
                  <Badge variant="outline">AI Powered</Badge>
                </div>
                <CardTitle className="text-2xl">Code Analyzer</CardTitle>
                <CardDescription>
                  AI-powered code quality and security analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle className="h-3 w-3 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium">Code Quality Analysis</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Detect code smells, anti-patterns, and best practices
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle className="h-3 w-3 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium">AI Recommendations</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Get intelligent suggestions for code improvements
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle className="h-3 w-3 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium">Multi-language Support</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Analyze code in JavaScript, Python, Java, and more
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border">
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">EXAMPLE OUTPUT</p>
                  <div className="space-y-2 font-mono text-xs">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span className="text-purple-600">Suggestion: Refactor nested loops</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-blue-600">Info: Consider using async/await</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-green-600">Good: Proper error handling</span>
                    </div>
                  </div>
                </div>

                <Button className="w-full group-hover:bg-purple-600" size="lg">
                  Start Code Analysis
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Link>
          </Card>
        </div>

        {/* GitHub Integration */}
        <GitHubConnect userId="default-user" />

        {/* GitHub Repositories List */}
        <GitHubReposList userId="default-user" isConnected={isGitHubConnected} />

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest scans and analysis results</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                    <Shield className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Vulnerability Scan - Repository XYZ</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">35 issues found • 2 hours ago</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  View Details
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                    <Code className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium">Code Analysis - main.js</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">12 suggestions • 5 hours ago</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  View Details
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
