import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Award, CheckCircle, Clock, Sparkles, Trophy, ArrowRight, RotateCcw, PenTool } from "lucide-react";
import { Card, Badge, Button, ProgressBar } from "../../components/ui/UI";
import { roles } from "../../data/roles";
import { useAuth } from "../../hooks/useAuth";
import { firestoreService } from "../../services/firestoreService";
import { LoadingCard } from "../../components/ui/Loading";

interface Question {
  id: number;
  category: string;
  question: string;
  answers: Array<{
    text: string;
    points: { tech?: number; business?: number; creative?: number };
  }>;
}

const fallbackQuestions: Question[] = [
  {
    id: 1,
    category: "Technical",
    question: "When facing a complex problem, what is your first instinct?",
    answers: [
      { text: "Break it down into code or algorithmic steps", points: { tech: 10 } },
      { text: "Analyze market data and resource trade-offs", points: { business: 10 } },
      { text: "Sketch visual layouts and user flows", points: { creative: 10 } },
      { text: "Discuss with peers to find a balanced solution", points: { business: 5, tech: 5 } },
    ],
  },
  {
    id: 2,
    category: "Interest",
    question: "Which of these projects excites you most to build?",
    answers: [
      { text: "An AI system that automates tasks", points: { tech: 10 } },
      { text: "A startup pitch deck and financial strategy", points: { business: 10 } },
      { text: "A consumer mobile app with stunning animations", points: { creative: 10 } },
      { text: "A data analytics dashboard for enterprises", points: { tech: 6, business: 4 } },
    ],
  },
  {
    id: 3,
    category: "Tools",
    question: "Which tool would you rather master in depth?",
    answers: [
      { text: "Python, Docker, and Cloud Infrastructure", points: { tech: 10 } },
      { text: "Excel models, Notion, and CRM systems", points: { business: 10 } },
      { text: "Figma, Adobe Creative Suite, and Webflow", points: { creative: 10 } },
      { text: "SQL, Tableau, and Analytics engines", points: { tech: 7, business: 3 } },
    ],
  },
  {
    id: 4,
    category: "Environment",
    question: "What type of daily work environment suits you best?",
    answers: [
      { text: "Deep architectural focus and debugging code", points: { tech: 10 } },
      { text: "Negotiating with stakeholders and leading teams", points: { business: 10 } },
      { text: "Iterating on brand visuals and user experiences", points: { creative: 10 } },
      { text: "A flexible hybrid role with varied responsibilities", points: { business: 5, creative: 5 } },
    ],
  },
  {
    id: 5,
    category: "Outcome",
    question: "What outcome makes you feel most accomplished?",
    answers: [
      { text: "Shipping a zero-bug, high-performance system", points: { tech: 10 } },
      { text: "Hitting revenue targets and growing user metrics", points: { business: 10 } },
      { text: "Seeing users delighted by an intuitive interface", points: { creative: 10 } },
      { text: "Optimizing a sluggish workflow to run 5x faster", points: { tech: 6, business: 4 } },
    ],
  },
];

const CountUpValue: React.FC<{ end: number; duration?: number }> = ({ end, duration = 800 }) => {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setValue(Math.round(progress * end));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [end, duration]);

  return <span className="font-data">{value}</span>;
};

