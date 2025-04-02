import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { generateTechContent } from "./openai";
import { sections, type TechSection } from "@shared/schema";

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

  return createServer(app);
}