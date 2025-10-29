import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Github, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface GitHubConnectProps {
  userId?: string;
  compact?: boolean;
}

export function GitHubConnect({ userId = 'default-user', compact = false }: GitHubConnectProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkConnectionStatus();
    
    // Check if we just connected via OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('github_connected') === 'true') {
      const githubUser = urlParams.get('github_user');
      toast.success(`GitHub connected successfully!${githubUser ? ` Logged in as @${githubUser}` : ''}`);
      
      // Force refresh connection status
      setTimeout(() => {
        checkConnectionStatus();
        // Clean up URL
        window.history.replaceState({}, '', window.location.pathname);
      }, 500);
    }
  }, []);

  const checkConnectionStatus = async () => {
    try {
      const response = await fetch(`/api/auth/github/status?userId=${userId}`);
      const data = await response.json();
      setIsConnected(data.connected);
    } catch (error) {
      console.error('Error checking GitHub connection:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = () => {
    // Redirect to GitHub OAuth
    window.location.href = '/api/auth/github';
  };

  const handleDisconnect = async () => {
    try {
      const response = await fetch('/api/auth/github/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        setIsConnected(false);
        toast.success('GitHub disconnected successfully');
      }
    } catch (error) {
      toast.error('Failed to disconnect GitHub');
    }
  };

  if (compact) {
    return (
      <div className="flex items-center space-x-2">
        {isLoading ? (
          <Badge variant="outline">Checking...</Badge>
        ) : isConnected ? (
          <>
            <Badge variant="default" className="bg-green-600">
              <CheckCircle className="mr-1 h-3 w-3" />
              GitHub Connected
            </Badge>
            <Button variant="ghost" size="sm" onClick={handleDisconnect}>
              Disconnect
            </Button>
          </>
        ) : (
          <Button variant="outline" size="sm" onClick={handleConnect}>
            <Github className="mr-2 h-4 w-4" />
            Connect GitHub
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-900 dark:bg-white rounded-lg flex items-center justify-center">
              <Github className="h-6 w-6 text-white dark:text-gray-900" />
            </div>
            <div>
              <CardTitle>GitHub Integration</CardTitle>
              <CardDescription>
                Connect your GitHub account to enable auto-fix PRs
              </CardDescription>
            </div>
          </div>
          {isConnected ? (
            <Badge variant="default" className="bg-green-600">
              <CheckCircle className="mr-1 h-3 w-3" />
              Connected
            </Badge>
          ) : (
            <Badge variant="secondary">
              <XCircle className="mr-1 h-3 w-3" />
              Not Connected
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-gray-600">Checking connection status...</p>
        ) : isConnected ? (
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium">GitHub account connected</p>
                <p className="text-sm text-gray-600">
                  You can now create Pull Requests with automated vulnerability fixes
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={handleDisconnect}>
              Disconnect GitHub
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Connect your GitHub account to enable automatic Pull Request creation for vulnerability fixes.
            </p>
            <div className="space-y-2">
              <div className="flex items-start space-x-2">
                <div className="w-5 h-5 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs text-blue-600">1</span>
                </div>
                <p className="text-sm">Authorize SOTERIA to access your repositories</p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-5 h-5 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs text-blue-600">2</span>
                </div>
                <p className="text-sm">Scan repositories for vulnerabilities</p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-5 h-5 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs text-blue-600">3</span>
                </div>
                <p className="text-sm">Click "Auto-Fix" to create PRs with fixes</p>
              </div>
            </div>
            <Button onClick={handleConnect}>
              <Github className="mr-2 h-4 w-4" />
              Connect GitHub Account
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
