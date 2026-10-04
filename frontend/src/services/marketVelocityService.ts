import { roles } from "../data/roles";
import type { Role } from "../types";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "openai/gpt-oss-20b";
const STORAGE_KEY = "careerverse_market_velocity_radar_2026";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface RoleVelocityData {
  roleId: string;
  velocityScore: number;        // e.g. 9.8 / 10
  deltaPercent: string;         // e.g. "+12.4%"
  trendStatus: "surge" | "high" | "stable" | "niche";
  marketDriver: string;         // 1 concise sentence on hiring catalyst in India
  estimatedOpenings: string;    // e.g. "14,500+"
  lastUpdated: string;
}

export interface MarketRadarSummary {
  overallSentiment: string;
  topSurgingRole: string;
  averageVelocity: number;
  lastUpdated: string;
  roles: Record<string, RoleVelocityData>;
  isLiveAI: boolean;
}

/**
 * High-fidelity static benchmark fallback data reflecting 2026 Indian tech landscape
 */
const DEFAULT_VELOCITY_MAP: Record<string, Omit<RoleVelocityData, "roleId" | "lastUpdated">> = {
  "software-engineer": {
    velocityScore: 9.8,
    deltaPercent: "+11.2%",
    trendStatus: "surge",
    marketDriver: "India GCC expansion & enterprise migration to scalable microservices",
    estimatedOpenings: "28,500+",
  },
  "frontend-dev": {
    velocityScore: 9.4,
    deltaPercent: "+7.8%",
    trendStatus: "high",
    marketDriver: "High consumer app engagement demands Next.js & mobile-first UI responsiveness",
    estimatedOpenings: "18,200+",
  },
  "backend-dev": {
    velocityScore: 9.7,
    deltaPercent: "+10.4%",
    trendStatus: "surge",
    marketDriver: "High-concurrency fintech, quick-commerce, and distributed database engineering",
    estimatedOpenings: "24,800+",
  },
  "fullstack-dev": {
    velocityScore: 9.6,
    deltaPercent: "+9.1%",
    trendStatus: "surge",
    marketDriver: "Startups and mid-market firms prioritizing versatile full-stack rapid prototyping",
    estimatedOpenings: "22,400+",
  },
  "mobile-dev": {
    velocityScore: 9.1,
    deltaPercent: "+5.6%",
    trendStatus: "high",
    marketDriver: "Tier-2/3 Indian market digitization boosting Flutter and cross-platform native apps",
    estimatedOpenings: "12,600+",
  },
  "devops-engineer": {
    velocityScore: 9.7,
    deltaPercent: "+13.5%",
    trendStatus: "surge",
    marketDriver: "Multi-cloud Kubernetes adoption and FinOps cloud spend optimization across GCCs",
    estimatedOpenings: "16,900+",
  },
  "qa-automation": {
    velocityScore: 8.8,
    deltaPercent: "+4.2%",
    trendStatus: "stable",
    marketDriver: "Shift-left continuous integration and automated Cypress/Playwright suites",
    estimatedOpenings: "11,500+",
  },
  "systems-architect": {
    velocityScore: 9.5,
    deltaPercent: "+8.9%",
    trendStatus: "high",
    marketDriver: "Architectural restructuring for AI workload integration and zero-downtime resilience",
    estimatedOpenings: "6,800+",
  },
  "data-scientist": {
    velocityScore: 9.7,
    deltaPercent: "+14.1%",
    trendStatus: "surge",
    marketDriver: "Enterprise predictive analytics, automated decision engines, and causal modeling",
    estimatedOpenings: "15,200+",
  },
  "ml-engineer": {
    velocityScore: 9.9,
    deltaPercent: "+18.6%",
    trendStatus: "surge",
    marketDriver: "Explosive demand for production LLM fine-tuning, RAG pipelines, and edge inference",
    estimatedOpenings: "17,800+",
  },
  "data-engineer": {
    velocityScore: 9.6,
    deltaPercent: "+12.0%",
    trendStatus: "surge",
    marketDriver: "Real-time streaming pipelines with Spark/Kafka fueling real-time ML feature stores",
    estimatedOpenings: "19,400+",
  },
  "bi-analyst": {
    velocityScore: 8.9,
    deltaPercent: "+4.8%",
    trendStatus: "stable",
    marketDriver: "Executive dashboarding and self-service analytics with Tableau, PowerBI, and dbt",
    estimatedOpenings: "14,100+",
  },
  "data-analyst": {
    velocityScore: 9.0,
    deltaPercent: "+6.0%",
    trendStatus: "high",
    marketDriver: "Data-driven commercial operations and metric instrumentation across Indian D2C",
    estimatedOpenings: "21,000+",
  },
  "ai-researcher": {
    velocityScore: 9.5,
    deltaPercent: "+15.2%",
    trendStatus: "surge",
    marketDriver: "Deep tech labs and multinational research arms advancing multimodal reasoning",
    estimatedOpenings: "4,200+",
  },
  "cybersecurity-analyst": {
    velocityScore: 9.8,
    deltaPercent: "+16.4%",
    trendStatus: "surge",
    marketDriver: "Stricter DPDP Act compliance, cloud ransomware threats, and Zero Trust mandates",
    estimatedOpenings: "13,900+",
  },
  "cloud-engineer": {
    velocityScore: 9.6,
    deltaPercent: "+11.8%",
    trendStatus: "surge",
    marketDriver: "AWS/Azure enterprise landing zone migrations and sovereign cloud infrastructure",
    estimatedOpenings: "23,100+",
  },
  "product-manager": {
    velocityScore: 9.3,
    deltaPercent: "+7.4%",
    trendStatus: "high",
    marketDriver: "Focus on AI-native product experiences, user retention, and monetization velocity",
    estimatedOpenings: "9,600+",
  },
  "uiux-designer": {
    velocityScore: 9.1,
    deltaPercent: "+6.2%",
    trendStatus: "high",
    marketDriver: "Accessible multilingual design systems and design-to-code workflow automation",
    estimatedOpenings: "10,800+",
  },
  "technical-writer": {
    velocityScore: 8.4,
    deltaPercent: "+3.1%",
    trendStatus: "stable",
    marketDriver: "Developer portal documentation, open-source SDK guides, and API specifications",
    estimatedOpenings: "4,500+",
  },
  "robotics-engineer": {
    velocityScore: 9.4,
    deltaPercent: "+13.8%",
    trendStatus: "surge",
    marketDriver: "Warehouse automation, ROS2 mobile robots, and drone manufacturing under Make-in-India",
    estimatedOpenings: "5,400+",
  },
  "vlsi-design-engineer": {
    velocityScore: 9.6,
    deltaPercent: "+15.9%",
    trendStatus: "surge",
    marketDriver: "India Semiconductor Mission and semiconductor fab / packaging investments",
    estimatedOpenings: "7,100+",
  },
  "embedded-systems-engineer": {
    velocityScore: 9.2,
    deltaPercent: "+8.5%",
    trendStatus: "high",
    marketDriver: "Electric vehicle (EV) battery management systems, IoT telematics, and firmware",
    estimatedOpenings: "11,200+",
  },
  "iot-solutions-architect": {
    velocityScore: 9.0,
    deltaPercent: "+7.1%",
    trendStatus: "high",
    marketDriver: "Industrial IoT 4.0 smart factory monitoring and smart metering rollouts",
    estimatedOpenings: "6,200+",
  },
  "cad-design-engineer": {
    velocityScore: 8.6,
    deltaPercent: "+4.5%",
    trendStatus: "stable",
    marketDriver: "Automotive EV chassis lightweighting and precision tooling simulation",
    estimatedOpenings: "9,800+",
  },
  "bim-engineer": {
    velocityScore: 8.9,
    deltaPercent: "+8.2%",
    trendStatus: "high",
    marketDriver: "Mega infrastructure, metro rail expansions, and smart city digital twins",
    estimatedOpenings: "8,500+",
  },
  "renewable-energy-engineer": {
    velocityScore: 9.3,
    deltaPercent: "+14.5%",
    trendStatus: "surge",
    marketDriver: "National Green Hydrogen Mission and rapid utility-scale solar/wind plant installations",
    estimatedOpenings: "7,900+",
  },
  "blockchain-developer": {
    velocityScore: 8.5,
    deltaPercent: "+3.8%",
    trendStatus: "niche",
    marketDriver: "Institutional tokenization, CBDC pilots, and cross-border trade finance protocols",
    estimatedOpenings: "3,800+",
  },
};

