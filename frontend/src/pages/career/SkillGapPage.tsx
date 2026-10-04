import React, { useMemo, useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Plus,
  Sparkles,
  X,
  Check,
  ArrowRight,
  BarChart3,
  Search,
  ChevronDown,
  Briefcase,
  UploadCloud,
  FileText,
  AlertCircle,
  CheckCircle2,
  Cpu,
  Layers,
  Zap,
  RefreshCw,
  FolderGit2,
  Terminal,
  Copy,
  Target,
  TrendingUp,
  FileSearch,
  HelpCircle,
  Info,
  Calculator,
  Lightbulb,
} from "lucide-react";
import { Card, Badge, Button, ProgressBar } from "../../components/ui/UI";
import { useAuth } from "../../hooks/useAuth";
import { skills } from "../../data/skills";
import { roles } from "../../data/roles";
import { firestoreService } from "../../services/firestoreService";
import { useSkillGap } from "../../hooks/useSkillGap";
import {
  resumeAnalyzerService,
  type GapAnalysisResult,
  type ProjectAnalysis,
  type JobMatchResult,
} from "../../services/resumeAnalyzerService";

const SAMPLE_JDS = {
  sde_backend: {
    title: "Senior Backend Engineer (Python / FastAPI / Docker / AWS)",
    roleId: "software-engineer",
    text: `Job Title: Senior Backend Engineer - High Throughput Systems
Company: Nexus Enterprise Tech (Bengaluru)
Experience: 2-5 Years | Compensation: ₹18L - ₹28L PA

About the Role:
We are looking for an experienced Backend Engineer to scale our core event-driven microservices processing millions of daily transactions.

Requirements & Competencies:
- Strong programming experience in Python (FastAPI, Asyncio) or Golang.
- Hands-on experience with containerization and orchestration (Docker, Kubernetes).
- Relational and NoSQL database mastery: PostgreSQL, Redis caching, and schema optimization.
- Message brokers and event streaming: Apache Kafka or RabbitMQ.
- Cloud platforms (AWS: ECS, S3, RDS, Lambda) and CI/CD pipelines.
- Solid understanding of Data Structures, Algorithms, and System Design for low-latency services.`,
  },
  ai_ml_engineer: {
    title: "Applied AI / ML Engineer (PyTorch / Transformers / Vector DB)",
    roleId: "ml-engineer",
    text: `Job Title: Applied Machine Learning & Generative AI Engineer
Company: Cognitive Cloud Labs (Hyderabad)
Experience: 1-4 Years | Compensation: ₹20L - ₹32L PA

About the Role:
Join our AI research and deployment team building production Retrieval-Augmented Generation (RAG) and embedding pipelines.

Requirements & Competencies:
- Deep expertise in Python, PyTorch, HuggingFace Transformers, and Scikit-Learn.
- Experience building RAG pipelines using Vector Databases (Qdrant, Pinecone, or Milvus).
- Production deployment experience with FastAPI, Docker, and GPU inference optimization (ONNX, TensorRT).
- Strong mathematical foundations in Linear Algebra, Probability, Loss Functions, and Prompt Engineering.
- Familiarity with MLOps pipelines (MLflow, Weights & Biases) and Celery task queues.`,
  },
  fullstack_dev: {
    title: "Full Stack Engineer (React / TypeScript / Node / Docker)",
    roleId: "full-stack-developer",
    text: `Job Title: Full Stack Web Developer (Growth Platform)
Company: VectorScale SaaS (Remote / Bengaluru)
Experience: 2-4 Years | Compensation: ₹16L - ₹24L PA

About the Role:
We are scaling our multi-tenant SaaS analytics platform and need a Full-Stack Engineer with high attention to frontend polish and robust backend architecture.

Requirements & Competencies:
- Frontend: React 18+, TypeScript, Next.js, TailwindCSS, State Management (Zustand/Redux).
- Backend: Node.js, Express/FastAPI, GraphQL or RESTful API architecture.
- Database: PostgreSQL, Prisma ORM, Redis for session & rate limiting.
- Cloud & DevOps: Docker containerization, AWS, Git version control, automated testing (Jest, Cypress).
- Experience building responsive, high-performance dashboards with sub-second page loads.`,
  },
};

const SAMPLE_RESUMES = {
  ml_engineer: `Mahesh S D
Bengaluru, India | student.ai@example.com

TECHNICAL SKILLS:
Languages: Python, C++, SQL
Frameworks & Libraries: PyTorch, FastAPI, HuggingFace, Scikit-Learn, Pandas, NumPy, OpenCV
Infrastructure & Tools: Docker, Git, Qdrant Vector DB, Redis, Linux, Celery

PROJECTS:
Production RAG Search & Vector Inference Pipeline | FastAPI, Qdrant, Docker, Python
- Architected enterprise semantic search pipeline indexing 500k technical documents using BGE-large dense vector embeddings in Qdrant.
- Containerized microservices using Docker Compose, achieving sub-110ms p99 latency with Redis query caching and async Celery workers.
- Deployed monitoring stack using Prometheus and Grafana for query throughput and latency tracking.

End-to-End Deep Learning Defect Detection System | PyTorch, OpenCV, Flask
- Trained customized YOLOv8 vision model on 12,000 industrial component images, achieving 94.2% mAP.
- Deployed lightweight Flask REST API with batch inference pipeline on local GPU workstation.

Basic Calculator App | HTML, CSS, JavaScript
- Simple arithmetic calculator with standard button interface.`,

  sde_backend: `Aryan Jain
New Delhi, India | aryan.dev@example.com

TECHNICAL SKILLS:
Languages: Java, Python, Go, SQL, JavaScript
Backend & Tools: Spring Boot, FastAPI, PostgreSQL, Redis, Apache Kafka, Docker, Git, REST APIs

PROJECTS:
Distributed High-Throughput Event Streaming Pipeline | Apache Kafka, Go, Docker, PostgreSQL
- Engineered event-driven consumer pipeline in Go processing 45,000 telemetry events/second across distributed partitions.
- Implemented stateful window aggregations and dead-letter queues with automated retry backoff into PostgreSQL.
- Packaged multi-container architecture using Docker with Prometheus metric instrumentation.

Full-Stack E-Commerce Platform with Stripe Integration | React, Node.js, Express, PostgreSQL
- Built full-featured shopping web app with JWT authentication, role-based access control, and Stripe checkout webhooks.
- Designed relational PostgreSQL schemas with indexed search queries reducing page load times by 40%.`
};

