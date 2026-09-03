export interface LiveJob {
  id: string;
  title: string;
  company: string;
  companyLogo?: string;
  companyDomain?: string;
  location: string;
  city: string;
  jobType: "Full-Time" | "Internship" | "Remote" | "Contract";
  salaryRange: string;
  description: string;
  applyUrl: string;
  source: string;
  postedDate: string;
  tags: string[];
  experienceLevel: "Fresher / 0-1 yrs" | "Junior / 1-3 yrs" | "Mid / 3-6 yrs" | "Senior / 6+ yrs";
}

export interface JobFilterParams {
  query?: string;
  city?: string;
  jobType?: string;
  experienceLevel?: string;
  page?: number;
}

// Known company name to official brand domain mapping
const KNOWN_COMPANY_DOMAINS: Record<string, string> = {
  "l&t": "ltts.com",
  "l&t technology": "ltts.com",
  "l&t technology services": "ltts.com",
  "larsen & toubro": "larsentoubro.com",
  "birlasoft": "birlasoft.com",
  "crum & forster": "cfins.com",
  "crum and forster": "cfins.com",
  "shi": "shi.com",
  "shi solutions": "shi.com",
  "swiggy": "swiggy.com",
  "zomato": "zomato.com",
  "blinkit": "blinkit.com",
  "zepto": "zeptonow.com",
  "flipkart": "flipkart.com",
  "amazon": "amazon.in",
  "google": "google.com",
  "microsoft": "microsoft.com",
  "tcs": "tcs.com",
  "tata consultancy services": "tcs.com",
  "tata": "tata.com",
  "infosys": "infosys.com",
  "wipro": "wipro.com",
  "hcl": "hcltech.com",
  "hcltech": "hcltech.com",
  "hcl technologies": "hcltech.com",
  "cognizant": "cognizant.com",
  "accenture": "accenture.com",
  "capgemini": "capgemini.com",
  "deloitte": "deloitte.com",
  "pwc": "pwc.com",
  "ey": "ey.com",
  "ernst & young": "ey.com",
  "kpmg": "kpmg.com",
  "phonepe": "phonepe.com",
  "paytm": "paytm.com",
  "razorpay": "razorpay.com",
  "cred": "cred.club",
  "groww": "groww.in",
  "zerodha": "zerodha.com",
  "hdfc": "hdfcbank.com",
  "hdfc bank": "hdfcbank.com",
  "icici": "icicibank.com",
  "icici bank": "icicibank.com",
  "sbi": "sbi.co.in",
  "state bank of india": "sbi.co.in",
  "axis bank": "axisbank.com",
  "tech mahindra": "techmahindra.com",
  "jio": "jio.com",
  "reliance": "ril.com",
  "oracle": "oracle.com",
  "ibm": "ibm.com",
  "sap": "sap.com",
  "cisco": "cisco.com",
  "intel": "intel.com",
  "nvidia": "nvidia.com",
  "jpmorgan": "jpmorgan.com",
  "jp morgan": "jpmorgan.com",
  "morgan stanley": "morganstanley.com",
  "goldman sachs": "goldmansachs.com",
  "adobe": "adobe.com",
  "salesforce": "salesforce.com",
  "zoho": "zoho.com",
  "freshworks": "freshworks.com",
  "ola": "olacabs.com",
  "uber": "uber.com",
  "urban company": "urbancompany.com",
  "makemytrip": "makemytrip.com",
  "siemens": "siemens.com",
  "abb": "abb.com",
  "bosch": "bosch.com",
  "schneider electric": "se.com",
  "browserstack": "browserstack.com",
  "persistent systems": "persistent.com",
  "mphasis": "mphasis.com",
  "ltimindtree": "ltimindtree.com",
  "mindtree": "ltimindtree.com",
  "zensar": "zensar.com",
  "cyient": "cyient.com",
  "honeywell": "honeywell.com",
  "qualcomm": "qualcomm.com",
  "amd": "amd.com",
  "dell": "dell.com",
  "hp": "hp.com",
  "lenovo": "lenovo.com",
  "samsung": "samsung.com",
  "genpact": "genpact.com",
  "ntt data": "nttdata.com",
  "virtusa": "virtusa.com",
  "hexaware": "hexaware.com",
  "kpit": "kpit.com",
  "sonata software": "sonata-software.com",
  "coforge": "coforge.com"
};

