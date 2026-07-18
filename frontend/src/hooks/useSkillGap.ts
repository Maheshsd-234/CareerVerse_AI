import { useEffect, useState } from "react";
import { roles } from "../data/roles";
import type { SkillGapAnalysis } from "../types";

export const useSkillGap = (userSkills: string[], roleId: string) => {
  const [analysis, setAnalysis] = useState<SkillGapAnalysis | null>(null);

  useEffect(() => {
    if (!roleId) {
      setAnalysis(null);
      return;
    }

    const role = roles.find((r) => r.id === roleId);
    if (!role) {
      setAnalysis(null);
      return;
    }

    const missingSkills = role.requiredSkills.filter(
      (skill) => !userSkills.includes(skill)
    );
    const matchPercentage = Math.round(
      ((role.requiredSkills.length - missingSkills.length) /
        role.requiredSkills.length) *
        100
    );

    setAnalysis({
      userSkills,
      roleRequiredSkills: role.requiredSkills,
      missingSkills,
      matchPercentage,
    });
  }, [roleId, userSkills]);

  return analysis;
};
