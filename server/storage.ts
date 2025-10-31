import { type TechSection, type AIContent } from "@shared/schema";
import { getTechContent as getMongoTechContent, saveTechContent as saveMongoTechContent } from "./db-mongo";

export interface IStorage {
  getTechContent(section: TechSection): Promise<AIContent | undefined>;
  saveTechContent(section: TechSection, content: AIContent): Promise<void>;
}

export class MongoStorage implements IStorage {
  async getTechContent(section: TechSection): Promise<AIContent | undefined> {
    return await getMongoTechContent(section);
  }

  async saveTechContent(section: TechSection, content: AIContent): Promise<void> {
    await saveMongoTechContent(section, content);
  }
}

// Legacy in-memory storage (kept for backward compatibility)
export class MemStorage implements IStorage {
  private content: Map<TechSection, AIContent>;

  constructor() {
    this.content = new Map();
  }

  async getTechContent(section: TechSection): Promise<AIContent | undefined> {
    return this.content.get(section);
  }

  async saveTechContent(section: TechSection, content: AIContent): Promise<void> {
    this.content.set(section, content);
  }
}

// Use MongoDB storage by default
export const storage = new MongoStorage();
