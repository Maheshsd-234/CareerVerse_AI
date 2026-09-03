import { doc, getDoc, setDoc, serverTimestamp, type Firestore } from "firebase/firestore";
import type { RoleDetail, RoleTier } from "../types/roleExplorer.types";
import { roles } from "../data/roles";

const CACHE_VERSION = "v1";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

const GROQ_MODELS = [
  import.meta.env.VITE_GROQ_MODEL?.trim(),
  "openai/gpt-oss-20b",
  "openai/gpt-oss-120b",
  "qwen/qwen3.8-27b",
  "groq/compound-mini",
  "groq/compound",
  "llama-3.3-70b-versatile",
].filter((m): m is string => Boolean(m));

const UNIQUE_MODELS = [...new Set(GROQ_MODELS)];

export const buildRoleDetailPrompt = (roleTitle: string): string => {
  return `You are CareerVerse AI, an expert career advisor and labor economist for the Indian job market.

Analyze the career trajectory for the professional role: "${roleTitle}".

Task: Return a detailed, structured 3-tier career breakdown for this role in India.

Requirements:
- Return ONLY valid JSON (no markdown formatting, no code block fences, no surrounding commentary).
- The JSON object MUST strictly adhere to this format:
{
  "roleId": "<kebab-case-id>",
  "roleTitle": "${roleTitle}",
  "overview": "2-3 crisp, informative sentences describing what this role does and its importance in modern Indian industry.",
  "demandTrend": "rising" | "stable" | "declining",
  "topHiringCompaniesIndia": ["3-5 real companies hiring in India e.g. TCS, Infosys, Google, Swiggy, Razorpay, Amazon"],
  "relatedRoles": ["3-5 lateral or adjacent role titles in India"],
  "tiers": [
    {
      "tierId": "beginner",
      "experienceRange": "0-2 years",
      "technicalSkills": ["3-5 technical skills for juniors"],
      "softSkills": ["3-5 soft skills"],
      "responsibilities": ["3-5 key day-to-day responsibilities"],
      "toolsAndStack": ["3-5 standard tools, libraries, or frameworks"],
      "salaryBandINR": "₹X-Y LPA (realistic entry level in India e.g. ₹4-8 LPA)",
      "promotionCriteria": ["3-4 concrete achievements needed to reach intermediate level"],
      "recommendedCertifications": ["2-3 valued beginner certifications"],
      "interviewFocusAreas": ["3-4 topics tested during fresher/junior interviews"]
    },
    {
      "tierId": "intermediate",
      "experienceRange": "3-5 years",
      "technicalSkills": ["3-5 mid-level skills"],
      "softSkills": ["3-5 mid-level soft skills"],
      "responsibilities": ["3-5 mid-level responsibilities"],
      "toolsAndStack": ["3-5 advanced tools and platforms"],
      "salaryBandINR": "₹X-Y LPA (realistic mid-level in India e.g. ₹10-18 LPA)",
      "promotionCriteria": ["3-4 concrete milestones needed to reach expert/lead level"],
      "recommendedCertifications": ["2-3 valued mid-level certifications"],
      "interviewFocusAreas": ["3-4 topics tested during mid-level interviews e.g. system design, architecture"]
    },
    {
      "tierId": "expert",
      "experienceRange": "6+ years",
      "technicalSkills": ["3-5 staff/principal/lead technical skills"],
      "softSkills": ["3-5 leadership and communication skills"],
      "responsibilities": ["3-5 senior responsibilities including mentoring, roadmap ownership"],
      "toolsAndStack": ["3-5 enterprise-scale tooling & infra"],
      "salaryBandINR": "₹X-Y LPA (realistic senior/lead level in India e.g. ₹22-45 LPA)",
      "promotionCriteria": ["3-4 benchmarks for executive/principal staff progression"],
      "recommendedCertifications": ["2-3 elite certifications"],
      "interviewFocusAreas": ["3-4 senior leadership & architecture evaluation areas"]
    }
  ]
}

Return JSON now:`;
};

const extractJson = (text: string): string => {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first !== -1 && last !== -1 && last > first) {
    return text.slice(first, last + 1);
  }
  return text.trim();
};

