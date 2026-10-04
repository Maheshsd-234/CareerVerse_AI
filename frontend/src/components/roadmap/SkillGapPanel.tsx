import React from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  Target,
  Layers,
  ArrowUpRight,
} from "lucide-react";
import type { SkillGapItem } from "../../types/roadmapEngine.types";

interface SkillGapPanelProps {
  skillGaps: SkillGapItem[];
  targetRoleName: string;
}

export const SkillGapPanel: React.FC<SkillGapPanelProps> = ({
  skillGaps,
  targetRoleName,
}) => {
  const criticalCount = skillGaps.filter((g) => g.priority === "Critical").length;
  const totalGapHours = skillGaps.reduce((acc, g) => acc + g.estimated_hours, 0);
  const masteredCount = skillGaps.filter((g) => g.current_level >= 80).length;

  const getPriorityStyle = (p: string) => {
    switch (p) {
      case "Critical":
        return "bg-rose-500/20 text-rose-300 border-rose-500/30";
      case "High":
        return "bg-amber-500/20 text-amber-300 border-amber-500/30";
      case "Medium":
        return "bg-blue-500/20 text-blue-300 border-blue-500/30";
      default:
        return "bg-gray-500/20 text-gray-300 border-gray-500/30";
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#181836] border border-white/10 rounded-2xl p-5">
          <div className="text-xs font-mono text-gray-400 mb-1">Critical Must-Haves</div>
          <div className="text-2xl font-display font-bold text-rose-400">
            {criticalCount} Competencies
          </div>
          <p className="text-xs text-gray-400 mt-1">High-priority core requirements</p>
        </div>

        <div className="bg-[#181836] border border-white/10 rounded-2xl p-5">
          <div className="text-xs font-mono text-gray-400 mb-1">Total Effort to Bridge</div>
          <div className="text-2xl font-display font-bold text-indigo-400">
            ~{totalGapHours} Hours
          </div>
          <p className="text-xs text-gray-400 mt-1">Adjusted by existing verified skills</p>
        </div>

        <div className="bg-[#181836] border border-white/10 rounded-2xl p-5">
          <div className="text-xs font-mono text-gray-400 mb-1">Already Strong / Mastered</div>
          <div className="text-2xl font-display font-bold text-emerald-400">
            {masteredCount} of {skillGaps.length}
          </div>
          <p className="text-xs text-gray-400 mt-1">Bypassed in foundational tasks</p>
        </div>
      </div>

      {/* Detailed Skill Cards */}
      <div className="bg-[#181836] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6">
        <div>
          <h3 className="text-xl font-display font-bold text-white">
            Skill Gap Matrix for {targetRoleName}
          </h3>
          <p className="text-xs sm:text-sm text-gray-400 font-body mt-1">
            Calculated by evaluating required role competencies against your verified skill profile and diagnostic assessments.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {skillGaps.map((gap) => (
            <div
              key={gap.skill}
              className="bg-white/[0.02] border border-white/5 hover:border-white/10 rounded-2xl p-5 space-y-4 transition-all"
            >
              {/* Top row */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[11px] font-mono text-indigo-400 uppercase tracking-wider">
                    {gap.category}
                  </span>
                  <h4 className="text-base font-semibold text-white mt-0.5">
                    {gap.skill}
                  </h4>
                </div>

                <span
                  className={`px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold uppercase border ${getPriorityStyle(
                    gap.priority
                  )}`}
                >
                  {gap.priority}
                </span>
              </div>

              {/* Progress bar comparison */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-gray-400">
                    Current: <strong className="text-white">{gap.current_level}% ({gap.current_state})</strong>
                  </span>
                  <span className="text-gray-400">
                    Target: <strong className="text-indigo-300">{gap.target_level}%</strong>
                  </span>
                </div>

                <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden relative">
                  <div
                    className="bg-indigo-500 h-full rounded-full transition-all"
                    style={{ width: `${gap.current_level}%` }}
                  />
                  {gap.gap_size > 0 && (
                    <div
                      className="absolute top-0 bottom-0 bg-rose-500/30 border-l border-white/20"
                      style={{
                        left: `${gap.current_level}%`,
                        width: `${gap.gap_size}%`,
                      }}
                    />
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1">
                  <span>Gap Size: <strong className="text-rose-400">{gap.gap_size} pts</strong></span>
                  <span className="flex items-center gap-1 font-mono">
                    <Clock size={11} /> ~{gap.estimated_hours}h required
                  </span>
                </div>
              </div>

              {/* Prerequisites check */}
              {gap.prerequisites.length > 0 && (
                <div className="pt-2 border-t border-white/5 space-y-1.5">
                  <span className="text-[11px] font-mono text-gray-500">Direct Prerequisites:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {gap.prerequisites.map((p) => (
                      <span
                        key={p.skill}
                        className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md border ${
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
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
