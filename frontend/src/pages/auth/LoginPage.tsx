import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, AlertCircle, ArrowRight } from "lucide-react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../firebase/config";
import { Button, Card } from "../../components/ui/UI";
import { LoadingSpinner } from "../../components/ui/Loading";
import { useAuth } from "../../hooks/useAuth";

export const LoginPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  const handleLogin = async () => {
    setError("");

    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email.trim(), password);
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      const code = err?.code as string | undefined;
      if (
        code === "auth/invalid-credential" ||
        code === "auth/wrong-password" ||
        code === "auth/user-not-found"
      ) {
        setError("Invalid email or password credentials");
      } else {
        setError(err?.message || "Login verification failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#12122B] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background Metro Route Line Accent Glows */}
      <div className="pointer-events-none absolute -top-40 -right-40 h-96 w-96 rounded-full bg-[#4F46E5]/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-[#14B8A6]/15 blur-3xl" />

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
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2 text-xs font-body">
            <AlertCircle size={16} className="flex-shrink-0" />
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
            <label className="block text-xs font-data font-bold text-[#6B7280] uppercase mb-1.5">
              Password
            </label>
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
