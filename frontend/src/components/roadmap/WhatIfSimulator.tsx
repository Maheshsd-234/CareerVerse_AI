import React, { useState, useEffect } from "react";
import {
  X,
  Sliders,
  Sparkles,
  Clock,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import type { RoadmapPlan, RoadmapSimulationResult } from "../../types/roadmapEngine.types";
import { dynamicRoadmapService } from "../../services/dynamicRoadmapService";
import { Button } from "../ui/UI";

interface WhatIfSimulatorProps {
  plan: RoadmapPlan;
  isOpen: boolean;
  onClose: () => void;
  onApplyPlan: (newWeeklyHours: number, newTargetDate?: string, newMvcpMode?: boolean) => void;
}

export const WhatIfSimulator: React.FC<WhatIfSimulatorProps> = ({
  plan,
  isOpen,
  onClose,
  onApplyPlan,
}) => {
  if (!isOpen) return null;

  const [simWeeklyHours, setSimWeeklyHours] = useState<number>(plan.weekly_hours);
  const [simTargetDate, setSimTargetDate] = useState<string>(plan.target_date);
  const [simMvcpMode, setSimMvcpMode] = useState<boolean>(plan.mvcp_mode);
  const [simResult, setSimResult] = useState<RoadmapSimulationResult | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  // Run simulation whenever parameters change
  useEffect(() => {
    let isCancelled = false;
    const runSim = async () => {
      setIsSimulating(true);
      const res = await dynamicRoadmapService.simulatePlan(plan, {
        weeklyHours: simWeeklyHours,
        targetDate: simTargetDate,
        mvcpMode: simMvcpMode,
      });
      if (!isCancelled) {
        setSimResult(res);
        setIsSimulating(false);
      }
    };
    runSim();
    return () => {
      isCancelled = true;
    };
  }, [simWeeklyHours, simTargetDate, simMvcpMode, plan]);

  const isConflict = simResult?.feasibility_status === "conflict";
  const isTight = simResult?.feasibility_status === "tight";

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        className="w-full max-w-xl bg-[#12122B] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-[#4F46E5] text-white flex items-center gap-1">
                <Sliders size={12} />
                WHAT-IF ROADMAP SIMULATOR
              </span>
            </div>
            <h3 className="text-xl font-display font-bold text-white">
              Simulate Schedule Scenarios
            </h3>
            <p className="text-xs text-gray-400 mt-0.5 font-body">
              Test how altering weekly dedication, deadlines, or scope affects feasibility before committing.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/10"
          >
            <X size={20} />
          </button>
        </div>

        {/* Interactive Sliders & Controls */}
        <div className="space-y-5">
          {/* 1. Weekly Hours Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-gray-300">Study Dedication:</span>
              <strong className="text-indigo-400 text-sm">{simWeeklyHours} hrs / week</strong>
            </div>
            <input
              type="range"
              min="3"
              max="40"
              step="1"
              value={simWeeklyHours}
              onChange={(e) => setSimWeeklyHours(parseFloat(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-gray-500 font-mono">
              <span>3h (Casual)</span>
              <span>10h (Standard)</span>
              <span>20h (Focused)</span>
              <span>40h (Bootcamp)</span>
            </div>
          </div>

          {/* 2. Target Date Picker */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-gray-300 block">
              Target Deadline Date:
            </label>
            <input
              type="date"
              value={simTargetDate}
              onChange={(e) => setSimTargetDate(e.target.value)}
              className="w-full bg-[#181836] border border-white/20 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-400 font-mono"
            />
          </div>

          {/* 3. MVCP Mode Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.03] border border-white/5">
            <div>
              <div className="text-xs font-semibold text-white">
                Minimum Viable Career Path (MVCP)
              </div>
              <div className="text-[11px] text-gray-400">
                Filters to critical core competencies only (bypasses optional topics)
              </div>
            </div>
            <input
              type="checkbox"
              checked={simMvcpMode}
              onChange={(e) => setSimMvcpMode(e.target.checked)}
              className="w-4 h-4 accent-indigo-500 rounded cursor-pointer"
            />
          </div>
        </div>

        {/* Simulation Output Card */}
        {simResult && (
          <div
            className={`p-4 sm:p-5 rounded-2xl border space-y-3 ${
              isConflict
                ? "bg-rose-950/20 border-rose-500/40 text-rose-200"
                : isTight
                ? "bg-amber-950/20 border-amber-500/40 text-amber-200"
                : "bg-emerald-950/20 border-emerald-500/40 text-emerald-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-1.5">
                {isConflict ? (
                  <AlertTriangle size={14} className="text-rose-400" />
                ) : (
                  <CheckCircle2 size={14} className="text-emerald-400" />
                )}
                {simResult.headline}
              </span>
              <span className="text-xs font-mono font-bold">
                Capacity Ratio: {simResult.capacity_ratio}x
              </span>
            </div>

            <p className="text-xs font-body opacity-90 leading-relaxed">
              {simResult.recommendation}
            </p>

            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs font-mono">
              <span>Projected Completion:</span>
              <strong className="text-white text-sm">{simResult.projected_finish_date}</strong>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-white/20 text-gray-300 hover:text-white text-xs"
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              onApplyPlan(simWeeklyHours, simTargetDate, simMvcpMode);
              onClose();
            }}
            className="bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-semibold flex items-center gap-1.5"
          >
            <Sparkles size={14} />
            Apply Changes to Active Roadmap
          </Button>
        </div>
      </div>
    </div>
  );
};
