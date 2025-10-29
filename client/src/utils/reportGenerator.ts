interface Vulnerability {
  id: string;
  title: string;
  severity: string;
  file: string;
  line: number;
  description: string;
  codeSnippet: string;
  recommendation: string;
  type?: string;
}

interface ScanResult {
  id: string;
  status: string;
  startTime: string;
  endTime?: string;
  vulnerabilities: Vulnerability[];
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
    total: number;
  };
  repoInfo?: {
    languages: Record<string, number>;
    projectType: string;
    mainDirs: string[];
  };
}

/**
 * Generate a JSON report of the scan
 */
export function generateJSONReport(scan: ScanResult): void {
  const report = {
    reportGeneratedAt: new Date().toISOString(),
    scanId: scan.id,
    scanStatus: scan.status,
    scanStartTime: scan.startTime,
    scanEndTime: scan.endTime,
    summary: scan.summary,
    repositoryInfo: scan.repoInfo,
    vulnerabilities: scan.vulnerabilities.map(vuln => ({
      id: vuln.id,
      title: vuln.title,
      severity: vuln.severity,
      type: vuln.type,
      location: {
        file: vuln.file,
        line: vuln.line,
      },
      description: vuln.description,
      codeSnippet: vuln.codeSnippet,
      recommendation: vuln.recommendation,
    })),
  };

  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `vulnerability-scan-${scan.id}-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate a CSV report of the scan
 */
export function generateCSVReport(scan: ScanResult): void {
  const headers = ['ID', 'Title', 'Severity', 'Type', 'File', 'Line', 'Description', 'Recommendation'];
  const rows = scan.vulnerabilities.map(vuln => [
    vuln.id,
    `"${vuln.title.replace(/"/g, '""')}"`,
    vuln.severity,
    vuln.type || 'N/A',
    vuln.file,
    vuln.line.toString(),
    `"${vuln.description.replace(/"/g, '""')}"`,
    `"${vuln.recommendation.replace(/"/g, '""')}"`,
  ]);

  const csv = [
    headers.join(','),
    ...rows.map(row => row.join(',')),
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `vulnerability-scan-${scan.id}-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate an HTML report of the scan
 */
export function generateHTMLReport(scan: ScanResult): void {
  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return '#dc2626';
      case 'high': return '#ea580c';
      case 'medium': return '#f59e0b';
      case 'low': return '#3b82f6';
      case 'info': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vulnerability Scan Report - ${scan.id}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background: #f9fafb;
      padding: 2rem;
    }
    .container { max-width: 1200px; margin: 0 auto; background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .header { border-bottom: 3px solid #3b82f6; padding-bottom: 1.5rem; margin-bottom: 2rem; }
    .header h1 { color: #1f2937; font-size: 2rem; margin-bottom: 0.5rem; }
    .header .meta { color: #6b7280; font-size: 0.875rem; }
    .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
    .summary-card { background: #f3f4f6; padding: 1rem; border-radius: 6px; text-align: center; }
    .summary-card .number { font-size: 2rem; font-weight: bold; margin-bottom: 0.25rem; }
    .summary-card .label { color: #6b7280; font-size: 0.875rem; text-transform: uppercase; }
    .vulnerability { border: 1px solid #e5e7eb; border-radius: 6px; padding: 1.5rem; margin-bottom: 1rem; }
    .vulnerability-header { display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem; }
    .vulnerability-title { font-size: 1.25rem; font-weight: 600; color: #1f2937; }
    .severity-badge { padding: 0.25rem 0.75rem; border-radius: 9999px; color: white; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; }
    .vulnerability-meta { color: #6b7280; font-size: 0.875rem; margin-bottom: 1rem; }
    .code-snippet { background: #1f2937; color: #f3f4f6; padding: 1rem; border-radius: 4px; overflow-x: auto; margin: 1rem 0; font-family: 'Courier New', monospace; font-size: 0.875rem; }
    .section { margin-bottom: 1rem; }
    .section-title { font-weight: 600; color: #374151; margin-bottom: 0.5rem; }
    .footer { margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 0.875rem; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔒 Vulnerability Scan Report</h1>
      <div class="meta">
        <div>Scan ID: ${scan.id}</div>
        <div>Generated: ${new Date().toLocaleString()}</div>
        <div>Scan Date: ${new Date(scan.startTime).toLocaleString()}</div>
        ${scan.endTime ? `<div>Completed: ${new Date(scan.endTime).toLocaleString()}</div>` : ''}
      </div>
    </div>

    ${scan.repoInfo ? `
    <div class="section">
      <h2 class="section-title">Repository Information</h2>
      <p><strong>Project Type:</strong> ${scan.repoInfo.projectType}</p>
      <p><strong>Languages:</strong> ${Object.keys(scan.repoInfo.languages).join(', ')}</p>
      <p><strong>Main Directories:</strong> ${scan.repoInfo.mainDirs.join(', ')}</p>
    </div>
    ` : ''}

    <h2 style="margin-bottom: 1rem;">Summary</h2>
    <div class="summary">
      <div class="summary-card">
        <div class="number" style="color: #dc2626;">${scan.summary.critical}</div>
        <div class="label">Critical</div>
      </div>
      <div class="summary-card">
        <div class="number" style="color: #ea580c;">${scan.summary.high}</div>
        <div class="label">High</div>
      </div>
      <div class="summary-card">
        <div class="number" style="color: #f59e0b;">${scan.summary.medium}</div>
        <div class="label">Medium</div>
      </div>
      <div class="summary-card">
        <div class="number" style="color: #3b82f6;">${scan.summary.low}</div>
        <div class="label">Low</div>
      </div>
      <div class="summary-card">
        <div class="number" style="color: #6b7280;">${scan.summary.info}</div>
        <div class="label">Info</div>
      </div>
      <div class="summary-card">
        <div class="number" style="color: #1f2937;">${scan.summary.total}</div>
        <div class="label">Total</div>
      </div>
    </div>

    <h2 style="margin-bottom: 1rem;">Vulnerabilities (${scan.vulnerabilities.length})</h2>
    ${scan.vulnerabilities.map(vuln => `
      <div class="vulnerability">
        <div class="vulnerability-header">
          <div class="vulnerability-title">${vuln.title}</div>
          <span class="severity-badge" style="background-color: ${getSeverityColor(vuln.severity)}">
            ${vuln.severity}
          </span>
        </div>
        <div class="vulnerability-meta">
          📁 ${vuln.file}:${vuln.line}
        </div>
        <div class="section">
          <div class="section-title">Description</div>
          <p>${vuln.description}</p>
        </div>
        <div class="section">
          <div class="section-title">Code Snippet</div>
          <div class="code-snippet">${vuln.codeSnippet}</div>
        </div>
        <div class="section">
          <div class="section-title">Recommendation</div>
          <p>${vuln.recommendation}</p>
        </div>
      </div>
    `).join('')}

    <div class="footer">
      <p>Generated by SOTERIA Vulnerability Dashboard</p>
      <p>© ${new Date().getFullYear()} - All rights reserved</p>
    </div>
  </div>
</body>
</html>
  `;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `vulnerability-scan-${scan.id}-${new Date().toISOString().split('T')[0]}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate a Markdown report of the scan
 */
export function generateMarkdownReport(scan: ScanResult): void {
  const markdown = `# 🔒 Vulnerability Scan Report

**Scan ID:** ${scan.id}  
**Generated:** ${new Date().toLocaleString()}  
**Scan Date:** ${new Date(scan.startTime).toLocaleString()}  
${scan.endTime ? `**Completed:** ${new Date(scan.endTime).toLocaleString()}  ` : ''}

---

${scan.repoInfo ? `
## Repository Information

- **Project Type:** ${scan.repoInfo.projectType}
- **Languages:** ${Object.keys(scan.repoInfo.languages).join(', ')}
- **Main Directories:** ${scan.repoInfo.mainDirs.join(', ')}

---
` : ''}

## Summary

| Severity | Count |
|----------|-------|
| 🔴 Critical | ${scan.summary.critical} |
| 🟠 High | ${scan.summary.high} |
| 🟡 Medium | ${scan.summary.medium} |
| 🔵 Low | ${scan.summary.low} |
| ⚪ Info | ${scan.summary.info} |
| **Total** | **${scan.summary.total}** |

---

## Vulnerabilities (${scan.vulnerabilities.length})

${scan.vulnerabilities.map((vuln, index) => `
### ${index + 1}. ${vuln.title}

**Severity:** \`${vuln.severity}\`  
**Location:** \`${vuln.file}:${vuln.line}\`  
${vuln.type ? `**Type:** ${vuln.type}  ` : ''}

**Description:**  
${vuln.description}

**Code Snippet:**
\`\`\`
${vuln.codeSnippet}
\`\`\`

**Recommendation:**  
${vuln.recommendation}

---
`).join('\n')}

## Report Information

Generated by **SOTERIA Vulnerability Dashboard**  
© ${new Date().getFullYear()} - All rights reserved
`;

  const blob = new Blob([markdown], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `vulnerability-scan-${scan.id}-${new Date().toISOString().split('T')[0]}.md`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
