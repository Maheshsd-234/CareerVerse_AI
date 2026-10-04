import React, { useState } from "react";
import {
  X,
  BookOpen,
  Code2,
  FolderGit2,
  HelpCircle,
  Briefcase,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Award,
} from "lucide-react";
import type { RoadmapTask } from "../../types/roadmapEngine.types";
import { Button } from "../ui/UI";

interface TaskDetailDrawerProps {
  task: RoadmapTask | null;
  isOpen: boolean;
  onClose: () => void;
  onCompleteTask: (taskId: string, extra?: { github_url?: string; score?: number }) => void;
  onAssessmentSubmit: (taskId: string, skillId: string, score: number) => void;
}

export const TaskDetailDrawer: React.FC<TaskDetailDrawerProps> = ({
  task,
  isOpen,
  onClose,
  onCompleteTask,
  onAssessmentSubmit,
}) => {
  if (!isOpen || !task) return null;

  // Local state for quiz answers
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);

  // Local state for GitHub evidence URL
  const [githubUrl, setGithubUrl] = useState<string>(task.github_evidence_url || "");
  const [evidenceSubmitted, setEvidenceSubmitted] = useState<boolean>(!!task.github_evidence_url);

  // Local state for expanding interview question hints
  const [expandedInterviewIdx, setExpandedInterviewIdx] = useState<number | null>(null);

  // Handle quiz answer selection
  const handleSelectOption = (qIdx: number, optIdx: number) => {
    if (quizSubmitted) return;
    setSelectedAnswers((prev) => ({ ...prev, [qIdx]: optIdx }));
  };

  // Submit quiz
  const handleQuizSubmit = () => {
    if (!task.quiz_questions || task.quiz_questions.length === 0) return;
    let correctCount = 0;
    task.quiz_questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correct_index) {
        correctCount += 1;
      }
    });

    const calculatedScore = Math.round((correctCount / task.quiz_questions.length) * 100);
    setQuizScore(calculatedScore);
    setQuizSubmitted(true);

    // Send assessment result for adaptive roadmap recalculation
    onAssessmentSubmit(task.id, task.skill_id, calculatedScore);
  };

  // Submit project evidence
  const handleSaveEvidence = () => {
    if (!githubUrl.trim()) return;
    setEvidenceSubmitted(true);
    onCompleteTask(task.id, { github_url: githubUrl });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-[#12122B] border-l border-white/10 h-full overflow-y-auto p-6 sm:p-8 flex flex-col shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-md text-xs font-mono uppercase font-bold tracking-wider bg-[#4F46E5]/20 text-indigo-300 border border-[#4F46E5]/30">
                {task.type}
              </span>
              <span className="text-xs font-mono text-gray-400 flex items-center gap-1">
                <Clock size={12} />
                {task.estimated_minutes} Minutes
              </span>
              <span className="text-xs uppercase font-mono px-2 py-0.5 rounded bg-white/5 text-gray-400">
                {task.difficulty}
              </span>
              {task.status === "completed" && (
                <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
                  <CheckCircle2 size={12} /> Completed
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-display font-bold text-white leading-tight">
              {task.title}
            </h2>
            <p className="text-xs font-mono text-indigo-400 mt-1">
              Skill Focus: {task.skill_id}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 py-6 space-y-6">
          {/* 1. Why Am I Learning This Now? */}
          <div className="bg-[#181836] rounded-2xl p-4 sm:p-5 border border-white/10">
            <h3 className="text-xs font-data font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2 mb-2">
              <Sparkles size={14} />
              Why Am I Learning This Now?
            </h3>
            <p className="text-sm text-gray-300 leading-relaxed font-body">
              {task.why_this_now ||
                "This topic is scheduled right now based on your prerequisite tree and target career requirements."}
            </p>
          </div>

          {/* 2. Prerequisites Check */}
          {task.prerequisites && task.prerequisites.length > 0 && (
            <div className="bg-white/[0.02] rounded-2xl p-4 border border-white/5">
              <h3 className="text-xs font-mono uppercase text-gray-400 mb-2 font-semibold">
                Prerequisites Required
              </h3>
              <div className="flex flex-wrap gap-2">
                {task.prerequisites.map((p, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs bg-white/5 text-gray-300 border border-white/10"
                  >
                    <CheckCircle2 size={12} className="text-emerald-400" />
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 3. Concepts Breakdown */}
          {task.concepts && task.concepts.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <BookOpen size={16} className="text-blue-400" />
                Concepts & Syllabus Breakdown
              </h3>
              <div className="space-y-2">
                {task.concepts.map((concept, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 p-3 rounded-xl bg-white/[0.03] border border-white/5 text-sm text-gray-300"
                  >
                    <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 text-xs flex items-center justify-center font-mono shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span>{concept}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Practical Practice Prompt (if practice task) */}
          {task.practice_prompt && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Code2 size={16} className="text-emerald-400" />
                Hands-On Practice Assignment
              </h3>
              <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 text-sm text-emerald-200 leading-relaxed font-body">
                {task.practice_prompt}
              </div>
            </div>
          )}

          {/* 5. Micro-Project Deliverable (if project task) */}
          {task.type === "project" && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <FolderGit2 size={16} className="text-purple-400" />
                Micro-Project Portfolio Deliverable
              </h3>
              <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/30 space-y-3">
                <p className="text-sm text-purple-200">
                  {task.project_spec?.deliverable ||
                    "Build a functional module and publish it to GitHub with automated tests and setup instructions."}
                </p>
                {task.project_spec?.rubric && (
                  <p className="text-xs text-purple-300/80 font-mono">
                    Evaluation Rubric: {task.project_spec.rubric}
                  </p>
                )}
              </div>

              {/* GitHub Evidence Submission */}
              <div className="space-y-2 pt-2">
                <label className="text-xs font-mono text-gray-300 block">
                  GitHub Repository Evidence URL:
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://github.com/your-username/project-repo"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    className="flex-1 bg-[#181836] border border-white/20 rounded-xl px-3.5 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-400"
                  />
                  <Button
                    onClick={handleSaveEvidence}
                    disabled={!githubUrl.trim()}
                    className="bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs px-4"
                  >
                    Submit Evidence
                  </Button>
                </div>
                {evidenceSubmitted && (
                  <p className="text-xs text-emerald-400 flex items-center gap-1 mt-1">
                    <CheckCircle2 size={13} /> Evidence recorded in CareerVerse transit logs.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* 6. Competency Assessment Quiz (if assessment task) */}
          {task.quiz_questions && task.quiz_questions.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <HelpCircle size={16} className="text-amber-400" />
                  Knowledge Verification Quiz
                </h3>
                {quizSubmitted && quizScore !== null && (
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-md border ${
                      quizScore >= 60
                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                        : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                    }`}
                  >
                    Score: {quizScore}% {quizScore >= 60 ? "(Passed)" : "(Needs Remediation)"}
                  </span>
                )}
              </div>

              <div className="space-y-4">
                {task.quiz_questions.map((q, qIdx) => (
                  <div
                    key={qIdx}
                    className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3"
                  >
                    <p className="text-sm font-medium text-white">
                      {qIdx + 1}. {q.question}
                    </p>
                    <div className="space-y-2">
                      {q.options.map((opt, optIdx) => {
                        const isSelected = selectedAnswers[qIdx] === optIdx;
                        const isCorrect = q.correct_index === optIdx;
                        let optStyle = "bg-white/5 border-white/10 hover:bg-white/10 text-gray-300";

                        if (quizSubmitted) {
                          if (isCorrect) {
                            optStyle = "bg-emerald-500/20 border-emerald-500 text-emerald-300 font-semibold";
                          } else if (isSelected && !isCorrect) {
                            optStyle = "bg-rose-500/20 border-rose-500 text-rose-300";
                          } else {
                            optStyle = "bg-white/5 border-white/5 opacity-50";
                          }
                        } else if (isSelected) {
                          optStyle = "bg-indigo-600/30 border-indigo-500 text-white font-medium";
                        }

                        return (
                          <button
                            key={optIdx}
                            disabled={quizSubmitted}
                            onClick={() => handleSelectOption(qIdx, optIdx)}
                            className={`w-full text-left p-3 rounded-xl border text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-between ${optStyle}`}
                          >
                            <span>{opt}</span>
                            {quizSubmitted && isCorrect && (
                              <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                    {quizSubmitted && (
                      <p className="text-xs text-gray-400 font-body pt-1 border-t border-white/5">
                        <strong className="text-gray-300">Explanation:</strong> {q.explanation}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {!quizSubmitted ? (
                <Button
                  onClick={handleQuizSubmit}
                  disabled={Object.keys(selectedAnswers).length < task.quiz_questions.length}
                  className="w-full bg-[#4F46E5] hover:bg-[#4338CA] text-white py-2.5 text-sm font-semibold"
                >
                  Submit Assessment Answers
                </Button>
              ) : quizScore !== null && quizScore < 60 ? (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  Adaptive Remediation has been automatically scheduled for this milestone.
                </div>
              ) : null}
            </div>
          )}

          {/* 7. Technical Interview Questions (if interview task) */}
          {task.interview_questions && task.interview_questions.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Briefcase size={16} className="text-rose-400" />
                Live Interview Screening Questions
              </h3>
              <div className="space-y-3">
                {task.interview_questions.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2"
                  >
                    <p className="text-sm font-medium text-white">
                      Q{idx + 1}: {item.question}
                    </p>
                    <button
                      onClick={() =>
                        setExpandedInterviewIdx(expandedInterviewIdx === idx ? null : idx)
                      }
                      className="text-xs font-mono text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                    >
                      {expandedInterviewIdx === idx ? (
                        <>
                          <ChevronUp size={12} /> Hide Model Answer Hint
                        </>
                      ) : (
                        <>
                          <ChevronDown size={12} /> Show Model Answer Hint
                        </>
                      )}
                    </button>
                    {expandedInterviewIdx === idx && (
                      <p className="text-xs text-gray-300 p-3 rounded-xl bg-white/5 border border-white/10 font-body">
                        {item.hint}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-6 border-t border-white/10 flex items-center justify-between gap-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-white/20 text-gray-300 hover:text-white text-xs"
          >
            Close
          </Button>

          {task.status !== "completed" ? (
            <div className="flex items-center gap-3">
              {task.evidence_required && (
                <>
                  {task.type === "project" && !githubUrl.trim() && !task.github_evidence_url && (
                    <span className="text-xs text-amber-400 font-mono">
                      * Enter GitHub URL to unlock
                    </span>
                  )}
                  {task.type === "assessment" && (!quizSubmitted || quizScore === null || quizScore < 60) && (
                    <span className="text-xs text-amber-400 font-mono">
                      * Pass quiz (&ge;60%) to unlock
                    </span>
                  )}
                </>
              )}

              <Button
                onClick={() => {
                  if (task.type === "project" && githubUrl.trim()) {
                    handleSaveEvidence();
                  } else if (task.type === "assessment" && quizScore !== null) {
                    onCompleteTask(task.id, { score: quizScore });
                  } else {
                    onCompleteTask(task.id);
                  }
                }}
                disabled={
                  task.evidence_required &&
                  ((task.type === "project" && !githubUrl.trim() && !task.github_evidence_url) ||
                    (task.type === "assessment" &&
                      (!quizSubmitted || quizScore === null || quizScore < 60) &&
                      (task.last_score === undefined || task.last_score < 60)))
                }
                className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold flex items-center gap-1.5"
              >
                <CheckCircle2 size={14} />
                Mark Task Completed
              </Button>
            </div>
          ) : (
            <span className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
              <CheckCircle2 size={14} /> Satisfied & Verified
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
