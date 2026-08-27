import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BadgeIndianRupee,
  BookOpen,
  Briefcase,
  GraduationCap,
  Sparkles,
  TrendingUp,
  X,
  Search,
  Compass,
  ArrowRight,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { Card, Badge, Button, ProgressBar } from "../../components/ui/UI";
import { roles } from "../../data/roles";

export const RoleExplorerPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get("role");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(initialRole);

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
          <span className="text-xs font-mono text-gray-400">Industry Career Profiles</span>
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
              onClick={() => setSelectedRoleId(role.id)}
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
                    Estimated Compensation
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
                  Inspect Role Details <ArrowRight size={14} />
                </span>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Role Details Modal */}
      <AnimatePresence>
        {activeRole && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#12122B]/60 backdrop-blur-xs"
              onClick={() => setSelectedRoleId(null)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden max-h-[85vh] flex flex-col z-10"
            >
              <div className="bg-[#12122B] text-white p-6 border-b border-white/10 flex items-start justify-between">
                <div>
                  <span className="text-xs font-data font-bold text-[#F5A623] uppercase">
                    {activeRole.category} DOMAIN
                  </span>
                  <h2 className="text-2xl font-display font-bold text-white mt-1">
                    {activeRole.name}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedRoleId(null)}
                  className="p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-5">
                <p className="text-sm font-body text-[#12122B]/80 leading-relaxed">
                  {activeRole.description}
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-[#FAFAF7] border border-gray-200">
                    <span className="text-xs font-data text-[#6B7280] uppercase">Salary Scale</span>
                    <p className="text-lg font-data font-bold text-[#0F766E] mt-1">
                      {activeRole.salaryRange}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-[#FAFAF7] border border-gray-200">
                    <span className="text-xs font-data text-[#6B7280] uppercase">Market Demand</span>
                    <p className="text-lg font-data font-bold text-[#4F46E5] mt-1">
                      {activeRole.trendScore.toFixed(1)} / 10.0
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-data font-bold uppercase text-[#6B7280] mb-2">
                    Complete Required Skillset:
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {activeRole.requiredSkills.map((skill) => (
                      <span
                        key={skill}
                        className="px-3 py-1 rounded-lg text-xs font-display font-semibold bg-[#4F46E5]/10 text-[#4F46E5] border border-[#4F46E5]/20"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end">
                <Button onClick={() => setSelectedRoleId(null)}>Close Inspection</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
