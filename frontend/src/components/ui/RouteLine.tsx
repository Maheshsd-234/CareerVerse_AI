import React, { useMemo } from "react";
import {
  GraduationCap,
  Compass,
  Sparkles,
  FileText,
  Users,
  Briefcase,
  Check,
} from "lucide-react";
import type { User } from "../../types";

export interface Station {
  id: string;
  name: string;
  label: string;
  sublabel?: string;
  icon: React.FC<{ size?: number; className?: string }>;
}

export const WAYFINDING_STATIONS: Station[] = [
  { id: "school", name: "School", label: "Foundation (10th/12th)", sublabel: "Basics & Board Exams", icon: GraduationCap },
  { id: "stream", name: "Stream", label: "Stream & Degree", sublabel: "Science / Comm / Arts", icon: Compass },
  { id: "skills", name: "Skills", label: "Skill Building", sublabel: "Core Competencies", icon: Sparkles },
  { id: "resume", name: "Resume", label: "Portfolio & Projects", sublabel: "Proof of Work", icon: FileText },
  { id: "interview", name: "Interview", label: "Assessment & Prep", sublabel: "Mock & Technical", icon: Users },
  { id: "placement", name: "Placement", label: "Career Placement", sublabel: "Dream Role Secured", icon: Briefcase },
];

export const deriveActiveStationId = (appUser?: User | null): string => {
  if (!appUser) return "school";

  const localStage = appUser.uid ? localStorage.getItem(`cv_user_stage_${appUser.uid}`) : null;
  const stage = appUser.currentStage || localStage;

  if (stage && WAYFINDING_STATIONS.some((s) => s.id === stage)) {
    return stage;
  }

  const hasSkills = (appUser.skills?.length ?? 0) >= 3;
  const hasCareer = Boolean(appUser.selectedCareer);
  const hasAssessment = Boolean(appUser.assessmentScore && appUser.assessmentScore > 0);

  if (hasCareer && hasAssessment && hasSkills) {
    return "resume";
  }
  if (hasAssessment || hasSkills) {
    return "skills";
  }
  if (hasCareer) {
    return "stream";
  }
  return "school";
};

interface RouteLineProps {
  appUser?: User | null;
  activeStationId?: string;
  interactive?: boolean;
  onSelectStation?: (id: string) => void;
  className?: string;
  theme?: "dark" | "light";
}

