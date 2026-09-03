import React, { useEffect, useState, useMemo } from "react";
import {
  Briefcase,
  Search,
  MapPin,
  Clock,
  ExternalLink,
  Sparkles,
  Building2,
  BadgeIndianRupee,
  RefreshCw,
  SlidersHorizontal,
  Compass,
  Layers,
  GraduationCap
} from "lucide-react";
import { liveJobService, type LiveJob } from "../../services/liveJobService";
import { useAuth } from "../../hooks/useAuth";
import { Button } from "../../components/ui/UI";

// Dedicated Company Logo Component with high-res brand logo fetching & graceful fallback
const CompanyLogo: React.FC<{ companyName: string; companyDomain?: string }> = ({
  companyName,
  companyDomain
}) => {
  const [imgError, setImgError] = useState(false);
  const initial = companyName ? companyName.charAt(0).toUpperCase() : "C";

  // Pick deterministic vibrant color for fallback initial avatar
  const avatarBg = useMemo(() => {
    const colors = [
      "bg-indigo-600",
      "bg-teal-600",
      "bg-blue-600",
      "bg-purple-600",
      "bg-rose-600",
      "bg-amber-600",
      "bg-emerald-600",
      "bg-cyan-600"
    ];
    const hash = (companyName || "").split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  }, [companyName]);

  // Compute best logo source using official domain or clean company slug
  const logoUrl = useMemo(() => {
    if (companyDomain) {
      return `https://www.google.com/s2/favicons?domain=${companyDomain}&sz=128`;
    }
    const clean = companyName
      .toLowerCase()
      .replace(/\b(private limited|pvt ltd|pvt|ltd|limited|services|solutions|technologies|technology|india|corp|inc|llc|co)\b/gi, "")
      .replace(/[^\w\s]/g, "")
      .trim()
      .replace(/\s+/g, "");

    return clean ? `https://www.google.com/s2/favicons?domain=${clean}.com&sz=128` : "";
  }, [companyName, companyDomain]);

  if (imgError || !logoUrl) {
    return (
      <div className={`w-11 h-11 rounded-xl ${avatarBg} text-white flex items-center justify-center font-display font-bold text-base shrink-0 shadow-xs`}>
        {initial}
      </div>
    );
  }

  return (
    <div className="w-11 h-11 rounded-xl bg-white border border-gray-200/90 flex items-center justify-center p-2 shrink-0 shadow-xs overflow-hidden">
      <img
        src={logoUrl}
        alt={companyName}
        onError={() => setImgError(true)}
        className="w-full h-full object-contain"
        loading="lazy"
      />
    </div>
  );
};

