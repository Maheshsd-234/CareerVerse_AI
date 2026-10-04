import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Sparkles,
  MapPin,
  Calendar,
  Clock,
  Layers,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Download,
  Sliders,
  Compass,
  RefreshCw,
  Award,
} from "lucide-react";
import { Button } from "../../components/ui/UI";
import { roles } from "../../data/roles";
import { useAuth } from "../../hooks/useAuth";
import { dynamicRoadmapService } from "../../services/dynamicRoadmapService";
import type {
  RoadmapPlan,
  RoadmapTask,
  RoadmapCreationParams,
} from "../../types/roadmapEngine.types";

import { RoadmapHeader } from "../../components/roadmap/RoadmapHeader";
import { CurrentWeekFocus } from "../../components/roadmap/CurrentWeekFocus";
import { RoadmapTimelineView } from "../../components/roadmap/RoadmapTimelineView";
import { SkillGapPanel } from "../../components/roadmap/SkillGapPanel";
import { SkillGraphView } from "../../components/roadmap/SkillGraphView";
import { TaskDetailDrawer } from "../../components/roadmap/TaskDetailDrawer";
import { WhatIfSimulator } from "../../components/roadmap/WhatIfSimulator";
import { RoadmapCreationWizard } from "../../components/roadmap/RoadmapCreationWizard";
import { AdaptiveNoticeBanner } from "../../components/roadmap/AdaptiveNoticeBanner";
import { NaturalLanguageBar } from "../../components/roadmap/NaturalLanguageBar";
import { BlockedWeekModal } from "../../components/roadmap/BlockedWeekModal";
import { CompleteFlowPDFModal } from "../../components/roadmap/CompleteFlowPDFModal";
import { WeeklyAssessmentModal } from "../../components/roadmap/WeeklyAssessmentModal";
import type { RoadmapWeek, AssessmentSubmissionResult } from "../../types/roadmapEngine.types";

