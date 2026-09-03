export interface RoleTier {
  tierId: "beginner" | "intermediate" | "expert";
  experienceRange: string;          // "0-2 years"
  technicalSkills: string[];
  softSkills: string[];
  responsibilities: string[];
  toolsAndStack: string[];
  salaryBandINR: string;            // "₹4-8 LPA"
  promotionCriteria: string[];      // what gets you to the next tier
  recommendedCertifications: string[];
  interviewFocusAreas: string[];    // what's tested at this level
}

export interface RoleDetail {
  roleId: string;
  roleTitle: string;
  overview: string;                 // 2-3 sentence role summary
  tiers: RoleTier[];                // exactly 3: beginner, intermediate, expert
  relatedRoles: string[];           // lateral/adjacent role titles
  topHiringCompaniesIndia: string[];
  demandTrend: "rising" | "stable" | "declining";
}
