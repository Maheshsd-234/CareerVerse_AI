import React from "react";
import {
  BookOpen,
  Code2,
  FolderGit2,
  HelpCircle,
  Briefcase,
  CheckCircle2,
  Clock,
  Lock,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";
import type { RoadmapTask } from "../../types/roadmapEngine.types";

interface TaskCardProps {
  task: RoadmapTask;
  onOpenDetail: (task: RoadmapTask) => void;
  onToggleComplete: (task: RoadmapTask, e: React.MouseEvent) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onOpenDetail,
  onToggleComplete,
}) => {
  const isCompleted = task.status === "completed";
  const isLocked = task.status === "locked";
  const isNeedsReview = task.status === "needs_review";

  const hasPendingEvidence =
    task.evidence_required &&
    ((task.type === "project" && !task.github_evidence_url) ||
      (task.type === "assessment" && (task.last_score === undefined || task.last_score < 60)));

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLocked) return;
    if (hasPendingEvidence && !isCompleted) {
      onOpenDetail(task);
      return;
    }
    onToggleComplete(task, e);
  };

  // Task type styling
  const getTypeBadge = () => {
    switch (task.type) {
      case "learn":
        return {
          icon: <BookOpen size={13} />,
          label: "Learn",
          bg: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        };
      case "practice":
        return {
          icon: <Code2 size={13} />,
          label: "Practice",
          bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        };
      case "project":
        return {
          icon: <FolderGit2 size={13} />,
          label: "Project",
          bg: "bg-purple-500/10 text-purple-400 border-purple-500/20",
        };
      case "assessment":
        return {
          icon: <HelpCircle size={13} />,
          label: "Assessment",
          bg: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        };
      case "interview":
        return {
          icon: <Briefcase size={13} />,
          label: "Interview",
          bg: "bg-rose-500/10 text-rose-400 border-rose-500/20",
        };
    }
  };

  const typeConfig = getTypeBadge();

  return (
    <div
      onClick={() => onOpenDetail(task)}
      className={`group relative rounded-2xl p-4 transition-all border cursor-pointer select-none ${
        isCompleted
          ? "bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-500/50"
          : isNeedsReview
          ? "bg-amber-950/20 border-amber-500/40 hover:border-amber-500/60"
          : isLocked
          ? "bg-white/[0.02] border-white/5 opacity-60 hover:opacity-80"
          : "bg-[#181836] border-white/10 hover:border-[#6366F1]/50 hover:shadow-lg hover:shadow-indigo-500/10"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Completion Checkbox / Lock Icon */}
        <button
          onClick={handleCheckboxClick}
          disabled={isLocked}
          className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
            isCompleted
              ? "bg-emerald-500 text-white"
              : isNeedsReview
              ? "bg-amber-500 text-white"
              : isLocked
              ? "bg-white/5 text-gray-500 cursor-not-allowed"
              : hasPendingEvidence
              ? "border border-purple-400/50 text-purple-400 hover:bg-purple-500/10"
              : "border border-white/20 hover:border-indigo-400 text-transparent hover:text-indigo-400/50"
          }`}
          title={
            isCompleted
              ? "Completed"
              : isLocked
              ? "Locked by prerequisites"
              : hasPendingEvidence
              ? "Evidence Required (Submit GitHub URL / Pass Quiz) - Click to submit"
              : "Click to mark complete"
          }
        >
          {isCompleted ? (
            <CheckCircle2 size={16} className="stroke-[2.5]" />
          ) : isNeedsReview ? (
            <AlertTriangle size={14} className="stroke-[2.5]" />
          ) : isLocked ? (
            <Lock size={12} />
          ) : hasPendingEvidence ? (
            <FolderGit2 size={13} className="text-purple-400" />
          ) : (
            <CheckCircle2 size={16} />
          )}
        </button>

        {/* Task Details */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border ${typeConfig.bg}`}
            >
              {typeConfig.icon}
              {typeConfig.label}
            </span>

            <span className="text-[11px] font-mono text-gray-400 flex items-center gap-1">
              <Clock size={11} />
              {task.estimated_minutes}m
            </span>

            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-white/5 text-gray-400">
              {task.difficulty}
            </span>

            {isNeedsReview && (
              <span className="text-[10px] font-semibold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">
                Needs Review ({task.last_score}%)
              </span>
            )}

            {task.evidence_required && (
              <span className="text-[10px] text-purple-300 bg-purple-400/10 px-1.5 py-0.5 rounded border border-purple-400/20">
                Evidence Required
              </span>
            )}
          </div>

          <h4
            className={`text-sm font-semibold leading-snug line-clamp-2 ${
              isCompleted
                ? "text-gray-300 line-through decoration-emerald-500/40"
                : "text-white group-hover:text-indigo-300 transition-colors"
            }`}
          >
            {task.title}
          </h4>

          {task.why_this_now && (
            <p className="text-xs text-gray-400 line-clamp-1 mt-1 font-body">
              {task.why_this_now}
            </p>
          )}
        </div>

        {/* Arrow affordance */}
        <ChevronRight
          size={16}
          className="text-gray-500 group-hover:text-white group-hover:translate-x-0.5 transition-all mt-1"
        />
      </div>
    </div>
  );
};
