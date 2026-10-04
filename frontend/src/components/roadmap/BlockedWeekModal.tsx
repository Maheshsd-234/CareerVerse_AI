import React from "react";
import {
  AlertTriangle,
  X,
  FileText,
  ArrowRight,
  CheckCircle2,
  FolderGit2,
  HelpCircle,
  BookOpen,
  Code2,
} from "lucide-react";
import type { RoadmapWeek, RoadmapTask } from "../../types/roadmapEngine.types";
import { Button } from "../ui/UI";

interface BlockedWeekModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentWeek: RoadmapWeek;
  onOpenTaskDetail: (task: RoadmapTask) => void;
  onViewCompleteFlow: () => void;
  assessmentBlocked?: boolean;
  onOpenAssessment?: () => void;
}

export const BlockedWeekModal: React.FC<BlockedWeekModalProps> = ({
  isOpen,
  onClose,
  currentWeek,
  onOpenTaskDetail,
  onViewCompleteFlow,
  assessmentBlocked,
  onOpenAssessment,
}) => {
  if (!isOpen) return null;

  const incompleteTasks = currentWeek.tasks.filter((t) => t.status !== "completed");
  const completedCount = currentWeek.tasks.length - incompleteTasks.length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        className="w-full max-w-xl bg-[#12122B] border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <AlertTriangle size={24} />
            </div>
            <div>
              <span className="text-xs font-mono uppercase font-bold text-amber-400 tracking-wider">
                Prerequisite Milestone Guard
              </span>
              <h3 className="text-xl font-display font-bold text-white leading-tight">
                Complete Current Week First
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Informative Explanation */}
        <div className="space-y-3 font-body text-sm text-gray-300 bg-white/[0.02] p-4 rounded-2xl border border-white/5">
          <p>
            You cannot proceed to <strong className="text-white">Week {currentWeek.week_number + 1}</strong> yet.
            CareerVerse enforces deterministic competency progression: you must finish all tasks and submit required evidence in{" "}
            <strong className="text-indigo-400">Week {currentWeek.week_number}: {currentWeek.title}</strong> before advancing.
          </p>

          {currentWeek.assessment_status !== "passed" && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-1">
              <div className="font-bold font-mono uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle size={14} />
                Mandatory Assessment Required (12/15 = 75%)
              </div>
              <p className="font-body text-gray-300">
                You must pass the 15-question Weekly Assessment with at least 12 correct answers to unlock Week {currentWeek.week_number + 1}.
                {currentWeek.assessment_score !== undefined && (
                  <span className="block mt-0.5 text-rose-400 font-semibold">
                    Current score: {currentWeek.assessment_score}/15 (Need {12 - currentWeek.assessment_score} more to pass).
                  </span>
                )}
              </p>
              {onOpenAssessment && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenAssessment();
                  }}
                  className="mt-2 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold cursor-pointer shadow"
                >
                  {currentWeek.assessment_status === "failed" ? "Retake Assessment" : "Take Weekly Assessment Now"}
                </button>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 text-xs font-mono text-gray-400 pt-1">
            <span>Tasks Progress:</span>
            <div className="flex-1 bg-white/10 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-amber-400 h-full rounded-full transition-all"
                style={{ width: `${currentWeek.completion_percentage}%` }}
              />
            </div>
            <span className="text-white font-bold">
              {completedCount} / {currentWeek.tasks.length} Completed
            </span>
          </div>
        </div>

        {/* Incomplete Tasks List */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-mono uppercase font-bold text-gray-400">
            Remaining Milestones in Week {currentWeek.week_number} ({incompleteTasks.length}):
          </h4>
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {incompleteTasks.map((task) => (
              <div
                key={task.id}
                onClick={() => {
                  onClose();
                  onOpenTaskDetail(task);
                }}
                className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[#181836] border border-white/10 hover:border-indigo-400/50 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="shrink-0 text-gray-400 group-hover:text-indigo-400">
                    {task.type === "project" ? (
                      <FolderGit2 size={16} />
                    ) : task.type === "assessment" ? (
                      <HelpCircle size={16} />
                    ) : task.type === "practice" ? (
                      <Code2 size={16} />
                    ) : (
                      <BookOpen size={16} />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white group-hover:text-indigo-300 truncate">
                      {task.title}
                    </p>
                    {task.evidence_required && (
                      <span className="text-[10px] text-purple-300 font-mono">
                        * Evidence Required (GitHub URL / Quiz)
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-xs text-indigo-400 flex items-center gap-1 shrink-0 font-mono group-hover:translate-x-0.5 transition-transform">
                  Resume <ArrowRight size={12} />
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={() => {
              onClose();
              onViewCompleteFlow();
            }}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <FileText size={14} />
            View Complete Flow (Download PDF)
          </button>

          <Button
            onClick={onClose}
            className="w-full sm:w-auto bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs px-5 py-2.5 font-semibold"
          >
            Got It, Complete Current Week
          </Button>
        </div>
      </div>
    </div>
  );
};
