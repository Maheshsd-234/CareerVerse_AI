import React from "react";
import {
  Calendar,
  Clock,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  BookOpen,
  Layers,
  HelpCircle,
  FileCheck2,
  AlertCircle,
  Award,
  ListChecks,
  Hourglass,
} from "lucide-react";
import type { RoadmapPhase, RoadmapWeek, RoadmapTask } from "../../types/roadmapEngine.types";
import { TaskCard } from "./TaskCard";
import { Button } from "../ui/UI";

interface CurrentWeekFocusProps {
  currentPhase: RoadmapPhase;
  currentWeek: RoadmapWeek;
  onOpenDetail: (task: RoadmapTask) => void;
  onToggleComplete: (task: RoadmapTask, e: React.MouseEvent) => void;
  onSelectWeek: (weekNumber: number) => void;
  totalWeeks: number;
  onBlockedNextWeek?: (currentWeekNumber: number, incompleteCount: number, assessmentBlocked?: boolean) => void;
  onViewCompleteFlow?: () => void;
  onOpenAssessment?: (week: RoadmapWeek) => void;
}

export const CurrentWeekFocus: React.FC<CurrentWeekFocusProps> = ({
  currentPhase,
  currentWeek,
  onOpenDetail,
  onToggleComplete,
  onSelectWeek,
  totalWeeks,
  onBlockedNextWeek,
  onViewCompleteFlow,
  onOpenAssessment,
}) => {
  const completedTasks = currentWeek.tasks.filter((t) => t.status === "completed").length;
  const nextAvailableTask = currentWeek.tasks.find((t) => t.status === "available" || t.status === "in_progress");

  const assessmentPassed = currentWeek.assessment_status === "passed";
  const assessmentFailed = currentWeek.assessment_status === "failed";
  const assessmentScore = currentWeek.assessment_score;
  const passingScore = currentWeek.passing_score || 12;
  const totalQuestions = currentWeek.total_questions || 15;

  const handleNextWeekClick = () => {
    if (currentWeek.week_number >= totalWeeks) return;
    const incompleteCount = currentWeek.tasks.length - completedTasks;
    
    // Block if tasks incomplete OR assessment not passed
    if (incompleteCount > 0 || !assessmentPassed) {
      if (onBlockedNextWeek) {
        onBlockedNextWeek(currentWeek.week_number, incompleteCount, !assessmentPassed);
      }
      return;
    }
    onSelectWeek(currentWeek.week_number + 1);
  };

  const learningHrs = currentWeek.learning_hours || Math.max(1, Math.round(currentWeek.estimated_hours * 0.45));
  const practiceHrs = currentWeek.practice_hours || Math.max(1, Math.round(currentWeek.estimated_hours * 0.4));
  const assessmentHrs = currentWeek.assessment_hours || Math.max(1, currentWeek.estimated_hours - learningHrs - practiceHrs);

  return (
    <div className="space-y-6">
      {/* Current Week Banner Card */}
      <div className="bg-[#181836] border border-white/10 rounded-3xl p-6 sm:p-8 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-[#4F46E5] text-white">
                WEEK {currentWeek.week_number} OF {totalWeeks}
              </span>
              <span className="text-xs text-gray-400 font-mono">
                {currentPhase.title}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-display font-bold text-white">
              {currentWeek.title}
            </h2>
            <p className="text-xs sm:text-sm text-gray-300 mt-1 font-body">
              Primary Competency: <strong className="text-indigo-400">{currentWeek.primary_skill}</strong> · Budgeted Time:{" "}
              <strong className="text-white">{currentWeek.estimated_hours} Hours</strong>
            </p>
          </div>

          {/* Quick Week Switcher Buttons & Complete Flow PDF */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {onViewCompleteFlow && (
              <button
                onClick={onViewCompleteFlow}
                className="px-3 py-1.5 rounded-xl text-xs font-mono bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20 cursor-pointer flex items-center gap-1.5 transition-all"
                title="View and download full week-by-week syllabus as PDF"
              >
                <BookOpen size={13} />
                View Complete Flow (PDF)
              </button>
            )}
            <button
              onClick={() => onSelectWeek(Math.max(1, currentWeek.week_number - 1))}
              disabled={currentWeek.week_number <= 1}
              className="px-3 py-1.5 rounded-xl text-xs font-mono bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              ← Prev Week
            </button>
            <button
              onClick={handleNextWeekClick}
              disabled={currentWeek.week_number >= totalWeeks}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono border transition-all cursor-pointer ${
                completedTasks === currentWeek.tasks.length && assessmentPassed
                  ? "bg-[#4F46E5] hover:bg-[#4338CA] text-white border-transparent shadow-md shadow-indigo-500/20"
                  : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              Next Week →
            </button>
          </div>
        </div>

        {/* Dynamic Objective & Topic Breakdown */}
        <div className="py-4 border-b border-white/10 space-y-3">
          {currentWeek.objective && (
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-indigo-400 font-bold block mb-1">
                Target Learning Objective:
              </span>
              <p className="text-sm text-gray-200 font-body leading-relaxed bg-white/[0.02] p-3 rounded-xl border border-white/5">
                {currentWeek.objective}
              </p>
            </div>
          )}

          {currentWeek.topics && currentWeek.topics.length > 0 && (
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-gray-400 font-bold block mb-2 flex items-center gap-1.5">
                <ListChecks size={13} className="text-indigo-400" />
                Curated Skill Topics:
              </span>
              <div className="flex flex-wrap gap-2">
                {currentWeek.topics.map((topic, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-medium"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Hours Allocation Breakdown */}
          <div className="grid grid-cols-3 gap-2 pt-2 text-center font-mono">
            <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
              <span className="text-[10px] text-gray-400 block uppercase">Learning</span>
              <span className="text-sm font-bold text-white">{learningHrs} Hours</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
              <span className="text-[10px] text-gray-400 block uppercase">Practice</span>
              <span className="text-sm font-bold text-emerald-400">{practiceHrs} Hours</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
              <span className="text-[10px] text-gray-400 block uppercase">Assessment</span>
              <span className="text-sm font-bold text-indigo-300">{assessmentHrs} Hours</span>
            </div>
          </div>
        </div>

        {/* Progress & Next Task Prompt */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4">
          <div className="space-y-1.5 flex-1 max-w-md">
            <div className="flex items-center justify-between text-xs font-mono text-gray-300">
              <span>Weekly Completion</span>
              <span className="font-bold text-white">
                {completedTasks} / {currentWeek.tasks.length} Tasks ({currentWeek.completion_percentage}%)
              </span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${currentWeek.completion_percentage}%` }}
              />
            </div>
          </div>

          {nextAvailableTask && (
            <Button
              onClick={() => onOpenDetail(nextAvailableTask)}
              className="bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-semibold flex items-center gap-2 shadow-md cursor-pointer self-start sm:self-auto"
            >
              <span>Resume: {nextAvailableTask.title.slice(0, 32)}...</span>
              <ArrowRight size={14} />
            </Button>
          )}
        </div>
      </div>

      {/* Mandatory Weekly Assessment Card */}
      <div
        className={`p-6 rounded-3xl border transition-all ${
          assessmentPassed
            ? "bg-emerald-950/20 border-emerald-500/30"
            : assessmentFailed
            ? "bg-rose-950/20 border-rose-500/30"
            : "bg-indigo-950/20 border-indigo-500/30"
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span
                className={`px-2.5 py-0.5 rounded-md text-xs font-mono font-bold uppercase ${
                  assessmentPassed
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : assessmentFailed
                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                    : "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                }`}
              >
                {assessmentPassed
                  ? `PASSED · ${assessmentScore}/${totalQuestions} (${Math.round(((assessmentScore || 0) / totalQuestions) * 100)}%)`
                  : assessmentFailed
                  ? `NOT PASSED · ${assessmentScore}/${totalQuestions} (Need ${passingScore}/${totalQuestions})`
                  : "ASSESSMENT PENDING"}
              </span>
              <span className="text-xs font-mono text-gray-400">
                15 MCQs · 75% ({passingScore}/15) to Unlock Next Week
              </span>
            </div>

            <h3 className="text-lg font-display font-bold text-white flex items-center gap-2">
              <FileCheck2 size={18} className="text-indigo-400" />
              Week {currentWeek.week_number} Adaptive Assessment
            </h3>

            <p className="text-xs text-gray-300 font-body max-w-2xl">
              {assessmentPassed
                ? "Congratulations! You have verified mastery for this week's topics. Next week is unlocked."
                : assessmentFailed
                ? `You scored ${assessmentScore}/${totalQuestions}. A minimum of 75% (${passingScore}/${totalQuestions}) is required to unlock Week ${currentWeek.week_number + 1}. Retake the assessment to focus on weak topics.`
                : "Dynamic 15-question evaluation synthesized from this week's learning objectives and topics using Groq AI. Passing unlocks the next week."}
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <Button
              onClick={() => onOpenAssessment?.(currentWeek)}
              className={`px-4 py-2.5 text-xs font-semibold cursor-pointer shadow-md ${
                assessmentPassed
                  ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                  : assessmentFailed
                  ? "bg-rose-600 hover:bg-rose-500 text-white animate-pulse"
                  : "bg-[#4F46E5] hover:bg-[#4338CA] text-white"
              }`}
            >
              <HelpCircle size={14} className="mr-1.5" />
              {assessmentPassed
                ? "Review / Retake Assessment"
                : assessmentFailed
                ? "Start Adaptive Retest"
                : "Take Weekly Assessment"}
            </Button>
          </div>
        </div>
      </div>

      {/* Week Task List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-display font-bold text-white flex items-center gap-2">
            <Layers size={16} className="text-indigo-400" />
            Weekly Execution Tasks ({currentWeek.tasks.length})
          </h3>
          <span className="text-xs text-gray-400 font-mono">
            Click task to view deep syllabus, quiz & practice
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {currentWeek.tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onOpenDetail={onOpenDetail}
              onToggleComplete={onToggleComplete}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
