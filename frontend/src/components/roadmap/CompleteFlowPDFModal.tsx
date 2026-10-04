import React from "react";
import {
  X,
  Printer,
  Download,
  Calendar,
  Clock,
  CheckCircle2,
  BookOpen,
  Code2,
  FolderGit2,
  HelpCircle,
  Briefcase,
  Layers,
  Sparkles,
  Award,
} from "lucide-react";
import type { RoadmapPlan } from "../../types/roadmapEngine.types";
import { Button } from "../ui/UI";

interface CompleteFlowPDFModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: RoadmapPlan;
}

export const CompleteFlowPDFModal: React.FC<CompleteFlowPDFModalProps> = ({
  isOpen,
  onClose,
  plan,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const allWeeks = plan.phases.flatMap((p) => p.weeks);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-6 animate-in fade-in duration-200">
      <div
        className="w-full max-w-5xl bg-[#12122B] border border-white/10 rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header Bar (Hidden during Print) */}
        <div className="flex items-center justify-between gap-4 p-5 sm:p-6 border-b border-white/10 bg-[#181836]/80 print:hidden">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold bg-[#4F46E5] text-white">
                COMPLETE SYLLABUS FLOW
              </span>
              <span className="text-xs text-gray-400 font-mono">
                {plan.total_weeks} Weeks · {plan.target_timeline_months} Months
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-display font-bold text-white">
              {plan.target_role_name} Complete Learning Roadmap
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handlePrint}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
            >
              <Download size={14} />
              Download / Print PDF
            </Button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Document */}
        <div
          id="printable-complete-flow"
          className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-8 bg-[#0D0D1E] text-white print:p-0 print:m-0 print:bg-white print:text-black print:overflow-visible print:max-h-none"
        >
          {/* Document Header Banner */}
          <div className="border-b-2 border-indigo-500/30 pb-6 space-y-4 print:border-gray-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs font-mono uppercase tracking-widest text-indigo-400 print:text-indigo-700 font-bold">
                  CareerVerse AI · Engineering Education Platform
                </p>
                <h1 className="text-2xl sm:text-3xl font-display font-black text-white print:text-gray-900 mt-1">
                  {plan.target_role_name}
                </h1>
                <p className="text-sm text-gray-300 print:text-gray-600 mt-1">
                  Domain: <strong>{plan.target_role_category}</strong> · Experience Target:{" "}
                  <strong>{plan.experience_level}</strong>
                </p>
              </div>

              <div className="bg-[#181836] p-4 rounded-2xl border border-white/10 text-xs font-mono space-y-1 sm:text-right print:bg-gray-100 print:border-gray-300 print:text-gray-800">
                <p>
                  Committed Pace: <strong className="text-white print:text-gray-900">{plan.weekly_hours} hrs/week</strong>
                </p>
                <p>
                  Duration: <strong className="text-white print:text-gray-900">{plan.total_weeks} Weeks ({plan.target_timeline_months} Months)</strong>
                </p>
                <p>
                  Target Completion Date: <strong className="text-indigo-400 print:text-indigo-800">{plan.target_date}</strong>
                </p>
                <p>
                  Feasibility: <strong className="text-emerald-400 print:text-emerald-700">{plan.feasibility.headline}</strong>
                </p>
              </div>
            </div>

            {/* Feasibility Note */}
            <div className="bg-indigo-950/30 border border-indigo-500/20 p-3.5 rounded-xl text-xs text-indigo-200 print:bg-gray-50 print:border-gray-300 print:text-gray-700">
              <strong>Curriculum Feasibility Analysis:</strong> {plan.feasibility.message}
            </div>
          </div>

          {/* Skill Gaps & Focus Competencies */}
          {plan.skill_gaps && plan.skill_gaps.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-mono uppercase font-bold text-gray-400 print:text-gray-700 flex items-center gap-2">
                <Layers size={14} className="text-indigo-400" />
                Target Competencies & Skill Gaps
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {plan.skill_gaps.map((gap, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-[#181836] border border-white/10 print:border-gray-300 print:bg-gray-50 text-xs"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-white print:text-gray-900">{gap.skill}</span>
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white/5 print:bg-gray-200 text-indigo-300 print:text-indigo-800">
                        {gap.priority}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 print:text-gray-600">
                      Baseline: {gap.current_level}% → Target: {gap.target_level}% (Gap: {gap.gap_size}pts)
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Complete Week-by-Week Breakdown */}
          <div className="space-y-8">
            <h3 className="text-base font-display font-bold text-white print:text-gray-900 flex items-center gap-2 border-b border-white/10 pb-3">
              <Calendar size={18} className="text-indigo-400" />
              Complete Week-by-Week Execution Syllabus ({allWeeks.length} Weeks)
            </h3>

            {plan.phases.map((phase) => (
              <div key={phase.id} className="space-y-5">
                {/* Phase Banner */}
                <div className="bg-[#181836] p-4 rounded-2xl border-l-4 border-indigo-500 border border-white/10 print:border-gray-400 print:bg-gray-100">
                  <span className="text-[11px] font-mono uppercase font-bold text-indigo-400 print:text-indigo-700">
                    Phase 0{phase.phase_number}
                  </span>
                  <h4 className="text-base font-bold text-white print:text-gray-900">
                    {phase.title}
                  </h4>
                  <p className="text-xs text-gray-300 print:text-gray-600 mt-1 font-body">
                    {phase.description}
                  </p>
                </div>

                {/* Weeks in this Phase */}
                <div className="space-y-4 pl-0 sm:pl-4">
                  {phase.weeks.map((week) => (
                    <div
                      key={week.id}
                      className="p-5 rounded-2xl bg-[#14142F] border border-white/10 space-y-4 print:border-gray-300 print:bg-white print:break-inside-avoid shadow-sm"
                    >
                      {/* Week Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#4F46E5] text-white">
                              WEEK {week.week_number}
                            </span>
                            <h5 className="text-sm sm:text-base font-bold text-white print:text-gray-900">
                              {week.title}
                            </h5>
                          </div>
                          <p className="text-xs text-indigo-400 print:text-indigo-700 mt-0.5 font-mono">
                            Language & Skill Focus: <strong>{week.primary_skill}</strong>
                          </p>
                        </div>
                        <span className="text-xs font-mono text-gray-400 print:text-gray-600 shrink-0">
                          {week.estimated_hours} Hours Allocated
                        </span>
                      </div>

                      {/* Granular Tasks Breakdown */}
                      <div className="grid grid-cols-1 gap-3">
                        {week.tasks.map((task) => (
                          <div
                            key={task.id}
                            className="p-3.5 rounded-xl bg-[#181836] border border-white/5 print:border-gray-200 print:bg-gray-50 space-y-2 text-xs"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold bg-white/5 print:bg-gray-200 text-indigo-300 print:text-indigo-900 border border-white/10">
                                  {task.type}
                                </span>
                                <span className="font-semibold text-white print:text-gray-900">
                                  {task.title}
                                </span>
                              </div>
                              <span className="font-mono text-gray-400 print:text-gray-600 text-[11px]">
                                {task.estimated_minutes} mins
                              </span>
                            </div>

                            {/* Concepts */}
                            {task.concepts && task.concepts.length > 0 && (
                              <div className="space-y-1 pt-1">
                                <p className="font-mono text-[10px] text-gray-400 uppercase">
                                  Key Concepts to Learn:
                                </p>
                                <ul className="list-disc list-inside text-gray-300 print:text-gray-700 space-y-0.5">
                                  {task.concepts.map((c, cIdx) => (
                                    <li key={cIdx}>{c}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Practice Prompt */}
                            {task.practice_prompt && (
                              <div className="space-y-1 pt-1">
                                <p className="font-mono text-[10px] text-emerald-400 print:text-emerald-700 uppercase font-bold">
                                  Code Lab Practice Exercise:
                                </p>
                                <p className="text-gray-300 print:text-gray-700 font-mono bg-black/30 print:bg-gray-100 p-2 rounded-lg">
                                  {task.practice_prompt}
                                </p>
                              </div>
                            )}

                            {/* Micro-Project */}
                            {task.type === "project" && (
                              <div className="space-y-1 pt-1">
                                <p className="font-mono text-[10px] text-purple-400 print:text-purple-700 uppercase font-bold">
                                  Portfolio Deliverable (Evidence Required):
                                </p>
                                <p className="text-gray-300 print:text-gray-700">
                                  {task.project_spec?.deliverable || "Public GitHub repository with automated tests and documentation."}
                                </p>
                              </div>
                            )}

                            {/* Assessment Quiz Question */}
                            {task.quiz_questions && task.quiz_questions.length > 0 && (
                              <div className="space-y-1 pt-1">
                                <p className="font-mono text-[10px] text-amber-400 print:text-amber-700 uppercase font-bold">
                                  Knowledge Check Diagnostic Question:
                                </p>
                                <p className="font-medium text-white print:text-gray-900">
                                  {task.quiz_questions[0].question}
                                </p>
                                <p className="text-gray-400 print:text-gray-600 text-[11px]">
                                  Correct Answer: <strong className="text-emerald-400 print:text-emerald-700">{task.quiz_questions[0].options[task.quiz_questions[0].correct_index]}</strong> — {task.quiz_questions[0].explanation}
                                </p>
                              </div>
                            )}

                            {/* Interview Screening */}
                            {task.interview_questions && task.interview_questions.length > 0 && (
                              <div className="space-y-1 pt-1">
                                <p className="font-mono text-[10px] text-rose-400 print:text-rose-700 uppercase font-bold">
                                  Technical Interview Screening Round:
                                </p>
                                <p className="font-medium text-white print:text-gray-900">
                                  "{task.interview_questions[0].question}"
                                </p>
                                <p className="text-gray-400 print:text-gray-600 text-[11px]">
                                  Hiring Rubric / Hint: {task.interview_questions[0].hint}
                                </p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer Note */}
          <div className="pt-6 border-t border-white/10 text-center text-xs text-gray-500 print:text-gray-600 font-mono">
            Generated by CareerVerse AI Deterministic Engine · Empowering Indian Engineering Students with Industry Mastery
          </div>
        </div>
      </div>
    </div>
  );
};
