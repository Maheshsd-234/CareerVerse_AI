import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Award, CheckCircle, Sparkles, ArrowRight, RotateCcw, 
  Cpu, Database, ShieldCheck, BarChart3, TrendingUp, HelpCircle, 
  X, Compass, MapPin, GraduationCap, School, BookOpen, Layers, AlertCircle
} from "lucide-react";
import { Card, Badge, Button, ProgressBar } from "../../components/ui/UI";
import { useAuth } from "../../hooks/useAuth";
import { firestoreService } from "../../services/firestoreService";
import { 
  mlCareerService, 
  ASSESSMENT_DOMAIN_TO_CAREER, 
  DOMAIN_SKILLS_MAP 
} from "../../services/mlCareerService";
import type { MLPredictionResult, ModelMetrics, StudentMLInput } from "../../services/mlCareerService";
import type {
  StudentStage,
  AssessmentQuestion,
} from "../../services/adaptiveAssessmentService";
import {
  CLASS_10_QUESTIONS,
  COLLEGE_QUESTIONS,
  EXTENDED_TIE_BREAKERS,
  checkClarityStatus,
  fetchLiveTrendQuestions
} from "../../services/adaptiveAssessmentService";

const ALL_SKILLS = [
  "Python", "Java", "C++", "SQL", "Machine Learning", 
  "Data Science", "Web Development", "AutoCAD", "SolidWorks", 
  "Embedded Systems", "IoT", "MATLAB", "Revit", "Cloud/DevOps",
  "Cybersecurity", "Robotics"
];

const ALL_CLUBS = [
  "Coding Club", "Robotics", "Literary Society", 
  "Sports Club", "Entrepreneurship Cell", "Cultural Club"
];

