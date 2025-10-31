import mongoose, { Schema, Document } from 'mongoose';

// Enums
export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type ScanStatus = 'queued' | 'in-progress' | 'completed' | 'failed';
export type VulnerabilityStatus = 'open' | 'in-progress' | 'fixed' | 'false-positive' | 'wont-fix';

// Interfaces
export interface IScanResult extends Document {
  repoUrl: string;
  status: ScanStatus;
  startTime: Date;
  endTime?: Date;
  settings: {
    scanDependencies: boolean;
    scanSecrets: boolean;
    deepScan: boolean;
  };
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
    total: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IVulnerability extends Document {
  scanId: mongoose.Types.ObjectId;
  title: string;
  severity: Severity;
  description: string;
  file: string;
  line: number;
  codeSnippet: string;
  recommendation: string;
  cwe?: string;
  cve?: string;
  status: VulnerabilityStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITechContent extends Document {
  section: string;
  content: any;
}

// Schemas
const ScanResultSchema = new Schema<IScanResult>({
  repoUrl: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['queued', 'in-progress', 'completed', 'failed'],
    default: 'queued',
    required: true 
  },
  startTime: { type: Date, default: Date.now, required: true },
  endTime: { type: Date },
  settings: {
    scanDependencies: { type: Boolean, required: true },
    scanSecrets: { type: Boolean, required: true },
    deepScan: { type: Boolean, required: true }
  },
  summary: {
    critical: { type: Number, required: true, default: 0 },
    high: { type: Number, required: true, default: 0 },
    medium: { type: Number, required: true, default: 0 },
    low: { type: Number, required: true, default: 0 },
    info: { type: Number, required: true, default: 0 },
    total: { type: Number, required: true, default: 0 }
  }
}, {
  timestamps: true
});

const VulnerabilitySchema = new Schema<IVulnerability>({
  scanId: { type: Schema.Types.ObjectId, ref: 'ScanResult', required: true },
  title: { type: String, required: true },
  severity: { 
    type: String, 
    enum: ['critical', 'high', 'medium', 'low', 'info'],
    required: true 
  },
  description: { type: String, required: true },
  file: { type: String, required: true },
  line: { type: Number, required: true },
  codeSnippet: { type: String, required: true },
  recommendation: { type: String, required: true },
  cwe: { type: String },
  cve: { type: String },
  status: { 
    type: String, 
    enum: ['open', 'in-progress', 'fixed', 'false-positive', 'wont-fix'],
    default: 'open',
    required: true 
  }
}, {
  timestamps: true
});

const TechContentSchema = new Schema<ITechContent>({
  section: { type: String, required: true, unique: true },
  content: { type: Schema.Types.Mixed, required: true }
});

// Indexes for better query performance
ScanResultSchema.index({ createdAt: -1 });
ScanResultSchema.index({ status: 1 });
VulnerabilitySchema.index({ scanId: 1 });
VulnerabilitySchema.index({ severity: 1 });
VulnerabilitySchema.index({ status: 1 });

// Models
export const ScanResult = mongoose.model<IScanResult>('ScanResult', ScanResultSchema);
export const Vulnerability = mongoose.model<IVulnerability>('Vulnerability', VulnerabilitySchema);
export const TechContent = mongoose.model<ITechContent>('TechContent', TechContentSchema);
