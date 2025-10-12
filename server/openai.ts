import { GoogleGenerativeAI } from "@google/generative-ai";
import { type TechSection, type AIContent } from "@shared/schema";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export interface CodeAnalysisResult {
  originalCode: string;
  fixedCode: string;
  issues: Array<{
    lineNumber: number;
    issue: string;
    severity: 'high' | 'medium' | 'low';
    description: string;
    fix: string;
  }>;
  summary: string;
  language: string;
}

// Initialize Google's Generative AI with the API key from environment variables
if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY is not set in environment variables');
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function generateTechContent(section: TechSection): Promise<AIContent> {
  try {
    // Get the generative model
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    // Generate content
    const prompt = `You are a technology expert. Generate content about ${section} development including a summary, key features, and current trends. 
    Respond in JSON format with the following structure:
    {
      "summary": "A brief overview of ${section} development",
      "features": ["Feature 1", "Feature 2", "Feature 3"],
      "trends": ["Trend 1", "Trend 2", "Trend 3"]
    }`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse the response (remove markdown code block if present)
    const jsonString = text.replace(/^```json\n|\n```$/g, '');
    const content = JSON.parse(jsonString);
    
    return {
      summary: content.summary || 'Content generation failed',
      features: content.features || [],
      trends: content.trends || []
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error generating content:', error);
    throw new Error(`Failed to generate content: ${errorMessage}`);
  }
}

export async function analyzeAndFixCode(code: string, language: string = 'typescript'): Promise<CodeAnalysisResult> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const prompt = `You are a senior security engineer and code reviewer. Analyze the following ${language} code for security vulnerabilities, bugs, and code quality issues.
    
Code to analyze:
\`\`\`${language}
${code}
\`\`\`

Provide your analysis in the following JSON format:
{
  "fixedCode": "The fixed and secured version of the code with comments explaining changes",
  "issues": [
    {
      "lineNumber": 1,
      "issue": "SQL Injection vulnerability",
      "severity": "high",
      "description": "Directly concatenating user input into SQL query",
      "fix": "Use parameterized queries or prepared statements"
    }
  ],
  "summary": "Brief summary of the issues found and fixed"
}

Be thorough in your analysis and provide detailed fixes.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse the response
    const jsonString = text.replace(/^```json\n|\n```$/g, '');
    const analysis = JSON.parse(jsonString);
    
    return {
      originalCode: code,
      fixedCode: analysis.fixedCode || code,
      issues: analysis.issues || [],
      summary: analysis.summary || 'No issues found',
      language
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error analyzing code:', error);
    throw new Error(`Failed to analyze code: ${errorMessage}`);
  }
}