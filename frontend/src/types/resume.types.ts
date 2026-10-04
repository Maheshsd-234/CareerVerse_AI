export interface EducationEntry {
  institution: string;
  degree: string;
  branch: string;
  gpa?: number | string;
  startYear: number | string;
  endYear: number | string;
}

export interface SkillCategory {
  category: string;
  items: string[];
}

export interface ExperienceEntry {
  company: string;
  role: string;
  duration: string;
  bullets: string[];
  isCurrentRole: boolean;
}

export interface ProjectEntry {
  title: string;
  description: string;
  technologies: string[];
  link?: string;
  date?: string;
}

export interface CertificationEntry {
  name: string;
  issuer: string;
  date: string;
}

export interface ResumeData {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  headline?: string;
  summary?: string;
  education: EducationEntry[];
  skills: SkillCategory[];
  experience: ExperienceEntry[];
  projects: ProjectEntry[];
  certifications: CertificationEntry[];
}

export interface UserResume {
  resumeId: string;
  templateId: "clean-simple" | "modern-minimal" | string;
  title: string;
  data: ResumeData;
  pdfUrl?: string;
  createdAt: Date | any;
  updatedAt: Date | any;
  isDefault?: boolean;
}

export type ResumeTemplateId = "clean-simple" | "modern-minimal";

export interface ResumeTemplateMeta {
  id: ResumeTemplateId;
  name: string;
  description: string;
  badge: string;
  accentColor: string;
}

export const RESUME_TEMPLATES: ResumeTemplateMeta[] = [
  {
    id: "clean-simple",
    name: "Clean & Simple",
    description: "Traditional single-column layout with clean dividers and high ATS readability.",
    badge: "ATS Optimized",
    accentColor: "#12122B",
  },
  {
    id: "modern-minimal",
    name: "Modern Minimal",
    description: "Contemporary design with sleek indigo headers, skill badge pills, and balanced margins.",
    badge: "Tech & Startup",
    accentColor: "#4F46E5",
  },
];

export const INITIAL_RESUME_DATA: ResumeData = {
  fullName: "",
  email: "",
  phone: "",
  location: "Bengaluru, India",
  linkedinUrl: "",
  githubUrl: "",
  portfolioUrl: "",
  headline: "Aspiring Software Engineer & Full Stack Developer",
  summary: "Driven Computer Science student with practical experience building modern web applications, scalable APIs, and algorithmic problem solving. Seeking entry-level software engineering roles to ship impactful features.",
  education: [
    {
      institution: "National Institute of Technology / VTU",
      degree: "B.Tech / B.E",
      branch: "Computer Science & Engineering",
      gpa: "8.6 / 10.0",
      startYear: 2022,
      endYear: 2026,
    },
  ],
  skills: [
    {
      category: "Programming Languages",
      items: ["Java", "JavaScript", "TypeScript", "Python", "SQL", "C++"],
    },
    {
      category: "Frameworks & Web Tech",
      items: ["React", "Next.js", "Node.js", "Express", "Tailwind CSS", "REST APIs"],
    },
    {
      category: "Tools & Cloud",
      items: ["Git / GitHub", "Docker Basics", "Postman", "MongoDB", "PostgreSQL", "AWS Basics"],
    },
  ],
  experience: [
    {
      company: "TechNova Solutions India",
      role: "Software Development Intern",
      duration: "Jun 2024 - Aug 2024",
      bullets: [
        "Engineered reusable React components and integrated REST APIs, reducing page load latency by 24%.",
        "Collaborated in agile sprint standups, resolved 18+ high-priority bug tickets, and wrote Jest unit tests.",
      ],
      isCurrentRole: false,
    },
  ],
  projects: [
    {
      title: "CareerVerse AI — Career Wayfinding Platform",
      description: "Full-stack intelligent transit wayfinding platform providing skill gap calculations, 4-year student roadmaps, and real-time live job matching for Indian engineering students.",
      technologies: ["React", "TypeScript", "Tailwind CSS", "Firebase Firestore", "Groq AI"],
      link: "https://github.com/example/careerverse-ai",
      date: "2025",
    },
    {
      title: "Distributed Task Queue & Microservice API",
      description: "Asynchronous background job worker with Redis caching and PostgreSQL transactional logging, processing 5,000+ mock events/sec.",
      technologies: ["Node.js", "Redis", "PostgreSQL", "Docker"],
      link: "https://github.com/example/task-queue",
      date: "2024",
    },
  ],
  certifications: [
    {
      name: "AWS Certified Cloud Practitioner",
      issuer: "Amazon Web Services",
      date: "2024",
    },
  ],
};
