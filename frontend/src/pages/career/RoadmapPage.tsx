import React, { useMemo, useState } from "react";
import { CheckCircle, Clock, Search, Sparkles, X, MapPin, ArrowRight, Layers } from "lucide-react";
import { Card, Badge, Button } from "../../components/ui/UI";
import { roles } from "../../data/roles";
import { useAuth } from "../../hooks/useAuth";
import { firestoreService } from "../../services/firestoreService";
import { VerticalRouteLine } from "../../components/ui/RouteLine";
import type { RoadmapStationItem } from "../../components/ui/RouteLine";

type ExperienceLevel = "Beginner" | "Intermediate" | "Experienced";

interface YearPlan {
  title: string;
  milestones: string[];
  focusSkills: string[];
}

const generatePersonalRoadmap = (params: {
  roleId: string;
  years: number;
  experienceLevel: ExperienceLevel;
  hoursPerWeek: number;
  knownSkills: string[];
}) => {
  const role = roles.find((r) => r.id === params.roleId);
  if (!role) return null;

  const { years, experienceLevel, knownSkills } = params;
  const missingSkills = role.requiredSkills.filter((s) => !knownSkills.includes(s));

  const intensityHint =
    params.hoursPerWeek >= 12 ? "high" : params.hoursPerWeek >= 6 ? "medium" : "low";

  const baseMilestones: Record<ExperienceLevel, string[]> = {
    Beginner: [
      "Master foundational concepts and domain syntax",
      "Solve practical problem sets daily to build muscle memory",
      "Ship small end-to-end projects to validate learning",
    ],
    Intermediate: [
      "Deepen system architecture and design principles",
      "Build production-grade capstone projects with real datasets",
      "Contribute to open source and start targeted internship applications",
    ],
    Experienced: [
      "Focus on specialization, high scalability, and reliability",
      "Lead complex technical designs and system optimizations",
      "Prepare for senior-level interview rounds and portfolio presentations",
    ],
  };

  const plan: Record<string, YearPlan> = {};
  const perYear = Math.max(1, Math.ceil(missingSkills.length / years));

  for (let i = 1; i <= years; i++) {
    const yearKey = `year${i}`;
    const skillsForYear = missingSkills.slice((i - 1) * perYear, i * perYear);
    const genericFocus = role.requiredSkills.slice(0, Math.min(role.requiredSkills.length, i * 2));

    const milestones = [
      ...baseMilestones[experienceLevel],
      ...(skillsForYear.length
        ? [`Target competencies: ${skillsForYear.join(", ")}`]
        : ["Consolidate advanced strengths and build industry-grade projects"]),
      intensityHint === "high"
        ? "Build 2–3 serious deployed applications + portfolio proof"
        : intensityHint === "medium"
        ? "Build 1–2 solid projects with clean architecture"
        : "Build 1 focused project + consistent weekly milestones",
    ];

    plan[yearKey] = {
      title:
        i === 1
          ? "Foundation & Core Principles"
          : i === years
          ? "Mastery & Placement Readiness"
          : "System Design & Projects",
      focusSkills: Array.from(new Set([...skillsForYear, ...genericFocus])).slice(0, 8),
      milestones,
    };
  }

  return plan;
};

