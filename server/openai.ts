import OpenAI from "openai";
import { type TechSection, type AIContent } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024
const openai = new OpenAI({
  apiKey:
    "<API KEY>",
});

export async function generateTechContent(section: TechSection): Promise<AIContent> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a technology expert. Generate content about the specified technology platform."
        },
        {
          role: "user",
          content: `Generate content about ${section} development including a summary, key features, and current trends. Respond in JSON format.`
        }
      ],
      response_format: { type: "json_object" }
    });

    const content = JSON.parse(response.choices[0].message.content || '{}');
    return {
      summary: content.summary || 'Content generation failed',
      features: content.features || [],
      trends: content.trends || []
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`Failed to generate content: ${errorMessage}`);
  }
}