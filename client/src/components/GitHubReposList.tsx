import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Github, Star, GitFork, Lock, Globe, Search, ExternalLink, Shield } from 'lucide-react';
import { toast } from 'sonner';

interface GitHubRepo {
  id: number;
  name: string;
  fullName: string;
  description: string;
  url: string;
  cloneUrl: string;
  language: string;
  stars: number;
  forks: number;
  isPrivate: boolean;
  updatedAt: string;
  defaultBranch: string;
}

interface GitHubReposListProps {
  userId?: string;
  isConnected: boolean;
}

export function GitHubReposList({ userId = 'default-user', isConnected }: GitHubReposListProps) {
  const [, setLocation] = useLocation();
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isConnected) {
      fetchRepos();
    }
  }, [isConnected]);

  const fetchRepos = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/auth/github/repos?userId=${userId}`);
      const data = await response.json();

      if (data.needsAuth) {
        toast.error('Please connect your GitHub account first');
        return;
      }

      if (data.repos) {
        setRepos(data.repos);
      }
    } catch (error) {
      toast.error('Failed to fetch repositories');
      console.error('Error fetching repos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScanRepo = (repo: GitHubRepo) => {
    // Navigate to vulnerability scanner with the repo URL pre-filled
    setLocation(`/vulnerability-scanner?repo=${encodeURIComponent(repo.cloneUrl)}`);
  };

  const filteredRepos = repos.filter(repo =>
    repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    repo.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    repo.language?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isConnected) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <Github className="mr-2 h-5 w-5" />
              Your GitHub Repositories
            </CardTitle>
            <CardDescription>
              Select a repository to scan for vulnerabilities
            </CardDescription>
          </div>
          <Badge variant="secondary">{repos.length} repos</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-600">Loading repositories...</p>
          </div>
        ) : repos.length === 0 ? (
          <div className="text-center py-8">
            <Github className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No repositories found</p>
          </div>
        ) : (
          <>
            {/* Search Bar */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search repositories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Repositories Grid */}
            <div className="grid md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto">
              {filteredRepos.map((repo) => (
                <Card key={repo.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            {repo.isPrivate ? (
                              <Lock className="h-4 w-4 text-gray-500" />
                            ) : (
                              <Globe className="h-4 w-4 text-gray-500" />
                            )}
                            <h3 className="font-semibold text-lg truncate">
                              {repo.name}
                            </h3>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{repo.fullName}</p>
                        </div>
                      </div>

                      {/* Description */}
                      {repo.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {repo.description}
                        </p>
                      )}

                      {/* Metadata */}
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        {repo.language && (
                          <div className="flex items-center space-x-1">
                            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                            <span>{repo.language}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-1">
                          <Star className="h-3 w-3" />
                          <span>{repo.stars}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <GitFork className="h-3 w-3" />
                          <span>{repo.forks}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-2 pt-2">
                        <Button
                          size="sm"
                          onClick={() => handleScanRepo(repo)}
                          className="flex-1"
                        >
                          <Shield className="mr-2 h-4 w-4" />
                          Scan for Vulnerabilities
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          asChild
                        >
                          <a
                            href={repo.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredRepos.length === 0 && searchQuery && (
              <div className="text-center py-8">
                <p className="text-gray-600">No repositories match your search</p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