export const generateStaticFallbackRoleDetail = (roleId: string, roleTitle: string): RoleDetail => {
  const staticRole = roles.find((r) => r.id === roleId || r.name.toLowerCase() === roleTitle.toLowerCase());
  const category = staticRole?.category || "Technology";
  const rawSkills = staticRole?.requiredSkills || ["Problem Solving", "Analytical Thinking", "Communication"];
  const description = staticRole?.description || `${roleTitle} plays a vital role in building scalable systems and driving organizational impact.`;

  const isTech = category.toLowerCase().includes("tech");
  const isFinance = category.toLowerCase().includes("business") || category.toLowerCase().includes("finance");

  const beginnerSkills = rawSkills.slice(0, 3);
  const intermediateSkills = [...rawSkills.slice(1, 4), isTech ? "System Architecture" : "Strategic Planning"];
  const expertSkills = [...rawSkills.slice(2, 5), isTech ? "Enterprise Architecture" : "Executive Strategy", "Team Leadership"];

  const tiers: RoleTier[] = [
    {
      tierId: "beginner",
      experienceRange: "0-2 years",
      technicalSkills: beginnerSkills.length ? beginnerSkills : ["Core Fundamentals", "Data Analysis", "Version Control"],
      softSkills: ["Curiosity & Fast Learning", "Team Collaboration", "Clear Written Communication"],
      responsibilities: [
        `Execute modular tasks and sub-components under guidance of senior team members`,
        `Write clean, testable solutions following organizational best practices`,
        `Participate actively in daily standups, code/design reviews, and sprint planning`,
      ],
      toolsAndStack: isTech
        ? ["Git / GitHub", "VS Code / IDE", "Docker Basics", "Postman"]
        : isFinance
        ? ["Excel / Financial Modeling", "ERP Software", "PowerBI", "SQL"]
        : ["Industry Standard Tooling", "Notion", "Figma / Canva", "Slack"],
      salaryBandINR: isTech ? "₹4.5 - ₹8 LPA" : isFinance ? "₹4 - ₹7.5 LPA" : "₹3.5 - ₹6.5 LPA",
      promotionCriteria: [
        "Consistent delivery of assigned tasks with minimal code review iterations",
        "Demonstrated understanding of core business logic and customer impact",
        "Ability to troubleshoot and resolve production issues independently",
      ],
      recommendedCertifications: isTech
        ? ["AWS Certified Cloud Practitioner", "GitHub Foundations", "Meta Front-End/Back-End Specialization"]
        : ["NISM / CFA Level 1", "Google Data Analytics Certificate", "Six Sigma White Belt"],
      interviewFocusAreas: [
        "Core syntax, data structures, and algorithmic fundamentals",
        "Academic / internship project deep-dive and trade-offs",
        "Behavioral problem solving and willingness to learn",
      ],
    },
    {
      tierId: "intermediate",
      experienceRange: "3-5 years",
      technicalSkills: intermediateSkills,
      softSkills: ["Stakeholder Communication", "Task Estimation", "Cross-Functional Mentorship"],
      responsibilities: [
        `Own feature design, end-to-end implementation, and deployment of critical modules`,
        `Review peer deliverables and uphold security, scalability, and code quality standards`,
        `Collaborate with product managers and cross-functional teams to refine technical specifications`,
      ],
      toolsAndStack: isTech
        ? ["Kubernetes", "AWS / GCP", "CI/CD Pipelines", "Redis / Kafka", "TypeScript"]
        : isFinance
        ? ["Advanced Excel", "SAP / Oracle Financials", "Tableau", "Python for Finance"]
        : ["Jira / Confluence", "Analytics Dashboards", "Figma", "Design Systems"],
      salaryBandINR: isTech ? "₹10 - ₹20 LPA" : isFinance ? "₹9 - ₹17 LPA" : "₹7.5 - ₹14 LPA",
      promotionCriteria: [
        "Track record of shipping multi-quarter projects on schedule with zero critical outages",
        "Active mentorship of juniors and onboarding new team engineers",
        "Driving refactoring initiatives that noticeably improve performance or maintainability",
      ],
      recommendedCertifications: isTech
        ? ["AWS Certified Solutions Architect - Associate", "CKA (Certified Kubernetes Administrator)"]
        : ["CFA Level 2", "PMP / PMI-ACP", "Advanced PowerBI Specialist"],
      interviewFocusAreas: [
        "High-level and low-level system design questions",
        "Concurrency, caching, database indexing, and scale bottlenecks",
        "Real-world conflict resolution and project ownership examples",
      ],
    },
    {
      tierId: "expert",
      experienceRange: "6+ years",
      technicalSkills: expertSkills,
      softSkills: ["Executive Influence", "Strategic Roadmap Vision", "Organizational Leadership"],
      responsibilities: [
        `Define long-term technological or operational architecture across multiple business lines`,
        `Set company-wide standards for reliability, security, compliance, and velocity`,
        `Partner directly with VP/C-suite leadership to align technical roadmap with business revenue targets`,
      ],
      toolsAndStack: isTech
        ? ["Distributed Systems", "Multi-Cloud Strategy", "Terraform", "Observability (Datadog/Prometheus)"]
        : isFinance
        ? ["Strategic Capital Allocation", "Risk Governance Systems", "Big Data FinTech Stacks"]
        : ["Enterprise Strategy Frameworks", "OKRs", "Product Management Tools"],
      salaryBandINR: isTech ? "₹24 - ₹48+ LPA" : isFinance ? "₹20 - ₹40+ LPA" : "₹16 - ₹32+ LPA",
      promotionCriteria: [
        "Direct measurable business impact (e.g. 30%+ cost reduction or multimillion revenue enablement)",
        "Proven ability to attract, recruit, and retain top industry talent",
        "Industry thought leadership and establishing new technological moats",
      ],
      recommendedCertifications: isTech
        ? ["AWS Solutions Architect Professional", "Google Cloud Professional Architect"]
        : ["CFA Charterholder", "Executive Leadership / MBA", "Financial Risk Manager (FRM)"],
      interviewFocusAreas: [
        "Enterprise-scale distributed architecture and failure-mode recovery",
        "People management, organizational strategy, and executive communication",
        "Long-term ROI and buy vs. build decision making",
      ],
    },
  ];

  return {
    roleId,
    roleTitle,
    overview: description,
    demandTrend: staticRole && staticRole.trendScore >= 9.0 ? "rising" : "stable",
    topHiringCompaniesIndia: isTech
      ? ["Google India", "Microsoft India", "Amazon India", "Flipkart", "Razorpay", "TCS / Infosys"]
      : isFinance
      ? ["HDFC Bank", "ICICI Bank", "Goldman Sachs Bengaluru", "Deloitte India", "KPMG"]
      : ["Tata Group", "Reliance Industries", "Zomato", "Swiggy", "Accenture India"],
    relatedRoles: roles
      .filter((r) => r.id !== roleId && r.category === category)
      .slice(0, 4)
      .map((r) => r.name),
    tiers,
  };
};

