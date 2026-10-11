import type { ChatMessage } from "../types";

/**
 * Generate 2-3 dynamic, context-aware follow-up suggestion chips
 * based on the conversation history and the latest counselor response.
 */
export const generateFollowUpSuggestions = (messages: ChatMessage[]): string[] => {
  if (!messages || messages.length === 0) return [];

  // Find the latest user and assistant messages
  const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
  const lastAssistantMsg = [...messages].reverse().find((m) => m.role === "assistant");

  if (!lastAssistantMsg || !lastAssistantMsg.content.trim()) return [];

  const userQuery = (lastUserMsg?.content || "").toLowerCase();
  const assistantReply = lastAssistantMsg.content.toLowerCase();
  const fullContext = `${userQuery} ${assistantReply}`;

  // 1. NEET / Medical Aspirants
  if (fullContext.includes("neet") || fullContext.includes("mbbs") || fullContext.includes("medical")) {
    if (userQuery.includes("pattern") || userQuery.includes("marking") || userQuery.includes("negative")) {
      return [
        "What are the category cutoffs for Govt Medical Colleges (AIQ)?",
        "How does the 85% State Quota vs 15% AIQ counselling work?",
        "What are alternative careers if MBBS cutoffs aren't reached?",
      ];
    }
    if (userQuery.includes("eligib") || userQuery.includes("age") || userQuery.includes("attempt")) {
      return [
        "What is the Section B 10/15 question attempt strategy?",
        "What is the annual fee difference between Govt and Private colleges?",
        "Recommended study timetable for NCERT Biology revision",
      ];
    }
    if (userQuery.includes("fee") || userQuery.includes("cost") || userQuery.includes("salary")) {
      return [
        "What are rural service bond requirements after MBBS?",
        "What is the average stipend during MD/MS residency in India?",
        "Career options in Allied Health Sciences (BPT, MLT, B.Pharm)",
      ];
    }
    return [
      "Is there negative marking for wrong answers in NEET UG?",
      "What score is needed for AIIMS / Top Govt Medical Colleges?",
      "How to prepare Class 11 backlog alongside Class 12 syllabus?",
    ];
  }

  // 2. JEE / Engineering (IITs / NITs)
  if (fullContext.includes("jee") || fullContext.includes("iit") || fullContext.includes("nit") || fullContext.includes("b.tech")) {
    if (userQuery.includes("pattern") || userQuery.includes("eligib") || userQuery.includes("syllabus")) {
      return [
        "What rank is needed for CSE at Top 5 IITs or NITs?",
        "How is percentile calculated in JEE Main multi-session exam?",
        "What are good backup state entrance exams (KCET, MHT-CET, COMEDK)?",
      ];
    }
    if (userQuery.includes("salary") || userQuery.includes("package") || userQuery.includes("placement")) {
      return [
        "Difference in placement opportunities: IITs vs Tier-2 colleges",
        "How can students from non-CSE branches get tech roles?",
        "Key programming skills to build before starting college",
      ];
    }
    return [
      "What is the difference between JEE Main and JEE Advanced criteria?",
      "What are the recommended books for JEE Physics and Maths?",
      "What rank is needed for B.Tech CSE in top colleges?",
    ];
  }

  // 3. KCET / Karnataka State
  if (fullContext.includes("kcet") || fullContext.includes("karnataka") || fullContext.includes("kea")) {
    return [
      "How is KCET rank calculated using 50:50 Board and CET marks?",
      "Top engineering colleges in Bangalore through KCET counselling",
      "What are the verification documents required for KCET counselling?",
    ];
  }

  // 4. Software Engineering / Tech Salaries
  if (fullContext.includes("software engineer") || fullContext.includes("swe") || fullContext.includes("developer") || fullContext.includes("salary") || fullContext.includes("tech")) {
    if (userQuery.includes("salary") || userQuery.includes("pay") || userQuery.includes("lpa")) {
      return [
        "What skills differentiate a 6 LPA vs 20 LPA fresher role?",
        "How to prepare Data Structures and Algorithms for product companies?",
        "Which certifications or projects carry genuine weight on a resume?",
      ];
    }
    return [
      "What is the ideal roadmap for a 1st year B.Tech tech aspirant?",
      "How to get off-campus referrals for software engineering roles?",
      "Difference between Backend, Frontend, and AI/ML engineering pathways",
    ];
  }

  // 5. GATE / Masters / PSUs
  if (fullContext.includes("gate") || fullContext.includes("psu") || fullContext.includes("m.tech")) {
    return [
      "Which PSUs recruit directly through GATE scores with salaries?",
      "What is the monthly stipend for M.Tech through GATE?",
      "How many months of serious preparation are needed for GATE top 500?",
    ];
  }

  // 6. CAT / MBA
  if (fullContext.includes("cat") || fullContext.includes("mba") || fullContext.includes("iim")) {
    return [
      "What percentile is needed for Top IIMs (A, B, C) for non-engineers?",
      "Does work experience matter more than CAT score in IIM selection?",
      "Average CTC and consulting vs finance roles after MBA in India",
    ];
  }

  // 7. General Student Guidance / Study Tips
  if (fullContext.includes("study") || fullContext.includes("focus") || fullContext.includes("habits") || fullContext.includes("timetable")) {
    return [
      "How to set up a Pomodoro and active recall study schedule?",
      "How to deal with exam stress and fear of failure?",
      "Should I take a drop year or join a tier-2/3 college now?",
    ];
  }

  // Default dynamic contextual follow-ups
  return [
    "What are the key eligibility criteria and deadlines for this?",
    "What are the expected career salaries and growth progression?",
    "What is the step-by-step preparation plan for freshers?",
  ];
};