export const LiveJobsPage: React.FC = () => {
  const { appUser } = useAuth();
  const [jobs, setJobs] = useState<LiveJob[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("all");
  const [selectedJobType, setSelectedJobType] = useState("all");
  const [selectedExp, setSelectedExp] = useState("all");
  const [activeSearchPill, setActiveSearchPill] = useState<string | null>(null);

  const cities = useMemo(() => liveJobService.getIndianCities(), []);
  const quickPills = useMemo(() => liveJobService.getQuickSearchPills(), []);

  const fetchJobs = async (
    overrideQuery?: string,
    overrideCity?: string,
    overrideJobType?: string,
    overrideExp?: string
  ) => {
    try {
      setLoading(true);
      const queryToUse = overrideQuery !== undefined ? overrideQuery : searchQuery;
      const cityToUse = overrideCity !== undefined ? overrideCity : selectedCity;
      const jobTypeToUse = overrideJobType !== undefined ? overrideJobType : selectedJobType;
      const expToUse = overrideExp !== undefined ? overrideExp : selectedExp;

      const res = await liveJobService.searchLiveJobs({
        query: queryToUse,
        city: cityToUse,
        jobType: jobTypeToUse,
        experienceLevel: expToUse
      });
      setJobs(res.jobs);
      setTotalCount(res.totalCount);
    } catch (e) {
      console.error("Failed to fetch live jobs:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [selectedCity, selectedJobType, selectedExp]);

  const handleCityChange = (cityId: string) => {
    setSelectedCity(cityId);
    fetchJobs(searchQuery, cityId, selectedJobType, selectedExp);
  };

  const handleJobTypeChange = (jobType: string) => {
    setSelectedJobType(jobType);
    if (jobType === "Internship") {
      // Auto-lock experience to Fresher for Internships
      setSelectedExp("Fresher / 0-1 yrs");
      fetchJobs(searchQuery, selectedCity, jobType, "Fresher / 0-1 yrs");
    } else {
      fetchJobs(searchQuery, selectedCity, jobType, selectedExp);
    }
  };

  const handleExpChange = (exp: string) => {
    setSelectedExp(exp);
    fetchJobs(searchQuery, selectedCity, selectedJobType, exp);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchJobs();
  };

  const handlePillClick = (pill: string) => {
    if (activeSearchPill === pill) {
      setActiveSearchPill(null);
      setSearchQuery("");
      fetchJobs("", selectedCity, selectedJobType, selectedExp);
    } else {
      setActiveSearchPill(pill);
      setSearchQuery(pill);
      fetchJobs(pill, selectedCity, selectedJobType, selectedExp);
    }
  };

  const stageDisplay = useMemo(() => {
    if (!appUser?.currentStage) return null;
    const stageMap: Record<string, string> = {
      school: "10th / 12th Standard",
      stream: "PUC / Intermediate Stream",
      degree: "Bachelor's Degree / Engineering",
      masters: "Master's Degree (M.Tech/MBA)",
      skills: "Skill Building & Prep",
      placement: "Final Year / Campus Placements"
    };
    return stageMap[appUser.currentStage] || appUser.currentStage;
  }, [appUser?.currentStage]);

  const handleMatchWithProfile = () => {
    const targetQuery = appUser?.selectedCareer || appUser?.currentStage || "Software Engineer";
    setSearchQuery(targetQuery);
    fetchJobs(targetQuery, selectedCity, selectedJobType, selectedExp);
  };

  const currentCityLabel = useMemo(() => {
    const found = cities.find((c) => c.id === selectedCity);
    return found ? found.label.replace(" 🇮🇳", "") : "All India";
  }, [cities, selectedCity]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Station 09 Hero Section */}
      <div className="bg-[#12122B] text-white rounded-3xl p-6 sm:p-8 border border-white/10 shadow-xl relative overflow-hidden">
        <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[#14B8A6]/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-[#4F46E5]/20 blur-3xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-data font-bold tracking-wider uppercase bg-[#14B8A6] text-white">
                <Briefcase size={14} />
                STATION 09 · LIVE RADAR
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-mono text-[#14B8A6] bg-[#14B8A6]/10 px-2.5 py-0.5 rounded-full border border-[#14B8A6]/20">
                <span className="w-2 h-2 rounded-full bg-[#14B8A6] animate-ping" />
                REAL-TIME RECRUITER FEED
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-display font-bold mb-2 text-white">
              Live Indian Job Radar
            </h1>
            <p className="text-sm sm:text-base font-body text-gray-300 max-w-2xl">
              Real-time openings, entry-level opportunities, and high-growth tracks across Indian tech hubs (Bengaluru, Hyderabad, Pune, Mumbai, Delhi NCR, and Remote).
            </p>
          </div>

          {/* Quick Profile Match Button */}
          {stageDisplay && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-2 min-w-[240px]">
              <div className="flex items-center gap-2 text-xs font-data text-gray-300">
                <Compass size={14} className="text-[#F5A623]" />
                <span>Current Live Stage:</span>
              </div>
              <p className="text-sm font-display font-bold text-white truncate">
                {stageDisplay}
              </p>
              <button
                onClick={handleMatchWithProfile}
                className="mt-1 px-3 py-1.5 rounded-lg bg-[#4F46E5] hover:bg-[#4338CA] text-xs font-medium text-white transition flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Sparkles size={13} />
                Match Jobs to My Route
              </button>
            </div>
          )}
        </div>

        {/* Live Search Bar */}
        <form onSubmit={handleSearchSubmit} className="mt-6 relative z-10">
          <div className="flex flex-col sm:flex-row gap-2 bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/20">
            <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-white/5 rounded-xl border border-white/10">
              <Search size={18} className="text-gray-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search job title, tech stack, or company (e.g. AI Engineer, React, Swiggy, TCS)..."
                className="bg-transparent border-none text-sm text-white placeholder-gray-400 focus:outline-none w-full"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    fetchJobs("", selectedCity, selectedJobType, selectedExp);
                  }}
                  className="text-xs text-gray-400 hover:text-white px-1"
                >
                  ✕
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-xl bg-[#14B8A6] hover:bg-[#0D9488] text-white font-medium text-sm flex items-center justify-center gap-2 transition shrink-0 shadow-lg shadow-[#14B8A6]/20 disabled:opacity-50"
            >
              {loading ? <RefreshCw size={16} className="animate-spin" /> : <Search size={16} />}
              Search Live Jobs
            </button>
          </div>
        </form>

        {/* Quick Search Tags */}
        <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
          <span className="text-gray-400 font-data whitespace-nowrap">Trending:</span>
          {quickPills.map((pill) => (
            <button
              key={pill}
              onClick={() => handlePillClick(pill)}
              className={`px-3 py-1 rounded-full whitespace-nowrap transition border text-xs ${
                activeSearchPill === pill
                  ? "bg-[#14B8A6] text-white border-[#14B8A6]"
                  : "bg-white/5 text-gray-300 border-white/10 hover:bg-white/15"
              }`}
            >
              {pill}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* City Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
          <MapPin size={16} className="text-[#4F46E5] shrink-0" />
          <span className="text-xs font-data font-bold text-[#12122B] shrink-0">City:</span>
          <div className="flex gap-1.5">
            {cities.map((city) => (
              <button
                key={city.id}
                onClick={() => handleCityChange(city.id)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                  selectedCity === city.id
                    ? "bg-[#12122B] text-white shadow-xs"
                    : "bg-gray-100 text-[#6B7280] hover:bg-gray-200/70"
                }`}
              >
                {city.label}
              </button>
            ))}
          </div>
        </div>

        {/* Experience & Job Type Selectors */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-[#6B7280]">
            <SlidersHorizontal size={14} />
            <select
              value={selectedJobType}
              onChange={(e) => handleJobTypeChange(e.target.value)}
              aria-label="Job Type"
              className="bg-gray-100 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#12122B] focus:outline-none focus:border-[#4F46E5]"
            >
              <option value="all">All Job Types</option>
              <option value="Full-Time">Full-Time</option>
              <option value="Internship">Internship</option>
              <option value="Contract">Contract</option>
              <option value="Remote">Remote</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-[#6B7280]">
            {selectedJobType === "Internship" ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50 border border-purple-200 text-purple-700 text-xs font-medium">
                <GraduationCap size={14} />
                <span>Fresher / Student (Internship)</span>
              </div>
            ) : (
              <select
                value={selectedExp}
                onChange={(e) => handleExpChange(e.target.value)}
                aria-label="Experience Level"
                className="bg-gray-100 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#12122B] focus:outline-none focus:border-[#4F46E5]"
              >
                <option value="all">All Experience Levels</option>
                <option value="Fresher / 0-1 yrs">Fresher / 0-1 yrs</option>
                <option value="Junior / 1-3 yrs">Junior / 1-3 yrs</option>
                <option value="Mid / 3-6 yrs">Mid / 3-6 yrs</option>
                <option value="Senior / 6+ yrs">Senior / 6+ yrs</option>
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Results Header Count */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-display font-bold text-[#12122B]">
            Active Openings in {currentCityLabel}
          </h2>
          <span className="px-3 py-1 rounded-full bg-[#14B8A6]/10 text-[#0D9488] font-data font-bold text-xs border border-[#14B8A6]/20 flex items-center gap-1.5 transition-all">
            <Layers size={13} />
            {loading
              ? "Fetching live vacancies..."
              : jobs.length > 0
              ? totalCount > jobs.length
                ? `${totalCount.toLocaleString()} live vacancies`
                : `${jobs.length} live vacancies`
              : "0 live vacancies"}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-data text-[#6B7280]">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Feed: Adzuna India Live Vacancy Feed</span>
        </div>
      </div>

      {/* Live Job Cards Grid with Scrollbar Container */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-6 border border-gray-200/80 animate-pulse space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="h-5 bg-gray-200 rounded w-1/2" />
                <div className="h-4 bg-gray-200 rounded w-1/4" />
              </div>
              <div className="h-4 bg-gray-100 rounded w-3/4" />
              <div className="h-16 bg-gray-50 rounded" />
              <div className="flex justify-between items-center pt-2">
                <div className="h-6 bg-gray-200 rounded w-1/3" />
                <div className="h-8 bg-gray-200 rounded w-24" />
              </div>
            </div>
          ))}
        </div>
      ) : jobs.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-[#6B7280] px-1 font-data">
            <span>Displaying latest {jobs.length} roles</span>
            <span>Scroll down for more listings ↓</span>
          </div>

          <div className="max-h-[760px] overflow-y-auto pr-2 custom-scrollbar rounded-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="bg-white rounded-2xl p-6 border border-gray-200/80 hover:border-[#14B8A6] hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Top Row: Company Logo & Badges */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <CompanyLogo
                          companyName={job.company}
                          companyDomain={job.companyDomain}
                        />
                        <div className="min-w-0">
                          <h3 className="font-display font-bold text-[#12122B] text-base group-hover:text-[#14B8A6] transition-colors leading-tight truncate">
                            {job.title}
                          </h3>
                          <p className="text-xs font-medium text-[#6B7280] flex items-center gap-1 mt-0.5 truncate">
                            <Building2 size={13} className="text-gray-400 shrink-0" />
                            <span className="truncate">{job.company}</span>
                          </p>
                        </div>
                      </div>

                      <span
                        className={`px-2.5 py-1 rounded-md text-[11px] font-data font-semibold shrink-0 ${
                          job.jobType === "Internship"
                            ? "bg-purple-50 text-purple-700 border border-purple-200"
                            : job.jobType === "Remote"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        }`}
                      >
                        {job.jobType}
                      </span>
                    </div>

                    {/* Location, Salary & Posted */}
                    <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 text-xs text-[#6B7280] mb-3">
                      <span className="flex items-center gap-1">
                        <MapPin size={13} className="text-[#4F46E5]" />
                        {job.location}
                      </span>
                      <span className="flex items-center gap-1 font-data font-bold text-[#0D9488]">
                        <BadgeIndianRupee size={13} />
                        {job.salaryRange}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-gray-400">
                        <Clock size={12} />
                        {job.postedDate}
                      </span>
                    </div>

                    {/* Description Snippet */}
                    <p className="text-xs text-[#4B5563] leading-relaxed line-clamp-2 mb-4">
                      {job.description}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {job.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-[#FAFAF7] text-[#4B5563] text-[11px] font-data border border-gray-200"
                        >
                          {tag}
                        </span>
                      ))}
                      <span className="px-2 py-0.5 rounded-md bg-gray-50 text-gray-500 text-[11px] font-data">
                        {job.experienceLevel}
                      </span>
                    </div>
                  </div>

                  {/* Bottom Row: Source & Direct Apply Button */}
                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-data text-gray-400 truncate">
                      Source: <span className="font-semibold text-gray-600">{job.source}</span>
                    </span>

                    <a
                      href={job.applyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#12122B] hover:bg-[#4F46E5] text-white text-xs font-semibold transition shadow-xs shrink-0"
                    >
                      <span>Apply on Site</span>
                      <ExternalLink size={13} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-200/80 shadow-xs max-w-lg mx-auto">
          <div className="w-14 h-14 bg-gray-100 text-[#6B7280] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Search size={24} />
          </div>
          <h3 className="font-display font-bold text-lg text-[#12122B] mb-1">
            No active roles matched your filters
          </h3>
          <p className="text-xs text-[#6B7280] mb-6">
            Try resetting your search query or selecting "All Job Types" / "All India" to see all live openings.
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setSearchQuery("");
              setSelectedCity("all");
              setSelectedJobType("all");
              setSelectedExp("all");
              setActiveSearchPill(null);
              fetchJobs("", "all", "all", "all");
            }}
          >
            Reset All Filters
          </Button>
        </div>
      )}
    </div>
  );
};
