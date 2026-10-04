/**
 * CareerVerse AI - Station 05 Dynamic Roadmap Engine Types
 */

export type TaskType = "learn" | "practice" | "project" | "assessment" | "interview";

export type TaskStatus = "locked" | "available" | "in_progress" | "completed" | "needs_review" | "skipped";

export type DifficultyLevel = "beginner" | "intermediate" | "advanced";

export type FeasibilityStatus = "feasible" | "tight" | "conflict";

export interface QuizQuestion {
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
}

export interface InterviewQuestionItem {
  question: string;
  hint: string;
}

export interface ProjectSpec {
  title: string;
  deliverable: string;
  rubric: string;
}

export interface RoadmapTask {
  id: string;
  title: string;
  type: TaskType;
  skill_id: string;
  estimated_minutes: number;
  difficulty: DifficultyLevel;
  prerequisites: string[];
  status: TaskStatus;
  evidence_required: boolean;
  why_this_now: string;
  concepts?: string[];
  practice_prompt?: string;
  quiz_questions?: QuizQuestion[];
  interview_questions?: InterviewQuestionItem[];
  project_spec?: ProjectSpec;
  github_evidence_url?: string;
  last_score?: number;
  completed_at?: string;
}

export interface AssessmentQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer?: number;
  difficulty: "easy" | "medium" | "hard";
  topicId: string;
  learningObjectiveId?: string;
  explanation?: string;
}

export interface WeeklyAssessment {
  id: string;
  roadmap_id: string;
  week_id: string;
  week_number: number;
  role: string;
  user_level: string;
  attempt_number: number;
  passing_score: number;
  total_questions: number;
  passing_percentage: number;
  difficulty_distribution?: {
    easy: number;
    medium: number;
    hard: number;
  };
  questions: AssessmentQuestion[];
  status: "pending" | "in_progress" | "passed" | "failed";
}

export interface QuestionReviewItem {
  id: string;
  question: string;
  options: string[];
  user_answer?: number;
  correct_answer: number;
  is_correct: boolean;
  difficulty: string;
  topic: string;
  explanation: string;
}

export interface AssessmentRemediation {
  headline: string;
  required_score: number;
  actual_score: number;
  deficit: number;
  message: string;
  weak_topics: string[];
  action_steps: string[];
}

export interface AssessmentSubmissionResult {
  assessment_id: string;
  week_id: string;
  week_number: number;
  score: number;
  total_questions: number;
  percentage: number;
  passed: boolean;
  status?: string;
  passing_score: number;
  difficulty_breakdown: Record<string, { correct: number; total: number }>;
  topic_performance: Record<string, { correct: number; total: number; percentage: number }>;
  weak_topics: string[];
  remediation?: AssessmentRemediation | null;
  questions_review: QuestionReviewItem[];
  updated_roadmap: RoadmapPlan;
}

export interface DeprioritizedSkill {
  skill: string;
  skill_id?: string;
  skill_name?: string;
  is_core: boolean;
  estimated_hours: number;
  reason: string;
}

export interface RoadmapWeek {
  id: string;
  week_number: number;
  title: string;
  primary_skill: string;
  objective?: string;
  learning_objectives?: string[];
  topics?: string[];
  estimated_hours: number;
  learning_hours?: number;
  practice_hours?: number;
  assessment_hours?: number;
  assessment_score?: number;
  assessment_status?: "pending" | "passed" | "failed";
  passing_score?: number;
  total_questions?: number;
  best_score?: number | null;
  last_score?: number | null;
  tasks: RoadmapTask[];
  completion_percentage: number;
  status: "locked" | "in_progress" | "completed";
}

export interface RoadmapPhase {
  id: string;
  phase_number: number;
  title: string;
  description: string;
  estimated_hours: number;
  duration_weeks: number;
  skills: string[];
  status: "locked" | "in_progress" | "completed";
  completion_percentage: number;
  weeks: RoadmapWeek[];
}

export interface SkillPrerequisiteStatus {
  skill: string;
  satisfied: boolean;
  level: number;
}

export interface SkillGapItem {
  skill: string;
  category: string;
  difficulty: number;
  current_level: number;
  current_state: "Beginner" | "Developing" | "Competent" | "Strong" | "Advanced";
  target_level: number;
  gap_size: number;
  priority: "Critical" | "High" | "Medium" | "Low";
  priority_score: number;
  estimated_hours: number;
  is_core: boolean;
  market_demand: number;
  prerequisites: SkillPrerequisiteStatus[];
  all_prerequisites_met: boolean;
  description: string;
}

export interface RoadmapFeasibility {
  status: FeasibilityStatus;
  headline: string;
  message: string;
  capacity_ratio: number;
  total_required_hours: number;
  available_hours: number;
  hours_balance: number;
  recommended_weekly_hours: number;
  realistic_target_date: string;
}

export interface AdaptationNotice {
  type: "remediation" | "acceleration";
  title: string;
  message: string;
  action_taken: string;
}

export interface RoadmapPlan {
  id: string;
  user_id: string;
  target_role_id: string;
  target_role_name: string;
  target_role_category: string;
  experience_level: string;
  weekly_hours: number;
  target_date: string;
  target_timeline_months: number;
  total_weeks: number;
  learning_preference: string;
  goal: string;
  current_role?: string;
  overlapping_skills: string[];
  essential_skills?: string[];
  recommended_skills?: string[];
  deprioritized_skills?: DeprioritizedSkill[];
  specialization?: string;
  mvcp_mode: boolean;
  status: "active" | "paused" | "completed" | "archived";
  created_at: string;
  updated_at: string;
  engine_version: string;
  feasibility: RoadmapFeasibility;
  skill_gaps: SkillGapItem[];
  phases: RoadmapPhase[];
  mastery_weights: {
    learning: number;
    practice: number;
    assessment: number;
    project: number;
    interview: number;
  };
  overall_completion_pct: number;
  careerverse_skill_mastery_pct: number;
  latest_adaptation?: AdaptationNotice;
}

export interface RoadmapSimulationResult {
  simulated_weekly_hours: number;
  simulated_weeks: number;
  simulated_mvcp_mode: boolean;
  effective_required_hours: number;
  available_capacity_hours: number;
  hours_balance: number;
  capacity_ratio: number;
  feasibility_status: FeasibilityStatus;
  headline: string;
  recommendation: string;
  projected_finish_date: string;
}

export interface RoadmapCreationParams {
  userId?: string;
  targetRoleId: string;
  experienceLevel: string;
  weeklyHours: number;
  targetDate?: string;
  targetTimelineMonths?: number;
  learningPreference: string;
  goal: string;
  currentRole?: string;
  knownSkills?: string[];
  assessmentScores?: Record<string, number>;
  specialization?: string;
  mvcpMode?: boolean;
}
