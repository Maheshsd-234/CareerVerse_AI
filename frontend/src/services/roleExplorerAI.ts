import { doc, getDoc, setDoc, serverTimestamp, type Firestore } from "firebase/firestore";
import type { RoleDetail, RoleTier } from "../types/roleExplorer.types";
import { roles } from "../data/roles";

const CACHE_VERSION = "v3";
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
- For each tier, specify ACCURATE, realistic Indian market salary ranges in LPA specifically calibrated for ${roleTitle}:
  * Beginner (0-2 years): Real entry-level market compensation for ${roleTitle} in India (e.g. ₹5-10 LPA for SWE/Frontend, ₹8-16 LPA for AI Engineer, ₹4-8 LPA for Data Analyst).
  * Intermediate (3-5 years): Real mid-level market compensation for ${roleTitle} in India.
  * Expert (6+ years): Real lead/staff/director level compensation for ${roleTitle} in India.
- The JSON object MUST strictly adhere to this format:
{
  "roleId": "<kebab-case-id>",
  "roleTitle": "${roleTitle}",
  "overview": "2-3 crisp, informative sentences describing what this role does and its importance in modern Indian industry.",
  "demandTrend": "rising" | "stable" | "declining",
  "topHiringCompaniesIndia": ["3-5 real companies hiring in India e.g. Google, Microsoft, Swiggy, Razorpay, Flipkart, TCS, Infosys"],
  "relatedRoles": ["3-5 lateral or adjacent role titles in India"],
  "tiers": [
    {
      "tierId": "beginner",
      "experienceRange": "0-2 years",
      "technicalSkills": ["3-5 technical skills for juniors"],
      "softSkills": ["3-5 soft skills"],
      "responsibilities": ["3-5 key day-to-day responsibilities"],
      "toolsAndStack": ["3-5 standard tools, libraries, or frameworks"],
      "salaryBandINR": "₹X - ₹Y LPA (calibrated specifically for beginner ${roleTitle})",
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
      "salaryBandINR": "₹X - ₹Y LPA (calibrated specifically for mid-level ${roleTitle})",
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
      "salaryBandINR": "₹X - ₹Y LPA (calibrated specifically for senior/lead ${roleTitle})",
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
  const category = staticRole?.category || "Software Engineering";
  const rawSkills = staticRole?.requiredSkills || ["Problem Solving", "Analytical Thinking", "Communication"];
  const description = staticRole?.description || `${roleTitle} plays a vital role in building scalable systems and driving organizational impact.`;

  const catLower = category.toLowerCase();
  const isSoftware = catLower.includes("software") || roleId.includes("sde") || roleId.includes("dev");
  const isAI = catLower.includes("data") || catLower.includes("ai");
  const isCloud = catLower.includes("cloud") || catLower.includes("security");
  const isDesign = catLower.includes("design") || catLower.includes("product");
  const isFinance = catLower.includes("business") || catLower.includes("finance");
  const isCore = catLower.includes("core") || catLower.includes("vlsi") || catLower.includes("embedded");
  const isGov = catLower.includes("government");

  const beginnerSkills = rawSkills.slice(0, 4);
  const intermediateSkills = [...rawSkills.slice(1, 4), isSoftware ? "System Architecture & LLD" : isAI ? "MLOps & Scalable Pipelines" : isCloud ? "Multi-Region Cloud Infra" : "Strategic Planning"];
  const expertSkills = [...rawSkills.slice(2, 5), isSoftware ? "Enterprise Distributed Systems" : isAI ? "Foundation Model Architecture" : isCloud ? "Enterprise Security Governance" : "Executive Strategy", "Team Leadership"];

  // Role & Domain-specific progressive salary bands across 3 tiers (0-2y, 3-5y, 6+y)
  let beginnerSalary = "₹5L - ₹9.5L LPA";
  let intermediateSalary = "₹12L - ₹24L LPA";
  let expertSalary = "₹28L - ₹55L+ LPA";

  if (roleId === "software-engineer") {
    beginnerSalary = "₹6L - ₹18L LPA (Junior / SDE 1)";
    intermediateSalary = "₹18L - ₹38L LPA (SDE 2)";
    expertSalary = "₹36L - ₹75L+ LPA (SDE 3 / Staff Engineer)";
  } else if (roleId === "frontend-dev") {
    beginnerSalary = "₹5L - ₹9.5L LPA (Junior Frontend)";
    intermediateSalary = "₹12L - ₹22L LPA (Senior Frontend)";
    expertSalary = "₹25L - ₹45L+ LPA (Lead / Staff UI Architect)";
  } else if (roleId === "backend-dev") {
    beginnerSalary = "₹6L - ₹12L LPA (Junior Backend)";
    intermediateSalary = "₹15L - ₹28L LPA (Senior Backend)";
    expertSalary = "₹30L - ₹58L+ LPA (Principal / Systems Architect)";
  } else if (roleId === "fullstack-dev") {
    beginnerSalary = "₹5.5L - ₹11L LPA (Junior Full Stack)";
    intermediateSalary = "₹14L - ₹26L LPA (Senior Full Stack)";
    expertSalary = "₹28L - ₹50L+ LPA (Lead Full Stack Architect)";
  } else if (roleId === "mobile-dev") {
    beginnerSalary = "₹5L - ₹10L LPA (Junior Mobile Dev)";
    intermediateSalary = "₹12L - ₹22L LPA (Senior Mobile Dev)";
    expertSalary = "₹25L - ₹42L+ LPA (Lead Mobile Architect)";
  } else if (roleId === "sdet-qa") {
    beginnerSalary = "₹4.5L - ₹8.5L LPA (Junior QA / SDET)";
    intermediateSalary = "₹11L - ₹20L LPA (Senior SDET)";
    expertSalary = "₹22L - ₹38L+ LPA (QA Lead / SDET Manager)";
  } else if (roleId === "ai-engineer" || roleId === "ml-engineer") {
    beginnerSalary = "₹8L - ₹16L LPA (Associate AI/ML Engineer)";
    intermediateSalary = "₹18L - ₹34L LPA (Senior AI/MLOps Engineer)";
    expertSalary = "₹35L - ₹68L+ LPA (Principal AI Architect)";
  } else if (roleId === "data-analyst") {
    beginnerSalary = "₹4L - ₹8L LPA (Junior BI / Data Analyst)";
    intermediateSalary = "₹10L - ₹18L LPA (Senior Data Analyst)";
    expertSalary = "₹20L - ₹34L+ LPA (Lead Analytics Manager)";
  } else if (roleId === "data-scientist" || roleId === "data-engineer") {
    beginnerSalary = "₹6.5L - ₹13L LPA (Associate Data Scientist/Engineer)";
    intermediateSalary = "₹15L - ₹28L LPA (Senior Data Scientist/Engineer)";
    expertSalary = "₹30L - ₹55L+ LPA (Staff Data Scientist / Architect)";
  } else if (roleId === "devops-sre" || roleId === "cybersecurity-analyst") {
    beginnerSalary = "₹6L - ₹11L LPA (Junior Cloud/SecOps Analyst)";
    intermediateSalary = "₹14L - ₹26L LPA (Senior SRE / Security Engineer)";
    expertSalary = "₹28L - ₹55L+ LPA (Principal Cloud / CISO Track)";
  } else if (roleId === "cloud-architect") {
    beginnerSalary = "₹12L - ₹20L LPA (Associate Cloud Architect)";
    intermediateSalary = "₹22L - ₹38L LPA (Senior Cloud Architect)";
    expertSalary = "₹40L - ₹75L+ LPA (Enterprise Chief Architect)";
  } else if (roleId === "uiux-designer") {
    beginnerSalary = "₹4.5L - ₹9L LPA (Junior Product Designer)";
    intermediateSalary = "₹12L - ₹22L LPA (Senior Product Designer)";
    expertSalary = "₹25L - ₹45L+ LPA (Design Director / Head of UX)";
  } else if (roleId === "product-manager") {
    beginnerSalary = "₹8L - ₹16L LPA (Associate PM - APM)";
    intermediateSalary = "₹18L - ₹32L LPA (Senior Product Manager)";
    expertSalary = "₹35L - ₹65L+ LPA (Group PM / Director of Product)";
  } else if (roleId === "vlsi-engineer" || roleId === "embedded-engineer" || roleId === "robotics-engineer") {
    beginnerSalary = "₹6L - ₹12L LPA (Graduate Hardware/Firmware Engineer)";
    intermediateSalary = "₹14L - ₹28L LPA (Senior Design/Embedded Engineer)";
    expertSalary = "₹30L - ₹55L+ LPA (Principal Silicon/Robotics Architect)";
  } else if (roleId === "management-consultant" || roleId === "financial-analyst") {
    beginnerSalary = "₹7L - ₹14L LPA (Analyst / Associate)";
    intermediateSalary = "₹16L - ₹30L LPA (Senior Consultant / VP Analyst)";
    expertSalary = "₹35L - ₹70L+ LPA (Partner / Managing Director)";
  } else if (roleId === "chartered-accountant") {
    beginnerSalary = "₹7L - ₹13L LPA (Audit & Tax Associate)";
    intermediateSalary = "₹15L - ₹28L LPA (Senior Manager / Partner Track)";
    expertSalary = "₹30L - ₹65L+ LPA (Partner / CFO Advisory)";
  } else if (roleId === "digital-marketer") {
    beginnerSalary = "₹4L - ₹8.5L LPA (Growth Specialist)";
    intermediateSalary = "₹11L - ₹20L LPA (Senior Growth Lead)";
    expertSalary = "₹24L - ₹42L+ LPA (Head of Marketing / CMO Track)";
  } else if (isGov) {
    beginnerSalary = "₹7L - ₹10L LPA + Govt Residence & Perks";
    intermediateSalary = "₹13L - ₹18L LPA + District Command Perks";
    expertSalary = "₹22L - ₹30L LPA + Apex Cabinet Perks";
  }

  // Domain-specific tools
  const beginnerTools = isSoftware
    ? ["Git / GitHub", "VS Code / IntelliJ", "Postman", "Docker Basics", "Jest / Vitest"]
    : isAI
    ? ["Python", "Jupyter / Colab", "Pandas", "Scikit-Learn", "Hugging Face"]
    : isCloud
    ? ["AWS Core Services", "Linux CLI", "Docker", "Terraform Basics", "GitHub Actions"]
    : isDesign
    ? ["Figma", "FigJam", "Notion", "Miro", "Lottie"]
    : isCore
    ? ["Verilog / VHDL", "ModelSim", "Git", "Oscilloscopes & Logic Analyzers", "Keil / STM32Cube"]
    : isGov
    ? ["E-Office Portal", "Govt Administrative Modules", "Public Grievance Dashboards", "MIS Tools"]
    : ["Excel Financial Models", "PowerBI", "Tally ERP / SAP", "SQL"];

  const intermediateTools = isSoftware
    ? ["Kubernetes", "Redis", "Kafka", "PostgreSQL", "AWS / GCP", "CI/CD Workflows"]
    : isAI
    ? ["PyTorch", "LangChain / LlamaIndex", "Vector DBs (Pinecone/Milvus)", "MLflow", "FastAPI"]
    : isCloud
    ? ["Kubernetes (EKS/GKE)", "Terraform", "Prometheus & Grafana", "Vault", "Cloudflare"]
    : isDesign
    ? ["Design Systems Architecture", "Framer", "UserZoom / Maze", "Mixpanel", "Principle"]
    : isCore
    ? ["Synopsys Design Compiler", "Cadence Virtuoso", "RTOS (FreeRTOS)", "Vivado", "FPGA Kits"]
    : isGov
    ? ["Public Finance Management System (PFMS)", "GeM Portal", "State Planning Portals", "District MIS"]
    : ["Advanced DCF Modeling", "Tableau", "SAP Financials", "Python for Data Analysis"];

  const expertTools = isSoftware
    ? ["Distributed Architecture", "Multi-Region Cloud Infra", "Terraform", "Datadog / APM", "Kafka Clusters"]
    : isAI
    ? ["Distributed Training (DeepSpeed/Ray)", "Model Quantization", "Enterprise RAG Infrastructure", "Triton Inference Server"]
    : isCloud
    ? ["Multi-Cloud Architecture", "Zero Trust Security", "FinOps Tooling", "Enterprise SIEM"]
    : isDesign
    ? ["Enterprise Design Systems", "Executive CX Roadmaps", "Data-Driven UX Tooling", "Design Ops"]
    : isCore
    ? ["Sub-micron ASIC Design Flows", "Physical Design & Signoff", "STA (PrimeTime)", "Automotive ECU Stacks"]
    : isGov
    ? ["National Policy Frameworks", "Union/State Budget Allocation Platforms", "Crisis Coordination Grid"]
    : ["Strategic Capital Allocation", "M&A Deal Execution Stacks", "Enterprise Risk Governance"];

  const tiers: RoleTier[] = [
    {
      tierId: "beginner",
      experienceRange: "0-2 years",
      technicalSkills: beginnerSkills.length ? beginnerSkills : ["Core Fundamentals", "Data Structures", "Version Control"],
      softSkills: ["Curiosity & Rapid Learning", "Collaborative Problem Solving", "Clear Written Communication"],
      responsibilities: [
        `Deliver clean, modular code and feature components with peer review adherence`,
        `Debug assigned issues and write comprehensive unit tests to ensure high test coverage`,
        `Participate in agile sprint ceremonies, standups, and architectural knowledge sharing`,
      ],
      toolsAndStack: beginnerTools,
      salaryBandINR: beginnerSalary,
      promotionCriteria: [
        "Consistent on-time delivery of sprint tickets with low defect density",
        "Demonstrated mastery of repository architecture and core business requirements",
        "Ability to independently debug and resolve standard staging/production issues",
      ],
      recommendedCertifications: isSoftware
        ? ["AWS Certified Cloud Practitioner", "GitHub Foundations", "Meta Front-End / Back-End Developer"]
        : isAI
        ? ["DeepLearning.AI TensorFlow / PyTorch Specialization", "AWS Certified Machine Learning Specialty"]
        : isCloud
        ? ["AWS Certified Solutions Architect - Associate", "HashiCorp Certified Terraform Associate"]
        : isDesign
        ? ["Google UX Design Professional Certificate", "Figma Advanced Component Architecture"]
        : isCore
        ? ["IEEE VLSI Design Certification", "ARM Embedded Architecture Specialization"]
        : isGov
        ? ["UPSC Civil Services Prelims/Mains Qualifications", "National Institute of Public Finance Certification"]
        : ["CFA Level 1", "Google Data Analytics Certificate", "NISM Series VIII"],
      interviewFocusAreas: [
        "Core syntax, data structures, algorithms, and logical problem solving",
        "Deep-dive into academic, internship, or portfolio project architectural decisions",
        "Behavioral adaptability, curiosity, and receptiveness to feedback",
      ],
    },
    {
      tierId: "intermediate",
      experienceRange: "3-5 years",
      technicalSkills: intermediateSkills,
      softSkills: ["Stakeholder Alignment", "Accurate Task Estimation", "Engineering Mentorship"],
      responsibilities: [
        `Own end-to-end design, implementation, and deployment of mission-critical services`,
        `Review peer code, establish coding standards, and maintain system performance SLAs`,
        `Collaborate closely with product managers and architects to translate product vision into tech specs`,
      ],
      toolsAndStack: intermediateTools,
      salaryBandINR: intermediateSalary,
      promotionCriteria: [
        "Track record of successfully launching multi-month initiatives with zero critical regressions",
        "Active mentorship of junior team members and leading technical onboarding",
        "Proactively identifying technical debt and refactoring bottlenecks to improve system throughput",
      ],
      recommendedCertifications: isSoftware
        ? ["AWS Certified Solutions Architect - Associate", "CKA (Certified Kubernetes Administrator)"]
        : isAI
        ? ["TensorFlow Developer Certificate", "Databricks Certified Generative AI Engineer"]
        : isCloud
        ? ["CKA (Certified Kubernetes Administrator)", "AWS Certified Security - Specialty"]
        : isDesign
        ? ["Nielsen Norman Group UX Master Certified", "Interaction Design Foundation Specialist"]
        : isCore
        ? ["Certified ASIC Design Specialist", "Embedded Linux System Architecture"]
        : isGov
        ? ["Mid-Career Training Program (MCTP)", "Public Policy Implementation Diploma"]
        : ["CFA Level 2", "Financial Risk Manager (FRM Level 1)", "PMP Certification"],
      interviewFocusAreas: [
        "Low-Level and High-Level System Design (scalability, caching, DB indexing)",
        "Failure recovery, concurrency control, and API rate limiting strategies",
        "Real-world incident retrospectives and cross-functional conflict resolution",
      ],
    },
    {
      tierId: "expert",
      experienceRange: "6+ years",
      technicalSkills: expertSkills,
      softSkills: ["Executive Influence", "Strategic Tech Vision", "Organizational Leadership"],
      responsibilities: [
        `Define long-term technical architecture, technology stack standards, and multi-year roadmaps`,
        `Uphold enterprise security, regulatory compliance, zero-downtime scalability, and reliability`,
        `Partner with VP of Engineering and C-suite leadership to align tech investments with business revenue`,
      ],
      toolsAndStack: expertTools,
      salaryBandINR: expertSalary,
      promotionCriteria: [
        "Measurable high-scale business impact (e.g. 40%+ cloud cost optimization or $10M+ throughput enablement)",
        "Proven ability to attract, hire, and retain top engineering and technical leadership talent",
        "Setting industry architectural benchmarks and establishing enduring technological moats",
      ],
      recommendedCertifications: isSoftware
        ? ["AWS Solutions Architect - Professional", "Google Cloud Professional Cloud Architect"]
        : isAI
        ? ["Stanford AI Professional Program", "NVIDIA Deep Learning Institute Senior Fellow"]
        : isCloud
        ? ["Google Professional Cloud Security Engineer", "CISM / CISSP"]
        : isDesign
        ? ["Design Leadership & Executive Strategy Masterclass", "Stanford d.school Fellow"]
        : isCore
        ? ["Distinguished VLSI Architect Fellow", "Semiconductor Executive Program"]
        : isGov
        ? ["Joint Secretary / Apex Governance Empanelment", "IAS Apex Grade Leadership"]
        : ["CFA Charterholder", "Executive Leadership & Private Equity Program", "FRM Charter"],
      interviewFocusAreas: [
        "Multi-region enterprise distributed system resilience and zero-data-loss architecture",
        "Technical leadership, hiring excellence, and aligning engineering roadmaps with business OKRs",
        "Strategic build vs. buy trade-offs and capital expenditure efficiency",
      ],
    },
  ];

  // Top Indian recruiters based on domain
  let topRecruiters = ["Google India", "Microsoft India", "Amazon India", "Flipkart", "Swiggy", "Razorpay", "TCS", "Infosys"];
  if (isSoftware) {
    topRecruiters = ["Google India", "Microsoft India", "Amazon India", "Flipkart", "Razorpay", "CRED", "Swiggy", "Adobe India", "TCS / Infosys"];
  } else if (isAI) {
    topRecruiters = ["Google DeepMind India", "Microsoft Research", "NVIDIA Bangalore", "Flipkart AI Labs", "Sarvam AI", "Fractal Analytics", "Adobe"];
  } else if (isCloud) {
    topRecruiters = ["Amazon Web Services (AWS)", "Microsoft Azure India", "Google Cloud", "Palo Alto Networks", "CrowdStrike India", "Cisco"];
  } else if (isDesign) {
    topRecruiters = ["CRED", "Swiggy", "Razorpay", "Urban Company", "PhonePe", "Flipkart", "Zomato", "Microsoft Studio"];
  } else if (isFinance) {
    topRecruiters = ["Goldman Sachs Bengaluru", "Morgan Stanley Mumbai", "JPMorgan Chase", "HDFC Bank", "Deloitte India", "KPMG", "McKinsey & Co."];
  } else if (isCore) {
    topRecruiters = ["Qualcomm India", "Intel India", "Texas Instruments Bengaluru", "NVIDIA", "Broadcom", "Tata Elxsi", "Bosch India"];
  } else if (isGov) {
    topRecruiters = ["Government of India (UPSC)", "Reserve Bank of India (RBI)", "State Public Service Commissions (PSCs)", "State Bank of India (SBI)", "SEBI"];
  }

  return {
    roleId,
    roleTitle,
    overview: description,
    demandTrend: staticRole && staticRole.trendScore >= 9.0 ? "rising" : "stable",
    topHiringCompaniesIndia: topRecruiters,
    relatedRoles: roles
      .filter((r) => r.id !== roleId && r.category === category)
      .slice(0, 5)
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