export const RoadmapPage: React.FC = () => {
  const { user, appUser } = useAuth();
  const [selectedRole, setSelectedRole] = useState<string>(roles[0].id);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [roleQuery, setRoleQuery] = useState("");

  const [journeyOpen, setJourneyOpen] = useState(false);
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>("Beginner");
  const [years, setYears] = useState<number>(3);
  const [hoursPerWeek, setHoursPerWeek] = useState<number>(6);
  const [knownSkills, setKnownSkills] = useState<string[]>(appUser?.skills || []);
  const [saving, setSaving] = useState(false);
  const [activeStationYear, setActiveStationYear] = useState<number>(1);

  const selectedRoleData = roles.find((r) => r.id === selectedRole);

  const filteredRoles = useMemo(() => {
    const q = roleQuery.trim().toLowerCase();
    if (!q) return roles;
    return roles.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q)
    );
  }, [roleQuery]);

  const activePlan = useMemo(() => {
    if (!selectedRoleData) return null;

    return generatePersonalRoadmap({
      roleId: selectedRole,
      years,
      experienceLevel,
      hoursPerWeek,
      knownSkills: appUser?.skills || [],
    });
  }, [selectedRoleData, selectedRole, years, experienceLevel, hoursPerWeek, appUser?.skills]);

  // Convert activePlan into RoadmapStationItem array for VerticalRouteLine
  const roadmapStationItems: RoadmapStationItem[] = useMemo(() => {
    if (!activePlan) return [];
    return Object.entries(activePlan).map(([yearKey, val], idx) => {
      const planItem = val as YearPlan;
      return {
        id: yearKey,
        yearLabel: `Year 0${idx + 1}`,
        title: planItem.title,
        milestones: planItem.milestones,
        focusSkills: planItem.focusSkills || [],
        status:
          idx + 1 === activeStationYear
            ? "current"
            : idx + 1 < activeStationYear
            ? "completed"
            : "upcoming",
      };
    });
  }, [activePlan, activeStationYear]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Wayfinding Hero */}
      <div className="bg-[#12122B] text-white rounded-3xl p-6 sm:p-8 border border-white/10 shadow-xl relative overflow-hidden">
        <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[#4F46E5]/20 blur-3xl" />
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-data font-bold tracking-wider uppercase bg-[#4F46E5] text-white">
            <MapPin size={14} />
            STATION 05 · DYNAMIC ROADMAP
          </span>
          <span className="text-xs font-mono text-gray-400">Chronological Route</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-display font-bold mb-2 text-white">
          Multi-Year Career Roadmap
        </h1>
        <p className="text-sm sm:text-base font-body text-gray-300 max-w-2xl">
          Follow a structured vertical transit line mapped across yearly checkpoints, competencies, and milestones.
        </p>
      </div>

      {/* Target Role Selector Toolbar */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-data font-bold text-[#6B7280] uppercase">
            Current Destination Track:
          </span>
          <h2 className="text-2xl font-display font-bold text-[#12122B]">
            {selectedRoleData?.name || "Select Role"}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="ink">{selectedRoleData?.category}</Badge>
            <span className="text-xs font-data font-semibold text-[#0F766E]">
              Avg Salary: {selectedRoleData?.salaryRange}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setPickerOpen(true)}
            className="flex items-center gap-2"
          >
            <Search size={16} />
            Change Destination
          </Button>

          <Button
            onClick={() => setJourneyOpen(true)}
            className="flex items-center gap-2"
          >
            <Sparkles size={16} />
            Personalize Plan
          </Button>
        </div>
      </div>

      {/* Main Roadmap Area using Vertical Route Line Motif */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left 2 Cols: The Vertical Route Line */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-lg font-display font-bold text-[#12122B] flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F5A623]" />
              Route Stations ({roadmapStationItems.length} Years)
            </h3>
            <span className="text-xs font-data text-[#6B7280]">
              Click station to highlight
            </span>
          </div>

          <VerticalRouteLine
            items={roadmapStationItems}
            activeYear={activeStationYear}
            onSelectYear={(idx) => setActiveStationYear(idx + 1)}
          />
        </div>

        {/* Right Col: Certifications, Milestones & Waypoint Summary */}
        <div className="space-y-6">
          <Card className="border-[#4F46E5]/30">
            <div className="flex items-center gap-2 mb-3">
              <span className="p-2 rounded-xl bg-[#4F46E5]/10 text-[#4F46E5]">
                <Layers size={18} />
              </span>
              <div>
                <h4 className="text-base font-display font-bold text-[#12122B]">
                  Required Competencies
                </h4>
                <p className="text-xs font-body text-[#6B7280]">Key Industry Credentials</p>
              </div>
            </div>

            <div className="space-y-2 mt-4">
              {selectedRoleData?.requiredSkills.slice(0, 4).map((skill, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAFAF7] border border-gray-200"
                >
                  <span className="text-xs font-display font-semibold text-[#12122B]">
                    {skill} Mastery
                  </span>
                  <span className="text-[10px] font-data font-bold text-[#4F46E5] uppercase">
                    Level 0{idx + 1}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="bg-[#12122B] text-white border-white/10">
            <div className="flex items-center gap-2 mb-2 text-[#F5A623]">
              <Sparkles size={18} />
              <h4 className="text-sm font-display font-bold text-white uppercase tracking-wider">
                AI Guidance Tip
              </h4>
            </div>
            <p className="text-xs font-body text-gray-300 leading-relaxed">
              Focus primarily on completing <strong>Year 0{activeStationYear}</strong> milestones.
              Consistent daily practice on core skills and 1 real project per semester delivers the highest placement probability in India.
            </p>
          </Card>
        </div>
      </div>

      {/* Role Picker Modal */}
      {pickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#12122B]/60 backdrop-blur-xs" onClick={() => setPickerOpen(false)} />
          <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden z-10">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-display font-bold text-[#12122B]">
                Select Destination Role
              </h3>
              <button onClick={() => setPickerOpen(false)} className="p-2 rounded-xl hover:bg-gray-100">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="relative">
                <Search className="absolute left-3.5 top-3 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search role or domain..."
                  value={roleQuery}
                  onChange={(e) => setRoleQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#4F46E5] text-sm"
                />
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2">
                {filteredRoles.map((role) => (
                  <button
                    key={role.id}
                    onClick={() => {
                      setSelectedRole(role.id);
                      setPickerOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left ${
                      selectedRole === role.id
                        ? "bg-[#4F46E5] text-white border-[#4F46E5]"
                        : "bg-[#FAFAF7] hover:bg-gray-100 border-gray-200 text-[#12122B]"
                    }`}
                  >
                    <div>
                      <p className="text-sm font-display font-bold">{role.name}</p>
                      <p className={`text-xs ${selectedRole === role.id ? "text-white/80" : "text-[#6B7280]"}`}>
                        {role.category} · {role.salaryRange}
                      </p>
                    </div>
                    <ArrowRight size={16} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Personalize Journey Modal */}
      {journeyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#12122B]/60 backdrop-blur-xs" onClick={() => setJourneyOpen(false)} />
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden z-10 max-h-[90vh] flex flex-col">
            <div className="p-6 bg-[#12122B] text-white flex items-center justify-between border-b border-white/10">
              <div>
                <span className="text-[10px] font-data font-bold text-[#F5A623] uppercase">
                  CUSTOM TRANSIT CALIBRATION
                </span>
                <h3 className="text-xl font-display font-bold text-white">
                  Personalize Your Roadmap
                </h3>
              </div>
              <button onClick={() => setJourneyOpen(false)} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto">
              <div>
                <label className="text-xs font-data font-bold text-[#6B7280] uppercase block mb-2">
                  Experience Tier
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(["Beginner", "Intermediate", "Experienced"] as ExperienceLevel[]).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setExperienceLevel(lvl)}
                      className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                        experienceLevel === lvl
                          ? "bg-[#4F46E5] text-white border-[#4F46E5] shadow-xs font-bold"
                          : "bg-[#FAFAF7] border-gray-200 text-[#12122B] hover:border-gray-300"
                      }`}
                    >
                      <div className="text-sm font-display">{lvl}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-data font-bold text-[#6B7280] uppercase block mb-1.5">
                    Duration (Years)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={6}
                    value={years}
                    onChange={(e) => setYears(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#4F46E5] text-sm font-data"
                  />
                </div>
                <div>
                  <label className="text-xs font-data font-bold text-[#6B7280] uppercase block mb-1.5">
                    Hours / Week
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={hoursPerWeek}
                    onChange={(e) => setHoursPerWeek(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#4F46E5] text-sm font-data"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setJourneyOpen(false)}>
                Cancel
              </Button>
              <Button
                disabled={saving}
                onClick={async () => {
                  if (!user) {
                    setJourneyOpen(false);
                    return;
                  }
                  const plan = generatePersonalRoadmap({
                    roleId: selectedRole,
                    years,
                    experienceLevel,
                    hoursPerWeek,
                    knownSkills,
                  });
                  if (!plan) return;

                  try {
                    setSaving(true);
                    await firestoreService.saveRoadmapData(user.uid, {
                      roleId: selectedRole,
                      experienceLevel,
                      years,
                      hoursPerWeek,
                      knownSkills,
                      plan,
                      createdAt: new Date(),
                    });
                    setJourneyOpen(false);
                  } catch (e) {
                    console.error("Failed to save roadmap:", e);
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                {saving ? "Saving Route..." : "Generate Custom Route"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
