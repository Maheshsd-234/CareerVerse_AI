import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, AlertCircle, UserPlus, X, ArrowRight, ShieldAlert, KeyRound, CheckCircle2, Sparkles } from "lucide-react";
import { Button, Card } from "../../components/ui/UI";
import { LoadingSpinner } from "../../components/ui/Loading";
import { useAuth } from "../../hooks/useAuth";

export const LoginPage: React.FC = () => {
  const { user, login, loginAsGuest, sendPasswordReset } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showNotFoundModal, setShowNotFoundModal] = useState(false);

  // Password reset state
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState("");

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

      if (code === "auth/invalid-credential") {
        setError(
          "Invalid email or password. If you already created an account, please double-check your password or click 'Forgot Password?' below to reset it."
        );
      } else if (code === "auth/user-not-found") {
        setShowNotFoundModal(true);
        setError("Account not found with this email. Please create an account or verify your details.");
      } else if (code === "auth/wrong-password") {
        setError("Incorrect password. Please verify your password or use 'Forgot Password?' to reset it.");
      } else if (code === "auth/invalid-email") {
        setError("Invalid email address format. Please enter a valid email.");
      } else if (code === "auth/too-many-requests") {
        setError("Too many failed login attempts. Please wait a moment or reset your password.");
      } else if (code === "auth/network-request-failed") {
        setError("Network connection issue. Please check your internet connection and try again.");
      } else {
        setError(err?.message || "Login failed. Please verify your credentials and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendResetEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError("");
    setResetSuccess(false);

    const targetEmail = resetEmail.trim() || email.trim();
    if (!targetEmail) {
      setResetError("Please enter your registered email address.");
      return;
    }

    try {
      setResetLoading(true);
      await sendPasswordReset(targetEmail);
      setResetSuccess(true);
    } catch (err: any) {
      setResetError(err?.message || "Failed to send reset email. Please verify the email address.");
    } finally {
      setResetLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    try {
      setLoading(true);
      await loginAsGuest("skills");
      navigate("/dashboard", { replace: true });
    } catch (e: any) {
      setError("Could not launch demo session. Please try again.");
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

      {/* Password Reset Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-gray-100 relative space-y-4">
            <button
              onClick={() => {
                setShowResetModal(false);
                setResetSuccess(false);
                setResetError("");
              }}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center">
              <KeyRound size={24} />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-display font-bold text-[#12122B]">Reset Password</h2>
              <p className="text-xs text-gray-600 leading-relaxed font-body">
                Enter your account email and we'll send you an instant secure password reset link.
              </p>
            </div>

            {resetSuccess ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2 text-emerald-800">
                <div className="flex items-center gap-2 font-bold text-xs">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  <span>Password Reset Email Sent!</span>
                </div>
                <p className="text-xs text-emerald-700">
                  Please check your inbox (and spam folder) for an email from CareerVerse. Click the link to choose a new password.
                </p>
                <Button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="w-full mt-2 text-xs py-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Return to Sign In
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSendResetEmail} className="space-y-3 pt-1">
                {resetError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                    <AlertCircle size={15} />
                    <span>{resetError}</span>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-data font-bold text-[#6B7280] uppercase mb-1">
                    Registered Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 text-gray-400" size={16} />
                    <input
                      type="email"
                      value={resetEmail || email}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="student@example.com"
                      required
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4F46E5] text-xs font-body"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    type="submit"
                    disabled={resetLoading}
                    className="flex-1 bg-[#4F46E5] hover:bg-[#4338CA] text-white py-2.5 text-xs font-bold"
                  >
                    {resetLoading ? <LoadingSpinner size="sm" /> : "Send Reset Link"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowResetModal(false)}
                    className="text-xs py-2.5 text-gray-600"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

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
                If you have not registered on CareerVerse AI yet, create your free account now, or reset your password if you already registered.
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
                onClick={() => {
                  setShowNotFoundModal(false);
                  setShowResetModal(true);
                }}
                className="w-full sm:w-auto text-xs py-2.5 text-gray-600 border-gray-300"
              >
                Reset Password
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
            <div className="space-y-1">
              <span>{error}</span>
              {error.includes("password") && (
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      setResetEmail(email);
                      setShowResetModal(true);
                    }}
                    className="text-[#4F46E5] font-bold underline hover:text-[#4338CA]"
                  >
                    Forgot your password? Click here to reset it.
                  </button>
                </div>
              )}
            </div>
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
              <button
                type="button"
                onClick={() => {
                  setResetEmail(email);
                  setShowResetModal(true);
                }}
                className="text-[11px] font-medium text-[#4F46E5] hover:underline"
              >
                Forgot password?
              </button>
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

          {/* Quick Demo Access Option */}
          <div className="pt-2">
            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-gray-200"></div>
              <span className="flex-shrink mx-2 text-[10px] text-gray-400 font-data uppercase">or instant access</span>
              <div className="flex-grow border-t border-gray-200"></div>
            </div>

            <button
              type="button"
              onClick={handleGuestLogin}
              disabled={loading}
              className="w-full mt-2 py-2 px-3 bg-gradient-to-r from-slate-100 to-indigo-50/60 hover:from-slate-200 hover:to-indigo-100 border border-slate-200 text-[#12122B] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
            >
              <Sparkles size={14} className="text-[#4F46E5]" />
              <span>Explore as Demo Student (1-Click)</span>
            </button>
          </div>
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
