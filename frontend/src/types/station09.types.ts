export type ResumeTemplateId = 'ats_optimized' | 'modern' | 'minimal';

export interface PersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  portfolio?: string;
  linkedin?: string;
}

export interface ExperienceEntry {
  id?: string;
  company: string;
  role: string;
  duration: string;
  description: string;
  bullets: string[];
  skills: string[];
  isHighlight?: boolean;
}

export interface EducationEntry {
  id?: string;
  institution: string;
  degree: string;
  field: string;
  graduationDate: string;
  gpa?: string;
  relevantCoursework: string[];
}

export interface SkillEntry {
  skillId?: string;
  skillName: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  endorsements?: number;
  yearsOfExperience?: number;
  isHighlight?: boolean;
  relatedProjects?: string[];
}

export interface ProjectEntry {
  id?: string;
  title: string;
  description: string;
  duration: string;
  technologies: string[];
  link?: string;
  achievements: string[];
}

export interface CertificationEntry {
  id?: string;
  title: string;
  issuer: string;
  issueDate: string;
  credentialUrl?: string;
}

export interface ATSOptimization {
  score: number;
  keywords: string[];
  missingKeywords: string[];
  suggestions: string[];
  lastOptimizedAt?: string;
}

export interface ResumeVersion {
  version: number;
  createdAt: string;
  summary: string;
}

export interface ResumeDocument {
  id: string;
  userId: string;
  title: string;
  template: ResumeTemplateId;
  createdAt?: string;
  updatedAt?: string;
  isPrimary?: boolean;
  personalInfo: PersonalInfo;
  summary: string;
  experience: ExperienceEntry[];
  education: EducationEntry[];
  skills: SkillEntry[];
  projects: ProjectEntry[];
  certifications: CertificationEntry[];
  atsOptimization: ATSOptimization;
  versions?: ResumeVersion[];
  currentVersion?: number;
}

// ==================== ATS ANALYSIS TYPES ====================

export interface KeywordMatch {
  keyword: string;
  count: number;
  found: boolean;
  locations?: number[];
}

export interface MissingKeyword {
  keyword: string;
  priority: 'high' | 'medium' | 'low';
}

export interface KeywordAnalysisData {
  found: KeywordMatch[];
  missing: MissingKeyword[];
  foundCount: number;
  totalChecked: number;
  matchPercentage: number;
}

export interface FormattingIssue {
  id: string;
  severity: 'error' | 'warning' | 'info';
  type: string;
  description: string;
  suggestion: string;
}

export interface RequiredSkill {
  skill: string;
  found: boolean;
  frequency: number;
}

export interface JDComparisonData {
  jobDescriptionId?: string;
  matchPercentage: number;
  requiredSkills: RequiredSkill[];
  niceToHaveSkills: RequiredSkill[];
  matchingSkills?: string[];
  missingSkills?: string[];
  recommendations: string[];
}

export interface Recommendation {
  action: string;
  impact: 'high' | 'medium' | 'low';
}

export interface RecommendationsData {
  immediate: Recommendation[];
  shortTerm: Recommendation[];
  longTerm: Recommendation[];
}

export interface ATSScoreBreakdown {
  overall: number;
  formatting: number;
  readability: number;
  keywords: number;
  metrics: number;
  parsing: number;
}

export interface ATSAnalysisResult {
  id?: string;
  userId?: string;
  resumeId?: string;
  analyzedAt?: string;
  atsScore: ATSScoreBreakdown;
  keywords: KeywordAnalysisData;
  formattingIssues: FormattingIssue[];
  metricsFound?: {
    metricsFound: number;
    examples: string[];
    hasMetrics: boolean;
    recommendation: string;
  };
  jdComparison?: JDComparisonData | null;
  recommendations: RecommendationsData;
  parsedText?: string;
  warnings?: string[];
  fileName?: string;
}
