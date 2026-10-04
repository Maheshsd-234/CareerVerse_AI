import React, { useState, useEffect } from "react";
import {
  X,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Sparkles,
  Clock,
  Award,
  RotateCcw,
  ArrowRight,
  ArrowLeft,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Brain,
  Layers,
} from "lucide-react";
import { Button } from "../ui/UI";
import { dynamicRoadmapService } from "../../services/dynamicRoadmapService";
import type {
  RoadmapPlan,
  RoadmapWeek,
  WeeklyAssessment,
  AssessmentSubmissionResult,
} from "../../types/roadmapEngine.types";

interface WeeklyAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  week: RoadmapWeek;
  plan: RoadmapPlan;
  onAssessmentCompleted: (result: AssessmentSubmissionResult) => void;
}

export const WeeklyAssessmentModal: React.FC<WeeklyAssessmentModalProps> = ({
  isOpen,
  onClose,
  week,
  plan,
  onAssessmentCompleted,
}) => {
  const [assessment, setAssessment] = useState<WeeklyAssessment | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [result, setResult] = useState<AssessmentSubmissionResult | null>(null);
  const [showRemediationDetails, setShowRemediationDetails] = useState<boolean>(false);
  const [expandedExplanationId, setExpandedExplanationId] = useState<string | null>(null);

  // Initialize and generate assessment
  useEffect(() => {
    if (!isOpen) {
      setAssessment(null);
      setResult(null);
      setSelectedAnswers({});
      setActiveQuestionIndex(0);
      return;
    }

    let isMounted = true;

    const fetchAssessment = async () => {
      setLoading(true);
      setError(null);
      try {
        const topics = week.topics && week.topics.length > 0
          ? week.topics
          : [week.primary_skill];

        const generated = await dynamicRoadmapService.generateWeeklyAssessment({
          roadmapId: plan.id,
          weekId: week.id,
          weekNumber: week.week_number,
          role: plan.target_role_name,
          userLevel: plan.experience_level,
          topics,
          learningObjectives: week.learning_objectives,
        });

        if (isMounted) {
          setAssessment(generated);
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to generate assessment:", err);
        if (isMounted) {
          setError("Failed to generate 15-question assessment. Please retry.");
          setLoading(false);
        }
      }
    };

    fetchAssessment();

    return () => {
      isMounted = false;
    };
  }, [isOpen, week.id, plan.id]);

  if (!isOpen) return null;

  const questions = assessment?.questions || [];
  const currentQ = questions[activeQuestionIndex];
  const totalQuestions = questions.length || 15;
  const answeredCount = Object.keys(selectedAnswers).length;

  const handleSelectOption = (qId: string, optIdx: number) => {
    if (result) return;
    setSelectedAnswers((prev) => ({ ...prev, [qId]: optIdx }));
  };

  const handleSubmit = async () => {
    if (!assessment) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await dynamicRoadmapService.submitWeeklyAssessment({
        assessmentId: assessment.id,
        weekId: week.id,
        roadmap: plan,
        answers: selectedAnswers,
      });
      setResult(res);
      onAssessmentCompleted(res);
    } catch (err) {
      console.error("Submission failed:", err);
      setError("Failed to evaluate submission. Please check connection and retry.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetest = async () => {
    if (!assessment || !result) return;
    setLoading(true);
    setResult(null);
    setSelectedAnswers({});
    setActiveQuestionIndex(0);
    setError(null);
    try {
      const retested = await dynamicRoadmapService.retestWeeklyAssessment({
        assessmentId: assessment.id,
        weekId: week.id,
        roadmap: plan,
        role: plan.target_role_name,
        userLevel: plan.experience_level,
        weekNumber: week.week_number,
        topics: week.topics || [week.primary_skill],
        weakTopics: result.weak_topics || [],
      });
      setAssessment(retested);
    } catch (err) {
      console.error("Failed to generate retest:", err);
      setError("Failed to synthesize retest. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div
        className="w-full max-w-4xl bg-[#12122B] border border-white/15 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-5 sm:p-6 border-b border-white/10 flex items-center justify-between bg-[#181836] shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-[#4F46E5] text-white">
                WEEK {week.week_number} ASSESSMENT
              </span>
              <span className="text-xs text-gray-400 font-mono">
                15 Questions · Pass Threshold: 75% (12/15)
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-display font-bold text-white">
              {week.title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-6">
          {/* Loading State */}
          {loading && (
            <div className="py-20 text-center space-y-4">
              <div className="w-14 h-14 rounded-full border-3 border-indigo-500 border-t-transparent animate-spin mx-auto" />
              <h3 className="text-lg font-bold text-white flex items-center justify-center gap-2">
                <Sparkles className="text-amber-400" size={18} />
                Synthesizing Dynamic 15-Question Assessment via Groq LPU...
              </h3>
              <p className="text-xs text-gray-400 max-w-md mx-auto font-mono">
                Targeting Week {week.week_number} syllabus topics: {week.topics?.slice(0, 3).join(", ")}...
              </p>
            </div>
          )}

          {/* Error State */}
          {!loading && error && (
            <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm space-y-3">
              <div className="flex items-center gap-2 font-bold">
                <AlertTriangle size={18} />
                Generation Error
              </div>
              <p className="text-xs text-gray-300">{error}</p>
              <Button
                onClick={() => {
                  setLoading(true);
                  setError(null);
                  dynamicRoadmapService
                    .generateWeeklyAssessment({
                      roadmapId: plan.id,
                      weekId: week.id,
                      weekNumber: week.week_number,
                      role: plan.target_role_name,
                      userLevel: plan.experience_level,
                      topics: week.topics || [week.primary_skill],
                      learningObjectives: week.learning_objectives,
                    })
                    .then((g) => {
                      setAssessment(g);
                      setLoading(false);
                    })
                    .catch((e) => {
                      setError("Retry failed. Please check Groq connection.");
                      setLoading(false);
                    });
                }}
                className="bg-rose-600 hover:bg-rose-500 text-white text-xs px-4"
              >
                Retry Assessment
              </Button>
            </div>
          )}

          {/* Active Assessment Flow (Before Submit) */}
          {!loading && !error && assessment && !result && currentQ && (
            <div className="space-y-6">
              {/* Question Navigation Bar (15 numbered pills) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-gray-400">
                  <span>Questions Progress</span>
                  <span className="text-white font-semibold">
                    {answeredCount} of {totalQuestions} Answered
                  </span>
                </div>
                <div className="grid grid-cols-5 sm:grid-cols-15 gap-1.5">
                  {questions.map((q, idx) => {
                    const isAnswered = selectedAnswers[q.id] !== undefined;
                    const isCurrent = idx === activeQuestionIndex;
                    return (
                      <button
                        key={q.id}
                        onClick={() => setActiveQuestionIndex(idx)}
                        className={`h-9 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
                          isCurrent
                            ? "bg-indigo-600 text-white ring-2 ring-indigo-400"
                            : isAnswered
                            ? "bg-indigo-950/60 text-indigo-300 border border-indigo-500/40"
                            : "bg-white/5 text-gray-400 hover:bg-white/10"
                        }`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Current Question Card */}
              <div className="bg-[#181836] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6">
                {/* Meta Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-gray-400">
                      Question {activeQuestionIndex + 1} of {totalQuestions}
                    </span>
                    <span
                      className={`text-[11px] font-mono uppercase font-bold px-2 py-0.5 rounded ${
                        currentQ.difficulty === "easy"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : currentQ.difficulty === "hard"
                          ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      }`}
                    >
                      {currentQ.difficulty}
                    </span>
                  </div>

                  <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-md border border-indigo-500/20">
                    Topic: {currentQ.topicId}
                  </span>
                </div>

                {/* Question Text */}
                <h3 className="text-base sm:text-lg font-medium text-white leading-relaxed">
                  {currentQ.question}
                </h3>

                {/* 4 Options */}
                <div className="space-y-3">
                  {currentQ.options.map((opt, optIdx) => {
                    const isSelected = selectedAnswers[currentQ.id] === optIdx;
                    return (
                      <button
                        key={optIdx}
                        onClick={() => handleSelectOption(currentQ.id, optIdx)}
                        className={`w-full text-left p-4 rounded-xl border text-sm transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? "bg-indigo-600/20 border-indigo-500 text-white font-medium shadow-md shadow-indigo-500/10"
                            : "bg-white/[0.03] border-white/10 hover:bg-white/10 text-gray-300"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs font-bold ${
                              isSelected
                                ? "bg-indigo-500 text-white"
                                : "bg-white/10 text-gray-400"
                            }`}
                          >
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span>{opt}</span>
                        </div>
                        {isSelected && (
                          <div className="w-2.5 h-2.5 rounded-full bg-indigo-400 shadow-sm shadow-indigo-400/50 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Navigation Buttons */}
              <div className="flex items-center justify-between pt-2">
                <Button
                  onClick={() => setActiveQuestionIndex((prev) => Math.max(0, prev - 1))}
                  disabled={activeQuestionIndex === 0}
                  className="bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 text-xs px-4"
                >
                  <ArrowLeft size={14} className="mr-1.5" />
                  Previous
                </Button>

                <div className="flex items-center gap-3">
                  {activeQuestionIndex < totalQuestions - 1 ? (
                    <Button
                      onClick={() => setActiveQuestionIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
                      className="bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs px-5 font-semibold"
                    >
                      Next
                      <ArrowRight size={14} className="ml-1.5" />
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSubmit}
                      disabled={isSubmitting || answeredCount < totalQuestions}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-6 font-bold shadow-lg shadow-emerald-600/30"
                    >
                      {isSubmitting ? (
                        "Evaluating Assessment..."
                      ) : answeredCount < totalQuestions ? (
                        `Answer All (${totalQuestions - answeredCount} Left)`
                      ) : (
                        "Submit 15 Questions"
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Results Screen (After Submit) */}
          {!loading && result && (
            <div className="space-y-8 animate-in fade-in duration-300">
              {/* Verdict Card */}
              <div
                className={`p-6 sm:p-8 rounded-3xl border text-center space-y-4 ${
                  result.passed
                    ? "bg-emerald-950/20 border-emerald-500/40"
                    : "bg-rose-950/20 border-rose-500/40"
                }`}
              >
                <div className="inline-flex p-3 rounded-full bg-white/5 border border-white/10 mb-1">
                  {result.passed ? (
                    <CheckCircle2 size={44} className="text-emerald-400" />
                  ) : (
                    <XCircle size={44} className="text-rose-400" />
                  )}
                </div>

                <div className="space-y-1">
                  <h3 className="text-2xl sm:text-3xl font-display font-bold text-white">
                    {result.score} / {result.total_questions} ({result.percentage}%)
                  </h3>
                  <p
                    className={`text-sm font-mono font-bold tracking-wider uppercase ${
                      result.passed ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {result.passed
                      ? "PASSED ✓ · NEXT WEEK UNLOCKED"
                      : "ASSESSMENT NOT PASSED · NEXT WEEK LOCKED"}
                  </p>
                  <p className="text-xs text-gray-400 font-mono">
                    Required to Pass: 75% ({result.passing_score} / {result.total_questions})
                  </p>
                </div>

                {!result.passed && (
                  <p className="text-xs sm:text-sm text-rose-200 max-w-md mx-auto">
                    You need {result.passing_score - result.score} more correct answer
                    {result.passing_score - result.score > 1 ? "s" : ""} to unlock Week{" "}
                    {week.week_number + 1}. Complete the recommended review below and retake the
                    assessment.
                  </p>
                )}
              </div>

              {/* Difficulty Breakdown & Topic Performance */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Difficulty Breakdown */}
                <div className="bg-[#181836] border border-white/10 rounded-2xl p-5 space-y-3">
                  <h4 className="text-xs font-mono uppercase text-gray-400 font-semibold">
                    Score by Difficulty
                  </h4>
                  <div className="space-y-2">
                    {Object.entries(result.difficulty_breakdown).map(([diff, stats]) => (
                      <div key={diff} className="flex items-center justify-between text-xs">
                        <span className="capitalize font-mono text-gray-300">{diff}</span>
                        <span className="font-mono font-bold text-white">
                          {stats.correct} / {stats.total} (
                          {Math.round((stats.correct / Math.max(1, stats.total)) * 100)}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Topic Performance */}
                <div className="bg-[#181836] border border-white/10 rounded-2xl p-5 space-y-3">
                  <h4 className="text-xs font-mono uppercase text-gray-400 font-semibold">
                    Topic Performance
                  </h4>
                  <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                    {Object.entries(result.topic_performance).map(([topic, stats]) => (
                      <div key={topic} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-300 truncate max-w-[200px]">{topic}</span>
                          <span
                            className={`font-mono font-bold ${
                              stats.percentage >= 70 ? "text-emerald-400" : "text-amber-400"
                            }`}
                          >
                            {stats.percentage}%
                          </span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              stats.percentage >= 70 ? "bg-emerald-500" : "bg-amber-500"
                            }`}
                            style={{ width: `${stats.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Remediation Panel if Failed */}
              {!result.passed && result.remediation && (
                <div className="bg-amber-950/20 border border-amber-500/30 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-amber-300 flex items-center gap-2">
                      <Brain size={16} />
                      Recommended Remediation & Review
                    </h4>
                    <span className="text-xs font-mono text-amber-400/80">
                      Weak Areas Identified ({result.weak_topics.length})
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {result.weak_topics.map((t, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg text-xs font-mono bg-amber-500/20 text-amber-200 border border-amber-500/40"
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  <div className="space-y-2 text-xs text-gray-300">
                    {result.remediation.action_steps.map((step, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <span className="w-4 h-4 rounded-full bg-amber-500/30 text-amber-300 flex items-center justify-center shrink-0 mt-0.5 font-mono text-[10px]">
                          {idx + 1}
                        </span>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* In-Depth Question Review Section */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                  <BookOpen size={16} className="text-indigo-400" />
                  15-Question Review & Comprehensive Explanations
                </h4>

                <div className="space-y-3">
                  {result.questions_review.map((q, idx) => {
                    const isExpanded = expandedExplanationId === q.id;
                    return (
                      <div
                        key={q.id}
                        className={`p-4 rounded-2xl border transition-all ${
                          q.is_correct
                            ? "bg-emerald-950/10 border-emerald-500/20"
                            : "bg-rose-950/10 border-rose-500/20"
                        }`}
                      >
                        <div
                          className="flex items-start justify-between gap-3 cursor-pointer"
                          onClick={() =>
                            setExpandedExplanationId(isExpanded ? null : q.id)
                          }
                        >
                          <div className="flex items-start gap-2.5">
                            {q.is_correct ? (
                              <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                            ) : (
                              <XCircle size={16} className="text-rose-400 shrink-0 mt-0.5" />
                            )}
                            <div>
                              <p className="text-xs font-mono text-gray-400 mb-0.5">
                                Q{idx + 1} · {q.topic}
                              </p>
                              <p className="text-sm text-white font-medium leading-relaxed">
                                {q.question}
                              </p>
                            </div>
                          </div>

                          <button className="text-gray-400 hover:text-white p-1">
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        </div>

                        {/* Expandable Explanation & Options */}
                        {isExpanded && (
                          <div className="mt-4 pt-3 border-t border-white/10 space-y-3 text-xs">
                            <div className="space-y-1.5">
                              {q.options.map((opt, optIdx) => {
                                const isUser = q.user_answer === optIdx;
                                const isCorr = q.correct_answer === optIdx;
                                let optCls = "bg-white/5 border-white/10 text-gray-400";
                                if (isCorr) {
                                  optCls = "bg-emerald-500/20 border-emerald-500/40 text-emerald-300 font-semibold";
                                } else if (isUser && !isCorr) {
                                  optCls = "bg-rose-500/20 border-rose-500/40 text-rose-300";
                                }
                                return (
                                  <div
                                    key={optIdx}
                                    className={`p-2.5 rounded-lg border flex items-center justify-between ${optCls}`}
                                  >
                                    <span>
                                      {String.fromCharCode(65 + optIdx)}. {opt}
                                    </span>
                                    {isCorr && (
                                      <span className="font-mono text-[10px] uppercase font-bold text-emerald-400">
                                        Correct Answer
                                      </span>
                                    )}
                                    {isUser && !isCorr && (
                                      <span className="font-mono text-[10px] uppercase font-bold text-rose-400">
                                        Your Choice
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>

                            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 space-y-1">
                              <span className="font-semibold text-indigo-300 block">
                                Technical Explanation:
                              </span>
                              <p className="text-gray-300 leading-relaxed font-body">
                                {q.explanation}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons in Result View */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-white/10">
                <Button
                  onClick={onClose}
                  className="bg-white/10 hover:bg-white/15 text-white text-xs px-4"
                >
                  Close Assessment
                </Button>

                {!result.passed ? (
                  <Button
                    onClick={handleRetest}
                    className="bg-amber-600 hover:bg-amber-500 text-white text-xs px-6 font-bold flex items-center gap-2 shadow-lg shadow-amber-600/20"
                  >
                    <RotateCcw size={14} />
                    Retake Dynamic Retest (Weak Topics Biased)
                  </Button>
                ) : (
                  <Button
                    onClick={onClose}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-6 font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/30"
                  >
                    <span>Proceed to Next Week</span>
                    <ArrowRight size={14} />
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
