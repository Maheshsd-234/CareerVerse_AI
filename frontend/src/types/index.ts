export interface User {
  uid: string;
  email: string;
  displayName: string;
  createdAt: Date | unknown;
  skills: string[];
  selectedCareer: string | null;
  assessmentScore: number | null;
}

export interface Role {
  id: string;
  name: string;
  category: string;
  requiredSkills: string[];
  salaryRange: string;
  trendScore: number;
  description: string;
}

export interface CareerPath {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  careerOptions: string[];
  requiredSkills: string[];
  governmentExams: string[];
  salaryRange: string;
  futureScope: string;
  duration: number; // in years
  streams?: Record<
    string,
    {
      title: string;
      roles: string[];
      eligibility: string[];
      exams: string[];
      mustKnow: string[];
    }
  >;
}

export interface Skill {
  id: string;
  name: string;
  category: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  description: string;
}

export interface AssessmentResult {
  userId: string;
  score: number;
  recommendedCareer: string;
  categories: Record<string, number>;
  createdAt: Date | unknown;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SkillGapAnalysis {
  userSkills: string[];
  roleRequiredSkills: string[];
  missingSkills: string[];
  matchPercentage: number;
}

export interface Roadmap {
  role: string;
  duration: number;
  year1: string[];
  year2: string[];
  year3: string[];
  year4?: string[];
}