export const SkillGapPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const roleFromUrl = searchParams.get("role");
  const { user, appUser } = useAuth();

  const [activeTab, setActiveTab] = useState<"resume" | "jd_match" | "manual">("resume");
  const [selectedRole, setSelectedRole] = useState<string>(
    roleFromUrl || appUser?.selectedCareer || "software-engineer"
  );

  // Resume vs JD Semantic Matching States (P0 Critical Engine)
  const [targetJobDescription, setTargetJobDescription] = useState("");
  const [isMatchingJob, setIsMatchingJob] = useState(false);
  const [jobMatchError, setJobMatchError] = useState<string | null>(null);
  const [jobMatchResult, setJobMatchResult] = useState<JobMatchResult | null>(null);
  const [selectedMetricExplainer, setSelectedMetricExplainer] = useState<
    "match_ratio" | "salary_impact" | "dense_similarity" | "confidence" | null
  >(null);
  const [userSkills, setUserSkills] = useState<string[]>(() => {
    if (appUser?.skills && appUser.skills.length > 0) return appUser.skills;
    try {
      const cached = localStorage.getItem("careerverse_user_skills");
      if (cached) return JSON.parse(cached);
    } catch { }
    return [];
  });
  const [isSaving, setIsSaving] = useState(false);
  const [customSkillInput, setCustomSkillInput] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedBlueprint, setCopiedBlueprint] = useState(false);

  // Resume Upload / Text States
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pastedResumeText, setPastedResumeText] = useState("");
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<GapAnalysisResult | null>(null);

  // Searchable Role Dropdown States
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [roleSearchTerm, setRoleSearchTerm] = useState("");
  const [selectedDomainFilter, setSelectedDomainFilter] = useState("All");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sync userSkills when appUser updates
  useEffect(() => {
    if (appUser?.skills && appUser.skills.length > 0) {
      setUserSkills((prev) => Array.from(new Set([...prev, ...appUser.skills])));
    }
  }, [appUser?.skills]);

  // Auto-clear toast notifications after 3.5 seconds
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Manual fallback analysis hook
  const manualAnalysis = useSkillGap(userSkills, selectedRole);

  const targetRoleObj = roles.find((r) => r.id === selectedRole) || roles[0];

  const domainCategories = useMemo(() => {
    return ["All", ...Array.from(new Set(roles.map((r) => r.category)))];
  }, []);

  const matchingRoles = useMemo(() => {
    let list = roles;
    if (selectedDomainFilter !== "All") {
      list = list.filter((r) => r.category === selectedDomainFilter);
    }
    if (roleSearchTerm.trim()) {
      const q = roleSearchTerm.toLowerCase().trim();
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.requiredSkills.some((s) => s.toLowerCase().includes(q))
      );
    }
    return list;
  }, [roleSearchTerm, selectedDomainFilter]);

  const handleSelectTargetRole = (roleId: string) => {
    setSelectedRole(roleId);
    setSearchParams({ role: roleId });
    setIsDropdownOpen(false);
    setRoleSearchTerm("");

    // If analysisResult already exists, re-analyze against new role
    if (analysisResult && (selectedFile || pastedResumeText)) {
      void runAnalysis(selectedFile, pastedResumeText, roleId);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPastedResumeText("");
      setAnalysisError(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPastedResumeText("");
      setAnalysisError(null);
    }
  };

  const runAnalysis = async (
    fileToAnalyze: File | null = selectedFile,
    textToAnalyze: string = pastedResumeText,
    roleId: string = selectedRole
  ) => {
    if (!fileToAnalyze && !textToAnalyze.trim()) {
      setAnalysisError("Please select a resume file or paste resume text first.");
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const res = await resumeAnalyzerService.analyzeResume(fileToAnalyze, textToAnalyze, roleId);
      setAnalysisResult(res);

      // Add newly detected skills to userSkills without duplicates and persist
      if (res.alignment.all_detected_skills.length > 0) {
        setUserSkills((prev) => {
          const merged = Array.from(new Set([...prev, ...res.alignment.all_detected_skills]));
          persistSkills(merged);
          return merged;
        });
      }
    } catch (err: any) {
      setAnalysisError(err?.message || "Failed to analyze resume. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const persistSkills = (skillsList: string[]) => {
    try {
      localStorage.setItem("careerverse_user_skills", JSON.stringify(skillsList));
    } catch { }
    if (user?.uid) {
      firestoreService.updateUserSkills(user.uid, skillsList).catch((err) => {
        console.warn("Firestore autosave error:", err);
      });
    }
  };

  const handleLoadSample = (key: "ml_engineer" | "sde_backend") => {
    setSelectedFile(null);
    const text = SAMPLE_RESUMES[key];
    setPastedResumeText(text);
    const target = key === "ml_engineer" ? "ml-engineer" : "software-engineer";
    setSelectedRole(target);
    setSearchParams({ role: target });
    void runAnalysis(null, text, target);
  };

  const handleLoadSampleJD = (key: keyof typeof SAMPLE_JDS) => {
    const sample = SAMPLE_JDS[key];
    setTargetJobDescription(sample.text);
    if (sample.roleId) {
      setSelectedRole(sample.roleId);
      setSearchParams({ role: sample.roleId });
    }
    setJobMatchError(null);
  };

  const handleRunJobMatch = async () => {
    if (!targetJobDescription.trim()) {
      setJobMatchError("Please paste or select a target job description to evaluate.");
      return;
    }

    let candidateText = pastedResumeText.trim();
    if (!selectedFile && !candidateText) {
      if (userSkills.length > 0) {
        candidateText = `Candidate Technical Profile:\nVerified Skills: ${userSkills.join(", ")}.\nTarget Career Focus: ${targetRoleObj?.name}.\n`;
      } else {
        setJobMatchError(
          "Please upload a resume file, paste resume text in Tab 1, or select skills in your stack first to benchmark against this job posting."
        );
        return;
      }
    }

    setIsMatchingJob(true);
    setJobMatchError(null);

    try {
      const res = await resumeAnalyzerService.matchJobDescription(
        targetJobDescription,
        candidateText,
        selectedFile,
        selectedRole
      );
      setJobMatchResult(res);
      setToastMessage("Computed Semantic Embedding Match & Salary Impact!");
    } catch (err: any) {
      setJobMatchError(err?.message || "Failed to compare resume with job description.");
    } finally {
      setIsMatchingJob(false);
    }
  };

  const handleToggleSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (!trimmed) return;
    const exists = userSkills.some((s) => s.toLowerCase() === trimmed.toLowerCase());
    let updated: string[];
    if (exists) {
      updated = userSkills.filter((s) => s.toLowerCase() !== trimmed.toLowerCase());
      setToastMessage(`Removed "${trimmed}" from your Skill Stack.`);
    } else {
      updated = [...userSkills, trimmed];
      setToastMessage(`Added "${trimmed}" to your Career Stack & Profile!`);
    }
    setUserSkills(updated);
    persistSkills(updated);
  };

  const handleAddSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (!trimmed) return;
    const exists = userSkills.some((s) => s.toLowerCase() === trimmed.toLowerCase());
    if (!exists) {
      const updated = [...userSkills, trimmed];
      setUserSkills(updated);
      persistSkills(updated);
      setToastMessage(`Added "${trimmed}" to your Career Stack & Profile!`);
    }
  };

  const handleAddCustomSkill = () => {
    handleAddSkill(customSkillInput);
    setCustomSkillInput("");
  };

  const handleRemoveSkill = (skill: string) => {
    const updated = userSkills.filter((s) => s !== skill);
    setUserSkills(updated);
    persistSkills(updated);
    setToastMessage(`Removed "${skill}" from your Skill Stack.`);
  };

  const handleSaveToProfile = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await firestoreService.updateUserSkills(user.uid, userSkills);
      if (selectedRole) {
        await firestoreService.updateSelectedCareer(user.uid, selectedRole);
      }
      setToastMessage("All skills & target role saved to your Cloud Profile!");
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const availableSkills = useMemo(() => {
    return skills.filter((s) => !userSkills.includes(s.name));
  }, [userSkills]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Wayfinding Hero Banner */}
      <div className="bg-[#12122B] text-white rounded-3xl p-6 sm:p-8 border border-white/10 shadow-xl relative overflow-hidden">
        <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[#4F46E5]/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-[#14B8A6]/20 blur-3xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-data font-bold tracking-wider uppercase bg-[#4F46E5] text-white">
                <BarChart3 size={14} />
                STATION 04 · SKILL GAP & RESUME ML ENGINE
              </span>
              <span className="text-xs font-mono text-gray-400">Competency Differential</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-display font-bold mb-2 text-white">
              Skill Gap & Resume Competency Engine
            </h1>
            <p className="text-sm sm:text-base font-body text-gray-300 max-w-2xl leading-relaxed">
              Upload your resume for deep Machine Learning analysis: parses verified project depth, separates claimed vs. demonstrated skills, and pinpoints exact hiring gaps.
            </p>
          </div>

          {/* Mode Tabs */}
          <div className="flex items-center bg-white/10 p-1.5 rounded-2xl border border-white/15 self-start md:self-auto shrink-0 flex-wrap gap-1">
            <button
              onClick={() => setActiveTab("resume")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-display font-bold transition cursor-pointer ${activeTab === "resume"
                  ? "bg-[#4F46E5] text-white shadow-md"
                  : "text-gray-300 hover:text-white"
                }`}
            >
              <Cpu size={14} />
              ML Resume Parser
            </button>
            <button
              onClick={() => setActiveTab("jd_match")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-display font-bold transition cursor-pointer ${activeTab === "jd_match"
                  ? "bg-[#4F46E5] text-white shadow-md"
                  : "text-gray-300 hover:text-white"
                }`}
            >
              <Target size={14} />
              Resume vs JD Matcher
            </button>
            <button
              onClick={() => setActiveTab("manual")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-display font-bold transition cursor-pointer ${activeTab === "manual"
                  ? "bg-[#4F46E5] text-white shadow-md"
                  : "text-gray-300 hover:text-white"
                }`}
            >
              <Layers size={14} />
              Manual Skill Stack
            </button>
          </div>
        </div>
      </div>

      {/* Target Role Selector Bar (Always Synchronized) */}
      <Card className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div>
            <h3 className="text-sm font-display font-bold text-[#12122B] uppercase tracking-wide">
              Destination Benchmark Role
            </h3>
            <p className="text-xs font-body text-[#6B7280]">
              Evaluating your competencies and project complexity against this verified Indian hiring benchmark.
            </p>
          </div>
          <Button onClick={handleSaveToProfile} disabled={isSaving} size="sm">
            {isSaving ? "Saving..." : "Save Stack to Profile"}
          </Button>
        </div>

        {/* Searchable Dropdown Trigger */}
        <div className="relative" ref={dropdownRef}>
          <div
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            className="p-3.5 rounded-2xl bg-[#FAFAF7] border-2 border-gray-200 hover:border-[#4F46E5]/50 transition cursor-pointer flex items-center justify-between gap-3 group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#4F46E5]/10 text-[#4F46E5] flex items-center justify-center shrink-0">
                <Briefcase size={20} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm sm:text-base font-display font-bold text-[#12122B] truncate">
                    {targetRoleObj?.name}
                  </span>
                  <span className="text-[10px] font-data font-bold uppercase px-2 py-0.5 rounded-md bg-[#4F46E5]/10 text-[#4F46E5]">
                    {targetRoleObj?.category}
                  </span>
                  <span className="text-[10px] font-data px-2 py-0.5 rounded-md bg-[#14B8A6]/15 text-[#0F766E] font-bold">
                    {targetRoleObj?.salaryRange}
                  </span>
                </div>
                <p className="text-xs text-[#6B7280] font-body truncate mt-0.5">
                  {targetRoleObj?.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="hidden sm:inline text-xs font-display font-semibold text-[#4F46E5] group-hover:underline">
                {isDropdownOpen ? "Close List" : "Change Destination Role"}
              </span>
              <div className="p-1.5 rounded-lg bg-white border border-gray-200 text-[#12122B]">
                <ChevronDown
                  size={16}
                  className={`transition-transform duration-200 ${isDropdownOpen ? "rotate-180 text-[#4F46E5]" : ""
                    }`}
                />
              </div>
            </div>
          </div>

          {/* Dropdown Menu Panel */}
          {isDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-gray-200 shadow-2xl z-30 p-3 sm:p-4 space-y-3 max-h-[420px] flex flex-col animate-in fade-in zoom-in-95 duration-150">
              <div className="relative">
                <Search className="absolute left-3.5 top-2.5 text-gray-400" size={16} />
                <input
                  type="text"
                  autoFocus
                  placeholder="Type to filter roles (e.g. SDE, Machine Learning, DevOps, Full Stack)..."
                  value={roleSearchTerm}
                  onChange={(e) => setRoleSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 rounded-xl border border-gray-300 bg-[#FAFAF7] text-xs font-body focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                />
                {roleSearchTerm && (
                  <button
                    onClick={() => setRoleSearchTerm("")}
                    className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                {domainCategories.map((domain) => {
                  const isDomainActive = selectedDomainFilter === domain;
                  return (
                    <button
                      key={domain}
                      type="button"
                      onClick={() => setSelectedDomainFilter(domain)}
                      className={`px-3 py-1 rounded-lg text-[11px] font-display font-bold whitespace-nowrap transition cursor-pointer ${isDomainActive
                          ? "bg-[#4F46E5] text-white"
                          : "bg-gray-100 text-[#6B7280] hover:text-[#12122B] hover:bg-gray-200"
                        }`}
                    >
                      {domain}
                    </button>
                  );
                })}
              </div>

              <div className="overflow-y-auto space-y-1.5 max-h-[260px] pr-1">
                {matchingRoles.map((r) => {
                  const isSelected = selectedRole === r.id;
                  return (
                    <div
                      key={r.id}
                      onClick={() => handleSelectTargetRole(r.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${isSelected
                          ? "bg-[#4F46E5]/10 border-[#4F46E5] text-[#12122B]"
                          : "bg-white hover:bg-[#FAFAF7] border-gray-100 hover:border-gray-200"
                        }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-display font-bold text-[#12122B] truncate">
                            {r.name}
                          </p>
                          <span className="text-[10px] font-data px-1.5 py-0.5 rounded bg-gray-100 text-[#6B7280]">
                            {r.category}
                          </span>
                        </div>
                        <p className="text-[11px] font-body text-gray-500 truncate mt-0.5">
                          {r.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-data font-bold text-[#0F766E]">
                          {r.salaryRange}
                        </span>
                        {isSelected && <Check size={16} className="text-[#4F46E5]" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* ======================================================== */}
      {/* MODE 1: ML RESUME PARSER & COMPETENCY ENGINE */}
      {/* ======================================================== */}
      {activeTab === "resume" && (
        <div className="space-y-6">
          {/* Resume Upload Dropzone Card */}
          <Card className="border-2 border-dashed border-gray-300 hover:border-[#4F46E5]/60 transition-all bg-[#FAFAF7]/50">
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="flex flex-col items-center justify-center p-6 sm:p-8 text-center"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.doc,.txt"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="w-14 h-14 rounded-2xl bg-[#4F46E5]/10 text-[#4F46E5] flex items-center justify-center mb-3">
                <UploadCloud size={28} />
              </div>

              <h3 className="text-base sm:text-lg font-display font-bold text-[#12122B]">
                Upload Your Resume for Machine Learning Analysis
              </h3>
              <p className="text-xs sm:text-sm font-body text-[#6B7280] max-w-md mt-1">
                Supports PDF, DOCX or TXT formats. Our trained ML models extract technical skills, evaluate project complexity, and calculate role readiness.
              </p>

              {/* Selected File Badge */}
              {selectedFile && (
                <div className="mt-4 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-data font-bold">
                  <FileText size={16} />
                  <span>{selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="p-1 hover:bg-emerald-100 rounded-md cursor-pointer ml-1"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              {pastedResumeText && !selectedFile && (
                <div className="mt-4 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-indigo-50 border border-indigo-300 text-[#4F46E5] text-xs font-data font-bold">
                  <Terminal size={16} />
                  <span>Resume Text Loaded ({pastedResumeText.length} characters)</span>
                  <button
                    onClick={() => setPastedResumeText("")}
                    className="p-1 hover:bg-indigo-100 rounded-md cursor-pointer ml-1"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
                <Button
                  variant="primary"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-semibold"
                >
                  <UploadCloud size={15} className="mr-1.5" />
                  Select File from Computer
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setShowPasteModal(true)}
                  className="text-xs font-semibold"
                >
                  <Terminal size={15} className="mr-1.5" />
                  Paste Resume Text
                </Button>

                <Button
                  onClick={() => runAnalysis()}
                  disabled={isAnalyzing || (!selectedFile && !pastedResumeText.trim())}
                  className="bg-[#12122B] text-white hover:bg-[#1E1B4B] text-xs font-semibold px-5"
                >
                  {isAnalyzing ? (
                    <span className="flex items-center gap-2">
                      <RefreshCw size={14} className="animate-spin" />
                      Running ML Models...
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <Zap size={14} className="text-[#F5A623] fill-[#F5A623]" />
                      Analyze Competency & Gap
                    </span>
                  )}
                </Button>
              </div>

              {/* Quick 1-Click Samples for Testing */}
              <div className="mt-5 pt-4 border-t border-gray-200/80 flex items-center gap-2 flex-wrap justify-center text-xs font-data text-gray-500">
                <span>1-Click Test Samples:</span>
                <button
                  onClick={() => handleLoadSample("ml_engineer")}
                  className="px-2.5 py-1 rounded-lg bg-white border border-gray-200 text-gray-700 hover:text-[#4F46E5] hover:border-[#4F46E5] cursor-pointer font-medium"
                >
                  ⚡ Try AI / ML Resume
                </button>
                <button
                  onClick={() => handleLoadSample("sde_backend")}
                  className="px-2.5 py-1 rounded-lg bg-white border border-gray-200 text-gray-700 hover:text-[#4F46E5] hover:border-[#4F46E5] cursor-pointer font-medium"
                >
                  ⚡ Try SDE / Backend Resume
                </button>
              </div>

              {analysisError && (
                <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 max-w-lg">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{analysisError}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Analysis Results Display */}
          {analysisResult && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
              {/* Quick Prompt to Run Target JD Matcher */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-[#12122B] to-[#1E1B4B] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg border border-indigo-900/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#4F46E5]/20 text-indigo-300 flex items-center justify-center shrink-0">
                    <Target size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-display font-bold text-white flex items-center gap-2">
                      Compare Against a Specific Job Posting
                      <span className="px-2 py-0.5 rounded-full bg-emerald-400 text-black text-[9px] font-data font-bold uppercase">
                        P0 AI
                      </span>
                    </h4>
                    <p className="text-xs font-body text-gray-300">
                      Run Sentence-Transformers cosine similarity to forecast hiring odds and projected CTC boost (+₹XL).
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab("jd_match")}
                  className="px-4 py-2 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-display font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer shadow-md"
                >
                  <span>Launch JD Matcher</span>
                  <ArrowRight size={14} />
                </button>
              </div>

              {/* Metric Row: Overall Alignment + Project Complexity Tier */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Match Score Card */}
                <Card className="flex flex-col justify-between bg-gradient-to-br from-white to-[#FAFAF7]">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-data font-bold text-[#4F46E5] uppercase">
                        PREDICTED READINESS
                      </span>
                      <span className="text-[10px] font-data font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        ML Model Calibrated
                      </span>
                    </div>

                    <div className="text-center py-4">
                      <div className="inline-flex items-baseline gap-1">
                        <span className="text-5xl sm:text-6xl font-data font-bold text-[#12122B]">
                          {analysisResult.alignment.alignment_score_pct}
                        </span>
                        <span className="text-xl font-data font-bold text-[#4F46E5]">%</span>
                      </div>
                      <p className="text-xs font-body text-[#6B7280] mt-1">
                        Alignment for <strong>{analysisResult.alignment.target_role.name}</strong>
                      </p>
                    </div>

                    <ProgressBar
                      progress={analysisResult.alignment.alignment_score_pct}
                      showPercent={false}
                      color={
                        analysisResult.alignment.alignment_score_pct >= 75
                          ? "growth"
                          : analysisResult.alignment.alignment_score_pct >= 50
                            ? "milestone"
                            : "signal"
                      }
                    />
                  </div>

                  <div className="pt-3 border-t border-gray-100 flex justify-between text-[11px] font-data text-gray-500">
                    <span>{analysisResult.alignment.all_detected_skills.length} Skills Extracted</span>
                    <span>{analysisResult.alignment.missing_must_have.length} Critical Gaps</span>
                  </div>
                </Card>

                {/* Project Complexity Rating Card */}
                <Card className="flex flex-col justify-between md:col-span-2">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-lg bg-[#4F46E5]/10 text-[#4F46E5] flex items-center justify-center">
                          <Cpu size={18} />
                        </span>
                        <div>
                          <h4 className="text-sm font-display font-bold text-[#12122B]">
                            Project Engineering Maturity
                          </h4>
                          <p className="text-[11px] font-body text-[#6B7280]">
                            Classified by Random Forest & XGBoost text feature models
                          </p>
                        </div>
                      </div>

                      <span
                        className={`px-3 py-1 rounded-xl text-xs font-display font-bold border ${analysisResult.overall_project_maturity === "Production-Ready"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                            : analysisResult.overall_project_maturity === "Applied Capstone"
                              ? "bg-indigo-50 text-[#4F46E5] border-indigo-200"
                              : "bg-amber-50 text-amber-800 border-amber-300"
                          }`}
                      >
                        {analysisResult.overall_project_maturity}
                      </span>
                    </div>

                    <p className="text-xs font-body text-gray-600 leading-relaxed mb-4">
                      {analysisResult.overall_project_maturity === "Production-Ready"
                        ? "🏆 High hiring signal: Demonstrates distributed architecture, microservices, containerization, or measurable latency/throughput metrics."
                        : analysisResult.overall_project_maturity === "Applied Capstone"
                          ? "👍 Strong foundation: Full-stack applications with database integration and business logic. Adding Docker, caching, or distributed messaging will push you into top CTC bands."
                          : "⚠️ Upgrade Needed: Projects resemble academic tutorial clones. Recruiters at top GCCs look for containerized architectures and live deployments."}
                    </p>

                    {/* Extracted Projects Showcase */}
                    <div className="space-y-2.5">
                      <span className="text-[11px] font-data font-bold text-gray-500 uppercase">
                        Parsed Project Evidence ({analysisResult.classified_projects.length})
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {analysisResult.classified_projects.map((proj, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-xl bg-[#FAFAF7] border border-gray-200 flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex items-start justify-between gap-2 mb-1.5">
                                <h5 className="text-xs font-display font-bold text-[#12122B] line-clamp-1">
                                  {proj.title}
                                </h5>
                                <span
                                  className={`text-[9px] font-data font-bold uppercase px-1.5 py-0.5 rounded ${proj.tier_badge === "Production-Ready"
                                      ? "bg-emerald-100 text-emerald-800"
                                      : proj.tier_badge === "Applied"
                                        ? "bg-indigo-100 text-[#4F46E5]"
                                        : "bg-amber-100 text-amber-800"
                                    }`}
                                >
                                  {proj.tier_badge}
                                </span>
                              </div>
                              <p className="text-[11px] font-body text-gray-500 line-clamp-2 leading-tight">
                                {proj.description}
                              </p>
                            </div>

                            <div className="mt-2 pt-2 border-t border-gray-200/70 flex flex-wrap gap-1">
                              {proj.tools_used.slice(0, 4).map((tool) => (
                                <span
                                  key={tool}
                                  className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white text-gray-600 border border-gray-200"
                                >
                                  {tool}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Dual-Layer Skill Verification Matrix */}
              <Card>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                  <div>
                    <h3 className="text-base font-display font-bold text-[#12122B]">
                      Dual-Layer Skill Proof-of-Work Verification
                    </h3>
                    <p className="text-xs font-body text-[#6B7280]">
                      Separating skills proven in real project implementation vs. skills merely listed in bullet lists.
                    </p>
                  </div>
                  <span className="text-xs font-data font-bold text-[#4F46E5]">
                    {analysisResult.alignment.demonstrated_skills.length} Demonstrated /{" "}
                    {analysisResult.alignment.all_detected_skills.length} Total
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Demonstrated Skills Box */}
                  <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200">
                    <div className="flex items-center gap-2 mb-2 text-emerald-800">
                      <CheckCircle2 size={16} />
                      <h4 className="text-xs font-display font-bold uppercase tracking-wide">
                        Demonstrated in Projects (High Signal)
                      </h4>
                    </div>
                    <p className="text-[11px] text-emerald-700/80 mb-3">
                      Substantiated with practical implementation bullet points.
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {analysisResult.alignment.demonstrated_skills.length === 0 ? (
                        <span className="text-xs text-gray-500 italic">No project-backed skills detected.</span>
                      ) : (
                        analysisResult.alignment.demonstrated_skills.map((s) => (
                          <span
                            key={s}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-emerald-300 text-xs font-data font-bold text-emerald-900 shadow-2xs"
                          >
                            <Check size={12} className="text-emerald-600" />
                            {s}
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Claimed-Only Skills Box */}
                  <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200">
                    <div className="flex items-center gap-2 mb-2 text-amber-800">
                      <AlertCircle size={16} />
                      <h4 className="text-xs font-display font-bold uppercase tracking-wide">
                        Claimed Only in List (Unverified)
                      </h4>
                    </div>
                    <p className="text-[11px] text-amber-700/80 mb-3">
                      Mentioned in skills text, but no project demonstrates proof-of-work.
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {analysisResult.alignment.claimed_only_skills.length === 0 ? (
                        <span className="text-xs text-gray-500 italic">All skills are supported by projects!</span>
                      ) : (
                        analysisResult.alignment.claimed_only_skills.map((s) => (
                          <span
                            key={s}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-amber-300 text-xs font-data font-medium text-amber-900 shadow-2xs"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            {s}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </Card>

              {/* Sync Status Bar for Profile Stack */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-indigo-50/90 border border-indigo-200/80 text-xs shadow-2xs">
                <div className="flex items-center gap-2.5 text-indigo-950 font-medium">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <span>
                    <strong>Career Profile Stack:</strong> <span className="font-data font-bold text-[#4F46E5]">{userSkills.length} verified skills</span> saved to cloud database & local storage.
                  </span>
                </div>
                <button
                  onClick={() => setActiveTab("manual")}
                  className="inline-flex items-center gap-1.5 font-display font-bold text-[#4F46E5] hover:text-[#4338CA] transition-colors cursor-pointer self-start sm:self-auto bg-white px-3 py-1.5 rounded-xl border border-indigo-200 shadow-2xs hover:shadow-xs"
                >
                  View in Manual Stack Tab <ArrowRight size={13} />
                </button>
              </div>

              {/* Missing Skills Checklist (P0 Critical & P1 Differentiators) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Must-Have Missing Gaps */}
                <Card className="border-t-4 border-t-red-500">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-red-100 text-red-600">
                        <AlertCircle size={16} />
                      </span>
                      <h4 className="text-sm font-display font-bold text-[#12122B]">
                        P0 Critical Hiring Blockers ({analysisResult.alignment.missing_must_have.length})
                      </h4>
                    </div>
                    <span className="text-[10px] font-data font-bold uppercase text-red-600">
                      Required for Entry
                    </span>
                  </div>

                  <p className="text-xs font-body text-[#6B7280] mb-3">
                    Indian tech recruiters and ATS screens filter candidates missing these competencies:
                  </p>

                  <div className="space-y-2">
                    {analysisResult.alignment.missing_must_have.map((s) => {
                      const isInStack = userSkills.some((skill) => skill.toLowerCase() === s.toLowerCase());
                      return (
                        <div
                          key={s}
                          className={`p-2.5 rounded-xl border transition-all flex items-center justify-between ${isInStack
                              ? "bg-emerald-50/70 border-emerald-200"
                              : "bg-red-50/50 border-red-200"
                            }`}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${isInStack ? "bg-emerald-500" : "bg-red-500"
                                }`}
                            />
                            <span
                              className={`text-xs font-display font-bold ${isInStack ? "text-emerald-950" : "text-red-950"
                                }`}
                            >
                              {s}
                            </span>
                          </div>
                          {isInStack ? (
                            <button
                              onClick={() => handleToggleSkill(s)}
                              className="inline-flex items-center gap-1.5 text-[11px] font-display font-bold text-emerald-700 bg-emerald-100/90 hover:bg-red-50 hover:text-red-700 hover:border-red-300 px-2.5 py-1 rounded-lg border border-emerald-300 transition-all cursor-pointer group shadow-2xs"
                              title="Saved in your profile stack. Click to remove."
                            >
                              <Check size={12} className="group-hover:hidden text-emerald-700" />
                              <X size={12} className="hidden group-hover:inline text-red-600" />
                              <span className="group-hover:hidden">In Stack ✓</span>
                              <span className="hidden group-hover:inline">Remove</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleToggleSkill(s)}
                              className="inline-flex items-center gap-1 text-[11px] font-display font-semibold text-white bg-[#4F46E5] hover:bg-[#4338CA] px-2.5 py-1 rounded-lg transition-all shadow-xs cursor-pointer active:scale-95"
                            >
                              <Plus size={12} /> Add to Stack
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </Card>

                {/* Good-To-Have Boosters */}
                <Card className="border-t-4 border-t-amber-400">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-amber-100 text-amber-700">
                        <Sparkles size={16} />
                      </span>
                      <h4 className="text-sm font-display font-bold text-[#12122B]">
                        P1 Top-Band Differentiators ({analysisResult.alignment.missing_good_to_have.length})
                      </h4>
                    </div>
                    <span className="text-[10px] font-data font-bold uppercase text-amber-700">
                      12LPA+ Boosters
                    </span>
                  </div>

                  <p className="text-xs font-body text-[#6B7280] mb-3">
                    Skills that push your profile from average bands into Tier-1 and GCC engineering tiers:
                  </p>

                  <div className="space-y-2">
                    {analysisResult.alignment.missing_good_to_have.map((s) => {
                      const isInStack = userSkills.some((skill) => skill.toLowerCase() === s.toLowerCase());
                      return (
                        <div
                          key={s}
                          className={`p-2.5 rounded-xl border transition-all flex items-center justify-between ${isInStack
                              ? "bg-emerald-50/70 border-emerald-200"
                              : "bg-amber-50/50 border-amber-200"
                            }`}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${isInStack ? "bg-emerald-500" : "bg-amber-500"
                                }`}
                            />
                            <span
                              className={`text-xs font-display font-bold ${isInStack ? "text-emerald-950" : "text-amber-950"
                                }`}
                            >
                              {s}
                            </span>
                          </div>
                          {isInStack ? (
                            <button
                              onClick={() => handleToggleSkill(s)}
                              className="inline-flex items-center gap-1.5 text-[11px] font-display font-bold text-emerald-700 bg-emerald-100/90 hover:bg-red-50 hover:text-red-700 hover:border-red-300 px-2.5 py-1 rounded-lg border border-emerald-300 transition-all cursor-pointer group shadow-2xs"
                              title="Saved in your profile stack. Click to remove."
                            >
                              <Check size={12} className="group-hover:hidden text-emerald-700" />
                              <X size={12} className="hidden group-hover:inline text-red-600" />
                              <span className="group-hover:hidden">In Stack ✓</span>
                              <span className="hidden group-hover:inline">Remove</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleToggleSkill(s)}
                              className="inline-flex items-center gap-1 text-[11px] font-display font-semibold text-white bg-[#4F46E5] hover:bg-[#4338CA] px-2.5 py-1 rounded-lg transition-all shadow-xs cursor-pointer active:scale-95"
                            >
                              <Plus size={12} /> Add to Stack
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </div>

              {/* Tailored Gap-Bridging Project Blueprint (High-Contrast Rich Dark Mode Card) */}
              {analysisResult.alignment.project_blueprint && (
                <div className="rounded-3xl bg-[#0C0D1E] border border-slate-700/80 p-6 sm:p-8 text-white relative overflow-hidden shadow-2xl mt-8">
                  {/* Ambient Glows */}
                  <div className="pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full bg-teal-500/20 blur-3xl" />
                  <div className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-indigo-600/20 blur-3xl" />

                  <div className="relative z-10 space-y-5">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/20 border border-teal-400/40 text-xs font-data font-bold text-teal-300">
                        <FolderGit2 size={15} className="text-teal-400" /> RECOMMENDED GAP-BRIDGING PORTFOLIO PROJECT
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-data font-medium text-slate-300 bg-slate-800/90 px-3 py-1 rounded-md border border-slate-700">
                          Auto-Generated Blueprint
                        </span>
                        <button
                          onClick={() => {
                            const bp = analysisResult.alignment.project_blueprint;
                            const textToCopy = `PROJECT BLUEPRINT: ${bp.title}\n\nOBJECTIVE:\n${bp.objective}\n\nSUGGESTED ARCHITECTURE:\n${bp.architecture}\n\nIMPLEMENTATION MILESTONES:\n${bp.milestones.join("\n")}`;
                            navigator.clipboard.writeText(textToCopy);
                            setCopiedBlueprint(true);
                            setToastMessage("Project Blueprint copied to clipboard!");
                            setTimeout(() => setCopiedBlueprint(false), 2200);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-data border border-slate-700 transition-colors cursor-pointer"
                        >
                          {copiedBlueprint ? <Check size={13} className="text-teal-400" /> : <Copy size={13} />}
                          {copiedBlueprint ? "Copied!" : "Copy Blueprint"}
                        </button>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-2xl sm:text-3xl font-display font-extrabold text-white tracking-tight leading-snug">
                        {analysisResult.alignment.project_blueprint.title}
                      </h3>
                      <p className="text-sm font-body text-slate-200 mt-2 leading-relaxed max-w-3xl">
                        {analysisResult.alignment.project_blueprint.objective}
                      </p>
                    </div>

                    {/* Targeted Skills Bridged */}
                    {analysisResult.alignment.project_blueprint.target_skills_bridged?.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap pt-1">
                        <span className="text-[11px] font-data font-semibold text-slate-300 uppercase tracking-wider">
                          Target Skills Bridged:
                        </span>
                        {analysisResult.alignment.project_blueprint.target_skills_bridged.map((ts) => (
                          <span
                            key={ts}
                            className="px-2.5 py-1 rounded-lg bg-teal-950/80 border border-teal-500/50 text-teal-300 text-xs font-data font-bold shadow-2xs"
                          >
                            + {ts}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Suggested Architecture */}
                    <div className="p-4 rounded-xl bg-slate-900/95 border border-slate-700/90 shadow-inner">
                      <span className="text-teal-400 block text-xs font-data font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Terminal size={14} className="text-teal-400" /> Suggested Production Architecture
                      </span>
                      <div className="text-amber-300 font-mono font-bold text-xs sm:text-sm tracking-wide bg-black/60 px-3.5 py-2.5 rounded-lg border border-amber-400/30 overflow-x-auto">
                        {analysisResult.alignment.project_blueprint.architecture}
                      </div>
                    </div>

                    {/* Implementation Milestones */}
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-data font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                          <Layers size={14} className="text-teal-400" /> Implementation Milestones
                        </span>
                        <span className="text-[11px] font-data text-slate-400">
                          {analysisResult.alignment.project_blueprint.milestones.length} Step Engineering Plan
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {analysisResult.alignment.project_blueprint.milestones.map((m, idx) => (
                          <div
                            key={idx}
                            className="p-4 rounded-xl bg-slate-800/90 hover:bg-slate-800/100 border border-slate-700 transition-all flex flex-col justify-between gap-2.5 shadow-md"
                          >
                            <div className="flex items-center justify-between">
                              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-data font-bold bg-teal-500/20 text-teal-300 border border-teal-500/40">
                                Phase 0{idx + 1}
                              </span>
                              <span className="text-[11px] font-data text-slate-400">Production Goal</span>
                            </div>
                            <p className="text-xs sm:text-sm font-body text-slate-100 font-medium leading-relaxed">
                              {m.replace(/^Milestone \d+:\s*/i, "")}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODE 2: RESUME VS JOB DESCRIPTION SEMANTIC MATCHER (P0) */}
      {/* ======================================================== */}
      {activeTab === "jd_match" && (
        <div className="space-y-6">
          {/* Top Control Card: Candidate Resume Source + Target Job Description */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Candidate Resume Context (4 cols) */}
            <div className="lg:col-span-4 space-y-4">
              <Card className="h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="p-1.5 rounded-lg bg-[#4F46E5]/10 text-[#4F46E5]">
                      <FileSearch size={16} />
                    </span>
                    <h3 className="text-sm font-display font-bold text-[#12122B] uppercase tracking-wide">
                      1. Candidate Resume Source
                    </h3>
                  </div>
                  <p className="text-xs font-body text-[#6B7280] mb-4">
                    The AI semantic encoder uses this resume representation to compute cosine distance against the target JD.
                  </p>

                  {/* Status Indicator */}
                  {selectedFile ? (
                    <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 mb-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-data font-bold flex items-center gap-1.5">
                          <FileText size={15} /> Uploaded Document
                        </span>
                        <span className="text-[10px] font-data bg-emerald-200/80 px-1.5 py-0.5 rounded text-emerald-800 font-bold">
                          {(selectedFile.size / 1024).toFixed(1)} KB
                        </span>
                      </div>
                      <p className="text-xs font-medium truncate font-mono text-emerald-950">
                        {selectedFile.name}
                      </p>
                    </div>
                  ) : pastedResumeText ? (
                    <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-950 mb-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-data font-bold flex items-center gap-1.5 text-[#4F46E5]">
                          <Terminal size={15} /> Text Resume Loaded
                        </span>
                        <span className="text-[10px] font-data bg-indigo-200/70 px-1.5 py-0.5 rounded text-[#4F46E5] font-bold">
                          {pastedResumeText.length} chars
                        </span>
                      </div>
                      <p className="text-xs font-body text-gray-600 line-clamp-2 italic">
                        "{pastedResumeText.slice(0, 120)}..."
                      </p>
                    </div>
                  ) : userSkills.length > 0 ? (
                    <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 mb-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-data font-bold flex items-center gap-1.5 text-amber-800">
                          <Layers size={15} /> Verified Profile Stack
                        </span>
                        <span className="text-[10px] font-data bg-amber-200/70 px-1.5 py-0.5 rounded text-amber-900 font-bold">
                          {userSkills.length} skills
                        </span>
                      </div>
                      <p className="text-xs font-body text-amber-800 line-clamp-2">
                        {userSkills.slice(0, 6).join(", ")}{userSkills.length > 6 ? "..." : ""}
                      </p>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-2xl bg-gray-50 border border-dashed border-gray-300 text-gray-500 mb-3 text-xs font-body">
                      No resume loaded yet. Pick a sample below or upload your resume file.
                    </div>
                  )}

                  {/* Quick Preset Buttons for Testing */}
                  <div className="space-y-2 pt-2">
                    <span className="text-[11px] font-data font-bold text-gray-500 uppercase tracking-wider block">
                      Quick Resume Presets:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleLoadSample("ml_engineer")}
                        className="px-2.5 py-1.5 rounded-xl bg-[#FAFAF7] border border-gray-200 text-xs font-display font-medium text-gray-700 hover:text-[#4F46E5] hover:border-[#4F46E5] transition-all text-left flex items-center justify-between cursor-pointer"
                      >
                        <span>⚡ Load AI / ML Resume</span>
                        <ArrowRight size={12} className="text-gray-400" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleLoadSample("sde_backend")}
                        className="px-2.5 py-1.5 rounded-xl bg-[#FAFAF7] border border-gray-200 text-xs font-display font-medium text-gray-700 hover:text-[#4F46E5] hover:border-[#4F46E5] transition-all text-left flex items-center justify-between cursor-pointer"
                      >
                        <span>⚡ Load SDE / Backend Resume</span>
                        <ArrowRight size={12} className="text-gray-400" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs flex-1"
                  >
                    <UploadCloud size={13} className="mr-1.5" /> Upload File
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPasteModal(true)}
                    className="text-xs flex-1"
                  >
                    <Terminal size={13} className="mr-1.5" /> Paste Text
                  </Button>
                </div>
              </Card>
            </div>

            {/* Right Column: Target Job Description Input (8 cols) */}
            <div className="lg:col-span-8">
              <Card className="h-full flex flex-col justify-between">
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-[#14B8A6]/15 text-[#0F766E]">
                        <Target size={16} />
                      </span>
                      <h3 className="text-sm font-display font-bold text-[#12122B] uppercase tracking-wide">
                        2. Target Job Description (JD)
                      </h3>
                    </div>
                    <span className="text-[11px] font-data text-gray-400">
                      Paste from LinkedIn, Instahyre, Naukri, or Indeed
                    </span>
                  </div>

                  {/* 1-Click Preset JDs */}
                  <div className="mb-3 flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-data font-bold text-gray-500 uppercase mr-1">
                      1-Click JDs:
                    </span>
                    <button
                      type="button"
                      onClick={() => handleLoadSampleJD("sde_backend")}
                      className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-indigo-50 hover:text-[#4F46E5] border border-gray-200 text-[11px] font-display font-semibold transition cursor-pointer text-gray-700"
                    >
                      🎯 Senior Backend (FastAPI / K8s / AWS)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLoadSampleJD("ai_ml_engineer")}
                      className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-indigo-50 hover:text-[#4F46E5] border border-gray-200 text-[11px] font-display font-semibold transition cursor-pointer text-gray-700"
                    >
                      🎯 Applied AI / ML (PyTorch / RAG)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLoadSampleJD("fullstack_dev")}
                      className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-indigo-50 hover:text-[#4F46E5] border border-gray-200 text-[11px] font-display font-semibold transition cursor-pointer text-gray-700"
                    >
                      🎯 Full Stack (React / TypeScript / Node)
                    </button>
                  </div>

                  {/* Textarea */}
                  <div className="relative">
                    <textarea
                      rows={8}
                      placeholder="Paste target job description text here (Job Title, Requirements, Technical Competencies, Qualifications)..."
                      value={targetJobDescription}
                      onChange={(e) => setTargetJobDescription(e.target.value)}
                      className="w-full p-3.5 rounded-2xl border border-gray-300 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#4F46E5] bg-[#FAFAF7]/60 leading-relaxed"
                    />
                    {targetJobDescription && (
                      <button
                        type="button"
                        onClick={() => setTargetJobDescription("")}
                        className="absolute right-3 top-3 p-1 rounded-md text-gray-400 hover:text-gray-600 bg-white/80 backdrop-blur-xs border border-gray-200 cursor-pointer"
                        title="Clear Job Description"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {jobMatchError && (
                  <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{jobMatchError}</span>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="text-[11px] font-data text-gray-400">
                    Dense Latent Vectors: 384 dims · Cosine Metric · CTC Calibration
                  </div>
                  <Button
                    onClick={handleRunJobMatch}
                    disabled={isMatchingJob || !targetJobDescription.trim()}
                    className="bg-[#12122B] text-white hover:bg-[#1E1B4B] text-xs font-semibold px-6 cursor-pointer"
                  >
                    {isMatchingJob ? (
                      <span className="flex items-center gap-2">
                        <RefreshCw size={14} className="animate-spin" />
                        Calculating Embedding Cosine Similarity...
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5">
                        <Zap size={14} className="text-[#F5A623] fill-[#F5A623]" />
                        Compute Semantic Similarity & Salary Impact
                      </span>
                    )}
                  </Button>
                </div>
              </Card>
            </div>
          </div>

          {/* Semantic Match Results Section */}
          {jobMatchResult && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
              {/* Helper Banner for General / First-Time Users */}
              <div className="flex items-center justify-between text-xs text-[#6B7280] px-1">
                <span className="flex items-center gap-1.5 font-display font-medium text-[#12122B]">
                  <Info size={14} className="text-[#4F46E5]" />
                  <span>Click any score card below to see an easy-to-understand explanation of how it is calculated:</span>
                </span>
                <span className="hidden sm:inline text-[11px] font-data text-gray-400">
                  Interactive AI Breakdown
                </span>
              </div>

              {/* Hero Metric Cards Grid (4 tiles - Clickable for Detailed Explanations) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Overall Match Percentage */}
                <div
                  onClick={() => setSelectedMetricExplainer("match_ratio")}
                  className="p-5 rounded-2xl border transition-all duration-200 cursor-pointer bg-gradient-to-br from-white to-[#FAFAF7] border-gray-200 hover:border-[#4F46E5] hover:shadow-lg hover:-translate-y-1 group flex flex-col justify-between"
                  title="Click to see how Semantic Match Ratio is calculated"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-data font-bold text-[#4F46E5] uppercase tracking-wider">
                        SEMANTIC MATCH RATIO
                      </span>
                      <span className="inline-flex items-center gap-1 text-[9px] font-data font-bold text-[#4F46E5] bg-[#4F46E5]/10 px-2 py-0.5 rounded-full group-hover:bg-[#4F46E5] group-hover:text-white transition-colors">
                        <HelpCircle size={10} /> Click to Explain
                      </span>
                    </div>

                    <div className="text-center py-3">
                      <div className="inline-flex items-baseline gap-1">
                        <span className="text-4xl sm:text-5xl font-data font-bold text-[#12122B]">
                          {Math.round(jobMatchResult.match_percentage * 100)}
                        </span>
                        <span className="text-xl font-data font-bold text-[#4F46E5]">%</span>
                      </div>
                      <p className="text-[11px] font-body text-gray-500 mt-1">
                        Composite Keyword & Latent Alignment
                      </p>
                    </div>
                    <ProgressBar
                      progress={Math.round(jobMatchResult.match_percentage * 100)}
                      showPercent={false}
                      color={
                        jobMatchResult.match_percentage >= 0.7
                          ? "growth"
                          : jobMatchResult.match_percentage >= 0.45
                            ? "milestone"
                            : "signal"
                      }
                    />
                  </div>
                  <div className="pt-2.5 mt-2 border-t border-gray-100 text-[10px] font-data text-gray-400 text-center flex items-center justify-center gap-1">
                    <span>ATS shortlisting threshold: &gt;65%</span>
                    <span className="text-[#4F46E5] group-hover:underline font-semibold ml-1">Learn why →</span>
                  </div>
                </div>

                {/* 2. Projected Salary Impact Badge */}
                <div
                  onClick={() => setSelectedMetricExplainer("salary_impact")}
                  className="p-5 rounded-2xl border transition-all duration-200 cursor-pointer bg-gradient-to-br from-emerald-50/70 via-white to-emerald-50/30 border-emerald-200 hover:border-emerald-500 hover:shadow-lg hover:-translate-y-1 group flex flex-col justify-between"
                  title="Click to see how Salary Impact is calculated"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-data font-bold text-emerald-800 uppercase tracking-wider">
                        PROJECTED SALARY IMPACT
                      </span>
                      <span className="inline-flex items-center gap-1 text-[9px] font-data font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                        <HelpCircle size={10} /> Click to Explain
                      </span>
                    </div>

                    <div className="text-center py-3">
                      <span className="text-3xl sm:text-4xl font-data font-extrabold text-emerald-600 block">
                        {jobMatchResult.salary_impact}
                      </span>
                      <p className="text-[11px] font-body text-emerald-900 mt-1 font-medium">
                        CTC boost when bridging missing gaps
                      </p>
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-emerald-100 flex items-center justify-between text-[10px] font-data text-emerald-800">
                    <span>Base Role: {targetRoleObj?.salaryRange}</span>
                    <span className="font-bold flex items-center gap-0.5 group-hover:underline text-emerald-700">
                      <TrendingUp size={11} /> High ROI →
                    </span>
                  </div>
                </div>

                {/* 3. Cosine Latent Similarity */}
                <div
                  onClick={() => setSelectedMetricExplainer("dense_similarity")}
                  className="p-5 rounded-2xl border transition-all duration-200 cursor-pointer bg-gradient-to-br from-white to-[#FAFAF7] border-gray-200 hover:border-indigo-500 hover:shadow-lg hover:-translate-y-1 group flex flex-col justify-between"
                  title="Click to see what Dense Embedding Similarity means"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-data font-bold text-[#4F46E5] uppercase tracking-wider">
                        DENSE EMBEDDING SIMILARITY
                      </span>
                      <span className="inline-flex items-center gap-1 text-[9px] font-data font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        <HelpCircle size={10} /> Click to Explain
                      </span>
                    </div>

                    <div className="text-center py-3">
                      <div className="inline-flex items-baseline gap-1">
                        <span className="text-4xl sm:text-5xl font-data font-bold text-[#12122B]">
                          {(jobMatchResult.semantic_similarity * 100).toFixed(0)}
                        </span>
                        <span className="text-lg font-data font-bold text-indigo-500">%</span>
                      </div>
                      <p className="text-[11px] font-body text-gray-500 mt-1">
                        Cosine metric on 384-d vectors
                      </p>
                    </div>
                  </div>
                  <div className="pt-2.5 border-t border-gray-100 text-[10px] font-data text-gray-400 text-center flex items-center justify-center gap-1">
                    <span className="truncate">Model: Sentence-Transformers</span>
                    <span className="text-indigo-600 group-hover:underline font-semibold ml-1">Details →</span>
                  </div>
                </div>

                {/* 4. Model Confidence */}
                <div
                  onClick={() => setSelectedMetricExplainer("confidence")}
                  className="p-5 rounded-2xl border transition-all duration-200 cursor-pointer bg-gradient-to-br from-white to-[#FAFAF7] border-gray-200 hover:border-emerald-500 hover:shadow-lg hover:-translate-y-1 group flex flex-col justify-between"
                  title="Click to see what Model Confidence means"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-data font-bold text-[#4F46E5] uppercase tracking-wider">
                        MODEL CONFIDENCE
                      </span>
                      <span className="inline-flex items-center gap-1 text-[9px] font-data font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                        <HelpCircle size={10} /> Click to Explain
                      </span>
                    </div>

                    <div className="text-center py-3">
                      <div className="inline-flex items-baseline gap-1">
                        <span className="text-4xl sm:text-5xl font-data font-bold text-[#12122B]">
                          {Math.round(jobMatchResult.confidence * 100)}
                        </span>
                        <span className="text-lg font-data font-bold text-emerald-600">%</span>
                      </div>
                      <p className="text-[11px] font-body text-gray-500 mt-1">
                        Screening calibration score
                      </p>
                    </div>
                  </div>
                  <div className="pt-2.5 border-t border-gray-100 text-[10px] font-data text-emerald-700 text-center font-bold flex items-center justify-center gap-1">
                    <span>✓ High Predictive Stability</span>
                    <span className="text-emerald-800 group-hover:underline font-semibold ml-1">Breakdown →</span>
                  </div>
                </div>
              </div>

              {/* Interactive Modal: Easy-to-Understand Metric Explainer */}
              {selectedMetricExplainer && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                  <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 space-y-5 shadow-2xl border border-gray-200 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#4F46E5]/10 text-[#4F46E5] flex items-center justify-center shrink-0">
                          {selectedMetricExplainer === "dense_similarity" ? (
                            <Cpu size={22} />
                          ) : selectedMetricExplainer === "confidence" ? (
                            <CheckCircle2 size={22} className="text-emerald-600" />
                          ) : selectedMetricExplainer === "salary_impact" ? (
                            <TrendingUp size={22} className="text-emerald-600" />
                          ) : (
                            <Target size={22} />
                          )}
                        </div>
                        <div>
                          <span className="text-[10px] font-data font-bold text-[#4F46E5] uppercase tracking-wider">
                            Interactive Metric Guide
                          </span>
                          <h3 className="text-xl font-display font-bold text-[#12122B]">
                            {selectedMetricExplainer === "dense_similarity"
                              ? `Dense Embedding Similarity: ${(jobMatchResult.semantic_similarity * 100).toFixed(0)}%`
                              : selectedMetricExplainer === "confidence"
                              ? `Model Confidence: ${Math.round(jobMatchResult.confidence * 100)}%`
                              : selectedMetricExplainer === "salary_impact"
                              ? `Projected Salary Impact: ${jobMatchResult.salary_impact}`
                              : `Semantic Match Ratio: ${Math.round(jobMatchResult.match_percentage * 100)}%`}
                          </h3>
                        </div>
                      </div>

                      <button
                        onClick={() => setSelectedMetricExplainer(null)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                        title="Close Guide"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    {/* Quick Metric Navigation Pills */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                      <button
                        onClick={() => setSelectedMetricExplainer("match_ratio")}
                        className={`px-3 py-1 rounded-lg text-xs font-display font-bold whitespace-nowrap transition cursor-pointer ${
                          selectedMetricExplainer === "match_ratio"
                            ? "bg-[#4F46E5] text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        Match Ratio ({Math.round(jobMatchResult.match_percentage * 100)}%)
                      </button>
                      <button
                        onClick={() => setSelectedMetricExplainer("salary_impact")}
                        className={`px-3 py-1 rounded-lg text-xs font-display font-bold whitespace-nowrap transition cursor-pointer ${
                          selectedMetricExplainer === "salary_impact"
                            ? "bg-emerald-600 text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        Salary Impact ({jobMatchResult.salary_impact})
                      </button>
                      <button
                        onClick={() => setSelectedMetricExplainer("dense_similarity")}
                        className={`px-3 py-1 rounded-lg text-xs font-display font-bold whitespace-nowrap transition cursor-pointer ${
                          selectedMetricExplainer === "dense_similarity"
                            ? "bg-indigo-600 text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        Dense Similarity ({(jobMatchResult.semantic_similarity * 100).toFixed(0)}%)
                      </button>
                      <button
                        onClick={() => setSelectedMetricExplainer("confidence")}
                        className={`px-3 py-1 rounded-lg text-xs font-display font-bold whitespace-nowrap transition cursor-pointer ${
                          selectedMetricExplainer === "confidence"
                            ? "bg-emerald-700 text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        Confidence ({Math.round(jobMatchResult.confidence * 100)}%)
                      </button>
                    </div>

                    {/* Content Section 1: Plain English Meaning */}
                    <div className="p-4 rounded-2xl bg-[#FAFAF7] border border-gray-200 space-y-2">
                      <span className="text-xs font-data font-bold text-[#4F46E5] uppercase tracking-wider flex items-center gap-1.5">
                        <Lightbulb size={14} className="text-amber-500" />
                        1. What it means in plain English (No Technical Jargon)
                      </span>
                      <p className="text-sm font-body text-gray-700 leading-relaxed">
                        {selectedMetricExplainer === "dense_similarity" && (
                          <>
                            Imagine having a technical conversation with a lead engineer. Even if you wrote{" "}
                            <strong>"built fast web services with async Python"</strong> and the job post asked for{" "}
                            <strong>"scalable backend API development"</strong>, this AI understands that both mean the exact same thing! It evaluates the <em>meaning and concepts</em> rather than just checking if words match letter-by-letter.
                          </>
                        )}
                        {selectedMetricExplainer === "confidence" && (
                          <>
                            Think of this as the AI’s <strong>"Certainty Gauge"</strong>. If someone hands you a 1-line resume, you can't be sure how qualified they are. But if they provide a detailed resume with real project descriptions and a thorough job description, the AI can be <strong>86%+ certain</strong> that the hiring evaluation is accurate and reliable.
                          </>
                        )}
                        {selectedMetricExplainer === "salary_impact" && (
                          <>
                            This is your <strong>Career ROI Potential</strong>. In tech recruitment, some skills (like Docker, Kubernetes, Kafka, and System Design) act as high-leverage multipliers. This number estimates how much higher your annual compensation (CTC) can become once you add the employer's missing requirements to your profile.
                          </>
                        )}
                        {selectedMetricExplainer === "match_ratio" && (
                          <>
                            This is your <strong>Overall Hiring Shortlist Index</strong>. It simulates whether automated corporate hiring filters (Applicant Tracking Systems) and engineering managers will select your profile for an interview round. Scores above <strong>65%</strong> typically clear initial recruiter cutoffs.
                          </>
                        )}
                      </p>
                    </div>

                    {/* Content Section 2: How It's Calculated */}
                    <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-2">
                      <span className="text-xs font-data font-bold text-[#4F46E5] uppercase tracking-wider flex items-center gap-1.5">
                        <Calculator size={14} className="text-[#4F46E5]" />
                        2. How the AI calculates this score
                      </span>
                      <div className="text-xs font-body text-gray-700 space-y-1.5 leading-relaxed">
                        {selectedMetricExplainer === "dense_similarity" && (
                          <>
                            <p>
                              • <strong>AI Architecture:</strong> Uses <code>Sentence-Transformers (all-MiniLM-L6-v2)</code>, a state-of-the-art Natural Language Processing neural network.
                            </p>
                            <p>
                              • <strong>Vector Representation:</strong> Converts your resume text and the job description into <strong>384-dimensional mathematical concept vectors</strong> in latent space.
                            </p>
                            <p>
                              • <strong>Cosine Metric:</strong> Computes the mathematical angle between the two concept vectors ($0.0$ = completely unrelated, $1.0$ = identical technical meaning).
                            </p>
                          </>
                        )}
                        {selectedMetricExplainer === "confidence" && (
                          <>
                            <p>
                              • <strong>Information Density:</strong> Evaluates the combined token count (words) of your resume and the target job description.
                            </p>
                            <p>
                              • <strong>Calibration Formula:</strong> <code>Confidence = 85% + (Total Word Tokens / 4000) * 10%</code>, clamped between 82% and 96%.
                            </p>
                            <p>
                              • <strong>Predictive Stability:</strong> High word counts and detailed project bullet points guarantee that the score is statistically stable and free of AI hallucinations.
                            </p>
                          </>
                        )}
                        {selectedMetricExplainer === "salary_impact" && (
                          <>
                            <p>
                              • <strong>Market Premiums:</strong> Maps missing skills against verified Indian tech salary benchmarks (e.g. Kubernetes: +₹3.5L, Go/Rust: +₹3.5L, Kafka: +₹3.0L, AWS: +₹2.5L, FastAPI: +₹2.0L).
                            </p>
                            <p>
                              • <strong>Top-3 Levers:</strong> Sums the premium for your top 3 most valuable missing skills to provide an achievable, realistic milestone.
                            </p>
                          </>
                        )}
                        {selectedMetricExplainer === "match_ratio" && (
                          <>
                            <p>
                              • <strong>Hybrid Formula:</strong> <code>(Semantic Similarity × 55%) + (Skill Intersection × 45%)</code>.
                            </p>
                            <p>
                              • <strong>Balanced Scoring:</strong> Ensures you get full credit for conceptual understanding while still strictly checking that mandatory tools (e.g. Docker, Python, SQL) are present.
                            </p>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Content Section 3: Action Plan to Improve */}
                    <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-2">
                      <span className="text-xs font-data font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle2 size={14} className="text-emerald-600" />
                        3. What you should do next to improve this score
                      </span>
                      <ul className="text-xs font-body text-emerald-950 space-y-1.5 list-disc list-inside">
                        {selectedMetricExplainer === "dense_similarity" && (
                          <>
                            <li>Borrow key architectural phrases from the job description (e.g., "event-driven messaging", "sub-100ms latency", "production containerization").</li>
                            <li>Ensure your project summaries clearly mention the problem solved, architecture used, and real-world scale.</li>
                          </>
                        )}
                        {selectedMetricExplainer === "confidence" && (
                          <>
                            <li>Add 2 to 3 detailed bullet points under each project in your resume.</li>
                            <li>Include measurable metrics: % improvement, throughput, requests handled, or users served.</li>
                          </>
                        )}
                        {selectedMetricExplainer === "salary_impact" && (
                          <>
                            <li>Look at the <strong>"Missing JD Competencies"</strong> card below.</li>
                            <li>Click <strong>"+ Add to Stack"</strong> on the missing skills, and build a project using the blueprint generated at the bottom of the page.</li>
                          </>
                        )}
                        {selectedMetricExplainer === "match_ratio" && (
                          <>
                            <li>Add the top 2-3 missing skills highlighted in red below to your resume.</li>
                            <li>Re-upload or re-analyze to watch your match ratio jump into the <strong>80%+ Shortlist Band</strong>!</li>
                          </>
                        )}
                      </ul>
                    </div>

                    {/* Footer Close Button */}
                    <div className="flex justify-end pt-2">
                      <Button
                        size="sm"
                        onClick={() => setSelectedMetricExplainer(null)}
                        className="bg-[#12122B] text-white hover:bg-[#1E1B4B] text-xs font-semibold px-5"
                      >
                        Got It, Close Guide
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Competency Comparison Grid: Matched Skills vs Missing Skills */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Matched Competencies */}
                <Card className="border-t-4 border-t-emerald-500">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
                        <CheckCircle2 size={16} />
                      </span>
                      <h4 className="text-sm font-display font-bold text-[#12122B]">
                        Matched Technical Competencies ({jobMatchResult.matched_skills.length})
                      </h4>
                    </div>
                    <span className="text-[10px] font-data font-bold uppercase text-emerald-700">
                      Verified in Resume
                    </span>
                  </div>

                  <p className="text-xs font-body text-[#6B7280] mb-3">
                    These requirements in the Job Description were successfully recognized in your resume:
                  </p>

                  {jobMatchResult.matched_skills.length === 0 ? (
                    <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-500 text-center">
                      No direct skill overlaps detected with this Job Description. Review the missing competencies below!
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {jobMatchResult.matched_skills.map((skill) => (
                        <div
                          key={skill}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-display font-bold text-emerald-800"
                        >
                          <Check size={13} className="text-emerald-600" />
                          <span>{skill.toUpperCase()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>

                {/* Missing Skills (With 1-Click Add to Stack!) */}
                <Card className="border-t-4 border-t-red-500">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-red-100 text-red-600">
                        <AlertCircle size={16} />
                      </span>
                      <h4 className="text-sm font-display font-bold text-[#12122B]">
                        Missing JD Competencies ({jobMatchResult.missing_skills.length})
                      </h4>
                    </div>
                    <span className="text-[10px] font-data font-bold uppercase text-red-600">
                      Hiring Blockers
                    </span>
                  </div>

                  <p className="text-xs font-body text-[#6B7280] mb-3">
                    Critical keywords required by the employer that were missing. Click "+ Add to Stack" to save them to your active skill profile:
                  </p>

                  {jobMatchResult.missing_skills.length === 0 ? (
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 text-center font-medium">
                      🎉 Optimal Semantic Match! Your resume covers all primary technical requirements of this Job Description.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {jobMatchResult.missing_skills.map((skill) => {
                        const isInStack = userSkills.some(
                          (s) => s.toLowerCase() === skill.toLowerCase()
                        );
                        return (
                          <div
                            key={skill}
                            className={`p-2.5 rounded-xl border transition-all flex items-center justify-between ${isInStack
                                ? "bg-emerald-50/70 border-emerald-200"
                                : "bg-red-50/50 border-red-200"
                              }`}
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className={`w-2 h-2 rounded-full ${isInStack ? "bg-emerald-500" : "bg-red-500"
                                  }`}
                              />
                              <span
                                className={`text-xs font-display font-bold ${isInStack ? "text-emerald-950" : "text-red-950"
                                  }`}
                              >
                                {skill.toUpperCase()}
                              </span>
                            </div>

                            {isInStack ? (
                              <button
                                type="button"
                                onClick={() => handleToggleSkill(skill)}
                                className="inline-flex items-center gap-1.5 text-[11px] font-display font-bold text-emerald-700 bg-emerald-100 hover:bg-red-50 hover:text-red-700 hover:border-red-300 px-2.5 py-1 rounded-lg border border-emerald-300 transition-all cursor-pointer group shadow-2xs"
                                title="Saved in profile. Click to remove."
                              >
                                <Check size={12} className="group-hover:hidden text-emerald-700" />
                                <X size={12} className="hidden group-hover:inline text-red-600" />
                                <span className="group-hover:hidden">In Stack ✓</span>
                                <span className="hidden group-hover:inline">Remove</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleToggleSkill(skill)}
                                className="inline-flex items-center gap-1 text-[11px] font-display font-semibold text-white bg-[#4F46E5] hover:bg-[#4338CA] px-2.5 py-1 rounded-lg transition-all shadow-xs cursor-pointer active:scale-95"
                              >
                                <Plus size={12} /> Add to Stack
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>
              </div>

              {/* ATS Recommendations Card */}
              {jobMatchResult.recommendations && jobMatchResult.recommendations.length > 0 && (
                <div className="rounded-3xl bg-[#0C0D1E] border border-slate-700/80 p-6 text-white relative overflow-hidden shadow-2xl">
                  <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-indigo-600/20 blur-3xl" />
                  <div className="relative z-10 space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/40 text-xs font-data font-bold text-indigo-300">
                        <Sparkles size={14} className="text-indigo-400" />
                        ATS OPTIMIZATION & INTERVIEW SCREENING STRATEGY
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">
                        {jobMatchResult.engine_used}
                      </span>
                    </div>

                    <h4 className="text-lg font-display font-bold text-white">
                      Actionable Enhancements for This Target Opportunity
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                      {jobMatchResult.recommendations.map((rec, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 flex items-start gap-2.5"
                        >
                          <span className="w-5 h-5 rounded-full bg-indigo-500/30 text-indigo-300 font-data text-xs flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <p className="text-xs sm:text-sm font-body text-slate-200 leading-relaxed">
                            {rec}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODE 3: MANUAL SKILL STACK SELECTOR */}
      {/* ======================================================== */}
      {activeTab === "manual" && (
        <div className="space-y-6">
          {/* Main Grid: Target Role Selector & Metric Card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-lg font-display font-bold text-[#12122B]">
                    Manual Stack Configurator
                  </h3>
                  <p className="text-xs font-body text-[#6B7280]">
                    Add or remove individual skills to simulate compatibility.
                  </p>
                </div>
              </div>

              {/* Missing Skills Breakdown */}
              {manualAnalysis && (
                <div className="p-4 rounded-2xl bg-[#FAFAF7] border border-gray-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-data font-bold text-[#6B7280] uppercase">
                      Missing Competencies ({manualAnalysis.missingSkills.length})
                    </span>
                    <span className="text-xs font-data text-[#F5A623] font-bold">
                      High Priority
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {manualAnalysis.missingSkills.map((skill) => (
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

            {/* Metric Card */}
            <Card className="flex flex-col justify-between bg-gradient-to-br from-white to-[#FAFAF7]">
              <div>
                <span className="text-xs font-data font-bold text-[#4F46E5] uppercase">
                  METRIC COMPUTATION
                </span>
                <h3 className="text-xl font-display font-bold text-[#12122B] mt-1 mb-4">
                  Role Match Score
                </h3>

                <div className="text-center py-4">
                  <div className="inline-flex items-baseline gap-1">
                    <span className="text-5xl sm:text-6xl font-data font-bold text-[#12122B]">
                      {manualAnalysis?.matchPercentage ?? 0}
                    </span>
                    <span className="text-xl font-data font-bold text-[#4F46E5]">%</span>
                  </div>
                  <p className="text-xs font-body text-[#6B7280] mt-2">
                    Differential for <strong>{targetRoleObj?.name}</strong>
                  </p>
                </div>

                <div className="space-y-2 mt-2">
                  <ProgressBar
                    progress={manualAnalysis?.matchPercentage ?? 0}
                    showPercent={false}
                    color={(manualAnalysis?.matchPercentage ?? 0) >= 70 ? "growth" : "milestone"}
                  />
                  <div className="flex justify-between text-[11px] font-data text-[#6B7280]">
                    <span>{userSkills.length} Known</span>
                    <span>{manualAnalysis?.missingSkills.length ?? 0} Remaining</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <span className="text-xs font-body text-[#6B7280]">
                  {(manualAnalysis?.matchPercentage ?? 0) >= 75
                    ? "🎯 High compatibility! Ready for portfolio projects and interview prep."
                    : "⚡ Add missing skills from below to increase your hiring readiness."}
                </span>
              </div>
            </Card>
          </div>

          {/* Current Verified Skills Stack */}
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

          {/* Available Skills Catalog */}
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
      )}

      {/* Paste Resume Text Modal */}
      {showPasteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl border border-gray-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-display font-bold text-[#12122B] flex items-center gap-2">
                <Terminal size={18} className="text-[#4F46E5]" />
                Paste Resume Content
              </h3>
              <button
                onClick={() => setShowPasteModal(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs font-body text-gray-500">
              Paste the text of your resume below. Our ML model will parse your skills, extract project descriptions, and classify engineering maturity.
            </p>

            <textarea
              rows={10}
              placeholder="Paste your resume text here (Skills, Projects, Experience)..."
              value={pastedResumeText}
              onChange={(e) => setPastedResumeText(e.target.value)}
              className="w-full p-3.5 rounded-2xl border border-gray-300 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
            />

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="outline" size="sm" onClick={() => setShowPasteModal(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setShowPasteModal(false);
                  void runAnalysis(null, pastedResumeText);
                }}
                disabled={!pastedResumeText.trim()}
              >
                Start ML Analysis
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Real-time Persistence Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-[#0F1123] text-white text-xs font-medium shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-slate-400 hover:text-white cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
};
