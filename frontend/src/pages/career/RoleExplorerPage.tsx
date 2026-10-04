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
  Activity,
  RefreshCw,
  Zap,
  ArrowUpDown,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, Badge, Button } from "../../components/ui/UI";
import { roles } from "../../data/roles";
import { db } from "../../firebase/config";
import { getRoleDetailCached } from "../../services/roleExplorerAI";
import {
  getMarketVelocityRadar,
  getDefaultMarketRadar,
  type MarketRadarSummary,
  type RoleVelocityData,
} from "../../services/marketVelocityService";
import type { RoleDetail, RoleTier } from "../../types/roleExplorer.types";

export const RoleExplorerPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialRole = searchParams.get("role");

  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(initialRole);
  const [sortBy, setSortBy] = useState<"velocity" | "salary" | "name">("velocity");

  // Dynamic Market Velocity Radar state
  const [radarSummary, setRadarSummary] = useState<MarketRadarSummary>(getDefaultMarketRadar);
  const [isLoadingRadar, setIsLoadingRadar] = useState(false);

  // Role detail tiered data state
  const [activeTierId, setActiveTierId] = useState<"beginner" | "intermediate" | "expert">("beginner");
  const [roleDetail, setRoleDetail] = useState<RoleDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isFallbackData, setIsFallbackData] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Load Market Velocity Radar data on mount
  useEffect(() => {
    let alive = true;
    void (async () => {
      setIsLoadingRadar(true);
      try {
        const summary = await getMarketVelocityRadar(roles, false);
        if (alive) setRadarSummary(summary);
      } catch (err) {
        console.error("Failed to load velocity radar:", err);
        if (alive) setRadarSummary(getDefaultMarketRadar());
      } finally {
        if (alive) setIsLoadingRadar(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const handleRefreshRadar = async () => {
    setIsLoadingRadar(true);
    try {
      const fresh = await getMarketVelocityRadar(roles, true);
      setRadarSummary(fresh);
    } catch (err) {
      console.error("Failed to refresh market radar:", err);
    } finally {
      setIsLoadingRadar(false);
    }
  };

  const parseMaxSalary = (salaryRange: string): number => {
    const match = salaryRange.match(/₹?(\d+)L/g);
    if (match && match.length > 0) {
      const nums = match.map((m) => parseInt(m.replace(/[^\d]/g, ""), 10));
      return Math.max(...nums);
    }
    return 0;
  };

  const categories = useMemo(() => {
    const counts: Record<string, number> = { All: roles.length };
    roles.forEach((r) => {
      counts[r.category] = (counts[r.category] || 0) + 1;
    });
    return [
      { name: "All", count: roles.length },
      ...Array.from(new Set(roles.map((r) => r.category))).map((cat) => ({
        name: cat,
        count: counts[cat] || 0,
      })),
    ];
  }, []);

  const filteredRoles = useMemo(() => {
    let filtered = [...roles];

    if (selectedCategory !== "All") {
      filtered = filtered.filter((r) => r.category === selectedCategory);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q) ||
          r.requiredSkills.some((s) => s.toLowerCase().includes(q))
      );
    }

    if (sortBy === "velocity") {
      return filtered.sort((a, b) => {
        const scoreA = radarSummary?.roles?.[a.id]?.velocityScore ?? a.trendScore;
        const scoreB = radarSummary?.roles?.[b.id]?.velocityScore ?? b.trendScore;
        return scoreB - scoreA;
      });
    } else if (sortBy === "salary") {
      return filtered.sort((a, b) => parseMaxSalary(b.salaryRange) - parseMaxSalary(a.salaryRange));
    } else {
      return filtered.sort((a, b) => a.name.localeCompare(b.name));
    }
  }, [selectedCategory, searchTerm, sortBy, radarSummary]);

  const activeRole = useMemo(() => {
    return selectedRoleId ? roles.find((r) => r.id === selectedRoleId) ?? null : null;
  }, [selectedRoleId]);

  const activeRoleVelocity: RoleVelocityData | null = useMemo(() => {
    if (!activeRole) return null;
    return (
      radarSummary?.roles?.[activeRole.id] || {
        roleId: activeRole.id,
        velocityScore: activeRole.trendScore,
        deltaPercent: "+7.5%",
        trendStatus: activeRole.trendScore >= 9.5 ? "surge" : "high",
        marketDriver: "Consistent hiring across Indian IT & core engineering sectors",
        estimatedOpenings: "10,000+",
        lastUpdated: new Date().toLocaleDateString("en-IN"),
      }
    );
  }, [activeRole, radarSummary]);

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

      {/* Dynamic Market Velocity Radar Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-[#12122B] via-[#1E1A4A] to-[#12122B] text-white p-5 sm:p-7 border border-[#4F46E5]/30 shadow-2xl relative overflow-hidden">
        <div className="pointer-events-none absolute -bottom-16 -right-16 h-64 w-64 rounded-full bg-[#10B981]/15 blur-3xl" />
        <div className="pointer-events-none absolute -top-16 -left-16 h-64 w-64 rounded-full bg-[#4F46E5]/25 blur-3xl" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-data font-bold tracking-wide uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                2026 LIVE MARKET VELOCITY RADAR
              </span>
              <span className="text-[11px] font-mono text-gray-300 bg-white/5 px-2.5 py-1 rounded-md border border-white/10">
                {radarSummary?.isLiveAI ? "⚡ Live Groq LPU Calibrated" : "🛡️ Verified Indian Benchmark Index"}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-display font-bold text-white tracking-tight">
              Real-Time Hiring Dynamics & Momentum
            </h2>

            <p className="text-xs sm:text-sm font-body text-gray-300 leading-relaxed">
              {radarSummary?.overallSentiment ||
                "Calibrating real-time hiring demand, GCC expansion, and enterprise tech adoption across India..."}
            </p>
          </div>

          {/* Metric Chips & Refresh Button */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0">
            {/* Top Surging Role Pill */}
            <div className="px-4 py-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs min-w-[170px]">
              <div className="flex items-center gap-1.5 text-[10px] font-data font-bold text-emerald-400 uppercase tracking-wider">
                <TrendingUp size={12} />
                TOP SURGING TRACK
              </div>
              <div
                className="text-xs font-display font-bold text-white mt-1 truncate max-w-[190px]"
                title={radarSummary?.topSurgingRole}
              >
                {radarSummary?.topSurgingRole || "AI & Machine Learning"}
              </div>
              <div className="text-[10px] font-data text-gray-400 mt-0.5">Highest MoM Growth</div>
            </div>

            {/* Average Velocity Pill */}
            <div className="px-4 py-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs min-w-[120px]">
              <div className="flex items-center gap-1.5 text-[10px] font-data font-bold text-[#F5A623] uppercase tracking-wider">
                <Activity size={12} />
                AVG VELOCITY
              </div>
              <div className="text-lg font-data font-bold text-white mt-0.5">
                {Number(radarSummary?.averageVelocity ?? 9.3).toFixed(1)}/10
              </div>
              <div className="text-[10px] font-data text-gray-400">Indian Tech Index</div>
            </div>

            {/* Refresh Button */}
            <button
              onClick={handleRefreshRadar}
              disabled={isLoadingRadar}
              type="button"
              title="Recalibrate radar with live 2026 market data"
              className="px-4 py-3 rounded-2xl bg-[#4F46E5] hover:bg-[#4338CA] text-white font-display font-bold text-xs transition flex flex-col items-center justify-center gap-1 cursor-pointer disabled:opacity-50 shadow-lg shadow-[#4F46E5]/25 border border-white/20"
            >
              <RefreshCw size={16} className={isLoadingRadar ? "animate-spin" : ""} />
              <span>{isLoadingRadar ? "Recalibrating..." : "Recalibrate"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Category Tabs, Search Bar & Sorting Controls */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-thin">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.name;
              return (
                <button
                  key={cat.name}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`relative px-4 py-2 rounded-xl text-xs font-display font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                    isSelected ? "text-white" : "text-[#12122B]/75 hover:text-[#12122B] bg-white border border-gray-200"
                  }`}
                >
                  {isSelected && (
                    <motion.div
                      layoutId="activeRoleCategory"
                      className="absolute inset-0 bg-[#4F46E5] rounded-xl shadow-xs"
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{cat.name}</span>
                  <span
                    className={`relative z-10 text-[10px] px-1.5 py-0.5 rounded-full font-data ${
                      isSelected ? "bg-white/20 text-white" : "bg-gray-100 text-[#6B7280]"
                    }`}
                  >
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Box & Sort Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {/* Search Box */}
            <div className="relative min-w-[240px] shrink-0">
              <Search className="absolute left-3.5 top-2.5 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search roles, domains, skills..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-8 py-2 rounded-xl border border-gray-300 bg-white text-xs font-body focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Sorting Pills */}
            <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-gray-200 shadow-2xs">
              <span className="text-[11px] font-data font-semibold text-gray-500 pl-2 flex items-center gap-1">
                <ArrowUpDown size={12} />
                Sort:
              </span>
              <button
                type="button"
                onClick={() => setSortBy("velocity")}
                className={`px-2.5 py-1 rounded-lg text-xs font-display font-bold transition cursor-pointer ${
                  sortBy === "velocity"
                    ? "bg-[#4F46E5] text-white shadow-xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                ⚡ Velocity
              </button>
              <button
                type="button"
                onClick={() => setSortBy("salary")}
                className={`px-2.5 py-1 rounded-lg text-xs font-display font-bold transition cursor-pointer ${
                  sortBy === "salary"
                    ? "bg-[#4F46E5] text-white shadow-xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                💰 Salary
              </button>
              <button
                type="button"
                onClick={() => setSortBy("name")}
                className={`px-2.5 py-1 rounded-lg text-xs font-display font-bold transition cursor-pointer ${
                  sortBy === "name"
                    ? "bg-[#4F46E5] text-white shadow-xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                🔤 A–Z
              </button>
            </div>
          </div>
        </div>

        {/* Status Count & Filter Info */}
        <div className="flex items-center justify-between text-xs text-[#6B7280]">
          <span>
            Showing <strong className="text-[#12122B]">{filteredRoles.length}</strong> of{" "}
            <strong>{roles.length}</strong> verified career profiles
            {selectedCategory !== "All" && (
              <span className="ml-1 text-[#4F46E5]">in {selectedCategory}</span>
            )}
            <span className="ml-2 font-mono text-gray-400">
              (Ranked by {sortBy === "velocity" ? "Market Velocity" : sortBy === "salary" ? "Compensation" : "Name"})
            </span>
          </span>
          {(selectedCategory !== "All" || searchTerm) && (
            <button
              onClick={() => {
                setSelectedCategory("All");
                setSearchTerm("");
              }}
              className="text-[#4F46E5] hover:underline cursor-pointer font-medium"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Roles Grid */}
      {filteredRoles.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white rounded-3xl border border-gray-200">
          <Layers className="mx-auto text-gray-300 mb-3" size={40} />
          <h3 className="text-base font-display font-bold text-[#12122B] mb-1">No roles matched your search</h3>
          <p className="text-xs text-gray-500 mb-4">Try searching for different keywords or clear the category filters.</p>
          <Button
            variant="outline"
            onClick={() => {
              setSelectedCategory("All");
              setSearchTerm("");
            }}
          >
            Show All Roles
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRoles.map((role) => {
            const velocity: RoleVelocityData = radarSummary?.roles?.[role.id] || {
              roleId: role.id,
              velocityScore: role.trendScore,
              deltaPercent: "+7.5%",
              trendStatus: role.trendScore >= 9.5 ? "surge" : "high",
              marketDriver: "Active hiring demand across Indian IT and core engineering sectors",
              estimatedOpenings: "10,000+",
              lastUpdated: new Date().toLocaleDateString("en-IN"),
            };

            const isSurge = velocity.trendStatus === "surge";
            const isHigh = velocity.trendStatus === "high";

            return (
              <Card
                key={role.id}
                hover
                onClick={() => handleSelectRole(role.id)}
                className="flex flex-col justify-between group transition-all duration-200 hover:border-[#4F46E5]/40"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="text-[10px] font-data font-bold text-[#6B7280] uppercase tracking-wider">
                      {role.category}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-data font-bold ${
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

                  <h3 className="text-xl font-display font-bold text-[#12122B] mb-2 group-hover:text-[#4F46E5] transition-colors">
                    {role.name}
                  </h3>

                  {/* Dynamic 2026 Market Velocity Driver Pill */}
                  <div className="p-2.5 rounded-xl bg-gradient-to-r from-[#FAFAF7] to-indigo-50/40 border border-indigo-100/70 mb-3 text-[11px] text-[#1E1B4B]">
                    <div className="flex items-center gap-1 text-[10px] font-data font-bold text-[#4F46E5] uppercase tracking-wider mb-0.5">
                      <Activity size={12} />
                      2026 Demand Driver
                    </div>
                    <p className="line-clamp-2 leading-tight text-gray-700 font-body">
                      {velocity.marketDriver}
                    </p>
                  </div>

                  <p className="text-xs font-body text-[#6B7280] line-clamp-2 mb-4 leading-relaxed">
                    {role.description}
                  </p>

                  {/* Salary & Openings Band */}
                  <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-[#FAFAF7] border border-gray-200 mb-4">
                    <div>
                      <span className="text-[10px] font-data text-[#6B7280] uppercase block leading-tight">
                        Expected Band
                      </span>
                      <span className="text-sm font-data font-bold text-[#12122B]">
                        {role.salaryRange}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-data text-[#6B7280] uppercase block leading-tight">
                        Active Openings
                      </span>
                      <span className="text-xs font-data font-bold text-emerald-700 flex items-center gap-1 mt-0.5">
                        <Briefcase size={12} />
                        {velocity.estimatedOpenings}
                      </span>
                    </div>
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
                  <span className="text-xs font-display font-semibold text-[#4F46E5] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    Inspect 3-Tier Route <ArrowRight size={14} />
                  </span>
                  <span className="text-[10px] font-mono text-gray-400">
                    Radar Active
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

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

                    {/* Dynamic 2026 Market Velocity Radar Insight Card */}
                    {activeRoleVelocity && (
                      <div className="p-5 rounded-2xl bg-gradient-to-br from-[#12122B] via-[#1A1842] to-[#12122B] text-white border border-[#4F46E5]/40 shadow-lg relative overflow-hidden">
                        <div className="pointer-events-none absolute -top-12 -right-12 h-40 w-40 rounded-full bg-[#10B981]/15 blur-2xl" />
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 relative z-10">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-data font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              <Activity size={12} />
                              2026 Market Velocity Radar
                            </span>
                            <span className="text-[10px] font-mono text-gray-400">
                              {radarSummary?.isLiveAI ? "Live Groq LPU Calibrated" : "Verified Indian Tech Index"}
                            </span>
                          </div>

                          <span
                            className={`self-start sm:self-auto px-2.5 py-1 rounded-lg text-xs font-data font-bold flex items-center gap-1 ${
                              activeRoleVelocity.trendStatus === "surge"
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                : "bg-[#4F46E5]/25 text-indigo-300 border border-[#4F46E5]/40"
                            }`}
                          >
                            <TrendingUp size={12} />
                            {activeRoleVelocity.deltaPercent} MoM Hiring Momentum
                          </span>
                        </div>

                        <div className="space-y-4 relative z-10">
                          {/* Progress gauge & score */}
                          <div className="flex items-center gap-4">
                            <div className="shrink-0 text-center">
                              <div className="text-3xl font-data font-bold text-white leading-none">
                                {Number(activeRoleVelocity.velocityScore ?? 9).toFixed(1)}
                                <span className="text-sm font-normal text-gray-400">/10</span>
                              </div>
                              <span className="text-[9px] font-data text-emerald-400 uppercase tracking-wider block mt-1">
                                Demand Index
                              </span>
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="h-2.5 bg-white/10 rounded-full overflow-hidden p-0.5">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${(activeRoleVelocity.velocityScore / 10) * 100}%` }}
                                  transition={{ duration: 0.8, ease: "easeOut" }}
                                  className={`h-full rounded-full ${
                                    activeRoleVelocity.velocityScore >= 9.5
                                      ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                                      : "bg-gradient-to-r from-[#4F46E5] to-[#818CF8]"
                                  }`}
                                />
                              </div>
                              <div className="flex justify-between text-[10px] font-mono text-gray-400 mt-1">
                                <span>Baseline: 7.0</span>
                                <span>Target: 10.0</span>
                              </div>
                            </div>
                          </div>

                          {/* Market Driver & Est Openings */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-white/10">
                            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                              <div className="flex items-center gap-1.5 text-[10px] font-data font-bold text-[#F5A623] uppercase tracking-wider mb-1.5">
                                <Zap size={12} />
                                2026 Hiring Catalyst
                              </div>
                              <p className="text-xs text-gray-200 font-body leading-relaxed">
                                {activeRoleVelocity.marketDriver}
                              </p>
                            </div>

                            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex flex-col justify-between">
                              <div className="flex items-center gap-1.5 text-[10px] font-data font-bold text-emerald-400 uppercase tracking-wider mb-1">
                                <Briefcase size={12} />
                                Estimated Live Openings in India
                              </div>
                              <div className="text-2xl font-data font-bold text-white mt-1">
                                {activeRoleVelocity.estimatedOpenings}
                              </div>
                              <div className="text-[10px] font-mono text-gray-400 mt-1">
                                Primary Hubs: Bengaluru, Hyderabad, Pune, NCR, Chennai
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Tier Tabs: Beginner / Intermediate / Expert */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 p-1.5 bg-gray-200/70 rounded-2xl overflow-x-auto">
                        {[
                          { id: "beginner", title: "Beginner", exp: "0–2 Yrs" },
                          { id: "intermediate", title: "Intermediate", exp: "3–5 Yrs" },
                          { id: "expert", title: "Expert", exp: "6+ Yrs" },
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
                                  {tier.exp} Experience
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
