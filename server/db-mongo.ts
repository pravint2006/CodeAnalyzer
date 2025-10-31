import { ScanResult, Vulnerability, TechContent, IScanResult, IVulnerability, VulnerabilityStatus } from './models';
import mongoose from 'mongoose';

// Scan Results Operations
export async function createScan(scanData: Partial<IScanResult>) {
  const scan = new ScanResult(scanData);
  await scan.save();
  return scan.toObject();
}

export async function updateScan(scanId: string, updateData: Partial<IScanResult>) {
  const result = await ScanResult.findByIdAndUpdate(
    scanId,
    { ...updateData, updatedAt: new Date() },
    { new: true }
  );
  return result?.toObject();
}

export async function getScan(scanId: string) {
  const result = await ScanResult.findById(scanId);
  return result?.toObject();
}

export async function listScans(limit = 10, offset = 0) {
  const results = await ScanResult.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(offset)
    .lean();
  return results;
}

// Vulnerabilities Operations
export async function createVulnerability(vulnData: Partial<IVulnerability>) {
  const vulnerability = new Vulnerability(vulnData);
  await vulnerability.save();
  return vulnerability.toObject();
}

export async function createVulnerabilities(vulns: Partial<IVulnerability>[]) {
  if (vulns.length === 0) return [];
  const results = await Vulnerability.insertMany(vulns);
  return results.map(v => v.toObject()).filter(Boolean);
}

export async function updateVulnerability(vulnId: string, updateData: Partial<IVulnerability>) {
  const result = await Vulnerability.findByIdAndUpdate(
    vulnId,
    { ...updateData, updatedAt: new Date() },
    { new: true }
  );
  return result?.toObject();
}

export async function getVulnerabilitiesByScan(scanId: string, status?: VulnerabilityStatus) {
  const query: any = { scanId: new mongoose.Types.ObjectId(scanId) };
  
  if (status) {
    query.status = status;
  }
  
  const results = await Vulnerability.find(query).lean();
  return results;
}

export async function updateVulnerabilityStatus(vulnId: string, status: VulnerabilityStatus) {
  const result = await Vulnerability.findByIdAndUpdate(
    vulnId,
    { 
      status,
      updatedAt: new Date() 
    },
    { new: true }
  );
  return result?.toObject();
}

// Tech Content Operations
export async function getTechContent(section: string) {
  const content = await TechContent.findOne({ section }).lean();
  return content?.content;
}

export async function saveTechContent(section: string, content: any) {
  const result = await TechContent.findOneAndUpdate(
    { section },
    { section, content },
    { upsert: true, new: true }
  );
  return result.toObject();
}

// Helper function to validate ObjectId
export function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id);
}

// Get all vulnerabilities (for admin/stats)
export async function getAllVulnerabilities(limit = 100, offset = 0) {
  const results = await Vulnerability.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(offset)
    .lean();
  return results;
}

// Get vulnerability by ID
export async function getVulnerability(vulnId: string) {
  const result = await Vulnerability.findById(vulnId).lean();
  return result;
}

// Delete scan and associated vulnerabilities
export async function deleteScan(scanId: string) {
  await Vulnerability.deleteMany({ scanId: new mongoose.Types.ObjectId(scanId) });
  const result = await ScanResult.findByIdAndDelete(scanId);
  return result?.toObject();
}

// Get scan statistics
export async function getScanStats() {
  const totalScans = await ScanResult.countDocuments();
  const completedScans = await ScanResult.countDocuments({ status: 'completed' });
  const failedScans = await ScanResult.countDocuments({ status: 'failed' });
  const inProgressScans = await ScanResult.countDocuments({ status: 'in-progress' });
  
  const totalVulnerabilities = await Vulnerability.countDocuments();
  const criticalVulns = await Vulnerability.countDocuments({ severity: 'critical' });
  const highVulns = await Vulnerability.countDocuments({ severity: 'high' });
  const mediumVulns = await Vulnerability.countDocuments({ severity: 'medium' });
  const lowVulns = await Vulnerability.countDocuments({ severity: 'low' });
  
  const openVulns = await Vulnerability.countDocuments({ status: 'open' });
  const fixedVulns = await Vulnerability.countDocuments({ status: 'fixed' });
  
  return {
    scans: {
      total: totalScans,
      completed: completedScans,
      failed: failedScans,
      inProgress: inProgressScans
    },
    vulnerabilities: {
      total: totalVulnerabilities,
      bySeverity: {
        critical: criticalVulns,
        high: highVulns,
        medium: mediumVulns,
        low: lowVulns
      },
      byStatus: {
        open: openVulns,
        fixed: fixedVulns
      }
    }
  };
}
