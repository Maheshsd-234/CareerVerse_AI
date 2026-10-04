import React from "react";
import {
  MapPin,
  Calendar,
  Clock,
  Download,
  Sliders,
  Share2,
  Sparkles,
  GitFork,
  Target,
  CheckCircle2,
  AlertTriangle,
  Award,
} from "lucide-react";
import { Button } from "../ui/UI";
import type { RoadmapPlan } from "../../types/roadmapEngine.types";

interface RoadmapHeaderProps {
  plan: RoadmapPlan;
  onOpenSimulator: () => void;
  onOpenWizard: () => void;
  onExportPDF: () => void;
  onToggleView: (view: "timeline" | "weekly" | "gaps" | "graph") => void;
  activeView: "timeline" | "weekly" | "gaps" | "graph";
}

export const RoadmapHeader: React.FC<RoadmapHeaderProps> = ({
  plan,
  onOpenSimulator,
  onOpenWizard,
  onExportPDF,
  onToggleView,
  activeView,
}) => {
  const feasibility = plan.feasibility;
  const isConflict = feasibility.status === "conflict";
  const isTight = feasibility.status === "tight";

  return (
    <div className="bg-[#12122B] text-white rounded-3xl p-6 sm:p-8 border border-white/10 shadow-xl relative overflow-hidden print:hidden">
      <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[#4F46E5]/25 blur-3xl" />

      {/* Top Meta Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono font-bold tracking-wider uppercase bg-[#4F46E5] text-white shadow-xs">
            <MapPin size={13} />
            STATION 05 · ADAPTIVE ROADMAP
          </span>
          <span className="text-xs font-mono text-gray-400">
            Engine {plan.engine_version}
          </span>
          {plan.mvcp_mode && (
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
              MVCP Fast-Track
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={onOpenSimulator}
            className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs flex items-center gap-1.5"
          >
            <Sliders size={13} />
            What-If Simulator
          </Button>

          <Button
            variant="outline"
            onClick={onOpenWizard}
            className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs flex items-center gap-1.5"
          >
            <Sparkles size={13} />
            Personalize Plan
          </Button>

          <Button
            variant="outline"
            onClick={onExportPDF}
            className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Download size={13} />
            Complete Flow (PDF)
          </Button>
        </div>
      </div>

      {/* Title & Goal Summary */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-white/10">
        <div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-white">
              {plan.target_role_name}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
              Level: {plan.experience_level || "Beginner"}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/10 text-gray-300 border border-white/10">
              {plan.target_role_category}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-gray-300 font-mono">
            <span>
              Target Goal: <strong className="text-white">{plan.goal}</strong>
            </span>
            <span>·</span>
            <span>
              Duration: <strong className="text-white">{plan.total_weeks} Weeks (~{Math.max(1, Math.round(plan.total_weeks / 4.3))} Mo)</strong>
            </span>
            <span>·</span>
            <span>
              Weekly Commitment: <strong className="text-white">{plan.weekly_hours} Hours/Wk</strong>
            </span>
            <span>·</span>
            <span>
              Capacity: <strong className="text-indigo-400">{plan.total_weeks * plan.weekly_hours} Available Hrs</strong>
            </span>
          </div>
        </div>

        {/* Feasibility Status Pill */}
        <div
          className={`p-3.5 rounded-2xl border flex items-center gap-3 shrink-0 ${
            isConflict
              ? "bg-rose-950/30 border-rose-500/40 text-rose-300"
              : isTight
              ? "bg-amber-950/30 border-amber-500/40 text-amber-300"
              : "bg-emerald-950/30 border-emerald-500/40 text-emerald-300"
          }`}
        >
          {isConflict ? (
            <AlertTriangle size={20} className="text-rose-400 shrink-0" />
          ) : isTight ? (
            <Clock size={20} className="text-amber-400 shrink-0" />
          ) : (
            <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />
          )}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider font-mono">
              {feasibility.headline}
            </div>
            <div className="text-[11px] opacity-80 line-clamp-1 max-w-xs font-body">
              {feasibility.message}
            </div>
          </div>
        </div>
      </div>

      {/* Capacity Partitioning & Deprioritized Skills Notice */}
      {plan.deprioritized_skills && plan.deprioritized_skills.length > 0 && (
        <div className="mt-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
                <Clock size={14} />
                Timeline Capacity Adaptation
              </div>
              <p className="text-xs font-body text-gray-300">
                To fit your target duration ({plan.total_weeks} weeks · {plan.total_weeks * plan.weekly_hours} hrs), the engine prioritized{" "}
                <strong className="text-white">{plan.essential_skills?.length || "core"} Essential Skills</strong>.{" "}
                <strong className="text-amber-300">{plan.deprioritized_skills.length} Advanced Competencies</strong> were deprioritized rather than rushing depth.
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5 shrink-0">
              {plan.deprioritized_skills.slice(0, 4).map((s) => (
                <span
                  key={s.skill_id}
                  className="px-2 py-0.5 rounded bg-black/30 text-amber-300/80 border border-amber-500/20 text-[10px] font-mono"
                  title={s.reason}
                >
                  {s.skill_name}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Progress & Evidence-Based Mastery Gauges */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
        {/* Metric 1: Roadmap Completion */}
        <div className="bg-[#181836] p-4 rounded-2xl border border-white/10">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-mono text-gray-300 font-semibold flex items-center gap-1.5">
              <Target size={13} className="text-indigo-400" />
              Overall Roadmap Completion
            </span>
            <span className="font-mono font-bold text-white text-sm">
              {plan.overall_completion_pct}%
            </span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 to-indigo-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${plan.overall_completion_pct}%` }}
            />
          </div>
          <p className="text-[11px] text-gray-400 mt-2 font-mono">
            Tracks total completed study tasks, labs, and deliverables across all phases.
          </p>
        </div>

        {/* Metric 2: Evidence-Based Skill Mastery */}
        <div className="bg-[#181836] p-4 rounded-2xl border border-white/10">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-mono text-gray-300 font-semibold flex items-center gap-1.5">
              <Award size={14} className="text-emerald-400" />
              CareerVerse Skill Mastery
            </span>
            <span className="font-mono font-bold text-emerald-400 text-sm">
              {plan.careerverse_skill_mastery_pct}%
            </span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${plan.careerverse_skill_mastery_pct}%` }}
            />
          </div>
          <p className="text-[11px] text-gray-400 mt-2 font-mono">
            Evidence-weighted internal indicator: Labs 25%, Quizzes 30%, Projects 20%, Theory 15%, Interviews 10%.
          </p>
        </div>
      </div>

      {/* Navigation View Switcher Tabs */}
      <div className="mt-6 flex flex-wrap items-center gap-2 pt-4 border-t border-white/10">
        <span className="text-xs font-mono text-gray-400 font-semibold mr-2">
          View Mode:
        </span>
        <button
          onClick={() => onToggleView("weekly")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-display font-semibold transition-all cursor-pointer ${
            activeView === "weekly"
              ? "bg-[#4F46E5] text-white shadow-xs"
              : "bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white"
          }`}
        >
          Active Week Focus
        </button>
        <button
          onClick={() => onToggleView("timeline")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-display font-semibold transition-all cursor-pointer ${
            activeView === "timeline"
              ? "bg-[#4F46E5] text-white shadow-xs"
              : "bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white"
          }`}
        >
          Full Timeline & Milestones
        </button>
        <button
          onClick={() => onToggleView("gaps")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-display font-semibold transition-all cursor-pointer ${
            activeView === "gaps"
              ? "bg-[#4F46E5] text-white shadow-xs"
              : "bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white"
          }`}
        >
          Skill Gap Analysis ({plan.skill_gaps.length})
        </button>
        <button
          onClick={() => onToggleView("graph")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-display font-semibold transition-all cursor-pointer ${
            activeView === "graph"
              ? "bg-[#4F46E5] text-white shadow-xs"
              : "bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white"
          }`}
        >
          Skill Dependency Graph
        </button>
      </div>
    </div>
  );
};