export const AssessmentPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [scores, setScores] = useState({ tech: 0, business: 0, creative: 0 });
  const [completed, setCompleted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingQuestions] = useState(false);
  const [questions] = useState<Question[]>(fallbackQuestions);

  const maxScore = Math.max(1, (questions.length * 10) / 2);

  const handleAnswer = (points: { tech?: number; business?: number; creative?: number }) => {
    setScores((prev) => ({
      tech: prev.tech + (points.tech || 0),
      business: prev.business + (points.business || 0),
      creative: prev.creative + (points.creative || 0),
    }));

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
    } else {
      setCompleted(true);
    }
  };

  const recommendedRole = useMemo(() => {
    const { tech, business, creative } = scores;
    if (tech >= business && tech >= creative) {
      return roles.find((r) => r.category === "Technology" || r.id === "ai-engineer") || roles[0];
    }
    if (business >= tech && business >= creative) {
      return roles.find((r) => r.category === "Finance" || r.category === "Business") || roles[1];
    }
    return roles.find((r) => r.category === "Creative" || r.id === "ui-ux-designer") || roles[2];
  }, [scores]);

  const handleSaveResults = async () => {
    if (!user || !recommendedRole) return;
    setSaving(true);
    try {
      const overallScore = Math.round(
        ((scores.tech + scores.business + scores.creative) / (questions.length * 10)) * 100
      );
      await firestoreService.saveAssessmentResult(
        user.uid,
        overallScore,
        recommendedRole.id,
        scores
      );
      navigate("/dashboard");
    } catch (e) {
      console.error("Failed to save assessment:", e);
    } finally {
      setSaving(false);
    }
  };

  if (loadingQuestions) {
    return (
      <LoadingCard
        message="Plotting your aptitude route..."
        subtext="Generating randomized reasoning questions with Google Gemini"
      />
    );
  }

  if (completed) {
    return (
      <div className="space-y-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-[#12122B] text-white rounded-3xl p-6 sm:p-8 border border-white/10 shadow-xl relative overflow-hidden">
          <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[#14B8A6]/20 blur-3xl" />
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2.5 py-1 rounded-md text-xs font-data font-bold bg-[#14B8A6] text-white uppercase">
              ASSESSMENT COMPLETE · STATION 06
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-white mb-2">
            Your Verified Career Route
          </h1>
          <p className="text-sm sm:text-base font-body text-gray-300">
            Aptitude profile calibrated across technical reasoning, business acumen, and creative problem solving.
          </p>
        </div>

        {/* Results Breakdown Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Category Scores Card with Count-Up Animation in IBM Plex Mono */}
          <Card className="flex flex-col justify-between">
            <div>
              <h3 className="text-base font-display font-bold text-[#12122B] mb-4 flex items-center gap-2">
                <Sparkles size={18} className="text-[#4F46E5]" />
                Domain Scores
              </h3>

              <div className="space-y-4">
                {/* Tech */}
                <div>
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-xs font-display font-semibold text-[#12122B]">
                      Technical Aptitude
                    </span>
                    <span className="text-xs font-data font-bold text-[#4F46E5]">
                      <CountUpValue end={scores.tech} /> / {maxScore}
                    </span>
                  </div>
                  <ProgressBar progress={(scores.tech / maxScore) * 100} showPercent={false} color="signal" />
                </div>

                {/* Business */}
                <div>
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-xs font-display font-semibold text-[#12122B]">
                      Business Strategy
                    </span>
                    <span className="text-xs font-data font-bold text-[#F5A623]">
                      <CountUpValue end={scores.business} /> / {maxScore}
                    </span>
                  </div>
                  <ProgressBar progress={(scores.business / maxScore) * 100} showPercent={false} color="milestone" />
                </div>

                {/* Creative */}
                <div>
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-xs font-display font-semibold text-[#12122B]">
                      Creative & Design
                    </span>
                    <span className="text-xs font-data font-bold text-[#14B8A6]">
                      <CountUpValue end={scores.creative} /> / {maxScore}
                    </span>
                  </div>
                  <ProgressBar progress={(scores.creative / maxScore) * 100} showPercent={false} color="growth" />
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100">
              <button
                onClick={() => {
                  setCurrentQuestion(0);
                  setScores({ tech: 0, business: 0, creative: 0 });
                  setCompleted(false);
                }}
                className="w-full flex items-center justify-center gap-2 text-xs font-data font-bold text-[#6B7280] hover:text-[#12122B] py-2 cursor-pointer"
              >
                <RotateCcw size={14} /> Retake Assessment
              </button>
            </div>
          </Card>

          {/* Recommended Destination Card */}
          <Card className="md:col-span-2 border-[#4F46E5]/40 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className="text-xs font-data font-bold text-[#4F46E5] uppercase tracking-wider">
                    PRIMARY MATCH
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-display font-bold text-[#12122B]">
                    {recommendedRole?.name}
                  </h3>
                </div>
                <Trophy size={28} className="text-[#F5A623]" />
              </div>

              <p className="text-sm font-body text-[#6B7280] leading-relaxed mb-6">
                {recommendedRole?.description}
              </p>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-3.5 rounded-xl bg-[#FAFAF7] border border-gray-200">
                  <p className="text-xs font-data text-[#6B7280] uppercase">Target Compensation</p>
                  <p className="text-lg font-data font-bold text-[#0F766E]">
                    {recommendedRole?.salaryRange}
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-[#FAFAF7] border border-gray-200">
                  <p className="text-xs font-data text-[#6B7280] uppercase">Hiring Velocity</p>
                  <p className="text-lg font-data font-bold text-[#4F46E5]">
                    {recommendedRole?.trendScore.toFixed(1)} / 10
                  </p>
                </div>
              </div>

              <div>
                <span className="text-xs font-data font-bold text-[#6B7280] uppercase block mb-2">
                  Core Skills to Acquire:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {recommendedRole?.requiredSkills.slice(0, 5).map((skill) => (
                    <Badge key={skill} variant="ink">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 flex gap-3">
              <Button
                onClick={handleSaveResults}
                disabled={saving}
                className="w-full sm:w-auto"
              >
                {saving ? "Saving Route..." : "Save to Dashboard"} <ArrowRight size={16} />
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQuestion];
  const progressPercent = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      {/* Hero */}
      <div className="bg-[#12122B] text-white rounded-3xl p-6 sm:p-8 border border-white/10 shadow-xl relative overflow-hidden">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-1 rounded-md text-xs font-data font-bold bg-[#4F46E5] text-white uppercase">
            <PenTool size={12} className="inline mr-1" />
            STATION 06 · APTITUDE ASSESSMENT
          </span>
          <span className="text-xs font-mono text-gray-400">Quick 5-Question Calibration</span>
        </div>
        <h1 className="text-3xl font-display font-bold text-white mb-2">
          Career Aptitude Assessment
        </h1>
        <p className="text-sm font-body text-gray-300">
          Answer each scenario honestly to uncover your optimal Indian job market trajectory.
        </p>
      </div>

      {/* Progress Track */}
      <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-xs space-y-2">
        <div className="flex justify-between items-center text-xs font-data font-bold">
          <span className="text-[#6B7280]">
            QUESTION {currentQuestion + 1} OF {questions.length}
          </span>
          <span className="text-[#4F46E5]">
            {Math.round(progressPercent)}% COMPLETED
          </span>
        </div>
        <ProgressBar progress={progressPercent} showPercent={false} color="signal" />
      </div>

      {/* Question Card */}
      <Card className="border-gray-200">
        <div className="mb-6">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-data font-bold bg-[#FAFAF7] border border-gray-200 text-[#12122B] inline-block mb-3">
            {currentQ.category} Focus
          </span>
          <h2 className="text-xl sm:text-2xl font-display font-bold text-[#12122B] leading-snug">
            {currentQ.question}
          </h2>
        </div>

        <div className="space-y-3">
          {currentQ.answers.map((answer, index) => (
            <button
              key={index}
              onClick={() => handleAnswer(answer.points)}
              className="w-full p-4 rounded-xl text-left bg-white border border-gray-200 hover:border-[#4F46E5] hover:bg-[#4F46E5]/5 transition-all duration-150 cursor-pointer flex items-center justify-between group"
            >
              <span className="text-sm font-body font-medium text-[#12122B] group-hover:text-[#4F46E5]">
                {answer.text}
              </span>
              <ArrowRight size={16} className="text-gray-300 group-hover:text-[#4F46E5] transition-transform group-hover:translate-x-1" />
            </button>
          ))}
        </div>
      </Card>

      {/* Navigation Helper */}
      <div className="flex items-center justify-between px-2 text-xs font-data text-[#6B7280]">
        <button
          onClick={() => setCurrentQuestion((prev) => Math.max(0, prev - 1))}
          disabled={currentQuestion === 0}
          className="hover:text-[#12122B] disabled:opacity-40 cursor-pointer"
        >
          ← Previous Question
        </button>
        <span className="flex items-center gap-1">
          <Clock size={14} /> No time limit
        </span>
      </div>
    </div>
  );
};
