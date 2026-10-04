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

interface CurrentWeekFocusProps {
  currentPhase: RoadmapPhase;
  currentWeek: RoadmapWeek;
  onOpenDetail?: (task: RoadmapTask) => void;
  onToggleComplete?: (task: RoadmapTask, e: React.MouseEvent) => void;
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
  const assessmentPassed = currentWeek.assessment_status === "passed";
  const assessmentFailed = currentWeek.assessment_status === "failed";
  const assessmentScore = currentWeek.assessment_score;
  const passingScore = currentWeek.passing_score || 12;
  const totalQuestions = currentWeek.total_questions || 15;

  const handleNextWeekClick = () => {
    if (currentWeek.week_number >= totalWeeks) return;
    
    // Block if assessment not passed (75% = 12/15)
    if (!assessmentPassed) {
      if (onBlockedNextWeek) {
        onBlockedNextWeek(currentWeek.week_number, 0, true);
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
                assessmentPassed
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

        {/* Weekly Completion Progress */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4">
          <div className="space-y-1.5 flex-1 max-w-md">
            <div className="flex items-center justify-between text-xs font-mono text-gray-300">
              <span>Week {currentWeek.week_number} Progression</span>
              <span className="font-bold text-white">
                {assessmentPassed
                  ? "100% · Week Completed & Verified"
                  : assessmentFailed
                  ? `Retest Required · Score: ${assessmentScore}/15`
                  : "Assessment Required to Unlock Next Week"}
              </span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  assessmentPassed
                    ? "bg-emerald-500 w-full"
                    : assessmentFailed
                    ? "bg-rose-500 w-[35%]"
                    : "bg-indigo-500 w-[50%]"
                }`}
              />
            </div>
          </div>

          <button
            onClick={() => onOpenAssessment?.(currentWeek)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-md cursor-pointer transition-all self-start sm:self-auto ${
              assessmentPassed
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30"
                : "bg-[#4F46E5] hover:bg-[#4338CA] text-white"
            }`}
          >
            <span>{assessmentPassed ? "Assessment Passed ✓" : "Launch Weekly Assessment"}</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Mandatory Weekly Assessment Card (High Contrast, Solid Dark UI) */}
      <div
        className={`p-6 sm:p-8 rounded-3xl border-2 transition-all shadow-2xl relative overflow-hidden ${
          assessmentPassed
            ? "bg-[#0d2818] border-emerald-500/60"
            : assessmentFailed
            ? "bg-[#2d0f14] border-rose-500/60"
            : "bg-[#141432] border-indigo-500/50"
        }`}
      >
        {/* Glow accent */}
        <div
          className={`pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full blur-3xl opacity-30 ${
            assessmentPassed
              ? "bg-emerald-500"
              : assessmentFailed
              ? "bg-rose-500"
              : "bg-indigo-500"
          }`}
        />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <span
                className={`px-3 py-1 rounded-md text-xs font-mono font-bold uppercase tracking-wider shadow-sm flex items-center gap-1.5 ${
                  assessmentPassed
                    ? "bg-emerald-500 text-white"
                    : assessmentFailed
                    ? "bg-rose-600 text-white"
                    : "bg-[#4F46E5] text-white"
                }`}
              >
                {assessmentPassed ? (
                  <>
                    <CheckCircle2 size={13} />
                    PASSED · {assessmentScore}/{totalQuestions} ({Math.round(((assessmentScore || 0) / totalQuestions) * 100)}%)
                  </>
                ) : assessmentFailed ? (
                  <>
                    <AlertCircle size={13} />
                    NOT PASSED · {assessmentScore}/{totalQuestions} (Need {passingScore}/{totalQuestions})
                  </>
                ) : (
                  <>
                    <Hourglass size={13} />
                    ASSESSMENT PENDING
                  </>
                )}
              </span>

              <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-md bg-white/10 text-gray-200 border border-white/10">
                15 MCQs · 75% ({passingScore}/15) to Unlock Next Week
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-display font-bold text-white flex items-center gap-2.5">
              <FileCheck2 size={24} className="text-indigo-400 shrink-0" />
              Week {currentWeek.week_number} Adaptive Assessment
            </h3>

            <p className="text-xs sm:text-sm text-gray-200 font-body leading-relaxed max-w-2xl">
              {assessmentPassed
                ? "Congratulations! You verified competency on this week's topics. Next week is unlocked and available."
                : assessmentFailed
                ? `You scored ${assessmentScore}/${totalQuestions}. Minimum required is 75% (${passingScore}/${totalQuestions}) to advance. Click Retest to practice targeted questions on your weak topics.`
                : "Mandatory weekly evaluation synthesized from this week's learning objectives and topics using Groq AI. Passing score of 75% (12/15) is required to unlock downstream weeks."}
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-3">
            <button
              onClick={() => onOpenAssessment?.(currentWeek)}
              className={`px-6 py-3.5 rounded-xl font-display font-bold text-sm text-white shadow-xl cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 ${
                assessmentPassed
                  ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/25"
                  : assessmentFailed
                  ? "bg-rose-600 hover:bg-rose-500 shadow-rose-500/30 animate-pulse"
                  : "bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 shadow-indigo-500/30"
              }`}
            >
              <HelpCircle size={18} />
              <span>
                {assessmentPassed
                  ? "Review / Retake Assessment"
                  : assessmentFailed
                  ? "Start Adaptive Retest Now"
                  : "Take Weekly Assessment (15 Questions)"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

