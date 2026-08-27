import React, { useMemo, useState } from "react";
import { Plus, Route, Sparkles, X, Check, ArrowRight, BarChart3 } from "lucide-react";
import { Card, Badge, Button, ProgressBar } from "../../components/ui/UI";
import { useAuth } from "../../hooks/useAuth";
import { skills } from "../../data/skills";
import { roles } from "../../data/roles";
import { firestoreService } from "../../services/firestoreService";
import { useSkillGap } from "../../hooks/useSkillGap";

export const SkillGapPage: React.FC = () => {
  const { user, appUser } = useAuth();
  const [userSkills, setUserSkills] = useState<string[]>(appUser?.skills || []);
  const [selectedRole, setSelectedRole] = useState<string>(
    appUser?.selectedCareer || roles[0].id
  );
  const [isSaving, setIsSaving] = useState(false);
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
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const targetRoleObj = roles.find((r) => r.id === selectedRole);

  const availableSkills = useMemo(() => {
    return skills.filter((s) => !userSkills.includes(s.name));
  }, [userSkills]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Wayfinding Hero */}
      <div className="bg-[#12122B] text-white rounded-3xl p-6 sm:p-8 border border-white/10 shadow-xl relative overflow-hidden">
        <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[#F5A623]/20 blur-3xl" />
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-data font-bold tracking-wider uppercase bg-[#4F46E5] text-white">
            <BarChart3 size={14} />
            STATION 04 · SKILL GAP ANALYZER
          </span>
          <span className="text-xs font-mono text-gray-400">Competency Differential</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-display font-bold mb-2 text-white">
          Skill Gap Analysis
        </h1>
        <p className="text-sm sm:text-base font-body text-gray-300 max-w-2xl">
          Evaluate your current skill stack against destination industry benchmarks and pinpoint exact learning priorities.
        </p>
      </div>

      {/* Main Grid: Target Role Selector & Metric Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Role Target Selector */}
        <Card className="lg:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-lg font-display font-bold text-[#12122B]">
                Destination Role Target
              </h3>
              <p className="text-xs font-body text-[#6B7280]">Select the target career you are aiming for</p>
            </div>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              size="sm"
            >
              {isSaving ? "Saving..." : "Save Stack to Profile"}
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-6">
            {roles.map((r) => {
              const isSelected = selectedRole === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => setSelectedRole(r.id)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[#4F46E5] text-white border-[#4F46E5] shadow-xs font-bold"
                      : "bg-[#FAFAF7] border-gray-200 hover:border-gray-300 text-[#12122B]"
                  }`}
                >
                  <p className="text-xs font-display truncate">{r.name}</p>
                  <p className={`text-[10px] font-data ${isSelected ? "text-white/80" : "text-[#6B7280]"}`}>
                    {r.category}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Missing Skills Breakdown */}
          {analysis && (
            <div className="p-4 rounded-2xl bg-[#FAFAF7] border border-gray-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-data font-bold text-[#6B7280] uppercase">
                  Missing Competencies ({analysis.missingSkills.length})
                </span>
                <span className="text-xs font-data text-[#F5A623] font-bold">
                  High Priority
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {analysis.missingSkills.map((skill) => (
                  <button
                    key={skill}
                    onClick={() => handleAddSkill(skill)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-display font-semibold bg-white border border-amber-300 text-[#12122B] hover:bg-amber-50 cursor-pointer shadow-2xs"
                  >
                    <Plus size={14} className="text-[#F5A623]" />
                    {skill}
                  </button>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Compatibility Match Meter in IBM Plex Mono */}
        <Card className="flex flex-col justify-between bg-gradient-to-br from-white to-[#FAFAF7]">
          <div>
            <span className="text-xs font-data font-bold text-[#4F46E5] uppercase">
              METRIC COMPUTATION
            </span>
            <h3 className="text-xl font-display font-bold text-[#12122B] mt-1 mb-4">
              Role Match Score
            </h3>

            {/* Score Ring */}
            <div className="text-center py-4">
              <div className="inline-flex items-baseline gap-1">
                <span className="text-5xl sm:text-6xl font-data font-bold text-[#12122B]">
                  {analysis?.matchPercentage ?? 0}
                </span>
                <span className="text-xl font-data font-bold text-[#4F46E5]">%</span>
              </div>
              <p className="text-xs font-body text-[#6B7280] mt-2">
                Differential for <strong>{targetRoleObj?.name}</strong>
              </p>
            </div>

            <div className="space-y-2 mt-2">
              <ProgressBar
                progress={analysis?.matchPercentage ?? 0}
                showPercent={false}
                color={(analysis?.matchPercentage ?? 0) >= 70 ? "growth" : "milestone"}
              />
              <div className="flex justify-between text-[11px] font-data text-[#6B7280]">
                <span>{userSkills.length} Known</span>
                <span>{analysis?.missingSkills.length ?? 0} Remaining</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <span className="text-xs font-body text-[#6B7280]">
              {(analysis?.matchPercentage ?? 0) >= 75
                ? "🎯 High compatibility! Ready for portfolio projects and interview prep."
                : "⚡ Add missing skills from below to increase your hiring readiness."}
            </span>
          </div>
        </Card>
      </div>

      {/* Your Verified Skills Stack */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-display font-bold text-[#12122B]">
              Your Current Verified Skills ({userSkills.length})
            </h3>
            <p className="text-xs font-body text-[#6B7280]">Click to remove from stack</p>
          </div>
        </div>

        {userSkills.length === 0 ? (
          <p className="text-sm font-body text-[#6B7280] py-4 text-center">
            No skills added yet. Select from the skill bank below or type a custom skill.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {userSkills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#4F46E5]/10 border border-[#4F46E5]/20 text-xs font-display font-bold text-[#4F46E5]"
              >
                <Check size={14} className="text-[#14B8A6]" />
                {skill}
                <button
                  onClick={() => handleRemoveSkill(skill)}
                  className="hover:text-red-500 cursor-pointer ml-1"
                >
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Custom Skill Input */}
        <div className="mt-6 pt-4 border-t border-gray-100 flex gap-2">
          <input
            type="text"
            placeholder="Type custom skill (e.g. Next.js, FastAPI, PowerBI)..."
            value={customSkillInput}
            onChange={(e) => setCustomSkillInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddCustomSkill()}
            className="flex-1 px-3.5 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#4F46E5] text-xs font-body"
          />
          <Button size="sm" onClick={handleAddCustomSkill}>
            Add Custom Skill
          </Button>
        </div>
      </Card>

      {/* Skill Bank to Add */}
      <Card>
        <h3 className="text-lg font-display font-bold text-[#12122B] mb-2">
          Available Skills Catalog
        </h3>
        <p className="text-xs font-body text-[#6B7280] mb-4">
          Click any skill to instantly add to your profile stack
        </p>

        <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto pr-2">
          {availableSkills.map((skill) => (
            <button
              key={skill.name}
              onClick={() => handleAddSkill(skill.name)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-display font-medium bg-[#FAFAF7] border border-gray-200 text-[#12122B] hover:border-[#4F46E5] hover:bg-[#4F46E5]/5 transition-colors cursor-pointer"
            >
              <Plus size={12} className="text-[#6B7280]" />
              {skill.name}
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
};
