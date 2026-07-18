import React, { useEffect, useMemo, useState } from "react";
import { CheckCircle, Clock, Trophy } from "lucide-react";
import { Card, Badge, Button, ProgressBar } from "../../components/ui/UI";
import { useAuth } from "../../hooks/useAuth";
import { firestoreService } from "../../services/firestoreService";
import { roles } from "../../data/roles";
import { geminiService } from "../../services/geminiService";

interface Question {
  id: number;
  question: string;
  category: string;
  answers: { text: string; points: { tech?: number; business?: number; creative?: number } }[];
}

const mulberry32 = (seed: number) => {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const shuffleWithSeed = <T,>(arr: T[], seed: string) => {
  const numSeed = Array.from(seed).reduce((acc, c) => acc + c.charCodeAt(0), 0) || 1;
  const rand = mulberry32(numSeed);
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const fallbackQuestions: Question[] = [
  {
    id: 1,
    category: "Interest",
    question: "Which activity do you enjoy the most?",
    answers: [
      { text: "Building apps or automating tasks", points: { tech: 10 } },
      { text: "Planning, managing, and leading teams", points: { business: 10 } },
      { text: "Designing, writing, or creating content", points: { creative: 10 } },
      { text: "Analyzing data to find insights", points: { tech: 7, business: 3 } },
    ],
  },
  {
    id: 2,
    category: "Skills",
    question: "Which skill describes you best right now?",
    answers: [
      { text: "Logical problem-solving", points: { tech: 10 } },
      { text: "Negotiation & communication", points: { business: 10 } },
      { text: "Creative thinking", points: { creative: 10 } },
      { text: "Organization & consistency", points: { business: 6, creative: 4 } },
    ],
  },
  {
    id: 3,
    category: "Environment",
    question: "Where would you prefer to work?",
    answers: [
      { text: "Tech startup / product team", points: { tech: 10 } },
      { text: "Corporate / management role", points: { business: 10 } },
      { text: "Studio / media / creative team", points: { creative: 10 } },
      { text: "Hybrid with flexibility", points: { tech: 6, business: 2, creative: 2 } },
    ],
  },
  {
    id: 4,
    category: "Impact",
    question: "You want your work to mostly…",
    answers: [
      { text: "Build products used by millions", points: { tech: 10 } },
      { text: "Grow revenue / business outcomes", points: { business: 10 } },
      { text: "Inspire or entertain people", points: { creative: 10 } },
      { text: "Improve decisions with insights", points: { tech: 6, business: 4 } },
    ],
  },
  {
    id: 5,
    category: "RiskTolerance",
    question: "How comfortable are you with risk?",
    answers: [
      { text: "I love experimenting and taking risks", points: { creative: 7, tech: 3 } },
      { text: "I take calculated risks after analysis", points: { tech: 6, business: 4 } },
      { text: "I prefer stable, predictable paths", points: { business: 8, creative: 2 } },
      { text: "It depends on the opportunity", points: { business: 5, tech: 5 } },
    ],
  },
  {
    id: 6,
    category: "AttentionToDetail",
    question: "Which sounds most like you?",
    answers: [
      { text: "I like precision and correctness", points: { tech: 8, business: 2 } },
      { text: "I focus on outcomes and strategy", points: { business: 10 } },
      { text: "I focus on originality and aesthetics", points: { creative: 10 } },
      { text: "I balance detail and speed", points: { tech: 5, business: 5 } },
    ],
  },
  {
    id: 7,
    category: "Collaboration",
    question: "In a team, you usually prefer to…",
    answers: [
      { text: "Own a technical problem end-to-end", points: { tech: 10 } },
      { text: "Coordinate people and timelines", points: { business: 10 } },
      { text: "Contribute ideas and creativity", points: { creative: 10 } },
      { text: "Support and improve processes", points: { business: 6, tech: 4 } },
    ],
  },
  {
    id: 8,
    category: "Patience",
    question: "How do you feel about long learning journeys?",
    answers: [
      { text: "I enjoy deep learning and mastery", points: { tech: 8, creative: 2 } },
      { text: "I prefer faster results and iteration", points: { business: 6, creative: 4 } },
      { text: "I’m okay if the end goal is worth it", points: { tech: 5, business: 5 } },
      { text: "I get bored quickly", points: { creative: 7, business: 3 } },
    ],
  },
  {
    id: 9,
    category: "AmbiguityComfort",
    question: "When requirements are unclear, you…",
    answers: [
      { text: "Experiment and learn by building", points: { tech: 8, creative: 2 } },
      { text: "Clarify goals and plan steps", points: { business: 10 } },
      { text: "Brainstorm multiple directions", points: { creative: 10 } },
      { text: "Analyze options and choose a path", points: { tech: 6, business: 4 } },
    ],
  },
  {
    id: 10,
    category: "LearningStyle",
    question: "What’s the best way for you to learn?",
    answers: [
      { text: "Projects and hands-on practice", points: { tech: 10 } },
      { text: "Case studies and structured plans", points: { business: 10 } },
      { text: "Exploration and creative experiments", points: { creative: 10 } },
      { text: "Mix of videos + practice + notes", points: { tech: 5, business: 3, creative: 2 } },
    ],
  },
  // 5 more (accuracy boosters)
  {
    id: 11,
    category: "Strength",
    question: "What do people usually praise you for?",
    answers: [
      { text: "Solving difficult problems", points: { tech: 10 } },
      { text: "Leading and decision-making", points: { business: 10 } },
      { text: "Original ideas and creativity", points: { creative: 10 } },
      { text: "Reliability and discipline", points: { business: 7, tech: 3 } },
    ],
  },
  {
    id: 12,
    category: "WorkPreference",
    question: "Which work style suits you?",
    answers: [
      { text: "Deep focus work", points: { tech: 8, creative: 2 } },
      { text: "People-facing and coordination", points: { business: 10 } },
      { text: "Creative collaboration", points: { creative: 10 } },
      { text: "Balanced mix", points: { tech: 4, business: 4, creative: 2 } },
    ],
  },
  {
    id: 13,
    category: "Motivation",
    question: "What motivates you most?",
    answers: [
      { text: "Building something impressive", points: { tech: 10 } },
      { text: "Growth, money, and impact", points: { business: 10 } },
      { text: "Recognition for creativity", points: { creative: 10 } },
      { text: "Helping people with solutions", points: { tech: 6, business: 4 } },
    ],
  },
  {
    id: 14,
    category: "Future",
    question: "In 5 years, you’d like to be…",
    answers: [
      { text: "A strong engineer/technical specialist", points: { tech: 10 } },
      { text: "A manager or business owner", points: { business: 10 } },
      { text: "A creator with a strong portfolio", points: { creative: 10 } },
      { text: "An analyst driving decisions", points: { tech: 6, business: 4 } },
    ],
  },
  {
    id: 15,
    category: "Challenge",
    question: "What challenge do you enjoy more?",
    answers: [
      { text: "Debugging and optimizing systems", points: { tech: 10 } },
      { text: "Solving business problems", points: { business: 10 } },
      { text: "Creating something from scratch", points: { creative: 10 } },
      { text: "Improving a process step-by-step", points: { business: 6, tech: 4 } },
    ],
  },
];

export const AssessmentPage: React.FC = () => {
  const { user } = useAuth();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [scores, setScores] = useState({ tech: 0, business: 0, creative: 0 });
  const [completed, setCompleted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [questionSeed, setQuestionSeed] = useState<string>("");
  const [questionBank, setQuestionBank] = useState<Question[]>([]);
  const [runQuestions, setRunQuestions] = useState<Question[]>([]);

  const generate = async () => {
    const seed = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setQuestionSeed(seed);
    setCurrentQuestion(0);
    setScores({ tech: 0, business: 0, creative: 0 });
    setCompleted(false);

    try {
      setLoadingQuestions(true);
      const generated = (await geminiService.generateAssessmentQuestions(seed)) as Question[];
      setQuestionBank(generated);
      const shuffled = shuffleWithSeed(generated, seed);
      const selected = shuffled.slice(0, 10).map((q, idx) => ({ ...q, id: idx + 1 }));
      setRunQuestions(selected);

      if (user) {
        await firestoreService.saveAssessmentRun(user.uid, {
          seed,
          questions: generated,
          selectedQuestionIds: selected.map((q) => q.id),
          createdAt: new Date(),
        });
      }
    } catch (e) {
      console.error("Failed to generate questions (Gemini). Falling back:", e);
      const shuffled = shuffleWithSeed(fallbackQuestions, seed);
      const selected = shuffled.slice(0, 10).map((q, idx) => ({ ...q, id: idx + 1 }));
      setQuestionBank(fallbackQuestions);
      setRunQuestions(selected);
    } finally {
      setLoadingQuestions(false);
    }
  };

  useEffect(() => {
    void generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const questions = runQuestions;

  const handleAnswer = (points: { tech?: number; business?: number; creative?: number }) => {
    setScores((prev) => ({
      tech: prev.tech + (points.tech || 0),
      business: prev.business + (points.business || 0),
      creative: prev.creative + (points.creative || 0),
    }));

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setCompleted(true);
    }
  };

  const getRecommendedCareer = (): string => {
    const max = Math.max(scores.tech, scores.business, scores.creative);
    if (scores.tech === max) return "ai-engineer";
    if (scores.business === max) return "chartered-accountant";
    return "fullstack-dev";
  };

  const handleSaveResults = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const recommendedCareer = getRecommendedCareer();
      const totalScore = scores.tech + scores.business + scores.creative;
      await firestoreService.saveAssessmentResult(
        user.uid,
        totalScore,
        recommendedCareer,
        scores
      );
      alert("Assessment results saved!");
    } catch (error) {
      console.error("Save error:", error);
      alert("Failed to save results");
    } finally {
      setSaving(false);
    }
  };

  if (loadingQuestions) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="max-w-xl w-full">
          <h2 className="text-xl font-bold text-gray-900">Generating your questions...</h2>
          <p className="text-sm text-gray-600 mt-2">
            CareerVerse AI is creating a fresh assessment for you.
          </p>
          <div className="mt-6 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full w-1/2 bg-gradient-to-r from-indigo-600 to-purple-600 animate-pulse" />
          </div>
        </Card>
      </div>
    );
  }

  if (!loadingQuestions && questions.length === 0) {
    return (
      <div className="space-y-8">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl p-8">
          <h1 className="text-4xl font-bold mb-2">Career Assessment</h1>
          <p className="text-lg opacity-90">
            We couldn’t generate questions right now. Please check your Gemini API key and try again.
          </p>
        </div>
        <Card>
          <Button
            onClick={() => void generate()}
            className="w-full"
          >
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  if (completed) {
    const recommendedCareer = getRecommendedCareer();
    const recommendedRole = roles.find((r) => r.id === recommendedCareer);
    const totalScore = scores.tech + scores.business + scores.creative;
    const maxScore = 100;

    return (
      <div className="space-y-8">
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl p-8">
          <h1 className="text-4xl font-bold mb-2">Assessment Complete! 🎉</h1>
          <p className="text-lg opacity-90">
            Based on your answers, here's your AI-recommended career path
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Scores */}
          <Card>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Your Scores</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-semibold">Tech</span>
                  <span className="text-sm font-bold text-indigo-600">
                    {scores.tech}/{maxScore}
                  </span>
                </div>
                <ProgressBar progress={(scores.tech / maxScore) * 100} />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-semibold">Business</span>
                  <span className="text-sm font-bold text-purple-600">
                    {scores.business}/{maxScore}
                  </span>
                </div>
                <ProgressBar progress={(scores.business / maxScore) * 100} />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-semibold">Creative</span>
                  <span className="text-sm font-bold text-pink-600">
                    {scores.creative}/{maxScore}
                  </span>
                </div>
                <ProgressBar progress={(scores.creative / maxScore) * 100} />
              </div>
            </div>
          </Card>

          {/* Recommendation */}
          <Card className="md:col-span-2 bg-gradient-to-r from-indigo-50 to-purple-50">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-2xl font-bold text-gray-900">
                Your Perfect Career
              </h3>
              <Trophy className="text-yellow-500" size={32} />
            </div>

            {recommendedRole && (
              <div>
                <h4 className="text-3xl font-bold text-indigo-600 mb-2">
                  {recommendedRole.name}
                </h4>
                <p className="text-gray-600 mb-4">{recommendedRole.description}</p>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Salary</p>
                    <p className="font-bold text-green-600">
                      {recommendedRole.salaryRange}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Trend</p>
                    <p className="font-bold text-yellow-600">
                      {recommendedRole.trendScore.toFixed(1)}/10
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2">
                    Key Skills:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {recommendedRole.requiredSkills.slice(0, 4).map((skill) => (
                      <Badge key={skill} variant="primary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={handleSaveResults}
                  disabled={saving}
                  className="w-full"
                >
                  {saving ? "Saving..." : "Save & Continue"}
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl p-8">
        <h1 className="text-4xl font-bold mb-2">Career Assessment</h1>
        <p className="text-lg opacity-90">
          Answer 10 quick questions to get your AI-recommended career path
        </p>
      </div>

      {/* Progress */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Progress</h3>
          <span className="text-2xl font-bold text-indigo-600">
            {currentQuestion + 1}/{questions.length}
          </span>
        </div>
        <ProgressBar
          progress={((currentQuestion + 1) / questions.length) * 100}
          showPercent={false}
        />
      </Card>

      {/* Question */}
      <Card className="bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="mb-6">
          <Badge variant="secondary" className="mb-4">
            {questions[currentQuestion].category}
          </Badge>
          <h2 className="text-2xl font-bold text-gray-900">
            {questions[currentQuestion].question}
          </h2>
        </div>

        <div className="space-y-3">
          {questions[currentQuestion].answers.map((answer, index) => (
            <button
              key={index}
              onClick={() => handleAnswer(answer.points)}
              className="w-full p-4 text-left bg-white border-2 border-gray-200 rounded-lg hover:border-indigo-600 hover:bg-indigo-50 transition font-medium text-gray-900"
            >
              {answer.text}
            </button>
          ))}
        </div>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
          disabled={currentQuestion === 0}
          className="px-6 py-2 border-2 border-gray-300 rounded-lg font-medium text-gray-700 disabled:opacity-50"
        >
          Previous
        </button>
        <span className="text-sm text-gray-600">
          <Clock size={16} className="inline mr-2" />
          Take your time, there's no time limit
        </span>
      </div>
    </div>
  );
};
