import React, { useState } from "react";
import {
  MapPin,
  Sparkles,
  ArrowRight,
  Clock,
  Calendar,
  CheckCircle2,
  X,
  Target,
  Compass,
} from "lucide-react";
import { roles } from "../../data/roles";
import { Button } from "../ui/UI";
import type { RoadmapCreationParams } from "../../types/roadmapEngine.types";

interface RoadmapCreationWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (params: RoadmapCreationParams) => void;
  initialRoleId?: string;
  initialHours?: number;
  userSkills?: string[];
  assessmentScore?: number | null;
}

export const RoadmapCreationWizard: React.FC<RoadmapCreationWizardProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialRoleId = "software-engineer",
  initialHours = 10,
  userSkills = [],
  assessmentScore = null,
}) => {
  if (!isOpen) return null;

  // Form State
  const [targetRoleId, setTargetRoleId] = useState<string>(initialRoleId);
  const [experienceLevel, setExperienceLevel] = useState<string>("Beginner");
  const [weeklyHours, setWeeklyHours] = useState<number>(initialHours);
  const [targetMonths, setTargetMonths] = useState<number>(6);
  const [learningPreference, setLearningPreference] = useState<string>("Balanced");
  const [goal, setGoal] = useState<string>("First Job");
  const [isTransition, setIsTransition] = useState<boolean>(false);
  const [currentRole, setCurrentRole] = useState<string>("frontend-dev");
  const [mvcpMode, setMvcpMode] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      targetRoleId,
      experienceLevel,
      weeklyHours,
      targetTimelineMonths: targetMonths,
      learningPreference,
      goal,
      currentRole: isTransition ? currentRole : undefined,
      knownSkills: userSkills,
      mvcpMode,
    });
    onClose();
  };

  const experienceOptions = [
    "Complete Beginner",
    "Beginner",
    "Intermediate",
    "Advanced",
    "Existing Professional",
  ];

  const goalOptions = [
    "First Job",
    "Internship",
    "Placement",
    "Career Transition",
    "Skill Development",
    "Higher Studies Preparation",
  ];

  const preferenceOptions = [
    "Balanced",
    "Practice Heavy",
    "Project Heavy",
    "Interview Focused",
    "Theory Heavy",
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-[#12122B] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-bold uppercase bg-[#4F46E5] text-white flex items-center gap-1.5">
                <Sparkles size={12} />
                PERSONALIZED ROADMAP SETUP
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-display font-bold text-white">
              Build Your Career Roadmap
            </h2>
            <p className="text-xs sm:text-sm text-gray-300 mt-1 font-body">
              Tailors prerequisites, weekly workloads, and milestones to your unique profile and goals.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/10"
          >
            <X size={20} />
          </button>
        </div>

        {/* Existing Profile Context Banner */}
        {(userSkills.length > 0 || assessmentScore !== null) && (
          <div className="my-5 p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 flex items-center gap-3">
            <CheckCircle2 size={18} className="text-indigo-400 shrink-0" />
            <div className="text-xs text-indigo-200">
              Auto-detected Profile Data:{" "}
              {userSkills.length > 0 && (
                <strong>{userSkills.length} verified skills in your stack. </strong>
              )}
              {assessmentScore !== null && (
                <strong>Diagnostic Score: {assessmentScore}%. </strong>
              )}
              These will automatically calibrate your baseline levels.
            </div>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-6 pt-2">
          {/* 1. Target Role Selection */}
          <div className="space-y-2">
            <label className="text-xs font-mono text-gray-300 block font-semibold">
              Target Career Role:
            </label>
            <select
              value={targetRoleId}
              onChange={(e) => setTargetRoleId(e.target.value)}
              className="w-full bg-[#181836] border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-400 font-body"
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id} className="bg-[#181836] text-white">
                  {r.name} ({r.category})
                </option>
              ))}
            </select>
          </div>

          {/* 2. Experience Level & Primary Goal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-mono text-gray-300 block font-semibold">
                Current Experience Level:
              </label>
              <select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
                className="w-full bg-[#181836] border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-400 font-body"
              >
                {experienceOptions.map((opt) => (
                  <option key={opt} value={opt} className="bg-[#181836] text-white">
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono text-gray-300 block font-semibold">
                Primary Goal:
              </label>
              <select
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="w-full bg-[#181836] border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-400 font-body"
              >
                {goalOptions.map((opt) => (
                  <option key={opt} value={opt} className="bg-[#181836] text-white">
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 3. Weekly Hours & Timeline Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono text-gray-300">
                <span className="font-semibold">Weekly Dedication:</span>
                <span className="text-indigo-400 font-bold">{weeklyHours} hrs/week</span>
              </div>
              <input
                type="range"
                min="3"
                max="40"
                step="1"
                value={weeklyHours}
                onChange={(e) => setWeeklyHours(parseFloat(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer mt-1.5"
              />
              <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                <span>3h (Casual)</span>
                <span>10h (Standard)</span>
                <span>20h+ (Bootcamp)</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono text-gray-300 block font-semibold">
                Target Timeline:
              </label>
              <select
                value={targetMonths}
                onChange={(e) => setTargetMonths(parseInt(e.target.value, 10))}
                className="w-full bg-[#181836] border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-400 font-body"
              >
                <option value={1} className="bg-[#181836]">1 Month (4-Week Blitz)</option>
                <option value={3} className="bg-[#181836]">3 Months (Quarterly Sprint)</option>
                <option value={6} className="bg-[#181836]">6 Months (Semester Track)</option>
                <option value={12} className="bg-[#181836]">1 Year (Full Specialization)</option>
                <option value={24} className="bg-[#181836]">2 Years (Degree Pathway)</option>
              </select>
            </div>
          </div>

          {/* 4. Learning Preference */}
          <div className="space-y-2">
            <label className="text-xs font-mono text-gray-300 block font-semibold">
              Learning Focus & Style:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {preferenceOptions.map((pref) => (
                <button
                  type="button"
                  key={pref}
                  onClick={() => setLearningPreference(pref)}
                  className={`p-2.5 rounded-xl border text-xs font-medium text-center transition-all cursor-pointer ${
                    learningPreference === pref
                      ? "bg-[#4F46E5]/20 border-indigo-500 text-white font-bold"
                      : "bg-white/[0.02] border-white/10 text-gray-400 hover:text-white"
                  }`}
                >
                  {pref}
                </button>
              ))}
            </div>
          </div>

          {/* 5. Career Transition Mode Toggle */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Compass size={16} className="text-indigo-400" />
                <span className="text-xs font-semibold text-white">
                  Career Transition Mode
                </span>
              </div>
              <input
                type="checkbox"
                checked={isTransition}
                onChange={(e) => setIsTransition(e.target.checked)}
                className="w-4 h-4 accent-indigo-500 rounded cursor-pointer"
              />
            </div>
            <p className="text-[11px] text-gray-400">
              Check this if you are transitioning from an existing domain. We will map overlapping competencies to avoid redundant work.
            </p>
            {isTransition && (
              <div className="pt-2">
                <label className="text-xs font-mono text-gray-300 block mb-1">
                  Transitioning from:
                </label>
                <select
                  value={currentRole}
                  onChange={(e) => setCurrentRole(e.target.value)}
                  className="w-full bg-[#181836] border border-white/20 rounded-xl px-3 py-2 text-xs text-white"
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* 6. MVCP Toggle */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5">
            <div>
              <div className="text-xs font-semibold text-white">
                Minimum Viable Career Path (MVCP)
              </div>
              <div className="text-[11px] text-gray-400">
                Focus strictly on must-have core skills (recommended if timeline is tight)
              </div>
            </div>
            <input
              type="checkbox"
              checked={mvcpMode}
              onChange={(e) => setMvcpMode(e.target.checked)}
              className="w-4 h-4 accent-indigo-500 rounded cursor-pointer"
            />
          </div>

          {/* Submit Action */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
            <Button
              variant="outline"
              type="button"
              onClick={onClose}
              className="border-white/20 text-gray-300 hover:text-white text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-semibold flex items-center gap-2 shadow-lg"
            >
              <span>Generate Adaptive Roadmap</span>
              <ArrowRight size={14} />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
