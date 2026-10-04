import React, { useState } from "react";
import {
  Network,
  CheckCircle2,
  Lock,
  ArrowRight,
  Info,
  Clock,
  Sparkles,
} from "lucide-react";
import type { RoadmapPlan } from "../../types/roadmapEngine.types";

interface SkillGraphViewProps {
  plan: RoadmapPlan;
}

export const SkillGraphView: React.FC<SkillGraphViewProps> = ({ plan }) => {
  const [selectedSkill, setSelectedSkill] = useState<string | null>(
    plan.skill_gaps[0]?.skill || null
  );

  // Group skills by category layers for clear visual DAG hierarchy
  const layers = [
    {
      title: "Layer 01 · Foundations & Mathematics",
      categoryMatches: ["Foundations", "Computer Science Core", "AI / ML Foundations"],
    },
    {
      title: "Layer 02 · Languages & Core Persistence",
      categoryMatches: ["Programming Languages", "Databases", "Frontend"],
    },
    {
      title: "Layer 03 · Architecture, Cloud & Infrastructure",
      categoryMatches: ["Backend", "DevOps", "Cloud", "Cybersecurity"],
    },
    {
      title: "Layer 04 · Advanced Domain Specializations",
      categoryMatches: ["AI / ML", "Architecture", "Design", "Management", "Hardware / IoT"],
    },
  ];

  // Helper to determine node state
  const getNodeState = (skillName: string) => {
    const gap = plan.skill_gaps.find((g) => g.skill === skillName);
    if (!gap) return "neutral";
    if (gap.current_level >= 80) return "mastered";
    if (gap.all_prerequisites_met) return "available";
    return "locked";
  };

  const activeSkillDetails = plan.skill_gaps.find((g) => g.skill === selectedSkill);

  return (
    <div className="space-y-6">
      <div className="bg-[#181836] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-[#4F46E5] text-white">
                NETWORKX PREREQUISITE DAG
              </span>
              <span className="text-xs text-gray-400 font-mono">
                Directed Acyclic Graph Visualization
              </span>
            </div>
            <h3 className="text-xl font-display font-bold text-white">
              Prerequisite Dependency Hierarchy
            </h3>
            <p className="text-xs sm:text-sm text-gray-400 mt-1 font-body">
              Skills flow strictly from upstream fundamentals to downstream specialization. Circular dependencies are mathematically prevented.
            </p>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Mastered
            </span>
            <span className="flex items-center gap-1.5 text-indigo-400">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Available / Active
            </span>
            <span className="flex items-center gap-1.5 text-gray-400">
              <span className="w-2.5 h-2.5 rounded-full bg-gray-600" /> Prereqs Pending
            </span>
          </div>
        </div>

        {/* Layered DAG Nodes */}
        <div className="space-y-6">
          {layers.map((layer, lIdx) => {
            const layerSkills = plan.skill_gaps.filter((g) =>
              layer.categoryMatches.includes(g.category)
            );

            if (layerSkills.length === 0) return null;

            return (
              <div key={lIdx} className="space-y-3">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-400">
                  {layer.title}
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {layerSkills.map((gap) => {
                    const state = getNodeState(gap.skill);
                    const isSelected = selectedSkill === gap.skill;

                    return (
                      <div
                        key={gap.skill}
                        onClick={() => setSelectedSkill(gap.skill)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer select-none ${
                          isSelected
                            ? "bg-[#4F46E5]/20 border-[#6366F1] shadow-lg shadow-indigo-500/10"
                            : state === "mastered"
                            ? "bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-500/50"
                            : state === "available"
                            ? "bg-indigo-950/20 border-indigo-500/30 hover:border-indigo-500/50"
                            : "bg-white/[0.02] border-white/5 opacity-60 hover:opacity-80"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <span className="text-[10px] font-mono uppercase text-gray-400">
                            {gap.category}
                          </span>
                          {state === "mastered" ? (
                            <CheckCircle2 size={14} className="text-emerald-400" />
                          ) : state === "locked" ? (
                            <Lock size={12} className="text-gray-500" />
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                          )}
                        </div>

                        <div className="text-sm font-semibold text-white truncate">
                          {gap.skill}
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-gray-400 font-mono mt-2">
                          <span>Level: {gap.current_level}%</span>
                          <span>~{gap.estimated_hours}h</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Skill Detail Inspector Drawer */}
        {activeSkillDetails && (
          <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3 pt-4">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <Info size={16} className="text-indigo-400" />
                {activeSkillDetails.skill}
              </h4>
              <span className="text-xs font-mono text-gray-400">
                Demand: {activeSkillDetails.market_demand}/100
              </span>
            </div>

            <p className="text-xs text-gray-300 font-body">
              {activeSkillDetails.description}
            </p>

            {activeSkillDetails.prerequisites.length > 0 && (
              <div className="pt-2 border-t border-white/5 flex flex-wrap items-center gap-2 text-xs">
                <span className="text-gray-400 font-mono">Must Learn Prior:</span>
                {activeSkillDetails.prerequisites.map((p) => (
                  <span
                    key={p.skill}
                    className={`px-2 py-0.5 rounded-md border text-[11px] flex items-center gap-1 ${
                      p.satisfied
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-white/5 text-gray-400 border-white/10"
                    }`}
                  >
                    <CheckCircle2 size={11} className={p.satisfied ? "text-emerald-400" : "text-gray-500"} />
                    {p.skill}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
