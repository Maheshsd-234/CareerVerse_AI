import React, { useMemo, useState } from "react";
import {
  BadgeIndianRupee,
  BookOpen,
  Briefcase,
  GraduationCap,
  Sparkles,
  TrendingUp,
  X,
  Search,
  Filter,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { Card, Badge, Button, ProgressBar } from "../components/UI";
import { roles } from "../data/roles";

type ExperienceLevel = "beginner" | "intermediate" | "experienced";

const parseLakhsRange = (range: string) => {
  // Expected formats like: "₹8L - ₹25L"
  const cleaned = range.replace(/\s/g, "");
  const match = cleaned.match(/₹?(\d+(?:\.\d+)?)L-₹?(\d+(?:\.\d+)?)L/i);
  if (!match) return null;
  const min = Number(match[1]);
  const max = Number(match[2]);
  if (!Number.isFinite(min) || !Number.isFinite(max)) return null;
  return { min, max };
};

const formatLakhsRange = (min: number, max: number) => {
  const toStr = (n: number) => (Number.isInteger(n) ? `${n}` : n.toFixed(1));
  return `₹${toStr(min)}L - ₹${toStr(max)}L`;
};

const salaryByLevel = (salaryRange: string) => {
  const parsed = parseLakhsRange(salaryRange);
  if (!parsed) {
    return {
      beginner: salaryRange,
      intermediate: salaryRange,
      experienced: salaryRange,
    } as Record<ExperienceLevel, string>;
  }

  const { min, max } = parsed;
  const bMin = Math.max(0, min * 0.7);
  const bMax = Math.max(bMin, min * 1.05);
  const iMin = Math.max(0, min * 0.95);
  const iMax = Math.max(iMin, (min + max) / 2);
  const eMin = Math.max(0, (min + max) / 2);
  const eMax = Math.max(eMin, max * 1.15);

  return {
    beginner: formatLakhsRange(bMin, bMax),
    intermediate: formatLakhsRange(iMin, iMax),
    experienced: formatLakhsRange(eMin, eMax),
  } as Record<ExperienceLevel, string>;
};

const splitSkillsByLevel = (skills: string[]) => {
  const unique = Array.from(new Set(skills));
  const b = unique.slice(0, 3);
  const i = unique.slice(1, 5);
  const e = unique.slice(2, 7);
  return {
    beginner: b.length ? b : unique.slice(0, Math.min(3, unique.length)),
    intermediate: i.length ? i : unique,
    experienced: e.length ? e : unique,
  } as Record<ExperienceLevel, string[]>;
};

export const RoleExplorerPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);

  const categories = [
    "All",
    ...new Set(roles.map((r) => r.category)),
  ];

  const filteredRoles = useMemo(() => {
    let filtered = roles;

    if (selectedCategory !== "All") {
      filtered = filtered.filter((r) => r.category === selectedCategory);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (r) =>
          r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered.sort((a, b) => b.trendScore - a.trendScore);
  }, [selectedCategory, searchTerm]);

  const selectedRole = useMemo(
    () => (selectedRoleId ? roles.find((r) => r.id === selectedRoleId) ?? null : null),
    [selectedRoleId]
  );

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl p-8">
        <h1 className="text-4xl font-bold mb-2">Role Explorer</h1>
        <p className="text-lg opacity-90">
          Discover different career roles, salary expectations, and skill requirements
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search roles..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-600"
        />
      </div>

      {/* Category Filter */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
          <Filter size={20} />
          Category
        </h3>
        <div className="flex gap-3 flex-wrap">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                selectedCategory === category
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-200 text-gray-900 hover:bg-gray-300"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Roles Grid */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {filteredRoles.length} Roles Found
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredRoles.map((role) => (
            <Card key={role.id} className="hover:shadow-lg transition">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{role.name}</h3>
                  <Badge variant="secondary">{role.category}</Badge>
                </div>
                <div className="flex items-center gap-1 bg-yellow-100 px-3 py-1 rounded-lg">
                  <TrendingUp size={18} className="text-yellow-600" />
                  <span className="font-bold text-yellow-700">{role.trendScore.toFixed(1)}</span>
                </div>
              </div>

              {/* Description */}
              <p className="text-gray-600 mb-4 text-sm">{role.description}</p>

              {/* Required Skills */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">
                  Required Skills
                </h4>
                <div className="flex flex-wrap gap-2">
                  {role.requiredSkills.map((skill) => (
                    <Badge key={skill} variant="primary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Salary */}
              <div className="mb-4 pb-4 border-b">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">
                  Salary Range
                </h4>
                <p className="text-lg font-bold text-indigo-600">
                  {role.salaryRange}
                </p>
              </div>

              {/* CTA */}
              <Button
                size="sm"
                className="w-full"
                onClick={() => setSelectedRoleId(role.id)}
              >
                View Details
              </Button>
            </Card>
          ))}
        </div>

        {filteredRoles.length === 0 && (
          <Card className="text-center py-12">
            <p className="text-gray-500 text-lg">No roles found matching your criteria</p>
          </Card>
        )}
      </div>

      {/* Details Modal */}
      {selectedRole && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSelectedRoleId(null)}
          />
          <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl ring-1 ring-black/5 overflow-hidden animate-slide-in">
            <div className="flex items-start justify-between p-6 border-b">
              <div>
                <h2 className="text-2xl font-extrabold text-gray-900">
                  {selectedRole.name}
                </h2>
                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary">{selectedRole.category}</Badge>
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                    <TrendingUp size={16} />
                    {selectedRole.trendScore.toFixed(1)}
                  </span>
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-indigo-50 text-indigo-700">
                    <Sparkles size={16} />
                    CareerVerse Insights
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedRoleId(null)}
                className="p-2 rounded-lg hover:bg-gray-100 transition"
                aria-label="Close"
              >
                <X />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <BookOpen size={18} className="text-indigo-600" />
                  Meaning
                </h3>
                <p className="text-sm text-gray-700">{selectedRole.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(() => {
                  const skillsBy = splitSkillsByLevel(selectedRole.requiredSkills);
                  const salary = salaryByLevel(selectedRole.salaryRange);

                  const sections: Array<{
                    key: ExperienceLevel;
                    title: string;
                    subtitle: string;
                    icon: React.ReactNode;
                    accent: string;
                  }> = [
                    {
                      key: "beginner",
                      title: "Beginner",
                      subtitle: "0–2 years",
                      icon: <GraduationCap size={18} />,
                      accent: "from-indigo-600 to-purple-600",
                    },
                    {
                      key: "intermediate",
                      title: "Intermediate",
                      subtitle: "2–5 years",
                      icon: <Briefcase size={18} />,
                      accent: "from-purple-600 to-pink-600",
                    },
                    {
                      key: "experienced",
                      title: "Experienced",
                      subtitle: "5–10+ years",
                      icon: <Sparkles size={18} />,
                      accent: "from-amber-500 to-orange-600",
                    },
                  ];

                  return sections.map((s) => (
                    <div
                      key={s.key}
                      className="rounded-2xl border bg-white shadow-sm overflow-hidden"
                    >
                      <div className={`p-4 text-white bg-gradient-to-r ${s.accent}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 font-bold">
                            {s.icon}
                            {s.title}
                          </div>
                          <div className="text-xs opacity-90">{s.subtitle}</div>
                        </div>
                      </div>
                      <div className="p-4 space-y-3">
                        <div>
                          <div className="text-xs font-semibold text-gray-600 mb-2">
                            Skill sets
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {skillsBy[s.key].map((sk) => (
                              <Badge key={`${s.key}-${sk}`} variant="primary">
                                {sk}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="pt-3 border-t">
                          <div className="text-xs font-semibold text-gray-600 mb-1 flex items-center gap-2">
                            <BadgeIndianRupee size={16} className="text-indigo-600" />
                            Salary expectation
                          </div>
                          <div className="text-sm font-bold text-gray-900">
                            {salary[s.key]}
                          </div>
                        </div>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
