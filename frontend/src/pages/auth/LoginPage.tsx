import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, AlertCircle, UserPlus, X, ArrowRight, ShieldAlert } from "lucide-react";
import { Button, Card } from "../../components/ui/UI";
import { LoadingSpinner } from "../../components/ui/Loading";
import { useAuth } from "../../hooks/useAuth";

export const LoginPage: React.FC = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showNotFoundModal, setShowNotFoundModal] = useState(false);

  useEffect(() => {
    if (user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  const handleLogin = async () => {
    setError("");
    setShowNotFoundModal(false);

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    try {
      setLoading(true);
      await login(email.trim(), password);
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      const code = err?.code as string | undefined;

      if (code === "auth/invalid-credential" || code === "auth/user-not-found") {
        setShowNotFoundModal(true);
        setError("Account not found with these credentials. Please create an account or verify your details.");
      } else if (code === "auth/wrong-password") {
        setError("Incorrect password. Please verify your password and try again.");
      } else if (code === "auth/invalid-email") {
        setError("Invalid email address format. Please enter a valid email.");
      } else if (code === "auth/too-many-requests") {
        setError("Too many failed login attempts. Please wait a moment before trying again.");
      } else if (code === "auth/network-request-failed") {
        setError("Network connection issue. Please check your internet connection and try again.");
      } else {
        setError(err?.message || "Login failed. Please verify your credentials and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoToRegister = () => {
    setShowNotFoundModal(false);
    navigate("/register", { state: { email: email.trim() } });
  };

  return (
    <div className="min-h-screen bg-[#12122B] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background Metro Route Line Accent Glows */}
      <div className="pointer-events-none absolute -top-40 -right-40 h-96 w-96 rounded-full bg-[#4F46E5]/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-[#14B8A6]/15 blur-3xl" />

      {/* Account Not Found Popup Modal */}
      {showNotFoundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-gray-100 relative space-y-5">
            <button
              onClick={() => setShowNotFoundModal(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
              <ShieldAlert size={26} />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-display font-bold text-[#12122B]">
                Account Not Found
              </h2>
              <p className="text-xs text-gray-600 leading-relaxed font-body">
                We could not find an active CareerVerse account associated with:
              </p>
              <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs font-data font-bold text-gray-800 break-all">
                {email.trim()}
              </div>
              <p className="text-xs text-gray-500 font-body">
                If you have not registered on CareerVerse AI yet, create your free account now to calibrate your career roadmap.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <Button
                type="button"
                onClick={handleGoToRegister}
                className="w-full flex items-center justify-center gap-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white py-2.5 text-xs font-bold"
              >
                <UserPlus size={15} />
                Create New Account
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowNotFoundModal(false)}
                className="w-full sm:w-auto text-xs py-2.5 text-gray-600 border-gray-300"
              >
                Try Again
              </Button>
            </div>
          </div>
        </div>
      )}

      <Card className="w-full max-w-md shadow-2xl relative z-10 border-gray-200/90 p-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-[#4F46E5] rounded-2xl mb-3 shadow-md shadow-[#4F46E5]/30">
            <span className="font-display font-extrabold text-white text-lg">CV</span>
          </div>
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#14B8A6] animate-pulse" />
            <span className="text-[11px] font-data font-bold tracking-wider uppercase text-[#6B7280]">
              WAYFINDING PORTAL
            </span>
          </div>
          <h1 className="text-2xl font-display font-bold text-[#12122B]">Welcome Back</h1>
          <p className="text-xs font-body text-[#6B7280] mt-1">Sign in to resume your career transit route</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-start gap-2 text-xs font-body">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void handleLogin();
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-data font-bold text-[#6B7280] uppercase mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 text-gray-400" size={16} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@example.com"
                required
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4F46E5] text-xs font-body"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-data font-bold text-[#6B7280] uppercase">
                Password
              </label>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 text-gray-400" size={16} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4F46E5] text-xs font-body"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full mt-2"
            size="lg"
          >
            {loading ? <LoadingSpinner size="sm" /> : "Sign In to Route"}
          </Button>
        </form>

        <div className="mt-6 text-center text-xs font-body text-[#6B7280]">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="text-[#4F46E5] font-display font-bold hover:underline"
          >
            Create Waypoint Account
          </Link>
        </div>
      </Card>
    </div>
  );
};
