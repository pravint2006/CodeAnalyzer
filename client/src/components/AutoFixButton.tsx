import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Loader2, Wrench, ExternalLink, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Vulnerability {
  id: string;
  title: string;
  type?: string;
  file: string;
  line: number;
  codeSnippet: string;
  severity: string;
}

interface AutoFixButtonProps {
  vulnerability: Vulnerability;
  repoUrl: string;
  userId?: string;
  onSuccess?: (prUrl: string) => void;
}

export function AutoFixButton({ vulnerability, repoUrl, userId = 'default-user', onSuccess }: AutoFixButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [fixPreview, setFixPreview] = useState<any>(null);
  const [prUrl, setPrUrl] = useState<string | null>(null);

  const handlePreviewFix = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/github/preview-fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vulnerability }),
      });

      const data = await response.json();
      
      if (data.canFix) {
        setFixPreview(data.fix);
        setShowPreview(true);
      } else {
        toast.error(data.message || 'No automatic fix available for this vulnerability');
      }
    } catch (error) {
      toast.error('Failed to preview fix');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePR = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/github/create-fix-pr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          repoUrl,
          vulnerabilities: [vulnerability],
        }),
      });

      const data = await response.json();

      if (data.needsAuth) {
        toast.error('Please connect your GitHub account first');
        // Redirect to GitHub OAuth
        setTimeout(() => {
          window.location.href = '/api/auth/github';
        }, 2000);
        return;
      }

      if (data.success) {
        setPrUrl(data.prUrl);
        toast.success(`Pull Request created successfully! PR #${data.prNumber}`);
        if (onSuccess) {
          onSuccess(data.prUrl);
        }
      } else {
        toast.error(data.error || 'Failed to create Pull Request');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to create Pull Request');
    } finally {
      setIsLoading(false);
      setShowPreview(false);
    }
  };

  if (prUrl) {
    return (
      <Button variant="outline" size="sm" asChild>
        <a href={prUrl} target="_blank" rel="noopener noreferrer">
          <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
          View PR
          <ExternalLink className="ml-2 h-3 w-3" />
        </a>
      </Button>
    );
  }

  return (
    <>
      <Button
        variant="default"
        size="sm"
        onClick={handlePreviewFix}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Wrench className="mr-2 h-4 w-4" />
            Auto-Fix
          </>
        )}
      </Button>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preview Auto-Fix</DialogTitle>
            <DialogDescription>
              Review the proposed fix before creating a Pull Request
            </DialogDescription>
          </DialogHeader>

          {fixPreview && (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Fix Description:</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {fixPreview.description}
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2 flex items-center">
                  <AlertCircle className="mr-2 h-4 w-4 text-red-500" />
                  Original Code:
                </h4>
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <pre className="text-sm font-mono overflow-x-auto">
                    <code>{fixPreview.originalCode}</code>
                  </pre>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2 flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                  Fixed Code:
                </h4>
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <pre className="text-sm font-mono overflow-x-auto">
                    <code>{fixPreview.fixedCode}</code>
                  </pre>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="font-semibold mb-2">What will happen:</h4>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  <li>A new branch will be created: <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">security-fixes-{Date.now()}</code></li>
                  <li>The fix will be committed to this branch</li>
                  <li>A Pull Request will be created for your review</li>
                  <li>You can review and merge the PR on GitHub</li>
                </ul>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreatePR} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating PR...
                </>
              ) : (
                'Create Pull Request'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
