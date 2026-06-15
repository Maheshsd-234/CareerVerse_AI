import { GoogleGenerativeAI, type GenerateContentResponse } from "@google/generative-ai";
import { roles } from "../data/roles";
import { careerPaths } from "../data/careerPaths";
import { skills } from "../data/skills";

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

const MODEL_CANDIDATES = [
  import.meta.env.VITE_GEMINI_MODEL?.trim(),
  "gemini-2.5-flash-lite",
  "gemini-flash-lite-latest",
  "gemini-2.0-flash-lite",
].filter((name): name is string => Boolean(name));

const UNIQUE_MODELS = [...new Set(MODEL_CANDIDATES)];

const isQuotaError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes("429") || message.toLowerCase().includes("quota");
};

export const formatGeminiError = (error: unknown): string => {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("Missing VITE_GEMINI_API_KEY")) {
    return "Gemini API key is missing. Add VITE_GEMINI_API_KEY to .env and restart the dev server.";
  }
  if (isQuotaError(error)) {
    return "The AI daily free limit was reached for this API key. Wait a few minutes and try again, or use a new key from Google AI Studio (aistudio.google.com).";
  }
  return "Sorry, I could not get a response. Please try again in a moment.";
};

const buildChatPrompt = (userMessage: string) => {
  const trimmed = userMessage.trim();
  if (trimmed.length < 80) {
    return `${systemPrompt}\n\nUser: ${trimmed}\n\nAssistant:`;
  }
  const context = compactContext();
  return `${systemPrompt}\n\nCareerVerseContext(JSON):\n${context}\n\nUser: ${trimmed}\n\nAssistant:`;
};

type GenerateRequest = {
  contents: { role: string; parts: { text: string }[] }[];
  generationConfig: { maxOutputTokens: number; temperature: number };
};

const systemPrompt = `You are CareerVerse AI: an expert career advisor for Indian students.\n\nYour goals:\n- Provide clear, practical, and actionable career guidance\n- Explain career paths after 10th, 12th, diploma, and degree\n- Suggest skills, learning roadmaps, and resources\n- Discuss salary ranges and job prospects\n- Answer questions about government exams and entrances\n- Keep answers structured (headings + bullets), concise, and helpful\n- Focus on India education + job market\n`;

const compactContext = () => {
  const topRoles = roles.slice(0, 20).map((r) => ({
    id: r.id,
    name: r.name,
    category: r.category,
    skills: r.requiredSkills.slice(0, 6),
    salary: r.salaryRange,
  }));

  const topPaths = careerPaths.slice(0, 20).map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    subcategory: p.subcategory,
    options: p.careerOptions.slice(0, 6),
    exams: p.governmentExams.slice(0, 6),
  }));

  const topSkills = skills.slice(0, 60).map((s) => s.name);

  return JSON.stringify(
    {
      roles: topRoles,
      careerPaths: topPaths,
      skills: topSkills,
    },
    null,
    0
  );
};

/** Read streamed text without throwing on terminal metadata/safety chunks. */
const readStreamChunkText = (chunk: GenerateContentResponse): string => {
  const parts = chunk.candidates?.[0]?.content?.parts;
  if (!parts?.length) return "";
  return parts.map((part) => part.text ?? "").join("");
};

