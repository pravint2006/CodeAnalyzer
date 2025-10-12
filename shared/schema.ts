import { pgTable, text, serial, jsonb, timestamp, integer, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const severityEnum = pgEnum('severity', ['critical', 'high', 'medium', 'low', 'info']);
export const scanStatusEnum = pgEnum('scan_status', ['queued', 'in-progress', 'completed', 'failed']);
export const vulnerabilityStatusEnum = pgEnum('vulnerability_status', ['open', 'in-progress', 'fixed', 'false-positive', 'wont-fix']);

// Scan Results
export const scanResults = pgTable('scan_results', {
  id: serial('id').primaryKey(),
  repoUrl: text('repo_url').notNull(),
  status: scanStatusEnum('status').notNull().default('queued'),
  startTime: timestamp('start_time').notNull().defaultNow(),
  endTime: timestamp('end_time'),
  settings: jsonb('settings').notNull(),
  summary: jsonb('summary').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const vulnerabilities = pgTable('vulnerabilities', {
  id: serial('id').primaryKey(),
  scanId: integer('scan_id').references(() => scanResults.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  severity: severityEnum('severity').notNull(),
  description: text('description').notNull(),
  file: text('file').notNull(),
  line: integer('line').notNull(),
  codeSnippet: text('code_snippet').notNull(),
  recommendation: text('recommendation').notNull(),
  cwe: text('cwe'),
  cve: text('cve'),
  status: vulnerabilityStatusEnum('status').notNull().default('open'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// Existing tables
export const techContent = pgTable("tech_content", {
  id: serial("id").primaryKey(),
  section: text("section").notNull(),
  content: jsonb("content").notNull(),
});

// Schemas
export const insertScanResultSchema = createInsertSchema(scanResults, {
  settings: z.object({
    scanDependencies: z.boolean(),
    scanSecrets: z.boolean(),
    deepScan: z.boolean()
  }),
  summary: z.object({
    critical: z.number(),
    high: z.number(),
    medium: z.number(),
    low: z.number(),
    info: z.number(),
    total: z.number()
  })
});

export const insertVulnerabilitySchema = createInsertSchema(vulnerabilities, {
  severity: z.enum(['critical', 'high', 'medium', 'low', 'info']),
  status: z.enum(['open', 'in-progress', 'fixed', 'false-positive', 'wont-fix'])
});

export const updateVulnerabilityStatusSchema = z.object({
  status: z.enum(['open', 'in-progress', 'fixed', 'false-positive', 'wont-fix'])
});

// Export types
export type ScanResult = typeof scanResults.$inferSelect;
export type NewScanResult = typeof scanResults.$inferInsert;
export type Vulnerability = typeof vulnerabilities.$inferSelect;
export type NewVulnerability = typeof vulnerabilities.$inferInsert;

export type VulnerabilityStatus = 'open' | 'in-progress' | 'fixed' | 'false-positive' | 'wont-fix';

export const insertTechContentSchema = createInsertSchema(techContent);
export type InsertTechContent = z.infer<typeof insertTechContentSchema>;
export type TechContent = typeof techContent.$inferSelect;

export const sections = ['java', 'android', 'ios', 'dotnet'] as const;
export type TechSection = typeof sections[number];

export interface TechCardData {
  title: string;
  description: string;
  icon: string;
  stat: string;
}

export interface AIContent {
  summary: string;
  features: string[];
  trends: string[];
}
