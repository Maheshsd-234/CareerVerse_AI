import React, { useMemo, useState } from "react";
import { Plus, Route, Sparkles, X } from "lucide-react";
import { Card, Badge, Button, ProgressBar } from "../../components/ui/UI";
import { useAuth } from "../../hooks/useAuth";
import { skills } from "../../data/skills";
import { roles } from "../../data/roles";
import { firestoreService } from "../../services/firestoreService";
import { useSkillGap } from "../../hooks/useSkillGap";

type ExperienceLevel = "Beginner" | "Intermediate" | "Experienced";

const splitMissingByLevel = (missingSkills: string[]) => {
  const unique = Array.from(new Set(missingSkills));
  return {
    Beginner: unique.slice(0, 3),
    Intermediate: unique.slice(0, 6),
    Experienced: unique.slice(0, 10),
  } satisfies Record<ExperienceLevel, string[]>;
};

const buildLearningPath = (missingSkills: string[]) => {
  const unique = Array.from(new Set(missingSkills));
  const weeks = [
    { title: "Month 1 (Basics)", items: unique.slice(0, 3) },
    { title: "Month 2 (Practice)", items: unique.slice(3, 6) },
    { title: "Month 3 (Projects)", items: unique.slice(6, 10) },
  ].filter((w) => w.items.length > 0);
  return weeks;
};

