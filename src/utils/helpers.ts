export const formatSalary = (salaryRange: string): string => {
  return salaryRange;
};

export const calculateSkillMatch = (
  userSkills: string[],
  requiredSkills: string[]
): number => {
  if (requiredSkills.length === 0) return 100;
  const matchCount = requiredSkills.filter((skill) =>
    userSkills.includes(skill)
  ).length;
  return Math.round((matchCount / requiredSkills.length) * 100);
};

export const truncateText = (text: string, maxLength: number): string => {
  return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
};

export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

export const getInitials = (name: string): string => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
};
