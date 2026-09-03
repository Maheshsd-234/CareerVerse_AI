import { roles } from "../data/roles";
import { careerPaths } from "../data/careerPaths";
import { skills } from "../data/skills";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

const GROQ_MODELS = [
  import.meta.env.VITE_GROQ_MODEL?.trim(),
  "openai/gpt-oss-20b",
  "qwen/qwen3.8-27b",
  "groq/compound-mini",
  "openai/gpt-oss-120b",
  "qwen/qwen3.6-27b",
  "groq/compound",
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "mixtral-8x7b-32768",
  "gemma2-9b-it",
].filter((name): name is string => Boolean(name));

const UNIQUE_MODELS = [...new Set(GROQ_MODELS)];

export const formatGroqError = (error: unknown): string => {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("Missing VITE_GROQ_API_KEY") || message.includes("API key is missing")) {
    return "Groq API key is missing. Please add VITE_GROQ_API_KEY to your .env file and restart the development server.";
  }
  if (message.includes("401") || message.toLowerCase().includes("invalid api key")) {
    return "Invalid Groq API key. Please check your VITE_GROQ_API_KEY in the .env file.";
  }
  if (message.includes("429") || message.toLowerCase().includes("rate limit") || message.toLowerCase().includes("quota")) {
    return "Groq rate limit reached. Please wait a few seconds and try again.";
  }
  return "Sorry, I could not get a response from Groq AI. Please try again in a moment.";
};

export const formatAiError = formatGroqError;

const systemPrompt = `You are CareerVerse AI, a warm, highly knowledgeable, and friendly personal career counselor for Indian students and professionals.

Your communication style:
- Speak like a real human mentor (just like ChatGPT or Gemini) with an encouraging, empathetic, and professional tone.
- Format responses cleanly using natural paragraphs, clear bold section headings (## or ###), and bullet points (- or •).
- Do NOT output raw HTML tags (like <ul>, <li>, <br>). Use standard clean markdown only.
- Avoid cluttered pipe symbols or unreadable ASCII structures. Keep tables clean and only when comparing concrete metrics.
- Keep guidance realistic and practical for the Indian education system (10th/12th streams, diploma vs degree, entrance exams like JEE, NEET, CUET, CAT, GATE, UPSC, and Indian salary brackets in ₹ LPA).
- Provide actionable next steps and explain the reasoning behind your recommendations.
`;

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

const buildChatPrompt = (userMessage: string) => {
  const trimmed = userMessage.trim();
  if (trimmed.length < 80) {
    return trimmed;
  }
  const context = compactContext();
  return `CareerVerse Context (JSON):\n${context}\n\nUser Question:\n${trimmed}`;
};

