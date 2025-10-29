import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function CodebaseExplanation() {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>About This Codebase</CardTitle>
      </CardHeader>
      <CardContent>
        <p>
          <strong>Vulnerability Dashboard</strong> is a full-stack application for scanning code repositories for security vulnerabilities and visualizing scan results.
        </p>
        <ul className="mt-3 list-disc list-inside space-y-1 text-sm text-muted-foreground">
          <li><strong>Frontend:</strong> React + TypeScript (Vite, TanStack Query, Tailwind CSS). Provides interactive dashboards and scan management UI.</li>
          <li><strong>Backend:</strong> Node.js + Express + TypeScript. Handles repository scanning, vulnerability detection, and serves REST APIs.</li>
          <li><strong>Scanning:</strong> Supports code and dependency scanning, using regex patterns and optionally AI-based analysis.</li>
          <li><strong>Persistence:</strong> Scan results and vulnerabilities are stored in memory or a database (can be extended).</li>
          <li><strong>Key Features:</strong> Real-time scan progress, severity breakdown, scan history, and actionable security insights.</li>
        </ul>
        <p className="mt-3 text-xs text-muted-foreground">
          For more details, see the project README or explore the code in the <code>server</code> and <code>client</code> directories.
        </p>
      </CardContent>
    </Card>
  );
}

export default CodebaseExplanation;
