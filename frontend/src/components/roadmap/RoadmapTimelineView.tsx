import React, { useState } from "react";
import {
  Layers,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle2,
  Lock,
  ArrowRight,
  BookOpen,
} from "lucide-react";
import type { RoadmapPhase, RoadmapWeek, RoadmapTask } from "../../types/roadmapEngine.types";
import { TaskCard } from "./TaskCard";

interface RoadmapTimelineViewProps {
  phases: RoadmapPhase[];
  onOpenDetail: (task: RoadmapTask) => void;
  onToggleComplete: (task: RoadmapTask, e: React.MouseEvent) => void;
  onJumpToWeek: (weekNumber: number) => void;
}

export const RoadmapTimelineView: React.FC<RoadmapTimelineViewProps> = ({
  phases,
  onOpenDetail,
  onToggleComplete,
  onJumpToWeek,
}) => {
  // Local state for expanded week IDs
  const [expandedWeekId, setExpandedWeekId] = useState<string | null>(
    phases[0]?.weeks[0]?.id || null
  );

  const toggleWeek = (id: string) => {
    setExpandedWeekId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-8">
      {phases.map((phase) => (
        <div
          key={phase.id}
          className="bg-[#181836] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6"
        >
          {/* Phase Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-bold uppercase bg-[#4F46E5] text-white">
                  PHASE {phase.phase_number}
                </span>
                <span className="text-xs text-gray-400 font-mono">
                  {phase.duration_weeks} Weeks · ~{phase.estimated_hours} Hours
                </span>
                {phase.completion_percentage === 100 && (
                  <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    Phase Completed
                  </span>
                )}
              </div>
              <h3 className="text-xl sm:text-2xl font-display font-bold text-white">
                {phase.title}
              </h3>
              <p className="text-xs sm:text-sm text-gray-300 mt-1 font-body max-w-2xl">
                {phase.description}
              </p>
            </div>

            {/* Progress bar */}
            <div className="w-full md:w-48 space-y-1.5 shrink-0">
              <div className="flex justify-between text-xs font-mono text-gray-400">
                <span>Phase Progress</span>
                <span className="text-white font-bold">{phase.completion_percentage}%</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-indigo-500 h-full rounded-full transition-all"
                  style={{ width: `${phase.completion_percentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* Weeks within this phase */}
          <div className="space-y-4">
            {phase.weeks.map((week) => {
              const isExpanded = expandedWeekId === week.id;
              const isCompleted = week.completion_percentage === 100;
              const isLocked = week.status === "locked";

              return (
                <div
                  key={week.id}
                  className={`rounded-2xl border transition-all ${
                    isExpanded
                      ? "bg-white/[0.04] border-white/20"
                      : "bg-white/[0.02] border-white/5 hover:border-white/10"
                  }`}
                >
                  {/* Week Accordion Header */}
                  <div
                    onClick={() => toggleWeek(week.id)}
                    className="p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                          isCompleted
                            ? "bg-emerald-500 text-white"
                            : isLocked
                            ? "bg-white/5 text-gray-500"
                            : "bg-[#4F46E5]/20 text-indigo-300 border border-[#4F46E5]/30"
                        }`}
                      >
                        {isCompleted ? <CheckCircle2 size={16} /> : isLocked ? <Lock size={14} /> : `W${week.week_number}`}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-mono text-indigo-400 font-semibold">
                            Week {week.week_number}
                          </span>
                          <span className="text-[11px] text-gray-400 font-mono">
                            · ~{week.estimated_hours}h
                          </span>
                          <span className="text-[11px] font-mono text-gray-500">
                            · {week.tasks.length} Tasks
                          </span>
                          {week.assessment_status === "passed" && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                              Passed ({week.assessment_score}/15)
                            </span>
                          )}
                          {week.assessment_status === "failed" && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold">
                              Failed ({week.assessment_score}/15)
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm sm:text-base font-semibold text-white truncate">
                          {week.title}
                        </h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onJumpToWeek(week.week_number);
                        }}
                        className="hidden sm:flex items-center gap-1 text-xs text-indigo-400 hover:text-white px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                      >
                        <span>Focus</span>
                        <ArrowRight size={12} />
                      </button>

                      <div className="text-gray-400">
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Task List */}
                  {isExpanded && (
                    <div className="px-4 pb-5 sm:px-5 space-y-4 border-t border-white/5 pt-4">
                      {/* Week Objective & Topics */}
                      {week.objective && (
                        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                          <p className="text-xs text-gray-300 font-body">
                            <strong className="text-indigo-400 font-mono text-[11px] uppercase mr-2">Objective:</strong>
                            {week.objective}
                          </p>
                          {week.topics && week.topics.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {week.topics.map((t, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 text-[10px] font-mono border border-indigo-500/20"
                                >
                                  {t}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="space-y-3">
                      {week.tasks.map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          onOpenDetail={onOpenDetail}
                          onToggleComplete={onToggleComplete}
                        />
                      ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