const extractJson = (text: string) => {
  const fenced = text.match(/```json\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();
  const first = text.indexOf("[");
  const last = text.lastIndexOf("]");
  if (first !== -1 && last !== -1 && last > first) return text.slice(first, last + 1);
  return text.trim();
};

export type AssessmentQuestion = {
  id: number;
  category: string;
  question: string;
  answers: Array<{
    text: string;
    points: { tech?: number; business?: number; creative?: number };
  }>;
};

export type TrendingItem = {
  id: string;
  reason: string;
};

const getApiKey = () => {
  const key = import.meta.env.VITE_GROQ_API_KEY?.trim() || import.meta.env.VITE_GEMINI_API_KEY?.trim();
  if (!key) {
    throw new Error("Missing VITE_GROQ_API_KEY");
  }
  return key;
};

const callGroqApi = async (
  prompt: string,
  options: { temperature?: number; max_tokens?: number } = {}
): Promise<string> => {
  const apiKey = getApiKey();
  let lastError: unknown;

  for (const model of UNIQUE_MODELS) {
    try {
      const response = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt },
          ],
          temperature: options.temperature ?? 0.7,
          max_tokens: options.max_tokens ?? 4096,
          stream: false,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        let errMsg = `Groq error HTTP ${response.status}`;
        try {
          const errJson = JSON.parse(errText);
          errMsg = errJson.error?.message || errMsg;
        } catch {}
        throw new Error(errMsg);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (typeof content === "string") {
        return content;
      }
      throw new Error("Empty response received from Groq");
    } catch (error: any) {
      lastError = error;
      console.warn(`Groq model ${model} failed:`, error?.message || error);
      // Try next model if rate limited or model-specific error
    }
  }

  throw lastError || new Error("Failed to get response from Groq");
};

export const groqService = {
  chat: async (userMessage: string): Promise<string> => {
    const prompt = buildChatPrompt(userMessage);
    return await callGroqApi(prompt, { max_tokens: 4096, temperature: 0.7 });
  },

  streamChat: async function* (userMessage: string): AsyncGenerator<string, void, unknown> {
    const apiKey = getApiKey();
    const prompt = buildChatPrompt(userMessage);
    let lastError: unknown;

    for (const model of UNIQUE_MODELS) {
      try {
        const response = await fetch(GROQ_API_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: prompt },
            ],
            temperature: 0.7,
            max_tokens: 4096,
            stream: true,
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          let errMsg = `Groq stream error HTTP ${response.status}`;
          try {
            const errJson = JSON.parse(errText);
            errMsg = errJson.error?.message || errMsg;
          } catch {}
          throw new Error(errMsg);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("Browser stream reader unavailable");

        const decoder = new TextDecoder("utf-8");
        let buffer = "";
        let yieldedAny = false;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith(":")) continue;
            if (trimmed === "data: [DONE]") {
              return;
            }
            if (trimmed.startsWith("data: ")) {
              try {
                const json = JSON.parse(trimmed.slice(6));
                const delta = json.choices?.[0]?.delta?.content;
                if (delta) {
                  yieldedAny = true;
                  yield delta;
                }
              } catch {
                // Ignore incomplete line parse errors
              }
            }
          }
        }

        if (yieldedAny) return;
      } catch (error: any) {
        lastError = error;
        console.warn(`Groq stream model ${model} failed:`, error?.message || error);
      }
    }

    // If streaming failed or wasn't supported, try standard non-streaming completion as fallback
    try {
      const fallbackResponse = await groqService.chat(userMessage);
      if (fallbackResponse) {
        yield fallbackResponse;
        return;
      }
    } catch (fallbackErr) {
      console.warn("Groq non-streaming fallback also failed:", fallbackErr);
    }

    throw lastError || new Error("Failed to get response from Groq");
  },

  generateAssessmentQuestions: async (seed: string): Promise<AssessmentQuestion[]> => {
    const prompt = `Task: Generate 15 unique career assessment questions for Indian students.
Requirements:
- Return ONLY valid JSON (no markdown explanation) as an array of 15 objects.
- Each object: {"id": number, "category": string, "question": string, "answers": [{"text": string, "points": {"tech"?: number, "business"?: number, "creative"?: number}}]}
- Each question MUST have exactly 4 answers.
- Points should be integers between 0 and 10.
- Mix categories: Interest, Skills, Environment, Impact, RiskTolerance, AttentionToDetail, Collaboration, Patience, AmbiguityComfort, LearningStyle.
- The questions should differ each time; use seed '${seed}' to vary.

Return valid JSON array now.`;

    const text = await callGroqApi(prompt, { max_tokens: 2048, temperature: 0.8 });
    const json = extractJson(text);
    const parsed = JSON.parse(json) as AssessmentQuestion[];

    if (!Array.isArray(parsed) || parsed.length < 10) {
      throw new Error("Invalid assessment questions format");
    }

    for (const q of parsed) {
      if (!q || typeof q.question !== "string" || !Array.isArray(q.answers) || q.answers.length !== 4) {
        throw new Error("Invalid question item");
      }
    }

    return parsed.slice(0, 15);
  },

  generateTrendingRoleIds: async (yearLabel: string): Promise<TrendingItem[]> => {
    const context = compactContext();
    const prompt = `CareerVerse Context (JSON):\n${context}\n\nTask: Pick 6 trending roles for India for ${yearLabel}.\nRules:\n- Return ONLY valid JSON array.\n- Each item: {"id": string, "reason": string}\n- "id" MUST match one of the role IDs in CareerVerse Context (e.g. ai-engineer, full-stack-developer, data-scientist, cybersecurity-analyst, cloud-architect, product-manager).\n- Return valid JSON array now.`;

    const text = await callGroqApi(prompt, { max_tokens: 1024, temperature: 0.7 });
    const json = extractJson(text);
    const parsed = JSON.parse(json) as TrendingItem[];

    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error("Invalid trending roles response");
    }
    return parsed.slice(0, 6);
  },
};