export const RoadmapPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const roleFromUrl = searchParams.get("role");
  const { user, appUser } = useAuth();

  const userId = user?.uid || appUser?.uid || "guest_user";
  const preferredRoleId = roleFromUrl || appUser?.selectedCareer || "software-engineer";

  // Core State
  const [plan, setPlan] = useState<RoadmapPlan | null>(null);
  const [activeWeekNumber, setActiveWeekNumber] = useState<number>(1);
  const [activeView, setActiveView] = useState<"weekly" | "timeline" | "gaps" | "graph">("weekly");
  const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<RoadmapTask | null>(null);

  // Modals & Panels
  const [isSimulatorOpen, setIsSimulatorOpen] = useState<boolean>(false);
  const [isWizardOpen, setIsWizardOpen] = useState<boolean>(false);
  const [isBlockedModalOpen, setIsBlockedModalOpen] = useState<boolean>(false);
  const [isCompleteFlowModalOpen, setIsCompleteFlowModalOpen] = useState<boolean>(false);
  const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState<boolean>(false);
  const [activeAssessmentWeek, setActiveAssessmentWeek] = useState<RoadmapWeek | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [copilotLoading, setCopilotLoading] = useState<boolean>(false);

  // Load existing plan or initialize default
  useEffect(() => {
    let isCancelled = false;

    const loadInitialPlan = async () => {
      setIsLoading(true);
      const existing = await dynamicRoadmapService.getActivePlan(userId);

      if (!isCancelled) {
        if (existing && (!roleFromUrl || existing.target_role_id === roleFromUrl)) {
          setPlan(existing);
          // Set active week to first non-completed week
          const allWeeks = existing.phases.flatMap((p) => p.weeks);
          const firstIncomplete = allWeeks.find((w) => w.completion_percentage < 100);
          if (firstIncomplete) {
            setActiveWeekNumber(firstIncomplete.week_number);
          }
        } else {
          // Generate default personalized roadmap based on profile
          const initialPlan = await dynamicRoadmapService.generatePlan({
            userId,
            targetRoleId: preferredRoleId,
            experienceLevel: "Beginner",
            weeklyHours: 10,
            targetTimelineMonths: 6,
            learningPreference: "Balanced",
            goal: "First Job",
            knownSkills: appUser?.skills || [],
            assessmentScores: appUser?.assessmentScore ? { general: appUser.assessmentScore } : {},
          });
          if (!isCancelled) {
            setPlan(initialPlan);
          }
        }
        setIsLoading(false);
      }
    };

    loadInitialPlan();
    return () => {
      isCancelled = true;
    };
  }, [userId, preferredRoleId, appUser]);

  // Active Phase & Week based on activeWeekNumber
  const { currentPhase, currentWeek } = useMemo(() => {
    if (!plan) return { currentPhase: null, currentWeek: null };
    for (const phase of plan.phases) {
      const match = phase.weeks.find((w) => w.week_number === activeWeekNumber);
      if (match) {
        return { currentPhase: phase, currentWeek: match };
      }
    }
    const defaultPhase = plan.phases[0] || null;
    const defaultWeek = defaultPhase?.weeks[0] || null;
    return { currentPhase: defaultPhase, currentWeek: defaultWeek };
  }, [plan, activeWeekNumber]);

  // Handle task complete toggle
  const handleToggleComplete = async (task: RoadmapTask, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!plan || task.status === "locked") return;

    const newStatus = task.status === "completed" ? "available" : "completed";
    const updated = await dynamicRoadmapService.adaptPlan(plan, "task_completed", {
      task_id: task.id,
      status: newStatus,
    });
    setPlan(updated);

    if (selectedTaskForDetail?.id === task.id) {
      setSelectedTaskForDetail((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
  };

  // Complete task from detail drawer
  const handleCompleteTask = async (taskId: string, extra?: { github_url?: string; score?: number }) => {
    if (!plan) return;
    const updated = await dynamicRoadmapService.adaptPlan(plan, "task_completed", {
      task_id: taskId,
      ...extra,
    });
    setPlan(updated);

    if (selectedTaskForDetail?.id === taskId) {
      setSelectedTaskForDetail((prev) => (prev ? { ...prev, status: "completed", ...extra } : null));
    }
  };

  // Handle quiz assessment submission from drawer
  const handleAssessmentSubmit = async (taskId: string, skillId: string, score: number) => {
    if (!plan) return;
    const updated = await dynamicRoadmapService.adaptPlan(plan, "assessment_result", {
      task_id: taskId,
      skill_id: skillId,
      score,
    });
    setPlan(updated);

    if (selectedTaskForDetail?.id === taskId) {
      setSelectedTaskForDetail((prev) =>
        prev
          ? {
              ...prev,
              last_score: score,
              status: score >= 60 ? "completed" : "needs_review",
            }
          : null
      );
    }
  };

  // Apply What-If simulation parameters
  const handleApplySimulator = async (
    newWeeklyHours: number,
    newTargetDate?: string,
    newMvcpMode?: boolean
  ) => {
    if (!plan) return;
    setIsLoading(true);
    const updated = await dynamicRoadmapService.generatePlan({
      userId,
      targetRoleId: plan.target_role_id,
      experienceLevel: plan.experience_level,
      weeklyHours: newWeeklyHours,
      targetDate: newTargetDate,
      learningPreference: plan.learning_preference,
      goal: plan.goal,
      currentRole: plan.current_role,
      knownSkills: appUser?.skills || [],
      mvcpMode: newMvcpMode !== undefined ? newMvcpMode : plan.mvcp_mode,
      specialization: plan.specialization,
    });
    setPlan(updated);
    setIsLoading(false);
  };

  // Handle New Roadmap from Wizard
  const handleCreateRoadmap = async (params: RoadmapCreationParams) => {
    setIsLoading(true);
    const newPlan = await dynamicRoadmapService.generatePlan({
      ...params,
      userId,
      knownSkills: appUser?.skills || [],
      assessmentScores: appUser?.assessmentScore ? { general: appUser.assessmentScore } : {},
    });
    setPlan(newPlan);
    setActiveWeekNumber(1);
    setIsLoading(false);
  };

  // Handle Natural Language Commands
  const handleNaturalLanguageCommand = async (commandText: string) => {
    if (!plan) return;
    setCopilotLoading(true);
    const interpretation = await dynamicRoadmapService.interpretCommand(commandText, plan);

    if (interpretation.action === "update_weekly_hours") {
      const newHours = Number(interpretation.value);
      await handleApplySimulator(newHours);
    } else if (interpretation.action === "toggle_mvcp") {
      await handleApplySimulator(plan.weekly_hours, plan.target_date, true);
    } else if (interpretation.action === "update_preference") {
      const newPref = String(interpretation.value);
      const updated = await dynamicRoadmapService.generatePlan({
        userId,
        targetRoleId: plan.target_role_id,
        experienceLevel: plan.experience_level,
        weeklyHours: plan.weekly_hours,
        targetDate: plan.target_date,
        learningPreference: newPref,
        goal: plan.goal,
        currentRole: plan.current_role,
        knownSkills: appUser?.skills || [],
        mvcpMode: plan.mvcp_mode,
        specialization: plan.specialization,
      });
      setPlan(updated);
    } else if (interpretation.action === "mark_skill_known") {
      const skillToSkip = String(interpretation.value);
      const currentKnown = [...(appUser?.skills || []), skillToSkip];
      const updated = await dynamicRoadmapService.generatePlan({
        userId,
        targetRoleId: plan.target_role_id,
        experienceLevel: plan.experience_level,
        weeklyHours: plan.weekly_hours,
        targetDate: plan.target_date,
        learningPreference: plan.learning_preference,
        goal: plan.goal,
        currentRole: plan.current_role,
        knownSkills: currentKnown,
        mvcpMode: plan.mvcp_mode,
        specialization: plan.specialization,
      });
      setPlan(updated);
    }
    setCopilotLoading(false);
  };

  // Export as PDF / Print
  const handleExportPDF = () => {
    setIsCompleteFlowModalOpen(true);
  };

  // Handle Opening Weekly Assessment Modal
  const handleOpenAssessment = (week: RoadmapWeek) => {
    setActiveAssessmentWeek(week);
    setIsAssessmentModalOpen(true);
  };

  // Handle Assessment Submission Result
  const handleAssessmentCompleted = (result: AssessmentSubmissionResult) => {
    if (!plan || !activeAssessmentWeek) return;
    const isPassed = result.passed || (result as any).status === "passed";

    const updatedPhases = plan.phases.map((phase) => ({
      ...phase,
      weeks: phase.weeks.map((w) => {
        if (w.id === activeAssessmentWeek.id) {
          return {
            ...w,
            assessment_status: (isPassed ? "passed" : "failed") as "passed" | "failed",
            assessment_score: result.score,
          };
        }
        // Unlock next week if passed
        if (isPassed && w.week_number === activeAssessmentWeek.week_number + 1) {
          return {
            ...w,
            status: "in_progress" as const,
          };
        }
        return w;
      }),
    }));

    // Increment evidence-based mastery
    const newMastery = isPassed
      ? Math.min(100, Math.round(plan.careerverse_skill_mastery_pct + Math.max(3, 100 / plan.total_weeks)))
      : plan.careerverse_skill_mastery_pct;

    setPlan({
      ...plan,
      phases: updatedPhases,
      careerverse_skill_mastery_pct: newMastery,
    });
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 print:p-0 print:m-0 print:max-w-full">
      {/* ========================================================================= */}
      {/* 1. PRINT-ONLY HEADER (Vector PDF stylesheet layout) */}
      {/* ========================================================================= */}
      {plan && (
        <div className="hidden print:block border-b-2 border-gray-900 pb-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                CareerVerse AI · Personalized Career Roadmap
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Target Track: <strong className="text-gray-900">{plan.target_role_name}</strong> ({plan.target_role_category})
              </p>
            </div>
            <div className="text-right text-xs text-gray-500">
              <p>Pace: {plan.weekly_hours} hrs/week</p>
              <p>Target Date: {plan.target_date}</p>
              <p>Engine: {plan.engine_version}</p>
              <p>Generated: {new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="bg-[#12122B] border border-white/10 rounded-3xl p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mx-auto" />
          <h3 className="text-lg font-bold text-white">
            Synthesizing Deterministic Skill Roadmap...
          </h3>
          <p className="text-xs text-gray-400 max-w-md mx-auto">
            Resolving NetworkX dependency graph, checking verified profile competencies, and calculating timeline capacity.
          </p>
        </div>
      )}

      {/* Main Roadmap Content */}
      {!isLoading && plan && (
        <div className="space-y-8">
          {/* Adaptive Engine Notice Banner */}
          {plan.latest_adaptation && (
            <AdaptiveNoticeBanner
              notice={plan.latest_adaptation}
              onDismiss={() => {
                const copy = { ...plan };
                delete copy.latest_adaptation;
                setPlan(copy);
              }}
            />
          )}

          {/* Interactive Header & Gauges */}
          <RoadmapHeader
            plan={plan}
            onOpenSimulator={() => setIsSimulatorOpen(true)}
            onOpenWizard={() => setIsWizardOpen(true)}
            onExportPDF={handleExportPDF}
            onToggleView={setActiveView}
            activeView={activeView}
          />

          {/* View Modes */}
          {activeView === "weekly" && currentPhase && currentWeek && (
            <CurrentWeekFocus
              currentPhase={currentPhase}
              currentWeek={currentWeek}
              onOpenDetail={(task) => setSelectedTaskForDetail(task)}
              onToggleComplete={handleToggleComplete}
              onSelectWeek={(wNum) => setActiveWeekNumber(wNum)}
              totalWeeks={plan.total_weeks}
              onBlockedNextWeek={() => setIsBlockedModalOpen(true)}
              onViewCompleteFlow={() => setIsCompleteFlowModalOpen(true)}
              onOpenAssessment={handleOpenAssessment}
            />
          )}

          {activeView === "timeline" && (
            <RoadmapTimelineView
              phases={plan.phases}
              onOpenDetail={(task) => setSelectedTaskForDetail(task)}
              onToggleComplete={handleToggleComplete}
              onJumpToWeek={(wNum) => {
                setActiveWeekNumber(wNum);
                setActiveView("weekly");
              }}
            />
          )}

          {activeView === "gaps" && (
            <SkillGapPanel
              skillGaps={plan.skill_gaps}
              targetRoleName={plan.target_role_name}
            />
          )}

          {activeView === "graph" && (
            <SkillGraphView plan={plan} />
          )}

          {/* Natural Language Copilot Bar */}
          <NaturalLanguageBar
            onSendCommand={handleNaturalLanguageCommand}
            isLoading={copilotLoading}
          />
        </div>
      )}

      {/* Task Detail Drawer */}
      <TaskDetailDrawer
        task={selectedTaskForDetail}
        isOpen={!!selectedTaskForDetail}
        onClose={() => setSelectedTaskForDetail(null)}
        onCompleteTask={handleCompleteTask}
        onAssessmentSubmit={handleAssessmentSubmit}
      />

      {/* What-If Simulator Modal */}
      {plan && (
        <WhatIfSimulator
          plan={plan}
          isOpen={isSimulatorOpen}
          onClose={() => setIsSimulatorOpen(false)}
          onApplyPlan={handleApplySimulator}
        />
      )}

      {/* Roadmap Personalization Wizard Modal */}
      <RoadmapCreationWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onSubmit={handleCreateRoadmap}
        initialRoleId={plan?.target_role_id || preferredRoleId}
        initialHours={plan?.weekly_hours || 10}
        userSkills={appUser?.skills || []}
        assessmentScore={appUser?.assessmentScore || null}
      />

      {/* Blocked Week Progression Guard Modal */}
      {currentWeek && (
        <BlockedWeekModal
          isOpen={isBlockedModalOpen}
          onClose={() => setIsBlockedModalOpen(false)}
          currentWeek={currentWeek}
          onOpenTaskDetail={(task) => setSelectedTaskForDetail(task)}
          onViewCompleteFlow={() => setIsCompleteFlowModalOpen(true)}
          assessmentBlocked={currentWeek.assessment_status !== "passed"}
          onOpenAssessment={() => handleOpenAssessment(currentWeek)}
        />
      )}

      {/* Complete Flow Vector PDF Syllabus Modal */}
      {plan && (
        <CompleteFlowPDFModal
          isOpen={isCompleteFlowModalOpen}
          onClose={() => setIsCompleteFlowModalOpen(false)}
          plan={plan}
        />
      )}

      {/* Dynamic 15-Question Weekly Assessment Modal */}
      {isAssessmentModalOpen && activeAssessmentWeek && plan && (
        <WeeklyAssessmentModal
          isOpen={isAssessmentModalOpen}
          onClose={() => setIsAssessmentModalOpen(false)}
          week={activeAssessmentWeek}
          plan={plan}
          onAssessmentCompleted={handleAssessmentCompleted}
        />
      )}
    </div>
  );
};

