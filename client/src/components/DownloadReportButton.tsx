import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileJson, FileText, FileSpreadsheet, FileCode } from 'lucide-react';
import { toast } from 'sonner';
import {
  generateJSONReport,
  generateCSVReport,
  generateHTMLReport,
  generateMarkdownReport,
} from '@/utils/reportGenerator';

interface ScanResult {
  id: string;
  status: string;
  startTime: string;
  endTime?: string;
  vulnerabilities: any[];
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
    total: number;
  };
  repoInfo?: any;
}

interface DownloadReportButtonProps {
  scan: ScanResult | null;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
}

export function DownloadReportButton({ scan, variant = 'default', size = 'default' }: DownloadReportButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async (format: 'json' | 'csv' | 'html' | 'markdown') => {
    if (!scan) {
      toast.error('No scan data available');
      return;
    }

    if (scan.vulnerabilities.length === 0) {
      toast.error('No vulnerabilities to report');
      return;
    }

    setIsGenerating(true);
    
    try {
      switch (format) {
        case 'json':
          generateJSONReport(scan);
          toast.success('JSON report downloaded successfully');
          break;
        case 'csv':
          generateCSVReport(scan);
          toast.success('CSV report downloaded successfully');
          break;
        case 'html':
          generateHTMLReport(scan);
          toast.success('HTML report downloaded successfully');
          break;
        case 'markdown':
          generateMarkdownReport(scan);
          toast.success('Markdown report downloaded successfully');
          break;
      }
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!scan || scan.vulnerabilities.length === 0) {
    return (
      <Button variant={variant} size={size} disabled>
        <Download className="mr-2 h-4 w-4" />
        Download Report
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} disabled={isGenerating}>
          <Download className="mr-2 h-4 w-4" />
          {isGenerating ? 'Generating...' : 'Download Report'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Export Format</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleDownload('html')}>
          <FileText className="mr-2 h-4 w-4" />
          <div className="flex flex-col">
            <span>HTML Report</span>
            <span className="text-xs text-gray-500">Formatted web page</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleDownload('json')}>
          <FileJson className="mr-2 h-4 w-4" />
          <div className="flex flex-col">
            <span>JSON Report</span>
            <span className="text-xs text-gray-500">Machine-readable data</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleDownload('csv')}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          <div className="flex flex-col">
            <span>CSV Report</span>
            <span className="text-xs text-gray-500">Spreadsheet format</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleDownload('markdown')}>
          <FileCode className="mr-2 h-4 w-4" />
          <div className="flex flex-col">
            <span>Markdown Report</span>
            <span className="text-xs text-gray-500">Documentation format</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
