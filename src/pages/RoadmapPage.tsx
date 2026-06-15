import React, { useMemo, useState } from "react";
import { CheckCircle, Clock, Search, Sparkles, X } from "lucide-react";
import { Card, Badge, Button } from "../components/UI";
import { roles } from "../data/roles";
import { useAuth } from "../hooks/useAuth";
import { firestoreService } from "../services/firestoreService";

type ExperienceLevel = "Beginner" | "Intermediate" | "Experienced";

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
      "Build strong fundamentals",
      "Learn core concepts with daily practice",
      "Ship small projects to build confidence",
    ],
    Intermediate: [
      "Strengthen weak areas and system design basics",
      "Build portfolio projects with real-world features",
      "Start internships / freelancing / open source",
    ],
    Experienced: [
      "Focus on specialization and advanced topics",
      "Optimize for impact: scale, reliability, ownership",
      "Prepare for high-level interviews and leadership",
    ],
  };

  const plan: Record<
    string,
    { title: string; milestones: string[]; focusSkills: string[] }
  > = {};
  const perYear = Math.max(1, Math.ceil(missingSkills.length / years));

  for (let i = 1; i <= years; i++) {
    const yearKey = `year${i}`;
    const skillsForYear = missingSkills.slice((i - 1) * perYear, i * perYear);
    const genericFocus = role.requiredSkills.slice(0, Math.min(role.requiredSkills.length, i * 2));

    const milestones = [
      ...baseMilestones[experienceLevel],
      ...(skillsForYear.length
        ? [`Master: ${skillsForYear.join(", ")}`]
        : ["Consolidate strengths and build advanced projects"]),
      intensityHint === "high"
        ? "Build 2–3 serious projects + publish portfolio"
        : intensityHint === "medium"
        ? "Build 1–2 solid projects + improve portfolio"
        : "Build 1 focused project + consistent practice",
    ];

    plan[yearKey] = {
      title:
        i === 1
          ? "Foundation"
          : i === years
          ? "Mastery & Job Readiness"
          : "Growth & Projects",
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

  const selectedRoleData = roles.find((r) => r.id === selectedRole);

  const filteredRoles = useMemo(() => {
    const q = roleQuery.trim().toLowerCase();
    if (!q) return roles;
    return roles.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q) ||
        r.requiredSkills.some((s) => s.toLowerCase().includes(q))
    );
  }, [roleQuery]);

  const roadmap = useMemo(() => {
    return generatePersonalRoadmap({
      roleId: selectedRole,
      years,
      experienceLevel,
      hoursPerWeek,
      knownSkills,
    });
  }, [selectedRole, years, experienceLevel, hoursPerWeek, knownSkills]);

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl p-8">
        <h1 className="text-4xl font-bold mb-2">Career Roadmap Generator</h1>
        <p className="text-lg opacity-90">
          Dynamic learning path for your chosen career role
        </p>
      </div>

      {/* Role Selection */}
      <Card>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Select Target Role</h2>
        <div className="relative">
          <button
            type="button"
            onClick={() => setPickerOpen((v) => !v)}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-left bg-white hover:border-indigo-600 transition"
          >
            <div className="font-semibold text-gray-900">
              {selectedRoleData ? selectedRoleData.name : "Select role"}
            </div>
            <div className="text-sm text-gray-600">
              {selectedRoleData ? selectedRoleData.category : "Choose your target role"}
            </div>
          </button>

          {pickerOpen && (
            <div className="absolute left-0 right-0 mt-2 rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 overflow-hidden z-20">
              <div className="p-3 border-b">
                <div className="relative">
                  <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                  <input
                    value={roleQuery}
                    onChange={(e) => setRoleQuery(e.target.value)}
                    placeholder="Search roles, categories, or skills..."
                    className="w-full pl-10 pr-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {filteredRoles.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => {
                      setSelectedRole(r.id);
                      setPickerOpen(false);
                      setRoleQuery("");
                    }}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition ${
                      r.id === selectedRole ? "bg-indigo-50" : ""
                    }`}
                  >
                    <div className="font-semibold text-gray-900">{r.name}</div>
                    <div className="text-xs text-gray-600">{r.category}</div>
                  </button>
                ))}
                {filteredRoles.length === 0 && (
                  <div className="px-4 py-6 text-sm text-gray-500">
                    No roles match your search.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Roadmap */}
      {selectedRoleData && roadmap && (
        <div className="space-y-6">
          {/* Header */}
          <Card className="bg-gradient-to-r from-indigo-50 to-purple-50">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {selectedRoleData.name}
            </h2>
            <p className="text-gray-600 mb-4">{selectedRoleData.description}</p>
            <div className="flex flex-wrap gap-4">
              <div>
                <p className="text-sm text-gray-600">Duration</p>
                <p className="text-2xl font-bold text-indigo-600">{years} Years</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Salary Range</p>
                <p className="text-2xl font-bold text-green-600">
                  {selectedRoleData.salaryRange}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Trend Score</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {selectedRoleData.trendScore.toFixed(1)}/10
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Your level</p>
                <p className="text-2xl font-bold text-purple-600">{experienceLevel}</p>
              </div>
            </div>
          </Card>

          {/* Timeline */}
          <div className="space-y-6">
            {Object.entries(roadmap).map(([year, data], index) => (
              <Card key={year}>
                <div className="flex items-start gap-4">
                  {/* Year Badge */}
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-xl">
                      {index + 1}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">
                      {data.title}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {data.milestones.map((milestone, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                        >
                          <CheckCircle
                            size={20}
                            className="text-green-600 flex-shrink-0 mt-0.5"
                          />
                          <span className="text-gray-700 font-medium">
                            {milestone}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Key Skills for this year */}
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm font-semibold text-gray-700 mb-2">
                        Focus Skills:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {data.focusSkills.map((skill) => (
                          <Badge key={skill} variant="primary">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Required Skills Overview */}
          <Card>
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Skills to Master
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {selectedRoleData.requiredSkills.map((skill) => (
                <div
                  key={skill}
                  className="p-3 bg-indigo-50 rounded-lg border border-indigo-200"
                >
                  <p className="font-medium text-indigo-900">{skill}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Government Exams */}
          <Card>
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Relevant Exams & Certifications
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedRoleData.salaryRange && (
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-sm text-gray-600 mb-1">Government Exams</p>
                  <p className="font-bold text-purple-900">
                    GATE, UPSC, Banking Exams
                  </p>
                </div>
              )}
              <div className="p-4 bg-pink-50 rounded-lg border border-pink-200">
                <p className="text-sm text-gray-600 mb-1">Industry Certifications</p>
                <p className="font-bold text-pink-900">
                  AWS, GCP, Specialized Certs
                </p>
              </div>
            </div>
          </Card>

          {/* CTA */}
          <div className="text-center">
            <Button className="px-8 py-3 text-lg" onClick={() => setJourneyOpen(true)}>
              Start Your Journey
            </Button>
          </div>
        </div>
      )}

      {/* Start Journey Modal */}
      {journeyOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setJourneyOpen(false)}
          />
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl ring-1 ring-black/5 overflow-hidden animate-slide-in">
            <div className="flex items-start justify-between p-6 border-b">
              <div>
                <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
                  <Sparkles size={20} className="text-indigo-600" />
                  Personalize your roadmap
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Tell us what you already know — CareerVerse will tailor the plan.
                </p>
              </div>
              <button
                onClick={() => setJourneyOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 transition"
                aria-label="Close"
              >
                <X />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(["Beginner", "Intermediate", "Experienced"] as ExperienceLevel[]).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setExperienceLevel(lvl)}
                    className={`px-4 py-3 rounded-2xl border text-left transition ${
                      experienceLevel === lvl
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-white hover:bg-gray-50"
                    }`}
                  >
                    <div className="font-bold">{lvl}</div>
                    <div
                      className={`text-xs ${
                        experienceLevel === lvl ? "text-white/90" : "text-gray-600"
                      }`}
                    >
                      {lvl === "Beginner"
                        ? "I’m starting fresh"
                        : lvl === "Intermediate"
                        ? "I know basics + some projects"
                        : "I have strong experience"}
                    </div>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-2xl border p-4">
                  <div className="text-sm font-bold text-gray-900 mb-2">Timeline (years)</div>
                  <input
                    type="number"
                    min={1}
                    max={6}
                    value={years}
                    onChange={(e) => setYears(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                  <div className="mt-2 text-xs text-gray-500">1–6 years recommended.</div>
                </div>
                <div className="rounded-2xl border p-4">
                  <div className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <Clock size={16} className="text-indigo-600" />
                    Hours per week
                  </div>
                  <input
                    type="number"
                    min={1}
                    max={40}
                    value={hoursPerWeek}
                    onChange={(e) => setHoursPerWeek(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                  <div className="mt-2 text-xs text-gray-500">Helps tailor intensity.</div>
                </div>
              </div>

              <div className="rounded-2xl border p-4 bg-gray-50">
                <div className="text-sm font-bold text-gray-900 mb-2">
                  Known skills (auto-filled from Skill Gap)
                </div>
                {knownSkills.length === 0 ? (
                  <div className="text-sm text-gray-600">
                    No saved skills yet. Add skills in Skill Gap Analyzer for best results.
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {knownSkills.map((s) => (
                      <span
                        key={s}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white ring-1 ring-gray-200 text-sm"
                      >
                        {s}
                        <button
                          onClick={() => setKnownSkills(knownSkills.filter((x) => x !== s))}
                          className="text-gray-400 hover:text-gray-700"
                          aria-label="Remove skill"
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 pt-0 flex flex-col sm:flex-row gap-3 sm:justify-end">
              <Button variant="outline" onClick={() => setJourneyOpen(false)}>
                Cancel
              </Button>
              <Button
                disabled={!user || saving}
                onClick={async () => {
                  if (!user) return;
                  const plan = generatePersonalRoadmap({
                    roleId: selectedRole,
                    years,
                    experienceLevel,
                    hoursPerWeek,
                    knownSkills,
                  });
                  if (!plan) return;
                  setSaving(true);
                  try {
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
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                {saving ? "Saving..." : "Generate & Save"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
