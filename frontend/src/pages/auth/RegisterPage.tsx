import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, User, AlertCircle, CheckCircle, GraduationCap, Compass, Sparkles, FileText, Users, Briefcase } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { Button, Card } from "../../components/ui/UI";
import { LoadingSpinner } from "../../components/ui/Loading";

const EDUCATION_STAGES = [
  {
    id: "school",
    title: "Class 10th / School",
    desc: "Foundation & Board Exam Stage",
    icon: GraduationCap,
  },
  {
    id: "stream",
    title: "Class 11th / 12th",
    desc: "Science, Commerce, or Arts Stream",
    icon: Compass,
  },
  {
    id: "skills",
    title: "College / Degree Student",
    desc: "B.Tech, B.Com, B.Sc, Diploma, etc.",
    icon: Sparkles,
  },
  {
    id: "resume",
    title: "Final Year / Graduating",
    desc: "Building Projects & Resume Portfolio",
    icon: FileText,
  },
  {
    id: "interview",
    title: "Placement / Job Seeker",
    desc: "Interview Preparation & Coding Rounds",
    icon: Users,
  },
  {
    id: "placement",
    title: "Early Professional",
    desc: "Working in Industry or Career Switcher",
    icon: Briefcase,
  },
];

export const RegisterPage: React.FC = () => {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    displayName: "",
    email: "",
    password: "",
    confirmPassword: "",
    currentStage: "school",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // If user is already logged in, redirect straight to dashboard
  useEffect(() => {
    if (user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const name = formData.displayName.trim();
    const email = formData.email.trim();
    const password = formData.password;
    const confirmPassword = formData.confirmPassword;
    const stage = formData.currentStage;

    if (!name) {
      setError("Please enter your full name");
      return;
    }

    if (!email) {
      setError("Please enter your email address");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setSubmitting(true);
    try {
      await register(email, password, name, stage);
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      console.error("Registration error:", err);
      const code = err?.code;
      if (code === "auth/email-already-in-use") {
        setError("This email is already registered. Please sign in or use another email.");
      } else if (code === "auth/invalid-email") {
        setError("Please provide a valid email address.");
      } else if (code === "auth/weak-password") {
        setError("Password should be at least 6 characters.");
      } else {
        setError(err?.message || "Registration failed. Please check your credentials.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#12122B] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="pointer-events-none absolute -top-40 -right-40 h-96 w-96 rounded-full bg-[#4F46E5]/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-[#14B8A6]/15 blur-3xl" />

      <Card className="w-full max-w-lg shadow-2xl relative z-10 border-gray-200/90 p-6 sm:p-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-[#4F46E5] rounded-2xl mb-3 shadow-md shadow-[#4F46E5]/30">
            <span className="font-display font-extrabold text-white text-lg">CV</span>
          </div>
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#14B8A6] animate-pulse" />
            <span className="text-[11px] font-data font-bold tracking-wider uppercase text-[#6B7280]">
              STUDENT BOARDING
            </span>
          </div>
          <h1 className="text-2xl font-display font-bold text-[#12122B]">Create Your Account</h1>
          <p className="text-xs font-body text-[#6B7280] mt-1">
            Select your current education stage to set your live Route Line
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2 text-xs font-body">
            <AlertCircle size={16} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-data font-bold text-[#6B7280] uppercase mb-1.5">
              Full Name *
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-3 text-gray-400" size={16} />
              <input
                type="text"
                name="displayName"
                value={formData.displayName}
                onChange={handleChange}
                placeholder="Rohan Sharma"
                required
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4F46E5] text-xs font-body"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-data font-bold text-[#6B7280] uppercase mb-1.5">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 text-gray-400" size={16} />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="rohan@example.com"
                required
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4F46E5] text-xs font-body"
              />
            </div>
          </div>

          {/* Current Education Stage Selector */}
          <div>
            <label className="block text-xs font-data font-bold text-[#6B7280] uppercase mb-1.5">
              Where Are You Currently Located on the Route? *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {EDUCATION_STAGES.map((stage) => {
                const isSelected = formData.currentStage === stage.id;
                const Icon = stage.icon;
                return (
                  <button
                    key={stage.id}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, currentStage: stage.id }))}
                    className={`p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#4F46E5] text-white border-[#4F46E5] shadow-xs"
                        : "bg-[#FAFAF7] border-gray-200 hover:border-gray-300 text-[#12122B]"
                    }`}
                  >
                    <Icon size={16} className={`mt-0.5 shrink-0 ${isSelected ? "text-white" : "text-[#4F46E5]"}`} />
                    <div className="overflow-hidden">
                      <p className="text-xs font-display font-bold leading-tight truncate">
                        {stage.title}
                      </p>
                      <p className={`text-[10px] font-body mt-0.5 leading-tight ${isSelected ? "text-white/80" : "text-[#6B7280]"}`}>
                        {stage.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-data font-bold text-[#6B7280] uppercase mb-1.5">
                Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 text-gray-400" size={16} />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4F46E5] text-xs font-body"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-data font-bold text-[#6B7280] uppercase mb-1.5">
                Confirm Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 text-gray-400" size={16} />
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4F46E5] text-xs font-body"
                />
              </div>
            </div>
          </div>

          <Button
            type="submit"
            disabled={submitting}
            className="w-full mt-2"
            size="lg"
          >
            {submitting ? <LoadingSpinner size="sm" /> : "Complete Registration & Board Route"}
          </Button>
        </form>

        <div className="mt-5 text-center text-xs font-body text-[#6B7280]">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-[#4F46E5] font-display font-bold hover:underline"
          >
            Sign in
          </Link>
        </div>
      </Card>
    </div>
  );
};
