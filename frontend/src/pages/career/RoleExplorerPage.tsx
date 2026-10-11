import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BadgeIndianRupee,
  BookOpen,
  Briefcase,
  CheckCircle2,
  Compass,
  GraduationCap,
  Layers,
  MapPin,
  Search,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Minus,
  X,
  ArrowRight,
  Award,
  Building2,
  Target,
  Wrench,
  AlertCircle,
  Check,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, Badge, Button } from "../../components/ui/UI";
import { roles } from "../../data/roles";
import { db } from "../../firebase/config";
import { getRoleDetailCached } from "../../services/roleExplorerAI";
import type { RoleDetail, RoleTier } from "../../types/roleExplorer.types";

export const RoleExplorerPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialRole = searchParams.get("role");

  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(initialRole);

  // Role detail tiered data state
  const [activeTierId, setActiveTierId] = useState<"beginner" | "intermediate" | "expert">("beginner");
  const [roleDetail, setRoleDetail] = useState<RoleDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isFallbackData, setIsFallbackData] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const categories = [
    "All",
    ...Array.from(new Set(roles.map((r) => r.category))),
  ];

  const filteredRoles = useMemo(() => {
    let filtered = roles;

    if (selectedCategory !== "All") {
      filtered = filtered.filter((r) => r.category === selectedCategory);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (r) =>
          r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered.sort((a, b) => b.trendScore - a.trendScore);
  }, [selectedCategory, searchTerm]);

  const activeRole = useMemo(() => {
    return selectedRoleId ? roles.find((r) => r.id === selectedRoleId) ?? null : null;
  }, [selectedRoleId]);

  // Load tiered role detail whenever active role changes
  useEffect(() => {
    if (!selectedRoleId || !activeRole) {
      setRoleDetail(null);
      return;
    }

    let alive = true;
    setIsLoadingDetail(true);
    setFetchError(null);
    setActiveTierId("beginner");

    void (async () => {
      try {
        const { data, isFallback } = await getRoleDetailCached(db, activeRole.id, activeRole.name);
        if (!alive) return;
        setRoleDetail(data);
        setIsFallbackData(isFallback);
      } catch (err: any) {
        if (!alive) return;
        console.error("Failed to load role detail:", err);
        setFetchError("Unable to retrieve live AI analysis. Showing verified static profile.");
      } finally {
        if (alive) setIsLoadingDetail(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [selectedRoleId, activeRole]);

  // Select a new role and keep URL in sync
  const handleSelectRole = (roleId: string | null) => {
    setSelectedRoleId(roleId);
    if (roleId) {
      setSearchParams({ role: roleId });
    } else {
      setSearchParams({});
    }
  };

  const currentTier: RoleTier | null = useMemo(() => {
    if (!roleDetail?.tiers) return null;
    return roleDetail.tiers.find((t) => t.tierId === activeTierId) || roleDetail.tiers[0];
  }, [roleDetail, activeTierId]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Wayfinding Hero */}
      <div className="bg-[#12122B] text-white rounded-3xl p-6 sm:p-8 border border-white/10 shadow-xl relative overflow-hidden">
        <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[#4F46E5]/20 blur-3xl" />
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-data font-bold tracking-wider uppercase bg-[#4F46E5] text-white">
            <Compass size={14} />
            STATION 03 · ROLE EXPLORER
          </span>
          <span className="text-xs font-mono text-gray-400">Multi-Tier Industry Career Profiles</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-display font-bold mb-2 text-white">
          Professional Role Explorer
        </h1>
        <p className="text-sm sm:text-base font-body text-gray-300 max-w-2xl">
          Deep-dive into day-to-day responsibilities, compensation tiers, and required tech stacks across Indian industries.
        </p>
      </div>

      {/* Category Tabs with Sliding Pill Animation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`relative px-4 py-2 rounded-xl text-xs font-display font-bold transition-colors whitespace-nowrap cursor-pointer ${
                  isSelected ? "text-white" : "text-[#12122B]/70 hover:text-[#12122B] bg-white border border-gray-200"
                }`}
              >
                {isSelected && (
                  <motion.div
                    layoutId="activeRoleCategory"
                    className="absolute inset-0 bg-[#4F46E5] rounded-xl shadow-xs"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{cat}</span>
              </button>
            );
          })}
        </div>

        {/* Search Box */}
        <div className="relative min-w-[240px]">
          <Search className="absolute left-3.5 top-2.5 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search roles or skills..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-300 bg-white text-xs font-body focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
          />
        </div>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRoles.map((role) => {
          return (
            <Card
              key={role.id}
              hover
              onClick={() => handleSelectRole(role.id)}
              className="flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className="text-[10px] font-data font-bold text-[#6B7280] uppercase tracking-wider">
                    {role.category}
                  </span>
                  <span className="px-2 py-0.5 rounded text-xs font-data font-bold bg-[#14B8A6]/15 text-[#0F766E]">
                    {role.trendScore.toFixed(1)}/10 Velocity
                  </span>
                </div>

                <h3 className="text-xl font-display font-bold text-[#12122B] mb-2">
                  {role.name}
                </h3>
                <p className="text-xs font-body text-[#6B7280] line-clamp-3 mb-4 leading-relaxed">
                  {role.description}
                </p>

                {/* Salary in Tabular Data Font */}
                <div className="p-3 rounded-xl bg-[#FAFAF7] border border-gray-200 mb-4">
                  <span className="text-[10px] font-data text-[#6B7280] uppercase block">
                    Estimated Compensation Range
                  </span>
                  <span className="text-sm font-data font-bold text-[#12122B]">
                    {role.salaryRange}
                  </span>
                </div>

                {/* Skills Chips */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {role.requiredSkills.slice(0, 3).map((skill) => (
                    <span
                      key={skill}
                      className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-white border border-gray-200 text-[#12122B]"
                    >
                      {skill}
                    </span>
                  ))}
                  {role.requiredSkills.length > 3 && (
                    <span className="px-1.5 py-0.5 text-[10px] font-data text-[#6B7280]">
                      +{role.requiredSkills.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs font-display font-semibold text-[#4F46E5] flex items-center gap-1">
                  Inspect 3-Tier Route <ArrowRight size={14} />
                </span>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Tiered Role Details Modal */}
      <AnimatePresence>
        {activeRole && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#12122B]/70 backdrop-blur-xs"
              onClick={() => handleSelectRole(null)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden max-h-[90vh] flex flex-col z-10"
            >
              {/* Modal Header */}
              <div className="shrink-0 bg-[#12122B] text-white p-5 sm:p-6 border-b border-white/10 flex items-start justify-between relative overflow-hidden">
                <div className="pointer-events-none absolute -top-20 -right-20 h-60 w-60 rounded-full bg-[#4F46E5]/20 blur-2xl" />
                <div className="relative z-10 pr-4 flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="text-xs font-data font-bold text-[#F5A623] uppercase tracking-wider">
                      {activeRole.category} DOMAIN
                    </span>
                    <span className="text-white/30">•</span>
                    <span className="text-xs font-data text-gray-400">WAYFINDING STATION PROFILE</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-display font-bold text-white leading-tight">
                    {activeRole.name}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => handleSelectRole(null)}
                  className="p-2.5 rounded-xl bg-white/10 text-white hover:bg-white/20 transition cursor-pointer relative z-10 shrink-0 ml-2"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body Container */}
              <div className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-7 space-y-6 bg-[#FAFAF7]">
                {/* Notice if Static Fallback Used */}
                {(isFallbackData || fetchError) && !isLoadingDetail && (
                  <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl flex items-center gap-2 text-xs font-body">
                    <AlertCircle size={16} className="text-amber-600 shrink-0" />
                    <span>Live AI data temporarily unavailable. Displaying verified static career profile.</span>
                  </div>
                )}

                {/* SKELETON LOADING STATE */}
                {isLoadingDetail ? (
                  <div className="space-y-6 animate-pulse">
                    {/* Top Overview & Trend Skeleton */}
                    <div className="p-5 rounded-2xl bg-white border border-gray-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="h-4 bg-gray-200 rounded w-1/4" />
                        <div className="h-6 bg-gray-200 rounded-full w-28" />
                      </div>
                      <div className="h-3 bg-gray-200 rounded w-full" />
                      <div className="h-3 bg-gray-200 rounded w-4/5" />
                    </div>

                    {/* Tabs Skeleton */}
                    <div className="flex gap-2">
                      <div className="h-10 bg-gray-200 rounded-xl flex-1" />
                      <div className="h-10 bg-gray-200 rounded-xl flex-1" />
                      <div className="h-10 bg-gray-200 rounded-xl flex-1" />
                    </div>

                    {/* Salary & Metrics Skeleton */}
                    <div className="p-5 rounded-2xl bg-white border border-gray-200 space-y-3">
                      <div className="h-3 bg-gray-200 rounded w-32" />
                      <div className="h-8 bg-gray-200 rounded w-48" />
                    </div>

                    {/* Skills Group Skeleton */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-white rounded-2xl border border-gray-200 space-y-3">
                        <div className="h-3 bg-gray-200 rounded w-24" />
                        <div className="flex gap-2">
                          <div className="h-6 bg-gray-200 rounded-lg w-20" />
                          <div className="h-6 bg-gray-200 rounded-lg w-24" />
                          <div className="h-6 bg-gray-200 rounded-lg w-16" />
                        </div>
                      </div>
                      <div className="p-4 bg-white rounded-2xl border border-gray-200 space-y-3">
                        <div className="h-3 bg-gray-200 rounded w-24" />
                        <div className="flex gap-2">
                          <div className="h-6 bg-gray-200 rounded-lg w-20" />
                          <div className="h-6 bg-gray-200 rounded-lg w-24" />
                          <div className="h-6 bg-gray-200 rounded-lg w-16" />
                        </div>
                      </div>
                    </div>

                    {/* Bullet List Skeleton */}
                    <div className="p-5 bg-white rounded-2xl border border-gray-200 space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-36" />
                      <div className="h-3 bg-gray-200 rounded w-full" />
                      <div className="h-3 bg-gray-200 rounded w-11/12" />
                      <div className="h-3 bg-gray-200 rounded w-4/5" />
                    </div>
                  </div>
                ) : roleDetail ? (
                  <>
                    {/* Role Overview & Demand Trend Badge */}
                    <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                        <span className="text-[10px] font-data font-bold uppercase tracking-wider text-[#6B7280]">
                          EXECUTIVE ROLE BRIEF
                        </span>

                        {/* Demand Trend Badge */}
                        <div className="self-start sm:self-auto">
                          {roleDetail.demandTrend === "rising" ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-data font-bold bg-[#10B981]/15 text-[#0F766E] border border-[#10B981]/30">
                              <TrendingUp size={14} className="text-[#10B981]" />
                              RISING HIRING VELOCITY
                            </span>
                          ) : roleDetail.demandTrend === "declining" ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-data font-bold bg-amber-500/15 text-amber-800 border border-amber-500/30">
                              <TrendingDown size={14} className="text-amber-600" />
                              DECLINING HIRING PACE
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-data font-bold bg-blue-500/15 text-blue-800 border border-blue-500/30">
                              <Minus size={14} className="text-blue-600" />
                              STABLE MARKET DEMAND
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="text-sm font-body text-[#12122B] leading-relaxed">
                        {roleDetail.overview}
                      </p>
                    </div>

                    {/* Tier Tabs: Beginner / Intermediate / Expert */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 p-1.5 bg-gray-200/70 rounded-2xl overflow-x-auto">
                        {[
                          { id: "beginner", title: "Beginner", exp: "0–2 Yrs", color: "#14B8A6" },
                          { id: "intermediate", title: "Intermediate", exp: "3–5 Yrs", color: "#4F46E5" },
                          { id: "expert", title: "Expert", exp: "6+ Yrs", color: "#F5A623" },
                        ].map((tier) => {
                          const isSelected = activeTierId === tier.id;
                          return (
                            <button
                              key={tier.id}
                              type="button"
                              onClick={() => setActiveTierId(tier.id as any)}
                              className={`relative flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-center transition-all cursor-pointer ${
                                isSelected ? "text-white shadow-xs" : "text-[#12122B]/80 hover:text-[#12122B]"
                              }`}
                            >
                              {isSelected && (
                                <motion.div
                                  layoutId="activeRoleTier"
                                  className="absolute inset-0 bg-[#12122B] rounded-xl"
                                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                                />
                              )}
                              <div className="relative z-10 flex flex-col items-center">
                                <span className="text-xs font-display font-bold">
                                  {tier.title}
                                </span>
                                <span className={`text-[10px] font-data ${isSelected ? "text-gray-300" : "text-[#6B7280]"}`}>
                                  {tier.exp}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {/* Active Tier Content */}
                      {currentTier && (
                        <div className="space-y-5">
                          {/* Prominent Salary Band & Experience Banner */}
                          <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                              <span className="text-[10px] font-data font-bold text-[#6B7280] uppercase tracking-wider block">
                                EXPECTED INDIAN SALARY BAND ({currentTier.experienceRange})
                              </span>
                              <p className="text-2xl sm:text-3xl font-data font-bold text-[#0F766E] mt-1">
                                {currentTier.salaryBandINR}
                              </p>
                            </div>

                            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#FAFAF7] border border-gray-200">
                              <Briefcase size={16} className="text-[#4F46E5]" />
                              <div>
                                <span className="text-[10px] font-data text-[#6B7280] block leading-none uppercase">Experience Level</span>
                                <span className="text-xs font-display font-bold text-[#12122B]">{currentTier.experienceRange}</span>
                              </div>
                            </div>
                          </div>

                          {/* Skills Grid: Technical vs Soft Skills */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Technical Skills Pill Group */}
                            <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-xs">
                              <h4 className="text-xs font-data font-bold uppercase text-[#4F46E5] mb-2.5 flex items-center gap-1.5">
                                <Sparkles size={14} />
                                Core Technical Skills
                              </h4>
                              <div className="flex flex-wrap gap-1.5">
                                {currentTier.technicalSkills.map((skill, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2.5 py-1 rounded-lg text-xs font-display font-medium bg-[#4F46E5]/10 text-[#4F46E5] border border-[#4F46E5]/20"
                                  >
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>

                            {/* Soft Skills Pill Group */}
                            <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-xs">
                              <h4 className="text-xs font-data font-bold uppercase text-[#0F766E] mb-2.5 flex items-center gap-1.5">
                                <Target size={14} />
                                Essential Soft Skills
                              </h4>
                              <div className="flex flex-wrap gap-1.5">
                                {currentTier.softSkills.map((skill, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2.5 py-1 rounded-lg text-xs font-display font-medium bg-[#14B8A6]/10 text-[#0F766E] border border-[#14B8A6]/20"
                                  >
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Tools & Tech Stack Pill Group */}
                          <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-xs">
                            <h4 className="text-xs font-data font-bold uppercase text-[#12122B] mb-2.5 flex items-center gap-1.5">
                              <Wrench size={14} className="text-[#6B7280]" />
                              Tooling, Platforms & Stack
                            </h4>
                            <div className="flex flex-wrap gap-1.5">
                              {currentTier.toolsAndStack.map((tool, idx) => (
                                <span
                                  key={idx}
                                  className="px-2.5 py-1 rounded-lg text-xs font-data font-medium bg-gray-100 text-[#12122B] border border-gray-200"
                                >
                                  {tool}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Two-Column Structured Lists: Responsibilities & Interview Focus */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Key Responsibilities */}
                            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-gray-200 shadow-xs">
                              <h4 className="text-xs font-data font-bold uppercase text-[#12122B] mb-3 flex items-center gap-1.5">
                                <CheckCircle2 size={15} className="text-[#10B981]" />
                                Key Responsibilities
                              </h4>
                              <ul className="space-y-2 text-xs font-body text-[#12122B]/85 leading-relaxed">
                                {currentTier.responsibilities.map((resp, idx) => (
                                  <li key={idx} className="flex items-start gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#4F46E5] mt-1.5 shrink-0" />
                                    <span>{resp}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* Interview Focus Areas */}
                            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-gray-200 shadow-xs">
                              <h4 className="text-xs font-data font-bold uppercase text-[#12122B] mb-3 flex items-center gap-1.5">
                                <Target size={15} className="text-[#4F46E5]" />
                                Interview Focus Areas
                              </h4>
                              <ul className="space-y-2 text-xs font-body text-[#12122B]/85 leading-relaxed">
                                {currentTier.interviewFocusAreas.map((area, idx) => (
                                  <li key={idx} className="flex items-start gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#F5A623] mt-1.5 shrink-0" />
                                    <span>{area}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>

                          {/* Two-Column Structured Lists: Promotion Criteria & Certifications */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Promotion Criteria */}
                            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-gray-200 shadow-xs">
                              <h4 className="text-xs font-data font-bold uppercase text-[#12122B] mb-3 flex items-center gap-1.5">
                                <TrendingUp size={15} className="text-[#0F766E]" />
                                Promotion Benchmarks to Next Tier
                              </h4>
                              <ul className="space-y-2 text-xs font-body text-[#12122B]/85 leading-relaxed">
                                {currentTier.promotionCriteria.map((item, idx) => (
                                  <li key={idx} className="flex items-start gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#14B8A6] mt-1.5 shrink-0" />
                                    <span>{item}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* Recommended Certifications */}
                            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-gray-200 shadow-xs">
                              <h4 className="text-xs font-data font-bold uppercase text-[#12122B] mb-3 flex items-center gap-1.5">
                                <Award size={15} className="text-[#F5A623]" />
                                Valued Certifications
                              </h4>
                              <ul className="space-y-2 text-xs font-body text-[#12122B]/85 leading-relaxed">
                                {currentTier.recommendedCertifications.map((cert, idx) => (
                                  <li key={idx} className="flex items-start gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#4F46E5] mt-1.5 shrink-0" />
                                    <span>{cert}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bottom Metadata: Related Roles & Top Hiring Companies */}
                    <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-xs space-y-4">
                      {/* Related Roles */}
                      <div>
                        <span className="text-[10px] font-data font-bold text-[#6B7280] uppercase tracking-wider block mb-2">
                          LATERAL & RELATED ROLE PATHWAYS:
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {roleDetail.relatedRoles.map((roleTitle, idx) => {
                            const matchedRole = roles.find(
                              (r) => r.name.toLowerCase() === roleTitle.toLowerCase()
                            );
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  if (matchedRole) {
                                    handleSelectRole(matchedRole.id);
                                  }
                                }}
                                className={`px-3 py-1.5 rounded-xl text-xs font-display font-medium transition cursor-pointer flex items-center gap-1.5 ${
                                  matchedRole
                                    ? "bg-[#4F46E5]/10 text-[#4F46E5] hover:bg-[#4F46E5] hover:text-white border border-[#4F46E5]/20"
                                    : "bg-gray-100 text-[#12122B] border border-gray-200"
                                }`}
                              >
                                <span>{roleTitle}</span>
                                {matchedRole && <ArrowRight size={12} />}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Top Hiring Companies India */}
                      <div className="pt-3 border-t border-gray-100">
                        <span className="text-[10px] font-data font-bold text-[#6B7280] uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                          <Building2 size={13} className="text-[#6B7280]" />
                          TOP HIRING RECRUITERS IN INDIA:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {roleDetail.topHiringCompaniesIndia.map((company, idx) => (
                            <span
                              key={idx}
                              className="px-2.5 py-1 rounded-lg text-xs font-data font-medium bg-[#FAFAF7] text-[#12122B] border border-gray-200"
                            >
                              {company}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                ) : null}
              </div>

              {/* Modal Footer with Two Primary CTAs */}
              <div className="shrink-0 p-4 sm:p-5 bg-white border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <Button
                  variant="outline"
                  onClick={() => handleSelectRole(null)}
                  className="w-full sm:w-auto order-3 sm:order-1"
                >
                  Close Inspection
                </Button>

                <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto order-1 sm:order-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      navigate(`/skill-gap?role=${activeRole.id}`);
                    }}
                    className="w-full sm:w-auto text-xs font-display font-bold border-[#4F46E5] text-[#4F46E5] hover:bg-[#4F46E5]/5"
                  >
                    See your skill gap for this role →
                  </Button>

                  <Button
                    onClick={() => {
                      navigate(`/roadmap?role=${activeRole.id}`);
                    }}
                    className="w-full sm:w-auto text-xs font-display font-bold"
                  >
                    Get a roadmap to this role →
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