export const AssessmentPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Student Education Level Stage
  const [stage, setStage] = useState<StudentStage | null>(null);

  // Profile Inputs for College / Advanced mode
  const [branch, setBranch] = useState("CSE");
  const [avgGpa, setAvgGpa] = useState(7.5);
  const [backlogs, setBacklogs] = useState(0);
  const [attendance, setAttendance] = useState(85);
  const [cityTier, setCityTier] = useState("Tier 2");
  const [selectedSkills, setSelectedSkills] = useState<string[]>(["Python", "Web Development", "SQL"]);
  const [selectedClubs, setSelectedClubs] = useState<string[]>(["Coding Club"]);
  const [internshipDone, setInternshipDone] = useState(true);

  // Assessment Engine State
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [activeQuestions, setActiveQuestions] = useState<AssessmentQuestion[]>([]);
  const [completed, setCompleted] = useState(false);
  const [predicting, setPredicting] = useState(false);
  const [mlResult, setMlResult] = useState<MLPredictionResult | null>(null);

  // Model Verification & Modal state
  const [showProofModal, setShowProofModal] = useState(false);
  const [modelMetrics, setModelMetrics] = useState<ModelMetrics | null>(null);
  const [saving, setSaving] = useState(false);
  const [isLiveAI, setIsLiveAI] = useState(false);

  useEffect(() => {
    mlCareerService.getMetrics().then(setModelMetrics);
  }, []);

  // Pre-fetch or load questions
  const loadQuestionsForStage = (selectedStage: StudentStage, selectedBranch: string = branch) => {
    // 1. Instantly set benchmark questions (0ms delay)
    if (selectedStage === "10th") {
      setActiveQuestions([...CLASS_10_QUESTIONS]);
      setIsLiveAI(false);
    } else {
      setActiveQuestions([...COLLEGE_QUESTIONS]);
    }

    // 2. Quietly pre-fetch 2026 dynamic industry trend questions in background
    if (selectedStage !== "10th") {
      fetchLiveTrendQuestions(selectedStage, selectedBranch)
        .then((res) => {
          if (res && res.questions && res.questions.length >= 20) {
            setActiveQuestions(res.questions);
            setIsLiveAI(res.isLiveAI);
          }
        })
        .catch(() => {});
    }
  };

  // When stage is selected, initialize the 25-question bank
  const handleSelectStage = (selectedStage: StudentStage) => {
    setStage(selectedStage);
    setCurrentQuestionIdx(0);
    setScores({});
    setCompleted(false);
    setPredicting(false);
    setMlResult(null);
    loadQuestionsForStage(selectedStage, branch);
  };

  const handleRetake = () => {
    const currentStage = stage || "college";
    setStage(currentStage);
    setCurrentQuestionIdx(0);
    setScores({});
    setCompleted(false);
    setPredicting(false);
    setMlResult(null);
    loadQuestionsForStage(currentStage, branch);
  };

  const handleResetStage = () => {
    setStage(null);
    setCurrentQuestionIdx(0);
    setScores({});
    setCompleted(false);
    setPredicting(false);
    setMlResult(null);
    setActiveQuestions([]);
    setIsLiveAI(false);
  };

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const toggleClub = (club: string) => {
    setSelectedClubs((prev) =>
      prev.includes(club) ? prev.filter((c) => c !== club) : [...prev, club]
    );
  };

  // Current Question
  const currentQ = activeQuestions[currentQuestionIdx];

  // Dynamic Ambiguity calculation
  const clarityStatus = useMemo(() => {
    return checkClarityStatus(scores, currentQuestionIdx + 1);
  }, [scores, currentQuestionIdx]);

  const handleSelectOption = (domain: string, points: number) => {
    const updatedScores = {
      ...scores,
      [domain]: (scores[domain] || 0) + points,
    };
    setScores(updatedScores);

    const nextIdx = currentQuestionIdx + 1;

    // Check if we reached Question 25
    if (nextIdx === 25) {
      const clarity = checkClarityStatus(updatedScores, 25);
      // If ambiguous and we haven't added tie-breakers yet, extend with tie-breakers (up to 50 max)
      if (clarity.isAmbiguous && activeQuestions.length === 25) {
        // Append extended tie-breaker questions
        setActiveQuestions((prev) => [...prev, ...EXTENDED_TIE_BREAKERS]);
        setCurrentQuestionIdx(nextIdx);
        return;
      }
    }

    // Continue or complete
    if (nextIdx < activeQuestions.length && nextIdx < 50) {
      setCurrentQuestionIdx(nextIdx);
    } else {
      finalizeAssessment(updatedScores);
    }
  };

  const finalizeAssessment = async (finalScores: Record<string, number>) => {
    setPredicting(true);
    setCompleted(true);

    try {
      const sorted = Object.entries(finalScores).sort((a, b) => b[1] - a[1]);
      const evaluatedTopDomain = sorted[0]?.[0] || "";

      if (stage === "college" || stage === "12th") {
        const input: StudentMLInput = {
          branch,
          avg_gpa: avgGpa,
          backlogs,
          attendance,
          skills: selectedSkills,
          clubs: selectedClubs,
          internship_done: internshipDone,
          city_tier: cityTier,
          assessment_domain: evaluatedTopDomain,
          assessment_scores: finalScores,
        };
        const result = await mlCareerService.predictCareer(input);
        setMlResult(result);
      }
      localStorage.setItem("careerverse_assessment_done", "true");
    } catch (err) {
      console.error("ML prediction error:", err);
    } finally {
      setPredicting(false);
    }
  };

  const handleSaveAndContinue = async () => {
    if (!user) {
      navigate("/dashboard");
      return;
    }
    setSaving(true);
    try {
      const topDomain = Object.entries(scores).sort((a, b) => b[1] - a[1])[0]?.[0] || "General";
      const DOMAIN_TO_ROLE_ID: Record<string, string> = {
        "Cybersecurity & Threat Defense": "cybersecurity-analyst",
        "Cybersecurity & Threat Defense Engineer": "cybersecurity-analyst",
        "Full-Stack Software & Cloud/DevOps": "fullstack-dev",
        "Full-Stack Software Engineer (SDE)": "fullstack-dev",
        "AI, Machine Learning & GenAI": "ai-engineer",
        "AI & Machine Learning Engineer": "ai-engineer",
        "Robotics & Autonomous Systems": "software-engineer",
        "Robotics & Automation Specialist": "software-engineer",
        "Core Engineering & CAD/BIM": "software-engineer",
        "CAD/CAE Mechanical Systems Designer": "software-engineer",
        "Civil BIM & Structural Engineer": "software-engineer",
        "Tech Product Management & Consulting": "product-manager",
        "Technical Product Manager (PM)": "product-manager",
      };
      const careerId = DOMAIN_TO_ROLE_ID[topDomain] || DOMAIN_TO_ROLE_ID[mlResult?.recommended_career || ""] || topDomain.toLowerCase().replace(/[^a-z0-9]/g, "-");

      await firestoreService.saveAssessmentResult(
        user.uid,
        mlResult?.confidence_score ? Math.round(mlResult.confidence_score) : 85,
        careerId,
        {
          confidence: mlResult?.confidence_score ? Math.round(mlResult.confidence_score) : 85,
          ctc_lpa: Math.round(mlResult?.estimated_ctc_lpa || 8.5),
        }
      );
      navigate("/dashboard");
    } catch (err) {
      console.error("Failed saving results:", err);
      navigate("/dashboard");
    } finally {
      setSaving(false);
    }
  };

  // Section details
  const getSectionBadge = (sec: number) => {
    if (sec === 1) return { label: "Section 1 of 3: Problem Solving Logic", color: "bg-[#4F46E5]" };
    if (sec === 2) return { label: "Section 2 of 3: Domain & Tool Preferences", color: "bg-[#14B8A6]" };
    if (sec === 3) return { label: "Section 3 of 3: Real-World Scenarios", color: "bg-[#F5A623]" };
    return { label: "Section 4: Adaptive Tie-Breaker (Clarity Calibration)", color: "bg-purple-600" };
  };

  const topDomain = useMemo(() => {
    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[0] || "";
  }, [scores]);

  const recommendedRoleTitle = useMemo(() => {
    if (stage === "10th") {
      return ASSESSMENT_DOMAIN_TO_CAREER[topDomain] || topDomain || "Science (PCM) Stream";
    }
    // If mlResult is present and reflects the assessment domain
    if (mlResult?.recommended_career) {
      return mlResult.recommended_career;
    }
    return ASSESSMENT_DOMAIN_TO_CAREER[topDomain] || topDomain || "Full-Stack Software Engineer (SDE)";
  }, [stage, topDomain, mlResult]);

  const nextStepSkills = useMemo(() => {
    if (stage === "10th") {
      return DOMAIN_SKILLS_MAP[topDomain] || DOMAIN_SKILLS_MAP["Science PCM"] || [];
    }
    if (mlResult?.missing_skills && mlResult.missing_skills.length > 0) {
      return mlResult.missing_skills;
    }
    return DOMAIN_SKILLS_MAP[topDomain] || DOMAIN_SKILLS_MAP[recommendedRoleTitle] || [];
  }, [stage, topDomain, mlResult, recommendedRoleTitle]);

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="bg-[#12122B] text-white rounded-3xl p-6 sm:p-8 border border-white/10 shadow-xl relative overflow-hidden">
        <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[#14B8A6]/20 blur-3xl" />
        <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 rounded-md text-xs font-data font-bold bg-[#14B8A6] text-white uppercase flex items-center gap-1.5">
              <Compass size={13} /> PERSONALIZED CAREER DISCOVERY
            </span>
            <span className="px-2.5 py-1 rounded-md text-xs font-data font-semibold bg-white/10 text-gray-200">
              Initial 25 Diagnostic Questions · Adaptive Tie-Breakers up to 50
            </span>
            <span className="px-2.5 py-1 rounded-md text-xs font-data font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <Sparkles size={12} className="text-emerald-400" />
              {isLiveAI ? "2026 Live Trends Engine (Active)" : "2026 Multi-Track Calibrated"}
            </span>
          </div>

          <button
            onClick={() => setShowProofModal(true)}
            className="flex items-center gap-1.5 text-xs font-data text-[#14B8A6] bg-[#14B8A6]/10 px-3 py-1.5 rounded-lg border border-[#14B8A6]/30 hover:bg-[#14B8A6]/20 transition-colors"
          >
            <ShieldCheck size={14} /> View Model Metrics & Proof
          </button>
        </div>

        <h1 className="text-3xl sm:text-4xl font-display font-bold text-white mb-2">
          Career Discovery & Skill Gap Assessment
        </h1>
        <p className="text-sm sm:text-base font-body text-gray-300 max-w-3xl">
          Designed for all student levels—Class 10th stream discovery, Class 12th college degrees, and university engineering & non-engineering branches.
        </p>
      </div>

      {/* 1. STAGE SELECTION (If not chosen yet) */}
      {!stage && !completed && (
        <div className="space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-2xl font-display font-bold text-[#12122B]">
              Select Your Current Educational Stage
            </h2>
            <p className="text-sm text-gray-600">
              The assessment will calibrate questions and recommendations tailored to your exact decision stage:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            {/* 10th Stage */}
            <button
              onClick={() => handleSelectStage("10th")}
              className="text-left p-6 rounded-3xl bg-white border-2 border-gray-200 hover:border-[#4F46E5] hover:shadow-xl transition-all group flex flex-col justify-between space-y-6"
            >
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-[#4F46E5] flex items-center justify-center group-hover:scale-110 transition-transform">
                  <School size={24} />
                </div>
                <h3 className="text-lg font-display font-bold text-[#12122B] group-hover:text-[#4F46E5]">
                  Class 10th / Secondary
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Deciding between <strong>Science PCM, PCB, Commerce, or Arts/Humanities</strong>. Discover your cognitive aptitudes and future career paths.
                </p>
              </div>
              <div className="flex items-center text-xs font-data font-bold text-[#4F46E5]">
                Start 10th Stream Discovery →
              </div>
            </button>

            {/* 12th Stage */}
            <button
              onClick={() => handleSelectStage("12th")}
              className="text-left p-6 rounded-3xl bg-white border-2 border-gray-200 hover:border-[#14B8A6] hover:shadow-xl transition-all group flex flex-col justify-between space-y-6"
            >
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#14B8A6] flex items-center justify-center group-hover:scale-110 transition-transform">
                  <BookOpen size={24} />
                </div>
                <h3 className="text-lg font-display font-bold text-[#12122B] group-hover:text-[#14B8A6]">
                  Class 12th / Intermediate
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Evaluating college degrees (<strong>B.Tech, B.Com, BBA, BCA, B.Des, Law, Medicine</strong>), entrance exams, and high-demand specializations.
                </p>
              </div>
              <div className="flex items-center text-xs font-data font-bold text-[#14B8A6]">
                Start College Degree Discovery →
              </div>
            </button>

            {/* College Stage */}
            <button
              onClick={() => handleSelectStage("college")}
              className="text-left p-6 rounded-3xl bg-white border-2 border-gray-200 hover:border-[#F5A623] hover:shadow-xl transition-all group flex flex-col justify-between space-y-6"
            >
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-[#F5A623] flex items-center justify-center group-hover:scale-110 transition-transform">
                  <GraduationCap size={24} />
                </div>
                <h3 className="text-lg font-display font-bold text-[#12122B] group-hover:text-[#F5A623]">
                  College Student / Graduate
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  All branches (<strong>Engineering, Commerce, Design, Science</strong>). Maps your GPA and skills to exact job roles, skill gaps, and salary benchmarks.
                </p>
              </div>
              <div className="flex items-center text-xs font-data font-bold text-[#F5A623]">
                Start Industry Career Match →
              </div>
            </button>
          </div>
        </div>
      )}

      {/* 2. QUESTIONNAIRE ACTIVE */}
      {stage && !completed && currentQ && (
        <div className="space-y-6">
          {/* Progress and Ambiguity Bar */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 shadow-sm space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-data">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-md text-white font-bold ${getSectionBadge(currentQ.sectionNumber).color}`}>
                  {getSectionBadge(currentQ.sectionNumber).label}
                </span>
                <span className="text-gray-500 font-medium">
                  Question {currentQuestionIdx + 1} of {activeQuestions.length} (Max 50)
                </span>
              </div>

              {/* Live Clarity Indicator */}
              <div className="flex items-center gap-1.5">
                {clarityStatus.isAmbiguous && currentQuestionIdx >= 24 ? (
                  <span className="text-amber-700 font-bold flex items-center gap-1 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200">
                    <AlertCircle size={13} /> Close Match Detected: Tie-Breakers Active
                  </span>
                ) : (
                  <span className="text-emerald-700 font-semibold flex items-center gap-1 bg-emerald-50 px-2.5 py-0.5 rounded">
                    <CheckCircle size={13} /> {clarityStatus.message}
                  </span>
                )}
              </div>
            </div>

            <ProgressBar
              progress={((currentQuestionIdx + 1) / activeQuestions.length) * 100}
              showPercent={false}
              color={currentQ.sectionNumber === 4 ? "milestone" : "growth"}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Background context & optional tool filters (College only) */}
            <div className="lg:col-span-1 space-y-6">
              {stage === "college" ? (
                <Card className="border border-gray-200 p-5 space-y-4">
                  <h3 className="font-display font-bold text-sm text-[#12122B] flex items-center gap-1.5">
                    <Compass size={16} className="text-[#4F46E5]" />
                    Student Profile Settings
                  </h3>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                      Academic Branch / Stream
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {["CSE", "IT", "ECE", "EEE", "MECH", "CIVIL"].map((b) => (
                        <button
                          key={b}
                          onClick={() => {
                            setBranch(b);
                            loadQuestionsForStage("college", b);
                          }}
                          className={`px-1.5 py-1 rounded text-xs font-data font-bold border transition-all ${
                            branch === b
                              ? "bg-[#4F46E5] text-white border-[#4F46E5]"
                              : "bg-gray-50 text-gray-700 border-gray-200"
                          }`}
                        >
                          {b}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] font-semibold text-gray-700 mb-1">
                      <span>Cumulative GPA</span>
                      <span className="font-data font-bold text-[#4F46E5]">{avgGpa.toFixed(1)}</span>
                    </div>
                    <input
                      type="range"
                      min="5.0"
                      max="10.0"
                      step="0.1"
                      value={avgGpa}
                      onChange={(e) => setAvgGpa(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-gray-200 rounded appearance-none cursor-pointer accent-[#4F46E5]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                      City Region
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {["Tier 1", "Tier 2", "Tier 3"].map((t) => (
                        <button
                          key={t}
                          onClick={() => setCityTier(t)}
                          className={`px-1.5 py-1 rounded text-xs font-data border transition-all ${
                            cityTier === t
                              ? "bg-[#12122B] text-white border-[#12122B]"
                              : "bg-gray-50 text-gray-600 border-gray-200"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                </Card>
              ) : (
                <Card className="border border-gray-200 p-5 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-data text-gray-500 uppercase">
                    <Layers size={15} className="text-[#4F46E5]" /> Diagnostic Roadmap
                  </div>
                  <h4 className="font-display font-bold text-sm text-[#12122B]">
                    {stage === "10th" ? "Stream Compatibility Engine" : "Degree Program Calibrator"}
                  </h4>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Evaluates your cognitive logic, subject affinity, and real-world preferences to recommend the highest matching pathway.
                  </p>
                </Card>
              )}

              {/* Stage Switcher */}
              <button
                onClick={() => setStage(null)}
                className="text-xs font-data text-gray-500 hover:text-gray-800 flex items-center gap-1 transition-colors"
              >
                ← Switch Educational Stage
              </button>
            </div>

            {/* Right: Question Card */}
            <div className="lg:col-span-2">
              <Card className="p-6 sm:p-8 border border-gray-200 shadow-sm space-y-6">
                <div>
                  <span className="text-xs font-data text-gray-500 uppercase tracking-wider block mb-1">
                    {currentQ.category}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-display font-bold text-[#12122B] leading-snug">
                    {currentQ.question}
                  </h2>
                </div>

                <div className="space-y-3 pt-2">
                  {currentQ.options.map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectOption(opt.domain, opt.points)}
                      className="w-full text-left p-4 sm:p-5 rounded-2xl border-2 border-gray-100 hover:border-[#4F46E5] hover:bg-indigo-50/30 transition-all flex items-center justify-between group"
                    >
                      <span className="text-sm font-medium text-gray-800 group-hover:text-[#4F46E5]">
                        {opt.text}
                      </span>
                      <ArrowRight size={18} className="text-gray-300 group-hover:text-[#4F46E5] group-hover:translate-x-1.5 transition-all shrink-0 ml-3" />
                    </button>
                  ))}
                </div>

                {/* Navigation and Early Finalize Button */}
                <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
                  <button
                    onClick={() => setCurrentQuestionIdx((prev) => Math.max(0, prev - 1))}
                    disabled={currentQuestionIdx === 0}
                    className="text-xs font-data text-gray-500 disabled:opacity-30"
                  >
                    ← Previous Question
                  </button>

                  {currentQuestionIdx >= 24 && (
                    <button
                      onClick={() => finalizeAssessment(scores)}
                      className="text-xs font-data font-bold text-[#4F46E5] hover:underline flex items-center gap-1"
                    >
                      I have enough clarity, view results now →
                    </button>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* 3. RESULTS DISPLAY */}
      {completed && (
        <div className="space-y-8">
          {predicting ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-gray-200 space-y-4 shadow-sm">
              <div className="w-12 h-12 rounded-full border-4 border-[#4F46E5]/20 border-t-[#4F46E5] animate-spin mx-auto" />
              <h3 className="font-display font-bold text-lg text-[#12122B]">
                Synthesizing Your Career Discovery Assessment...
              </h3>
              <p className="text-xs font-data text-gray-500">
                Calibrating multi-dimensional responses against verified Indian academic and industry benchmarks
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Top Recommendation Banner */}
              <div className="bg-gradient-to-br from-[#12122B] to-[#1E1E45] text-white rounded-3xl p-8 border border-white/10 shadow-xl relative overflow-hidden">
                <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[#14B8A6]/20 blur-3xl" />
                
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-data font-bold bg-[#14B8A6] text-white flex items-center gap-1.5">
                      <CheckCircle size={14} /> RECOMMENDED ROUTE · HIGHEST AFFINITY
                    </span>
                    <span className="px-2.5 py-1 rounded-md text-xs font-data bg-white/10 text-gray-300">
                      {stage === "10th" ? "Class 10 Stream Discovery" : (stage === "12th" ? "Class 12 Degree Route" : `${branch} Stream Calibration`)}
                    </span>
                  </div>

                  <span className="text-xs font-data text-gray-400">
                    Questions Answered: {activeQuestions.length >= 25 ? activeQuestions.length : 25}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                  <div className="md:col-span-2 space-y-2">
                    <h2 className="text-3xl sm:text-4xl font-display font-bold text-white">
                      {recommendedRoleTitle}
                    </h2>
                    <p className="text-sm text-gray-300">
                      {stage === "10th" 
                        ? "Your logical reasoning and problem-solving patterns align most strongly with this senior secondary academic stream."
                        : stage === "12th"
                        ? "Your interests and analytical scores indicate high aptitude and long-term placement potential in this degree pathway."
                        : "Based on 33 technical parameters, this professional domain represents your highest probability of placement."}
                    </p>
                  </div>

                  {stage === "college" && mlResult && (
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center space-y-2">
                      <span className="text-xs font-data text-gray-400 uppercase tracking-wider">
                        Estimated CTC ({cityTier})
                      </span>
                      <div className="text-3xl sm:text-4xl font-data font-bold text-[#14B8A6]">
                        ₹{mlResult.estimated_ctc_lpa} LPA
                      </div>
                      <span className="text-xs font-data text-gray-400 block">
                        Range: {mlResult.salary_range}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Breakdown Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Domain Affinity Distribution */}
                <Card className="border border-gray-200 p-6 space-y-4">
                  <h3 className="font-display font-bold text-lg text-[#12122B] flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <BarChart3 size={18} className="text-[#4F46E5]" />
                      Domain Alignment Scores
                    </span>
                    <span className="text-xs font-data text-gray-500">Relative Breakdown</span>
                  </h3>
                  <p className="text-xs text-gray-500">
                    Calculated score distribution across evaluated career and academic pathways:
                  </p>

                  <div className="space-y-3.5 pt-2">
                    {Object.entries(scores)
                      .sort((a, b) => b[1] - a[1])
                      .map(([dom, sc], idx) => {
                        const totalScore = Math.max(1, Object.values(scores).reduce((a, b) => a + b, 0));
                        const pct = Math.round((sc / totalScore) * 100);
                        return (
                          <div key={idx} className="space-y-1">
                            <div className="flex justify-between text-xs font-medium">
                              <span className={idx === 0 ? "font-bold text-[#12122B]" : "text-gray-700"}>
                                {dom}
                              </span>
                              <span className="font-data font-bold text-[#4F46E5]">{pct}%</span>
                            </div>
                            <ProgressBar
                              progress={pct}
                              showPercent={false}
                              color={idx === 0 ? "growth" : "milestone"}
                            />
                          </div>
                        );
                      })}
                  </div>
                </Card>

                {/* Actionable Next Steps / Skill Gaps */}
                <Card className="border border-gray-200 p-6 space-y-4 flex flex-col justify-between">
                  <div>
                    <h3 className="font-display font-bold text-lg text-[#12122B] flex items-center gap-2 mb-2">
                      <TrendingUp size={18} className="text-[#F5A623]" />
                      Recommended Next Steps & Key Focus
                    </h3>

                    {stage === "10th" ? (
                      <div className="space-y-2.5 text-xs text-gray-700">
                        <p className="font-medium text-gray-800">
                          To succeed in your recommended {topDomain} stream:
                        </p>
                        {nextStepSkills.map((step, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between text-xs"
                          >
                            <span className="font-bold text-[#4F46E5]">{idx + 1}. {step}</span>
                            <span className="text-[11px] font-data text-indigo-700 bg-indigo-100/80 px-2 py-0.5 rounded">
                              Core Milestone
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : nextStepSkills.length > 0 ? (
                      <div className="space-y-2">
                        <p className="text-xs text-gray-600 mb-2">
                          Acquire these skills to push your candidate profile above 95%:
                        </p>
                        {nextStepSkills.map((s, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/70 flex items-center justify-between text-xs"
                          >
                            <span className="font-display font-bold text-amber-900">+ {s}</span>
                            <span className="text-[11px] font-data text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded">
                              High Market Value
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
                        <CheckCircle size={16} /> Solid foundational profile identified for this pathway!
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-gray-100 space-y-3">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        onClick={handleRetake}
                        className="flex-1 text-xs justify-center"
                      >
                        <RotateCcw size={14} className="mr-1.5" /> Retake Test
                      </Button>
                      <Button
                        variant="primary"
                        onClick={handleSaveAndContinue}
                        disabled={saving}
                        className="flex-1 text-xs justify-center"
                      >
                        {saving ? "Saving..." : "Save Route & Continue"}
                      </Button>
                    </div>

                    <div className="text-center pt-1">
                      <button
                        type="button"
                        onClick={handleResetStage}
                        className="text-[11px] font-data text-gray-500 hover:text-[#4F46E5] hover:underline transition-colors"
                      >
                        Switch educational stage (Class 10th / 12th / College)
                      </button>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Model Verification Modal */}
      {showProofModal && modelMetrics && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto border border-gray-200 shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h3 className="font-display font-bold text-xl text-[#12122B] flex items-center gap-2">
                  <ShieldCheck size={20} className="text-[#14B8A6]" />
                  Model Verification & Metrics
                </h3>
                <p className="text-xs font-data text-gray-500">{modelMetrics.dataset_source}</p>
              </div>
              <button
                onClick={() => setShowProofModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <span className="text-[11px] font-data text-gray-500 block">Overall Accuracy</span>
                <span className="text-xl font-data font-bold text-[#4F46E5]">{modelMetrics.overall_accuracy}%</span>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <span className="text-[11px] font-data text-gray-500 block">Weighted Precision</span>
                <span className="text-xl font-data font-bold text-[#14B8A6]">{modelMetrics.precision_weighted}%</span>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <span className="text-[11px] font-data text-gray-500 block">Validation Samples</span>
                <span className="text-xl font-data font-bold text-[#12122B]">{modelMetrics.validation_samples}</span>
              </div>
            </div>

            <div>
              <h4 className="font-display font-semibold text-sm text-[#12122B] mb-2">
                Per-Track Precision Metrics
              </h4>
              <div className="border border-gray-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-data">
                    <tr>
                      <th className="p-2.5">Domain</th>
                      <th className="p-2.5 text-right">Precision</th>
                      <th className="p-2.5 text-right">Recall</th>
                      <th className="p-2.5 text-right">F1</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-data">
                    {Object.entries(modelMetrics.per_class_metrics).map(([cls, met], idx) => (
                      <tr key={idx}>
                        <td className="p-2.5 font-medium text-gray-900">{cls}</td>
                        <td className="p-2.5 text-right text-emerald-700 font-bold">{met.precision}%</td>
                        <td className="p-2.5 text-right text-gray-700">{met.recall}%</td>
                        <td className="p-2.5 text-right text-[#4F46E5] font-semibold">{met.f1_score}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-2 text-right">
              <Button variant="primary" onClick={() => setShowProofModal(false)} className="text-xs">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