export const RouteLine: React.FC<RouteLineProps> = ({
  appUser,
  activeStationId: manualActiveId,
  interactive = false,
  onSelectStation,
  className = "",
  theme = "dark",
}) => {
  const activeId = useMemo(() => {
    return manualActiveId || deriveActiveStationId(appUser);
  }, [manualActiveId, appUser]);

  const activeIndex = useMemo(() => {
    const idx = WAYFINDING_STATIONS.findIndex((s) => s.id === activeId);
    return idx >= 0 ? idx : 0;
  }, [activeId]);

  const isDark = theme === "dark";

  return (
    <div className={`w-full overflow-hidden ${className}`}>
      {/* Header Metro Route Badge */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-data font-bold tracking-wider uppercase bg-[#4F46E5] text-white">
            <span className="w-1.5 h-1.5 rounded-full bg-[#14B8A6] animate-ping" />
            ROUTE LINE · 01
          </span>
          <span className={`text-xs font-mono font-medium ${isDark ? "text-gray-300" : "text-[#6B7280]"}`}>
            Stage {activeIndex + 1} of {WAYFINDING_STATIONS.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#F5A623] inline-block shadow-[0_0_8px_#F5A623]" />
          <span className={`text-xs font-data font-semibold ${isDark ? "text-yellow-300" : "text-[#12122B]"}`}>
            You Are Here: <span className="underline decoration-[#F5A623] underline-offset-2">{WAYFINDING_STATIONS[activeIndex]?.name}</span>
          </span>
        </div>
      </div>

      {/* Desktop / Horizontal Route Line */}
      <div className="relative py-4 hidden md:block">
        {/* SVG Route Line */}
        <div className="absolute top-1/2 left-6 right-6 -translate-y-1/2 h-4 pointer-events-none z-0">
          <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 1000 16">
            {/* Background Track */}
            <line
              x1="0"
              y1="8"
              x2="1000"
              y2="8"
              stroke={isDark ? "rgba(255,255,255,0.15)" : "#E5E7EB"}
              strokeWidth="4"
              strokeLinecap="round"
            />
            {/* Completed Track */}
            <line
              x1="0"
              y1="8"
              x2={`${(activeIndex / (WAYFINDING_STATIONS.length - 1)) * 1000}`}
              y2="8"
              stroke="#4F46E5"
              strokeWidth="4"
              strokeLinecap="round"
              className="route-line-path"
            />
          </svg>
        </div>

        {/* Station Nodes Grid */}
        <div className="relative z-10 grid grid-cols-6 gap-2">
          {WAYFINDING_STATIONS.map((station, index) => {
            const isCompleted = index < activeIndex;
            const isCurrent = index === activeIndex;
            const Icon = station.icon;

            return (
              <button
                key={station.id}
                type="button"
                onClick={() => onSelectStation?.(station.id)}
                title={interactive ? `Switch to ${station.name}` : undefined}
                className={`flex flex-col items-center text-center group transition-all duration-200 ${
                  interactive ? "cursor-pointer hover:scale-105" : "cursor-default"
                }`}
              >
                {/* Station Node Ring */}
                <div
                  className={`relative flex items-center justify-center w-11 h-11 rounded-full transition-all duration-300 ${
                    isCurrent
                      ? "bg-[#F5A623] text-[#12122B] ring-4 ring-[#F5A623]/30 station-active-pulse z-20 shadow-lg scale-110"
                      : isCompleted
                      ? "bg-[#4F46E5] text-white ring-2 ring-[#4F46E5]/40"
                      : isDark
                      ? "bg-[#1A1A38] text-gray-400 border-2 border-white/20 group-hover:border-[#4F46E5]"
                      : "bg-white text-gray-400 border-2 border-gray-300 group-hover:border-[#4F46E5]"
                  }`}
                >
                  {isCompleted ? (
                    <Check size={18} className="stroke-[2.5]" />
                  ) : (
                    <Icon size={18} className={isCurrent ? "stroke-[2.5]" : "stroke-[2]"} />
                  )}

                  {/* "You Are Here" Marker Flag */}
                  {isCurrent && (
                    <span className="absolute -top-7 px-2 py-0.5 rounded-full bg-[#F5A623] text-[#12122B] text-[10px] font-data font-bold tracking-tight shadow-md whitespace-nowrap animate-bounce">
                      YOU ARE HERE
                    </span>
                  )}
                </div>

                {/* Station Labels */}
                <div className="mt-3">
                  <p
                    className={`text-xs font-display font-bold tracking-tight ${
                      isCurrent
                        ? isDark
                          ? "text-[#F5A623]"
                          : "text-[#4F46E5]"
                        : isCompleted
                        ? isDark
                          ? "text-white"
                          : "text-[#12122B]"
                        : isDark
                        ? "text-gray-400 group-hover:text-white"
                        : "text-[#6B7280] group-hover:text-[#12122B]"
                    }`}
                  >
                    {station.name}
                  </p>
                  <p
                    className={`text-[11px] font-body mt-0.5 leading-tight line-clamp-1 ${
                      isDark ? "text-gray-300" : "text-[#6B7280]"
                    }`}
                  >
                    {station.label}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile / Vertical Stacked Route Line */}
      <div className="relative py-2 md:hidden">
        <div className="relative pl-6 space-y-4 before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-300 dark:before:bg-white/20">
          {WAYFINDING_STATIONS.map((station, index) => {
            const isCompleted = index < activeIndex;
            const isCurrent = index === activeIndex;
            const Icon = station.icon;

            return (
              <div
                key={station.id}
                onClick={() => onSelectStation?.(station.id)}
                className={`relative flex items-start gap-3 ${interactive ? "cursor-pointer" : ""}`}
              >
                <div
                  className={`absolute -left-6 top-0.5 flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all ${
                    isCurrent
                      ? "bg-[#F5A623] text-[#12122B] ring-2 ring-[#F5A623]/40 station-active-pulse z-10"
                      : isCompleted
                      ? "bg-[#4F46E5] text-white"
                      : isDark
                      ? "bg-[#1A1A38] text-gray-400 border border-white/20"
                      : "bg-white text-gray-400 border border-gray-300"
                  }`}
                >
                  {isCompleted ? <Check size={14} /> : <Icon size={14} />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-display font-bold ${
                        isCurrent
                          ? isDark
                            ? "text-[#F5A623]"
                            : "text-[#4F46E5]"
                          : isCompleted
                          ? isDark
                            ? "text-white"
                            : "text-[#12122B]"
                          : isDark
                          ? "text-gray-400"
                          : "text-[#6B7280]"
                      }`}
                    >
                      {station.name}
                    </span>
                    {isCurrent && (
                      <span className="px-1.5 py-0.2 bg-[#F5A623] text-[#12122B] text-[9px] font-data font-bold rounded">
                        CURRENT
                      </span>
                    )}
                  </div>
                  <p className={`text-[11px] ${isDark ? "text-gray-300" : "text-[#6B7280]"}`}>
                    {station.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export interface RoadmapStationItem {
  id: string;
  yearLabel: string;
  title: string;
  milestones: string[];
  focusSkills?: string[];
  status?: "completed" | "current" | "upcoming";
}

interface VerticalRouteLineProps {
  items: RoadmapStationItem[];
  activeYear?: number;
  onSelectYear?: (yearIndex: number) => void;
  className?: string;
}

export const VerticalRouteLine: React.FC<VerticalRouteLineProps> = ({
  items,
  activeYear = 1,
  onSelectYear,
  className = "",
}) => {
  return (
    <div className={`relative pl-8 md:pl-10 space-y-8 ${className}`}>
      {/* Vertical SVG Track */}
      <div className="absolute top-4 bottom-4 left-4 md:left-5 -translate-x-1/2 w-1 pointer-events-none">
        <svg className="w-full h-full" preserveAspectRatio="none">
          <line
            x1="2"
            y1="0"
            x2="2"
            y2="100%"
            stroke="#E5E7EB"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <line
            x1="2"
            y1="0"
            x2="2"
            y2={`${Math.min(100, (activeYear / Math.max(1, items.length)) * 100)}%`}
            stroke="#4F46E5"
            strokeWidth="3"
            strokeLinecap="round"
            className="route-line-vertical-path"
          />
        </svg>
      </div>

      {items.map((item, index) => {
        const yearNum = index + 1;
        const isCompleted = yearNum < activeYear;
        const isCurrent = yearNum === activeYear;

        return (
          <div
            key={item.id || index}
            onClick={() => onSelectYear?.(index)}
            className={`relative group rounded-2xl p-6 border transition-all duration-200 ${
              isCurrent
                ? "bg-white border-[#4F46E5] shadow-lg ring-1 ring-[#4F46E5]/30"
                : "bg-white/80 border-gray-200 hover:border-gray-300 hover:bg-white"
            } ${onSelectYear ? "cursor-pointer" : ""}`}
          >
            {/* Station Milestone Node */}
            <div
              className={`absolute -left-8 md:-left-10 top-6 -translate-x-1/2 flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-full transition-all ${
                isCurrent
                  ? "bg-[#F5A623] text-[#12122B] ring-4 ring-[#F5A623]/30 station-active-pulse z-10 shadow-md"
                  : isCompleted
                  ? "bg-[#4F46E5] text-white"
                  : "bg-white text-gray-400 border-2 border-gray-300"
              }`}
            >
              {isCompleted ? (
                <Check size={16} className="stroke-[2.5]" />
              ) : (
                <span className="text-xs font-data font-bold">Y{yearNum}</span>
              )}
            </div>

            {/* Content */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-data font-bold bg-[#12122B] text-white">
                  {item.yearLabel}
                </span>
                <h3 className="text-lg md:text-xl font-display font-bold text-[#12122B]">
                  {item.title}
                </h3>
              </div>
              {isCurrent && (
                <span className="inline-flex items-center gap-1 text-xs font-data font-bold text-[#F5A623] bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F5A623] animate-pulse" />
                  CURRENT FOCUS
                </span>
              )}
            </div>

            {/* Milestones List */}
            <ul className="space-y-2 mb-4">
              {item.milestones.map((milestone, mIdx) => (
                <li key={mIdx} className="flex items-start gap-2 text-sm text-[#12122B]/90 font-body">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4F46E5] mt-1.5 flex-shrink-0" />
                  <span>{milestone}</span>
                </li>
              ))}
            </ul>

            {/* Focus Skills */}
            {item.focusSkills && item.focusSkills.length > 0 && (
              <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-data font-semibold text-[#6B7280] mr-1">
                  SKILLS:
                </span>
                {item.focusSkills.map((skill) => (
                  <span
                    key={skill}
                    className="px-2 py-0.5 rounded-md text-xs font-medium bg-[#FAFAF7] border border-gray-200 text-[#12122B]"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
