import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  TrendingUp,
  BarChart3,
  MapPin,
  Zap,
  ArrowRight,
  Sparkles,
  Compass,
  FileCheck2,
  Briefcase,
  FileText,
  X,
  Activity,
  ListChecks,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { Card, Badge, Button, ProgressBar } from "../../components/ui/UI";
import { roles, trendingRoles } from "../../data/roles";
import {
  getMarketVelocityRadar,
  getDefaultMarketRadar,
  type MarketRadarSummary,
  type RoleVelocityData,
} from "../../services/marketVelocityService";
import { LoadingCard } from "../../components/ui/Loading";
import { RouteLine } from "../../components/ui/RouteLine";

export const DashboardPage: React.FC = () => {
  const { appUser, user, updateUserStage } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [animatedSkillsProgress, setAnimatedSkillsProgress] = useState(0);
  const [showFirstTimeModal, setShowFirstTimeModal] = useState(false);
  const [radarSummary, setRadarSummary] = useState<MarketRadarSummary>(getDefaultMarketRadar);

  const skillsCount = appUser?.skills?.length || 0;
  const targetSkillsPercentage = Math.min((skillsCount / 10) * 100, 100);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  // Fetch live market velocity radar (synchronized with Station 03 Role Explorer)
  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const summary = await getMarketVelocityRadar(roles, false);
        if (alive) setRadarSummary(summary);
      } catch (err) {
        if (alive) setRadarSummary(getDefaultMarketRadar());
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Check if first-time user who has not taken the assessment
  useEffect(() => {
    if (!isLoading) {
      try {
        const hasAssessed = Boolean(
          appUser?.selectedCareer ||
          appUser?.assessmentScore ||
          localStorage.getItem("careerverse_assessment_done")
        );
        const dismissedSession = sessionStorage.getItem("careerverse_onboarding_dismissed");
        if (!hasAssessed && !dismissedSession) {
          setShowFirstTimeModal(true);
        }
      } catch {
        // storage disabled or blocked
      }
    }
  }, [isLoading, appUser]);

  // Animate skills bar fill from 0 to target on mount
  useEffect(() => {
    if (!isLoading) {
      const animTimer = setTimeout(() => {
        setAnimatedSkillsProgress(targetSkillsPercentage);
      }, 100);
      return () => clearTimeout(animTimer);
    }
  }, [isLoading, targetSkillsPercentage]);

  // Enhanced career lookup supporting normalized slugs (e.g. ai--machine-learning---genai -> ml-engineer)
  const recommendedCareer = useMemo(() => {
    if (!appUser?.selectedCareer) return null;
    const direct = roles.find((r) => r.id === appUser.selectedCareer);
    if (direct) return direct;

    const rawKey = appUser.selectedCareer.toLowerCase().replace(/[^a-z0-9]/g, "");
    return (
      roles.find((r) => {
        const rKey = r.id.toLowerCase().replace(/[^a-z0-9]/g, "");
        const nameKey = r.name.toLowerCase().replace(/[^a-z0-9]/g, "");
        return (
          rKey.includes(rawKey) ||
          rawKey.includes(rKey) ||
          nameKey.includes(rawKey) ||
          (rawKey.includes("machinelearning") && r.id === "ml-engineer") ||
          (rawKey.includes("ai") && r.id === "ml-engineer")
        );
      }) || null
    );
  }, [appUser?.selectedCareer]);

  // Dynamically sorted by Market Velocity Radar (100% synchronized with Role Explorer)
  const topVelocityRoles = useMemo(() => {
    const sorted = [...roles].sort((a, b) => {
      const scoreA = Number(radarSummary?.roles?.[a.id]?.velocityScore ?? a.trendScore ?? 9);
      const scoreB = Number(radarSummary?.roles?.[b.id]?.velocityScore ?? b.trendScore ?? 9);
      return scoreB - scoreA;
    });
    return sorted.slice(0, 3);
  }, [radarSummary]);

  if (isLoading) {
    return (
      <LoadingCard
        message="Loading your career waypoint dashboard..."
        subtext="Fetching live stations, personalized recommendations & roadmap status"
      />
    );
  }

  const displayName =
    appUser?.displayName || user?.displayName || user?.email?.split("@")[0] || "Student";

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Wayfinding Hero Banner with Signature Route Line */}
      <div className="relative overflow-hidden bg-[#12122B] text-white rounded-3xl p-6 sm:p-8 border border-white/10 shadow-xl">
        {/* Subtle Background Glows */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full bg-[#4F46E5]/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-[#14B8A6]/15 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-white/10 text-xs font-data font-bold text-gray-300 mb-3 border border-white/10">
                <span className="w-2 h-2 rounded-full bg-[#14B8A6] animate-pulse" />
                WAYFINDING SYSTEM ACTIVE
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold tracking-tight text-white m-0">
                Welcome back, {displayName}
              </h1>
              <p className="text-sm sm:text-base font-body text-gray-300 mt-2 max-w-2xl">
                Track your real-time progress along the Indian education and career transit line.
              </p>
            </div>

            {/* Assessment Callout / Score */}
            {appUser?.assessmentScore ? (
              <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-4 self-start">
                <div className="w-12 h-12 rounded-xl bg-[#4F46E5] flex items-center justify-center font-data font-bold text-lg text-white">
                  {appUser.assessmentScore}%
                </div>
                <div>
                  <p className="text-[11px] font-data text-gray-400 uppercase">Aptitude Score</p>
                  <p className="text-sm font-display font-bold text-white">Verified Route Match</p>
                </div>
              </div>
            ) : null}
          </div>

          {/* Signature Route Line Component in Hero */}
          <div className="pt-4 border-t border-white/10">
            <RouteLine
              appUser={appUser}
              interactive={true}
              onSelectStation={updateUserStage}
              theme="dark"
            />
          </div>
        </div>
      </div>

      {/* First-Time User Onboarding Modal */}
      {showFirstTimeModal && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#12122B] text-white rounded-3xl max-w-lg w-full border border-white/10 shadow-2xl p-6 sm:p-8 space-y-6 relative overflow-hidden">
            <div className="pointer-events-none absolute -top-20 -right-20 h-60 w-60 rounded-full bg-[#14B8A6]/25 blur-3xl" />
            <div className="flex justify-between items-start">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#14B8A6]/20 border border-[#14B8A6]/30 text-xs font-data font-bold text-[#14B8A6]">
                <Sparkles size={14} /> NEW STUDENT ROUTE
              </div>
              <button
                onClick={() => {
                  sessionStorage.setItem("careerverse_onboarding_dismissed", "true");
                  setShowFirstTimeModal(false);
                }}
                className="text-gray-400 hover:text-white p-1"
              >
                <X size={18} />
              </button>
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-white mb-2">
                Welcome to CareerVerse!
              </h2>
              <p className="text-sm font-body text-gray-300 leading-relaxed">
                Complete your Personalized Career Discovery Assessment to map your route and calculate your skill gaps.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <Button
                variant="primary"
                onClick={() => {
                  setShowFirstTimeModal(false);
                  navigate("/assessment");
                }}
                className="w-full justify-center py-3 text-sm font-semibold"
              >
                Start Career Discovery Assessment <ArrowRight size={16} className="ml-2" />
              </Button>
              <button
                onClick={() => {
                  sessionStorage.setItem("careerverse_onboarding_dismissed", "true");
                  setShowFirstTimeModal(false);
                }}
                className="w-full text-center text-xs font-data text-gray-400 hover:text-white py-1 transition-colors"
              >
                Explore Dashboard First
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Discovery Prompt Banner if assessment not completed */}
      {!appUser?.assessmentScore && (
        <div className="bg-gradient-to-r from-[#4F46E5]/10 via-[#14B8A6]/10 to-transparent border border-[#4F46E5]/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#4F46E5] flex items-center justify-center text-white shrink-0 shadow-md">
              <Compass size={20} />
            </div>
            <div>
              <h4 className="font-display font-bold text-sm text-[#12122B]">
                Discover Your Career Trajectory & Skill Gaps
              </h4>
              <p className="text-xs text-gray-600">
                Tailored for 10th stream selection, 12th college degrees, and university branches.
              </p>
            </div>
          </div>
          <Button
            variant="primary"
            onClick={() => navigate("/assessment")}
            className="text-xs shrink-0 self-start sm:self-auto shadow-sm"
          >
            Start Discovery Assessment <ArrowRight size={14} className="ml-1.5" />
          </Button>
        </div>
      )}

      {/* Main Grid: Recommended Route & Skills Progress */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Recommended Career Track Card */}
        <Card className="lg:col-span-2 relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-[#4F46E5]/10 text-[#4F46E5]">
                  <Compass size={20} />
                </span>
                <div>
                  <h3 className="text-base font-display font-bold text-[#12122B]">
                    Assigned Career Track
                  </h3>
                  <p className="text-xs font-body text-[#6B7280]">Primary Waypoint Direction</p>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-data font-bold bg-[#14B8A6]/15 text-[#0F766E]">
                FOR YOU
              </span>
            </div>

            {recommendedCareer ? (
              <div className="space-y-4">
                <div>
                  <h4 className="text-2xl sm:text-3xl font-display font-bold text-[#12122B]">
                    {recommendedCareer.name}
                  </h4>
                  <p className="text-sm font-body text-[#6B7280] mt-1 line-clamp-2">
                    {recommendedCareer.description}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="ink">{recommendedCareer.category}</Badge>
                  <span className="text-xs font-data font-semibold text-[#6B7280]">
                    Salary: <span className="text-[#0F766E] font-bold">{recommendedCareer.salaryRange}</span>
                  </span>
                  <span className="text-xs font-data font-semibold text-[#6B7280]">
                    Demand: <span className="text-[#4F46E5] font-bold">{Number(recommendedCareer.trendScore ?? 9).toFixed(1)}/10</span>
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-gray-500 py-3">
                <p className="text-sm font-body text-[#6B7280] mb-4">
                  Take the AI aptitude assessment to map your high-compatibility career route.
                </p>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
            {recommendedCareer ? (
              <Button
                size="md"
                onClick={() => navigate(`/role-explorer?role=${recommendedCareer.id}`)}
                className="w-full sm:w-auto"
              >
                Inspect Track Details <ArrowRight size={16} />
              </Button>
            ) : (
              <Button
                size="md"
                onClick={() => navigate("/assessment")}
                className="w-full sm:w-auto"
              >
                Take Route Assessment <ArrowRight size={16} />
              </Button>
            )}
            <span className="text-xs font-data text-[#6B7280] hidden sm:inline">Station 02 → 03</span>
          </div>
        </Card>

        {/* Skills Progress Card */}
        <Card className="flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="p-2 rounded-xl bg-[#F5A623]/10 text-[#F5A623]">
                <Sparkles size={20} />
              </span>
              <div>
                <h3 className="text-base font-display font-bold text-[#12122B]">
                  Skills Track
                </h3>
                <p className="text-xs font-body text-[#6B7280]">Verified Milestones</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-baseline">
                <span className="text-2xl font-data font-bold text-[#12122B]">
                  {skillsCount} <span className="text-xs font-normal text-[#6B7280]">/ 10 Target</span>
                </span>
                <span className="text-xs font-data font-bold text-[#F5A623]">
                  {Math.round(animatedSkillsProgress)}% Complete
                </span>
              </div>

              {/* Animated Progress Bar in Milestone Yellow */}
              <ProgressBar
                progress={animatedSkillsProgress}
                showPercent={false}
                color="milestone"
              />

              <p className="text-xs font-body text-[#6B7280] leading-relaxed">
                Add required skills to close gaps for your chosen destination role.
              </p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100">
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate("/skill-gap")}
              className="w-full"
            >
              Analyze Skill Gaps
            </Button>
          </div>
        </Card>

        {/* Action Milestone Card */}
        <Card className="flex flex-col justify-between bg-gradient-to-br from-[#FAFAF7] to-white border-dashed border-gray-300">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="p-2 rounded-xl bg-[#14B8A6]/10 text-[#14B8A6]">
                <FileCheck2 size={20} />
              </span>
              <div>
                <h3 className="text-base font-display font-bold text-[#12122B]">
                  Next Station
                </h3>
                <p className="text-xs font-body text-[#6B7280]">Upcoming Action</p>
              </div>
            </div>

            <p className="text-sm font-body text-[#12122B] mb-2 font-medium">
              {appUser?.selectedCareer
                ? "Build your dynamic multi-year progression roadmap."
                : "Complete assessment to unlock personalized career paths."}
            </p>
            <p className="text-xs font-body text-[#6B7280]">
              Step-by-step milestones curated by AI for Indian universities & companies.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100">
            <Button
              size="sm"
              onClick={() => navigate(appUser?.selectedCareer ? "/roadmap" : "/assessment")}
              className="w-full"
            >
              {appUser?.selectedCareer ? "Launch Roadmap" : "Start Now"}
            </Button>
          </div>
        </Card>
      </div>

      {/* High-Growth Trending Tracks - 100% Synced with Role Explorer Radar */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5 flex-wrap">
            <TrendingUp className="text-[#4F46E5]" size={24} />
            <h2 className="text-xl sm:text-2xl font-display font-bold text-[#12122B] m-0">
              High-Velocity Market Roles
            </h2>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-data font-bold uppercase bg-emerald-500/15 text-emerald-800 border border-emerald-500/30">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </span>
              Radar Synced
            </span>
          </div>
          <button
            onClick={() => navigate("/role-explorer")}
            className="text-xs font-data font-bold text-[#4F46E5] hover:underline flex items-center gap-1 cursor-pointer self-start sm:self-auto"
          >
            View All 27 Tracks in Role Explorer <ArrowRight size={14} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {topVelocityRoles.map((role) => {
            const velocity: RoleVelocityData = radarSummary?.roles?.[role.id] || {
              roleId: role.id,
              velocityScore: role.trendScore,
              deltaPercent: "+7.5%",
              trendStatus: role.trendScore >= 9.5 ? "surge" : "high",
              marketDriver: "High-volume hiring demand across Indian IT and GCC engineering centres",
              estimatedOpenings: "10,000+",
              lastUpdated: new Date().toLocaleDateString("en-IN"),
            };

            const isSurge = velocity.trendStatus === "surge";
            const isHigh = velocity.trendStatus === "high";

            return (
              <Card
                key={role.id}
                hover
                onClick={() => navigate(`/role-explorer?role=${role.id}`)}
                className="flex flex-col justify-between group transition-all duration-200 hover:border-[#4F46E5]/40"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="text-[10px] font-data font-bold text-[#6B7280] uppercase tracking-wider">
                      {role.category}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-data font-bold ${
                        isSurge
                          ? "bg-emerald-500/15 text-emerald-800 border border-emerald-500/30"
                          : isHigh
                          ? "bg-[#4F46E5]/15 text-[#4F46E5] border border-[#4F46E5]/30"
                          : "bg-blue-500/15 text-blue-800 border border-blue-500/30"
                      }`}
                    >
                      <Zap
                        size={12}
                        className={isSurge ? "text-emerald-600 fill-emerald-600" : "text-[#4F46E5]"}
                      />
                      <span>{Number(velocity.velocityScore ?? 9).toFixed(1)}/10</span>
                      <span className="text-[10px] font-mono opacity-85">
                        ({velocity.deltaPercent} {isSurge ? "Surge" : isHigh ? "High" : ""})
                      </span>
                    </span>
                  </div>

                  <h3 className="text-lg font-display font-bold text-[#12122B] mb-2 group-hover:text-[#4F46E5] transition-colors">
                    {role.name}
                  </h3>

                  {/* Dynamic 2026 Demand Driver Box */}
                  <div className="p-2.5 rounded-xl bg-gradient-to-r from-[#FAFAF7] to-indigo-50/40 border border-indigo-100/70 mb-3 text-[11px] text-[#1E1B4B]">
                    <div className="flex items-center gap-1 text-[10px] font-data font-bold text-[#4F46E5] uppercase tracking-wider mb-0.5">
                      <Activity size={11} />
                      2026 Demand Catalyst
                    </div>
                    <p className="line-clamp-2 leading-tight text-gray-700 font-body">
                      {velocity.marketDriver}
                    </p>
                  </div>

                  <p className="text-xs font-body text-[#6B7280] line-clamp-2 mb-4 leading-relaxed">
                    {role.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-data text-gray-500 block leading-tight uppercase">
                      Indian Band
                    </span>
                    <span className="text-xs font-data font-bold text-[#12122B]">
                      {role.salaryRange}
                    </span>
                  </div>
                  <span className="text-xs font-display font-semibold text-[#4F46E5] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    Explore Track <ArrowRight size={14} />
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Quick Transit Actions */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200/90 shadow-sm">
        <h3 className="text-base font-display font-bold text-[#12122B] mb-4 flex items-center gap-2">
          <MapPin size={18} className="text-[#4F46E5]" />
          Wayfinding Shortcuts
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: "Career Navigator", desc: "10th, 12th & Degree", icon: Compass, path: "/career-navigator" },
            { label: "Role Explorer", desc: "10+ In-Depth Profiles", icon: BarChart3, path: "/role-explorer" },
            { label: "Dynamic Roadmap", desc: "3-4 Year Progression", icon: MapPin, path: "/roadmap" },
            { label: "AI Counselor", desc: "24/7 AI Guidance", icon: Zap, path: "/chatbot" },
            { label: "Live Jobs", desc: "Active Openings & Trends", icon: Briefcase, path: "/live-jobs" },
            { label: "Resume Builder", desc: "ATS & PDF Export", icon: FileText, path: "/resume-builder" },
            { label: "Job Tracker", desc: "Gmail Sync & Funnel", icon: ListChecks, path: "/application-tracker" },
          ].map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.path}
                onClick={() => navigate(action.path)}
                className="group flex flex-col items-start p-4 rounded-xl border border-gray-200/80 hover:border-[#4F46E5] hover:bg-[#4F46E5]/5 transition-all text-left"
              >
                <div className="w-9 h-9 rounded-lg bg-[#4F46E5]/10 text-[#4F46E5] flex items-center justify-center mb-2 group-hover:bg-[#4F46E5] group-hover:text-white transition-colors">
                  <Icon size={18} />
                </div>
                <span className="text-sm font-display font-bold text-[#12122B]">
                  {action.label}
                </span>
                <span className="text-xs font-body text-[#6B7280] mt-0.5">
                  {action.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