export function resolveCompanyDomain(companyName: string): string {
  if (!companyName) return "";
  const clean = companyName.toLowerCase().replace(/[^\w\s&]/g, "").trim();
  
  for (const [key, domain] of Object.entries(KNOWN_COMPANY_DOMAINS)) {
    if (clean === key || clean.includes(key) || key.includes(clean)) {
      return domain;
    }
  }

  const coreBrand = clean
    .replace(/\b(private limited|pvt ltd|pvt|ltd|limited|services|solutions|technologies|technology|india|corp|inc|llc|co)\b/gi, "")
    .replace(/\s+/g, "")
    .trim();

  return coreBrand ? `${coreBrand}.com` : "";
}

class LiveJobService {
  // Fast in-memory cache for silky smooth tab switching without lag
  private cache = new Map<string, { jobs: LiveJob[]; totalCount: number; timestamp: number }>();

  private formatTimeAgo(isoString?: string): string {
    if (!isoString) return "Recently Posted";
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHrs < 1) return "Just now";
      if (diffHrs < 24) return `${diffHrs}h ago`;
      const diffDays = Math.floor(diffHrs / 24);
      if (diffDays === 1) return "Yesterday";
      if (diffDays > 60) return "Recently Posted";
      return `${diffDays}d ago`;
    } catch {
      return "Recently Posted";
    }
  }

  /**
   * Intelligently classify job experience level for the Indian market
   */
  private classifyExperience(title: string, desc: string): "Fresher / 0-1 yrs" | "Junior / 1-3 yrs" | "Mid / 3-6 yrs" | "Senior / 6+ yrs" {
    const text = `${title} ${desc}`.toLowerCase();

    if (
      text.includes("senior") ||
      text.includes("lead") ||
      text.includes("principal") ||
      text.includes("architect") ||
      text.includes("director") ||
      text.includes("manager") ||
      text.includes("head") ||
      text.includes("6+") ||
      text.includes("7+") ||
      text.includes("8+") ||
      text.includes("10+")
    ) {
      return "Senior / 6+ yrs";
    }

    if (
      text.includes("fresher") ||
      text.includes("trainee") ||
      text.includes("intern") ||
      text.includes("graduate") ||
      text.includes("entry level") ||
      text.includes("associate") ||
      text.includes("0-1") ||
      text.includes("0-2") ||
      text.includes("0 to 1") ||
      text.includes("0 to 2") ||
      text.includes("campus") ||
      text.includes("junior") ||
      text.includes("analyst") ||
      text.includes("assistant") ||
      text.includes("get") ||
      text.includes("support")
    ) {
      return "Fresher / 0-1 yrs";
    }

    if (text.includes("3-5") || text.includes("3-6") || text.includes("4+") || text.includes("5+")) {
      return "Mid / 3-6 yrs";
    }

    return "Junior / 1-3 yrs";
  }

  /**
   * Fetch 100% live job openings from Adzuna India API with caching and count synchronization
   */
  async searchLiveJobs(params: JobFilterParams): Promise<{
    jobs: LiveJob[];
    totalCount: number;
    sourceType: "live-api";
  }> {
    const { query = "", city = "all", jobType = "all", experienceLevel = "all" } = params;

    const cacheKey = `${query.trim().toLowerCase()}_${city}_${jobType}_${experienceLevel}`;
    const cached = this.cache.get(cacheKey);
    // Return cached results instantly if fresh (< 3 mins)
    if (cached && Date.now() - cached.timestamp < 180000) {
      return {
        jobs: cached.jobs,
        totalCount: cached.totalCount,
        sourceType: "live-api"
      };
    }

    const appId = import.meta.env.VITE_ADZUNA_APP_ID || "";
    const appKey = import.meta.env.VITE_ADZUNA_APP_KEY || "";

    if (!appId || !appKey) {
      console.warn("Adzuna API credentials missing in .env");
      return { jobs: [], totalCount: 0, sourceType: "live-api" };
    }

    try {
      const country = "in";
      
      // 1. Sanitize user query
      const cleanUserQuery = query
        .replace(/[\/\&\|\+\@\(\)\#\:]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      // 2. Build smart primary query term
      let primaryTerm = "";
      if (jobType === "Internship") {
        primaryTerm = cleanUserQuery ? `${cleanUserQuery} intern` : "intern";
      } else if (experienceLevel === "Senior / 6+ yrs") {
        primaryTerm = cleanUserQuery ? `${cleanUserQuery} senior` : "senior developer";
      } else if (experienceLevel === "Junior / 1-3 yrs") {
        primaryTerm = cleanUserQuery ? `${cleanUserQuery} junior` : "junior developer";
      } else if (experienceLevel === "Mid / 3-6 yrs") {
        primaryTerm = cleanUserQuery ? `${cleanUserQuery} engineer` : "software engineer";
      } else if (experienceLevel === "Fresher / 0-1 yrs") {
        // Broad query for freshers to capture thousands of entry opportunities
        primaryTerm = cleanUserQuery ? `${cleanUserQuery} associate junior` : "associate developer trainee";
      } else {
        primaryTerm = cleanUserQuery || "developer";
      }

      if (city === "Remote" && !primaryTerm.toLowerCase().includes("remote")) {
        primaryTerm = `${primaryTerm} remote`;
      }

      const whatParam = encodeURIComponent(primaryTerm);

      // Build location parameter
      let whereParam = "";
      if (city !== "all" && city !== "Remote") {
        if (city.toLowerCase() === "bengaluru") {
          whereParam = "&where=Bangalore";
        } else if (city.toLowerCase().includes("delhi")) {
          whereParam = "&where=Delhi";
        } else {
          whereParam = `&where=${encodeURIComponent(city)}`;
        }
      }

      // Adzuna direct contract / full-time filters (only apply when not searching internships)
      let extraFilters = "";
      if (jobType === "Full-Time") {
        extraFilters += "&full_time=1";
      } else if (jobType === "Contract") {
        extraFilters += "&contract=1";
      }

      const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/1?app_id=${appId}&app_key=${appKey}&results_per_page=50&what=${whatParam}${whereParam}${extraFilters}`;

      let response = await fetch(url);
      let data: any = null;

      if (response.ok) {
        data = await response.json();
      }

      // Fallback: If 0 results found, query with broader base term so user always gets openings
      if (!data?.results || data.results.length === 0) {
        const fallbackTerm = jobType === "Internship" 
          ? (cleanUserQuery ? `${cleanUserQuery} intern` : "intern") 
          : (cleanUserQuery ? cleanUserQuery : (experienceLevel === "Fresher / 0-1 yrs" ? "trainee" : "developer"));
        const fallbackUrl = `https://api.adzuna.com/v1/api/jobs/${country}/search/1?app_id=${appId}&app_key=${appKey}&results_per_page=50&what=${encodeURIComponent(fallbackTerm)}${whereParam}`;
        const fallbackRes = await fetch(fallbackUrl);
        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json();
          if (fallbackData?.results?.length > 0) {
            data = fallbackData;
          }
        }
      }

      if (!data?.results || !Array.isArray(data.results) || data.results.length === 0) {
        return { jobs: [], totalCount: 0, sourceType: "live-api" };
      }

      let parsedJobs: LiveJob[] = data.results.map((item: any, idx: number) => {
        const cleanTitle = item.title?.replace(/<\/?[^>]+(>|$)/g, "") || "Open Position";
        const cleanDesc = item.description?.replace(/<\/?[^>]+(>|$)/g, "") || "Active job opening in India.";
        const companyName = item.company?.display_name || "Confidential Recruiter";
        const domain = resolveCompanyDomain(companyName);
        const isContract = item.contract_time === "contract" || item.contract_type === "contract";
        
        let jobTypeVal: "Full-Time" | "Internship" | "Remote" | "Contract" = "Full-Time";
        if (cleanTitle.toLowerCase().includes("intern") || cleanTitle.toLowerCase().includes("trainee") || cleanTitle.toLowerCase().includes("apprentice") || cleanDesc.toLowerCase().includes("internship")) {
          jobTypeVal = "Internship";
        } else if (isContract) {
          jobTypeVal = "Contract";
        } else if (cleanTitle.toLowerCase().includes("remote") || item.location?.display_name?.toLowerCase().includes("remote")) {
          jobTypeVal = "Remote";
        }

        let salaryDisplay = "Market Competitive";
        if (item.salary_min) {
          const minLpa = (item.salary_min / 100000).toFixed(1);
          const maxLpa = item.salary_max ? (item.salary_max / 100000).toFixed(1) : (Number(minLpa) * 1.4).toFixed(1);
          salaryDisplay = `₹${minLpa}L - ₹${maxLpa}L PA`;
        } else if (jobTypeVal === "Internship") {
          salaryDisplay = "Stipend (Competitive)";
        }

        const categoryLabel = item.category?.label || "Engineering & IT";
        const locationArea = item.location?.area?.[0] || item.location?.display_name || (city !== "all" ? city : "India");
        const tags = [categoryLabel, locationArea, jobTypeVal].filter(Boolean);
        const expLevel = this.classifyExperience(cleanTitle, cleanDesc);

        return {
          id: `adzuna-${item.id || idx}`,
          title: cleanTitle,
          company: companyName,
          companyDomain: domain,
          location: item.location?.display_name || (city !== "all" ? city : "Pan India"),
          city: item.location?.area?.[0] || city || "India",
          jobType: jobTypeVal,
          salaryRange: salaryDisplay,
          description: cleanDesc,
          applyUrl: item.redirect_url || "https://adzuna.in",
          source: "Adzuna India (Live)",
          postedDate: this.formatTimeAgo(item.created),
          tags: tags,
          experienceLevel: expLevel
        };
      });

      // Strict Internship filtering
      if (jobType === "Internship") {
        const internOnly = parsedJobs.filter((job) =>
          job.title.toLowerCase().includes("intern") ||
          job.title.toLowerCase().includes("trainee") ||
          job.title.toLowerCase().includes("apprentice") ||
          job.description.toLowerCase().includes("internship") ||
          job.jobType === "Internship"
        );
        if (internOnly.length > 0) {
          parsedJobs = internOnly;
        }
      }

      // Consistent Vacancy Count:
      // If jobs exist, totalCount matches the actual live count or list size
      const finalCount = parsedJobs.length > 0 ? (data.count || parsedJobs.length) : 0;

      const resultPayload = {
        jobs: parsedJobs,
        totalCount: finalCount,
        sourceType: "live-api" as const
      };

      // Save to fast cache
      this.cache.set(cacheKey, { ...resultPayload, timestamp: Date.now() });

      return resultPayload;
    } catch (err) {
      console.error("Live Job API error:", err);
      return { jobs: [], totalCount: 0, sourceType: "live-api" };
    }
  }

  /**
   * Return list of popular Indian hiring hubs
   */
  getIndianCities() {
    return [
      { id: "all", label: "All India" },
      { id: "Bengaluru", label: "Bengaluru 🇮🇳" },
      { id: "Hyderabad", label: "Hyderabad" },
      { id: "Pune", label: "Pune" },
      { id: "Mumbai", label: "Mumbai" },
      { id: "Delhi NCR", label: "Delhi NCR" },
      { id: "Chennai", label: "Chennai" },
      { id: "Remote", label: "Remote India" }
    ];
  }

  /**
   * Clean 1-Click trending search queries without special characters
   */
  getQuickSearchPills() {
    return [
      "AI Engineer",
      "Full Stack Developer",
      "Data Analyst",
      "Cloud DevOps",
      "Cybersecurity",
      "Product Manager",
      "Fresher Trainee",
      "Java Developer",
      "React Developer",
      "TCS",
      "Infosys",
      "Swiggy"
    ];
  }
}

export const liveJobService = new LiveJobService();