const extractJson = (text: string) => {
  const fenced = text.match(/```json\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();
  const first = text.indexOf("[");
  const last = text.lastIndexOf("]");
  if (first !== -1 && last !== -1 && last > first) return text.slice(first, last + 1);
  return text.trim();
};

type AssessmentQuestion = {
  id: number;
  category: string;
  question: string;
  answers: Array<{
    text: string;
    points: { tech?: number; business?: number; creative?: number };
  }>;
};

type TrendingItem = {
  id: string;
  reason: string;
};

const generateWithFallback = async (request: GenerateRequest) => {
  let lastError: unknown;
  for (const modelName of UNIQUE_MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      return await model.generateContent(request);
    } catch (error) {
      lastError = error;
      if (!isQuotaError(error)) throw error;
      console.warn(`Gemini model ${modelName} quota exceeded, trying next...`);
    }
  }
  throw lastError;
};

const streamWithFallback = async function* (request: GenerateRequest) {
  let lastError: unknown;
  for (const modelName of UNIQUE_MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContentStream(request);
      let yielded = false;
      for await (const chunk of result.stream) {
        const text = readStreamChunkText(chunk);
        if (text) {
          yielded = true;
          yield text;
        }
      }
      if (yielded) return;
    } catch (error) {
      lastError = error;
      if (!isQuotaError(error)) throw error;
      console.warn(`Gemini model ${modelName} quota exceeded, trying next...`);
    }
  }
  throw lastError;
};

export const geminiService = {
  chat: async (userMessage: string): Promise<string> => {
    if (!import.meta.env.VITE_GEMINI_API_KEY) {
      throw new Error("Missing VITE_GEMINI_API_KEY");
    }

    const prompt = buildChatPrompt(userMessage);
    const result = await generateWithFallback({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 1024, temperature: 0.7 },
    });

    return result.response.text();
  },

  generateAssessmentQuestions: async (seed: string): Promise<AssessmentQuestion[]> => {
    if (!import.meta.env.VITE_GEMINI_API_KEY) {
      throw new Error("Missing VITE_GEMINI_API_KEY");
    }
    const prompt = `${systemPrompt}\n\nTask: Generate 15 unique career assessment questions for Indian students.\nRequirements:\n- Return ONLY valid JSON (no markdown) as an array of 15 objects.\n- Each object: {id:number, category:string, question:string, answers:[{text:string, points:{tech?:number,business?:number,creative?:number}}]}\n- Each question MUST have exactly 4 answers.\n- Points should be integers between 0 and 10.\n- Mix categories: Interest, Skills, Environment, Impact, RiskTolerance, AttentionToDetail, Collaboration, Patience, AmbiguityComfort, LearningStyle.\n- The questions should differ each time; use seed '${seed}' to vary.\n\nReturn JSON now.`;

    const result = await generateWithFallback({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 2048, temperature: 0.9 },
    });

    const text = result.response.text();
    const json = extractJson(text);
    const parsed = JSON.parse(json) as AssessmentQuestion[];

    if (!Array.isArray(parsed) || parsed.length < 10) {
      throw new Error("Invalid assessment questions format");
    }

    // light validation
    for (const q of parsed) {
      if (!q || typeof q.question !== "string" || !Array.isArray(q.answers) || q.answers.length !== 4) {
        throw new Error("Invalid question item");
      }
    }

    return parsed.slice(0, 15);
  },

  generateTrendingRoleIds: async (yearLabel: string): Promise<TrendingItem[]> => {
    if (!import.meta.env.VITE_GEMINI_API_KEY) {
      throw new Error("Missing VITE_GEMINI_API_KEY");
    }

    const context = compactContext();
    const prompt = `${systemPrompt}\n\nCareerVerseContext(JSON):\n${context}\n\nTask: Pick 6 trending roles for India for ${yearLabel}.\nRules:\n- Return ONLY valid JSON array.\n- Each item: {id: string, reason: string}\n- id MUST be one of the role ids present in CareerVerseContext.roles[].id.\n- Prefer roles like AI/ML, Cybersecurity, Full Stack, Data roles.\n\nReturn JSON now.`;

    const result = await generateWithFallback({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 1024, temperature: 0.7 },
    });

    const text = result.response.text();
    const json = extractJson(text);
    const parsed = JSON.parse(json) as TrendingItem[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error("Invalid trending roles response");
    }
    return parsed.slice(0, 6);
  },

  streamChat: async function* (userMessage: string) {
    if (!import.meta.env.VITE_GEMINI_API_KEY) {
      throw new Error("Missing VITE_GEMINI_API_KEY");
    }

    const prompt = buildChatPrompt(userMessage);
    yield* streamWithFallback({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 1024, temperature: 0.7 },
    });
  },
};
