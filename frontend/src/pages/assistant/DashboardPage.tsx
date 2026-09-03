import React, { useEffect, useState } from "react";
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
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { Card, Badge, Button, ProgressBar } from "../../components/ui/UI";
import { roles, trendingRoles } from "../../data/roles";
import { LoadingCard } from "../../components/ui/Loading";
import { RouteLine } from "../../components/ui/RouteLine";

export const DashboardPage: React.FC = () => {
  const { appUser, user, updateUserStage } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [animatedSkillsProgress, setAnimatedSkillsProgress] = useState(0);

  const skillsCount = appUser?.skills?.length || 0;
  const targetSkillsPercentage = Math.min((skillsCount / 10) * 100, 100);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  // Animate skills bar fill from 0 to target on mount
  useEffect(() => {
    if (!isLoading) {
      const animTimer = setTimeout(() => {
        setAnimatedSkillsProgress(targetSkillsPercentage);
      }, 100);
      return () => clearTimeout(animTimer);
    }
  }, [isLoading, targetSkillsPercentage]);

  if (isLoading) {
    return (
      <LoadingCard
        message="Loading your career waypoint dashboard..."
        subtext="Fetching live stations, personalized recommendations & roadmap status"
      />
    );
  }

  const recommendedCareer = appUser?.selectedCareer
    ? roles.find((r) => r.id === appUser.selectedCareer)
    : null;

  const trendingRolesData = trendingRoles
    .map((id) => roles.find((r) => r.id === id))
    .filter(Boolean);

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
                    Demand: <span className="text-[#4F46E5] font-bold">{recommendedCareer.trendScore.toFixed(1)}/10</span>
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

      {/* High-Growth Trending Tracks */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="text-[#4F46E5]" size={24} />
            <h2 className="text-xl sm:text-2xl font-display font-bold text-[#12122B] m-0">
              High-Velocity Market Roles
            </h2>
          </div>
          <button
            onClick={() => navigate("/trending")}
            className="text-xs font-data font-bold text-[#4F46E5] hover:underline flex items-center gap-1"
          >
            View All Tracks <ArrowRight size={14} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {trendingRolesData.slice(0, 3).map((role) => (
            <Card
              key={role?.id}
              hover
              onClick={() => navigate(`/role-explorer?role=${role?.id}`)}
              className="flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="text-[10px] font-data font-bold text-[#6B7280] uppercase tracking-wider">
                      {role?.category}
                    </span>
                    <h3 className="text-lg font-display font-bold text-[#12122B]">
                      {role?.name}
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 rounded text-xs font-data font-bold bg-[#14B8A6]/15 text-[#0F766E]">
                    {role?.trendScore.toFixed(1)}/10
                  </span>
                </div>

                <p className="text-xs font-body text-[#6B7280] line-clamp-2 mb-4">
                  {role?.description}
                </p>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs font-data font-bold text-[#12122B]">
                  {role?.salaryRange}
                </span>
                <span className="text-xs font-display font-semibold text-[#4F46E5] flex items-center gap-1">
                  Explore <ArrowRight size={14} />
                </span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Transit Actions */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200/90 shadow-sm">
        <h3 className="text-base font-display font-bold text-[#12122B] mb-4 flex items-center gap-2">
          <MapPin size={18} className="text-[#4F46E5]" />
          Wayfinding Shortcuts
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Career Navigator", desc: "10th, 12th & Degree", icon: Compass, path: "/career-navigator" },
            { label: "Role Explorer", desc: "10+ In-Depth Profiles", icon: BarChart3, path: "/role-explorer" },
            { label: "Dynamic Roadmap", desc: "3-4 Year Progression", icon: MapPin, path: "/roadmap" },
            { label: "AI Counselor", desc: "24/7 AI Guidance", icon: Zap, path: "/chatbot" },
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
