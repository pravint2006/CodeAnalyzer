import express, { type Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { generateTechContent, analyzeAndFixCode } from "./openai";
import { scanRepository, cloneRepository, type RepoAnalysisResult } from "./repo-scanner";
import { 
  scanRepositoryForVulnerabilities, 
  getScanStatus, 
  getAllScans, 
  updateVulnerabilityStatus,
  type ScanResult
} from "./vulnerability-scanner";
import { sections, type TechSection } from "@shared/schema";
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { promises as fs } from 'fs';
import githubAuthRoutes from './github-auth';
import githubFixRoutes from './github-fix-routes';

export async function registerRoutes(app: Express) {
  app.get("/api/tech/:section", async (req, res) => {
    const section = req.params.section as TechSection;

    if (!sections.includes(section)) {
      return res.status(400).json({ message: "Invalid section" });
    }

    try {
      let content = await storage.getTechContent(section);

      if (!content) {
        content = await generateTechContent(section);
        await storage.saveTechContent(section, content);
      }

      res.json(content);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(500).json({ message: errorMessage });
    }
  });

  // New endpoint for code analysis and fixing
  app.post("/api/analyze-code", express.json(), async (req, res) => {
    const { code, language } = req.body;

    if (!code) {
      return res.status(400).json({ message: "Code is required" });
    }

    try {
      const result = await analyzeAndFixCode(code, language);
      res.json(result);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(500).json({ message: errorMessage });
    }
  });

  // Repository scanning endpoint
  app.post("/api/scan-repository", express.json(), async (req, res) => {
    const { repoUrl } = req.body;

    if (!repoUrl) {
      return res.status(400).json({ message: "Repository URL is required" });
    }

    try {
      // Create a temporary directory for the repository
      const tempDir = path.join(process.cwd(), 'temp', `repo-${uuidv4()}`);
      
      // Clone the repository
      await cloneRepository(repoUrl, tempDir);
      
      // Scan the repository
      const result = await scanRepository(tempDir);
      
      // Clean up (in production, you might want to keep the repo for a while)
      await fs.rm(tempDir, { recursive: true, force: true });
      
      res.json(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Error scanning repository:', error);
      res.status(500).json({ message: `Failed to scan repository: ${errorMessage}` });
    }
  });

  // File upload endpoint for direct code analysis
  app.post("/api/analyze-files", express.json(), async (req, res) => {
    const { files } = req.body;

    if (!Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ message: "Files array is required" });
    }

    try {
      const results = [];
      
      for (const file of files) {
        if (!file.content) {
          results.push({
            filePath: file.path || 'unknown',
            error: 'No content provided'
          });
          continue;
        }

        try {
          const analysis = await analyzeAndFixCode(file.content, file.language || 'text');
          results.push({
            filePath: file.path || 'unknown',
            ...analysis
          });
        } catch (error) {
          results.push({
            filePath: file.path || 'unknown',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
      
      res.json({ results });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Error analyzing files:', error);
      res.status(500).json({ message: `Failed to analyze files: ${errorMessage}` });
    }
  });

  // Vulnerability Scanner Endpoints
  app.post("/api/vulnerability/scan", express.json(), async (req, res) => {
    const { repoUrl, settings } = req.body;
    
    if (!repoUrl) {
      return res.status(400).json({ message: "Repository URL is required" });
    }

    try {
      // Create a temporary directory for the repository
      const tempDir = path.join(process.cwd(), 'temp', `vuln-scan-${uuidv4()}`);
      
      // Clone the repository
      await cloneRepository(repoUrl, tempDir);
      
      // Start vulnerability scanning
      const scanResult = await scanRepositoryForVulnerabilities(tempDir, {
        scanDependencies: settings?.scanDependencies ?? true,
        scanSecrets: settings?.scanSecrets ?? true,
        deepScan: settings?.deepScan ?? false
      });
      
      // Clean up (in production, you might want to keep the repo for a while)
      await fs.rm(tempDir, { recursive: true, force: true });
      
      res.json(scanResult); // scanResult now includes repoInfo
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Error scanning for vulnerabilities:', error);
      res.status(500).json({ message: `Failed to scan for vulnerabilities: ${errorMessage}` });
    }
  });

  app.get("/api/vulnerability/scans", async (req, res) => {
    try {
      const scans = getAllScans();
      res.json({ scans });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Error fetching scans:', error);
      res.status(500).json({ message: `Failed to fetch scans: ${errorMessage}` });
    }
  });

  app.get("/api/vulnerability/scans/:scanId", async (req, res) => {
    try {
      const { scanId } = req.params;
      const scan = getScanStatus(scanId);
      
      if (!scan) {
        return res.status(404).json({ message: 'Scan not found' });
      }
      
      res.json(scan);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Error fetching scan:', error);
      res.status(500).json({ message: `Failed to fetch scan: ${errorMessage}` });
    }
  });

  app.put("/api/vulnerability/scans/:scanId/vulnerabilities/:vulnerabilityId", express.json(), async (req, res) => {
    try {
      const { scanId, vulnerabilityId } = req.params;
      const { status } = req.body;
      
      if (!status || !['open', 'in-progress', 'fixed', 'false-positive', 'wont-fix'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }
      
      const success = updateVulnerabilityStatus(scanId, vulnerabilityId, status);
      
      if (!success) {
        return res.status(404).json({ message: 'Scan or vulnerability not found' });
      }
      
      res.json({ success: true });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Error updating vulnerability status:', error);
      res.status(500).json({ message: `Failed to update vulnerability status: ${errorMessage}` });
    }
  });

  // Register GitHub routes
  app.use('/api/auth', githubAuthRoutes);
  app.use('/api/github', githubFixRoutes);

  return createServer(app);
}