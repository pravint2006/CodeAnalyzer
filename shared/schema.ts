import { pgTable, text, serial, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const techContent = pgTable("tech_content", {
  id: serial("id").primaryKey(),
  section: text("section").notNull(),
  content: jsonb("content").notNull(),
});

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
