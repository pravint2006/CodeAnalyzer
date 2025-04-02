import { type TechSection, type AIContent } from "@shared/schema";

export interface IStorage {
  getTechContent(section: TechSection): Promise<AIContent | undefined>;
  saveTechContent(section: TechSection, content: AIContent): Promise<void>;
}

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

export const storage = new MemStorage();