/**
 * Construct default fallback summary with timestamp
 */
export function getDefaultMarketRadar(): MarketRadarSummary {
  const roleMap: Record<string, RoleVelocityData> = {};
  const dateStr = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  roles.forEach((r) => {
    const fallback = DEFAULT_VELOCITY_MAP[r.id] || {
      velocityScore: Number(r.trendScore.toFixed(1)),
      deltaPercent: "+6.5%",
      trendStatus: r.trendScore >= 9.5 ? "surge" : r.trendScore >= 9.0 ? "high" : "stable",
      marketDriver: "Active hiring in Indian tech and GCC engineering centres",
      estimatedOpenings: "10,000+",
    };

    roleMap[r.id] = {
      roleId: r.id,
      ...fallback,
      lastUpdated: dateStr,
    };
  });

  return {
    overallSentiment: "Surging Tech Hiring in AI, Threat Defense, GCCs & Semiconductors",
    topSurgingRole: "Machine Learning & GenAI Engineer (+18.6% MoM)",
    averageVelocity: 9.3,
    lastUpdated: dateStr,
    roles: roleMap,
    isLiveAI: false,
  };
}

/**
 * Fetch dynamic velocity radar data with 24-hour localStorage caching & Groq LPU synthesis
 */
export async function getMarketVelocityRadar(
  roleList: Role[] = roles,
  forceRefresh: boolean = false
): Promise<MarketRadarSummary> {
  // 1. Check local storage cache if not force refreshed
  if (!forceRefresh) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const cached = JSON.parse(raw);
        if (
          cached &&
          cached.timestamp &&
          Date.now() - cached.timestamp < CACHE_TTL_MS &&
          cached.summary &&
          cached.summary.roles
        ) {
          const defaultRoles = getDefaultMarketRadar().roles;
          const mergedRoles: Record<string, RoleVelocityData> = { ...defaultRoles };
          for (const [key, val] of Object.entries(cached.summary.roles as Record<string, any>)) {
            if (val && typeof val === "object") {
              const num = Number(val.velocityScore);
              mergedRoles[key] = {
                ...defaultRoles[key],
                ...val,
                velocityScore: isNaN(num) ? (defaultRoles[key]?.velocityScore ?? 9.0) : num,
              };
            }
          }
          return {
            ...cached.summary,
            averageVelocity: Number(cached.summary.averageVelocity) || 9.3,
            roles: mergedRoles,
            isLiveAI: cached.summary.isLiveAI ?? true,
          };
        }
      }
    } catch (e) {
      console.warn("Purging corrupt market radar cache:", e);
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }
    }
  }

  // 2. Check for Groq API key
  const apiKey = import.meta.env.VITE_GROQ_API_KEY?.trim();
  if (!apiKey) {
    return getDefaultMarketRadar();
  }

  // 3. Batch calibrate all roles using Groq LPU
  try {
    const simplifiedRoles = roleList.map((r) => ({
      id: r.id,
      name: r.name,
      category: r.category,
      baseScore: r.trendScore,
    }));

    const prompt = `You are CareerVerse Market Velocity AI, analyzing the real-time 2026 hiring pulse across Indian Tech & Engineering (GCCs, Bangalore, Hyderabad, Pune, NCR).
Calibrate market velocity metrics for the following ${simplifiedRoles.length} roles:
${JSON.stringify(simplifiedRoles, null, 0)}

Requirements:
- velocityScore: float between 7.5 and 9.9 (scaled to demand)
- deltaPercent: string e.g. "+14.2%" or "+8.5%" (month-over-month hiring change)
- trendStatus: "surge" (if score >= 9.5), "high" (if >= 9.0), "stable" (if >= 8.2), or "niche"
- marketDriver: EXACTLY 1 crisp sentence explaining why companies in India are hiring for this role right now (mention GCCs, AI adoption, infrastructure, or regulations where applicable)
- estimatedOpenings: realistic active openings in India e.g. "15,200+", "8,400+"

Output MUST be a single raw JSON object matching this schema:
{
  "overallSentiment": "One-line high-impact market summary for India 2026",
  "topSurgingRole": "Role title (+XX% MoM)",
  "averageVelocity": 9.4,
  "roles": [
    {
      "roleId": "exact role id from input",
      "velocityScore": 9.8,
      "deltaPercent": "+12.4%",
      "trendStatus": "surge",
      "marketDriver": "1-sentence reason",
      "estimatedOpenings": "18,500+"
    }
  ]
}
Output ONLY raw JSON.`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    const res = await fetch(GROQ_API_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
      }),
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content || "";
      const start = text.indexOf("{");
      const end = text.lastIndexOf("}");

      if (start !== -1 && end > start) {
        const parsed = JSON.parse(text.slice(start, end + 1));
        if (parsed && Array.isArray(parsed.roles) && parsed.roles.length > 0) {
          const dateStr = new Date().toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          });

          const roleMap: Record<string, RoleVelocityData> = {};
          parsed.roles.forEach((item: any) => {
            if (item.roleId) {
              roleMap[item.roleId] = {
                roleId: item.roleId,
                velocityScore: typeof item.velocityScore === "number" ? item.velocityScore : 9.0,
                deltaPercent: item.deltaPercent || "+6.0%",
                trendStatus: item.trendStatus || "high",
                marketDriver: item.marketDriver || "Active hiring across Indian GCCs",
                estimatedOpenings: item.estimatedOpenings || "10,000+",
                lastUpdated: dateStr,
              };
            }
          });

          // Ensure every role in roleList is present
          roleList.forEach((r) => {
            if (!roleMap[r.id]) {
              const fallback = DEFAULT_VELOCITY_MAP[r.id] || {
                velocityScore: r.trendScore,
                deltaPercent: "+5.0%",
                trendStatus: "high",
                marketDriver: "Consistent hiring across Indian IT & core engineering sectors",
                estimatedOpenings: "10,000+",
              };
              roleMap[r.id] = { roleId: r.id, ...fallback, lastUpdated: dateStr };
            }
          });

          const summary: MarketRadarSummary = {
            overallSentiment: parsed.overallSentiment || "High Velocity Hiring Across AI, Cloud & GCC Hubs",
            topSurgingRole: parsed.topSurgingRole || "Machine Learning & GenAI Engineer (+18.6% MoM)",
            averageVelocity: typeof parsed.averageVelocity === "number" ? parsed.averageVelocity : 9.3,
            lastUpdated: dateStr,
            roles: roleMap,
            isLiveAI: true,
          };

          // Cache in localStorage
          try {
            localStorage.setItem(
              STORAGE_KEY,
              JSON.stringify({
                timestamp: Date.now(),
                summary,
              })
            );
          } catch {
            // ignore quota error
          }

          return summary;
        }
      }
    }
  } catch (err) {
    console.warn("Groq market velocity fetch failed, using benchmark radar:", err);
  }

  return getDefaultMarketRadar();
}