export const generateRoleDetail = async (roleId: string, roleTitle: string): Promise<RoleDetail> => {
  const groqApiKey = import.meta.env.VITE_GROQ_API_KEY?.trim();
  const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY?.trim();

  const prompt = buildRoleDetailPrompt(roleTitle);

  // 1. Try Groq API if key is present
  if (groqApiKey) {
    for (const model of UNIQUE_MODELS) {
      try {
        const response = await fetch(GROQ_API_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${groqApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            messages: [
              {
                role: "system",
                content: "You are an expert Indian labor economist and career counselor. Always respond with strict, parseable JSON only.",
              },
              { role: "user", content: prompt },
            ],
            temperature: 0.6,
            max_tokens: 2048,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const content = data.choices?.[0]?.message?.content;
          if (content) {
            const rawJson = extractJson(content);
            const parsed = JSON.parse(rawJson) as RoleDetail;
            if (parsed && Array.isArray(parsed.tiers) && parsed.tiers.length >= 3) {
              return {
                ...parsed,
                roleId,
                roleTitle: parsed.roleTitle || roleTitle,
              };
            }
          }
        }
      } catch (err) {
        console.warn(`Groq role generation error on model ${model}:`, err);
      }
    }
  }

  // 2. Try Gemini API if key is present
  if (geminiApiKey) {
    try {
      const { GoogleGenerativeAI } = await import("@google/generative-ai");
      const genAI = new GoogleGenerativeAI(geminiApiKey);
      const geminiModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
      const result = await geminiModel.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 2048, temperature: 0.6 },
      });
      const text = result.response.text();
      const rawJson = extractJson(text);
      const parsed = JSON.parse(rawJson) as RoleDetail;
      if (parsed && Array.isArray(parsed.tiers) && parsed.tiers.length >= 3) {
        return {
          ...parsed,
          roleId,
          roleTitle: parsed.roleTitle || roleTitle,
        };
      }
    } catch (err) {
      console.warn("Gemini role generation error:", err);
    }
  }

  // 3. Fall back to rich static verified data
  return generateStaticFallbackRoleDetail(roleId, roleTitle);
};

export const getRoleDetailCached = async (
  db: Firestore,
  roleId: string,
  roleTitle: string
): Promise<{ data: RoleDetail; isFallback: boolean }> => {
  try {
    const docRef = doc(db, "roleDetailCache", roleId);
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      const cached = snap.data();
      if (cached && cached.version === CACHE_VERSION && cached.data?.tiers?.length === 3) {
        return { data: cached.data as RoleDetail, isFallback: false };
      }
    }

    // Generate fresh data
    const freshData = await generateRoleDetail(roleId, roleTitle);

    // Save to Firestore cache asynchronously
    try {
      await setDoc(docRef, {
        data: freshData,
        model: import.meta.env.VITE_GROQ_MODEL || "groq-ai",
        version: CACHE_VERSION,
        generatedAt: serverTimestamp(),
      });
    } catch (writeErr) {
      console.warn("Firestore roleDetailCache write error (proceeding with data):", writeErr);
    }

    return { data: freshData, isFallback: false };
  } catch (error) {
    console.warn("Firestore cache read/generate failed, using static fallback:", error);
    const fallback = generateStaticFallbackRoleDetail(roleId, roleTitle);
    return { data: fallback, isFallback: true };
  }
};