export const SkillGapPage: React.FC = () => {
  const { user, appUser } = useAuth();
  const [userSkills, setUserSkills] = useState<string[]>(appUser?.skills || []);
  const [selectedRole, setSelectedRole] = useState<string>(
    appUser?.selectedCareer || ""
  );
  const [isSaving, setIsSaving] = useState(false);
  const [learningOpen, setLearningOpen] = useState(false);
  const [customSkillInput, setCustomSkillInput] = useState("");

  const analysis = useSkillGap(userSkills, selectedRole);

  const handleAddSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (!trimmed) return;
    const exists = userSkills.some(
      (s) => s.toLowerCase() === trimmed.toLowerCase()
    );
    if (!exists) {
      setUserSkills([...userSkills, trimmed]);
    }
  };

  const handleAddCustomSkill = () => {
    handleAddSkill(customSkillInput);
    setCustomSkillInput("");
  };

  const handleRemoveSkill = (skill: string) => {
    setUserSkills(userSkills.filter((s) => s !== skill));
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await firestoreService.updateUserSkills(user.uid, userSkills);
      if (selectedRole) {
        await firestoreService.updateSelectedCareer(user.uid, selectedRole);
      }
      alert("Skills updated successfully!");
    } catch (error) {
      console.error("Save error:", error);
      alert("Failed to save skills");
    } finally {
      setIsSaving(false);
    }
  };

  const skillsByCategory = skills.reduce(
    (acc, skill) => {
      if (!acc[skill.category]) acc[skill.category] = [];
      acc[skill.category].push(skill);
      return acc;
    },
    {} as Record<string, typeof skills>
  );

  const availableSkillNames = useMemo(() => skills.map((s) => s.name), []);
  const filteredAvailable = useMemo(
    () => availableSkillNames.filter((n) => !userSkills.includes(n)),
    [availableSkillNames, userSkills]
  );

  const missingByLevel = useMemo(
    () => (analysis ? splitMissingByLevel(analysis.missingSkills) : null),
    [analysis]
  );

  const learningPath = useMemo(
    () => (analysis ? buildLearningPath(analysis.missingSkills) : []),
    [analysis]
  );

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl p-8">
        <h1 className="text-4xl font-bold mb-2">Skill Gap Analyzer</h1>
        <p className="text-lg opacity-90">
          Compare your skills with role requirements and identify gaps
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Your Skills */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Your Skills ({userSkills.length})
            </h2>
            <div className="space-y-2 max-h-96 overflow-y-auto mb-4">
              {userSkills.length === 0 ? (
                <p className="text-gray-500 text-sm">No skills added yet</p>
              ) : (
                userSkills.map((skill) => (
                  <div
                    key={skill}
                    className="flex items-center justify-between bg-indigo-50 p-2 rounded-lg"
                  >
                    <span className="text-sm font-medium text-indigo-900">
                      {skill}
                    </span>
                    <button
                      onClick={() => handleRemoveSkill(skill)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="w-full"
            >
              {isSaving ? "Saving..." : "Save Skills"}
            </Button>
            <p className="mt-3 text-xs text-gray-500">
              Tip: after saving, your skills are stored in Firestore and will be loaded on refresh.
            </p>
          </Card>
        </div>

        {/* Middle: Add Skills */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Add Skills</h2>
            <div className="space-y-3">
              <div>
                <label
                  htmlFor="custom-skill"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Add your own skill
                </label>
                <div className="flex gap-2">
                  <input
                    id="custom-skill"
                    type="text"
                    value={customSkillInput}
                    onChange={(e) => setCustomSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddCustomSkill();
                      }
                    }}
                    placeholder="e.g. Figma, React Native, Hindi..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddCustomSkill}
                    disabled={!customSkillInput.trim()}
                  >
                    Add
                  </Button>
                </div>
              </div>

              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Or pick from the list
              </p>

              <div className="flex flex-wrap gap-2 max-h-72 overflow-y-auto pr-1">
                {filteredAvailable.length === 0 ? (
                  <div className="text-sm text-gray-500">All skills added.</div>
                ) : (
                  filteredAvailable.map((name) => (
                    <button
                      key={name}
                      onClick={() => handleAddSkill(name)}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-gray-50 hover:bg-indigo-50 text-gray-800 text-sm ring-1 ring-gray-200 transition"
                    >
                      <Plus size={14} className="text-indigo-600" />
                      {name}
                    </button>
                  ))
                )}
              </div>
              <div className="text-xs text-gray-500">
                Type a custom skill above, or click a skill below to add it to your profile.
              </div>
            </div>
          </Card>
        </div>

        {/* Right: Gap Analysis */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Target Role</h2>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-600"
            >
              <option value="">Select a role...</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>

            {analysis && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">
                    Match Score
                  </h3>
                  <ProgressBar
                    progress={analysis.matchPercentage}
                    showPercent={true}
                  />
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">
                    Missing Skills ({analysis.missingSkills.length})
                  </h3>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {analysis.missingSkills.length === 0 ? (
                      <p className="text-green-600 text-sm font-medium">
                        ✓ You have all required skills!
                      </p>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-sm text-gray-600">
                          You’re missing some skills for this role. Here’s what to learn next:
                        </p>
                        {missingByLevel && (
                          <div className="space-y-2">
                            {(
                              Object.keys(missingByLevel) as Array<ExperienceLevel>
                            ).map((level) => (
                              <div key={level} className="bg-gray-50 rounded-xl p-3">
                                <div className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-2">
                                  <Sparkles size={14} className="text-indigo-600" />
                                  {level}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {missingByLevel[level].length === 0 ? (
                                    <span className="text-xs text-green-700 font-medium">
                                      You’re ready for this level.
                                    </span>
                                  ) : (
                                    missingByLevel[level].map((sk) => (
                                      <Badge key={`${level}-${sk}`} variant="warning">
                                        {sk}
                                      </Badge>
                                    ))
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <Button
                  size="sm"
                  className="w-full"
                  variant="outline"
                  onClick={() => setLearningOpen(true)}
                  disabled={analysis.missingSkills.length === 0}
                >
                  Create Learning Path
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Learning Path Modal */}
      {learningOpen && analysis && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setLearningOpen(false)}
          />
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl ring-1 ring-black/5 overflow-hidden animate-slide-in">
            <div className="flex items-start justify-between p-6 border-b">
              <div>
                <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
                  <Route size={20} className="text-indigo-600" />
                  Your Learning Path
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  A simple month-by-month plan based on missing skills.
                </p>
              </div>
              <button
                onClick={() => setLearningOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 transition"
                aria-label="Close"
              >
                <X />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {analysis.missingSkills.length === 0 ? (
                <div className="text-sm text-green-700 font-medium">
                  ✓ You have all required skills for this role.
                </div>
              ) : learningPath.length === 0 ? (
                <div className="text-sm text-gray-600">
                  Add a few more skills or pick a target role to generate a learning path.
                </div>
              ) : (
                learningPath.map((m) => (
                  <div key={m.title} className="rounded-2xl border bg-gray-50 p-4">
                    <div className="font-bold text-gray-900">{m.title}</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {m.items.map((sk) => (
                        <Badge key={`${m.title}-${sk}`} variant="primary">
                          {sk}
                        </Badge>
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-gray-600">
                      Focus on fundamentals + small projects using these skills.
                    </p>
                  </div>
                ))
              )}
            </div>

            <div className="p-6 pt-0">
              <Button className="w-full" onClick={() => setLearningOpen(false)}>
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
