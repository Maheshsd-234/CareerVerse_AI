import { groqService, formatGroqError, type AssessmentQuestion, type TrendingItem } from "./groqService";

// Re-export for seamless backward compatibility
export { groqService, formatGroqError };
export const formatGeminiError = formatGroqError;
export const geminiService = groqService;
export type { AssessmentQuestion, TrendingItem };
export default groqService;
