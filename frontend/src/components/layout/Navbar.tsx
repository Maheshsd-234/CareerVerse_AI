import React, { useEffect, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronDown, Crown, LogOut, Menu, Sparkles, X } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useState } from "react";

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement | null>(null);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const initials = useMemo(() => {
    const name = user?.displayName?.trim();
    if (name) {
      const parts = name.split(/\s+/).filter(Boolean);
      const first = parts[0]?.[0] ?? "";
      const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
      return (first + last).toUpperCase();
    }
    const email = user?.email ?? "";
    return (email[0] ?? "U").toUpperCase();
  }, [user?.displayName, user?.email]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!profileRef.current) return;
      if (e.target instanceof Node && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <nav className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg relative z-50">
      <div className="w-full px-2 sm:px-4 md:px-6">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-white/15 ring-1 ring-white/25 backdrop-blur flex items-center justify-center shadow-sm">
              <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center">
                <span className="font-extrabold text-indigo-700 tracking-tight">CV</span>
              </div>
            </div>
            <span className="font-bold text-xl hidden sm:inline">CareerVerse</span>
          </Link>

          {user && (
            <div className="hidden md:flex items-center gap-3">
              <div ref={profileRef} className="relative">
                <button
                  type="button"
                  onClick={() => setProfileOpen((v) => !v)}
                  className="flex items-center gap-2 px-2.5 py-2 rounded-xl hover:bg-white/10 transition"
                >
                  <div className="flex flex-col items-center leading-none">
                    <div className="w-9 h-9 rounded-full bg-white/20 ring-1 ring-white/25 flex items-center justify-center font-bold">
                      {initials}
                    </div>
                    <div className="mt-1 text-[11px] font-semibold opacity-95">
                      Profile
                    </div>
                  </div>
                  <ChevronDown
                    size={18}
                    className={`opacity-90 transition ${profileOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white text-gray-900 shadow-2xl ring-1 ring-black/5 overflow-hidden animate-slide-in z-50">
                    <div className="p-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full bg-white/20 ring-1 ring-white/30 flex items-center justify-center font-bold text-lg">
                          {initials}
                        </div>
                        <div className="leading-tight">
                          <div className="text-sm font-semibold">
                            {user.displayName || "Your Account"}
                          </div>
                          <div className="text-xs opacity-90">{user.email}</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-2">
                          <Crown size={18} className="text-yellow-300" />
                          <span className="font-semibold">Premium</span>
                        </div>
                        <Sparkles size={18} className="opacity-90" />
                      </div>
                      <p className="text-xs opacity-90 mt-2">
                        Unlock personalized roadmaps, deeper skill insights, and smart role matching.
                      </p>
                    </div>

                    <div className="p-3">
                      <button
                        type="button"
                        onClick={() => {
                          setProfileOpen(false);
                          void handleLogout();
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-gray-50 transition"
                      >
                        <span className="flex items-center gap-2 font-medium">
                          <LogOut size={18} className="text-gray-700" />
                          Logout
                        </span>
                        <span className="text-xs text-gray-500">Sign out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {user && (
            <button
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          )}
        </div>

        {user && mobileMenuOpen && (
          <div className="md:hidden pb-4 border-t border-white/20">
            <div className="py-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 ring-1 ring-white/30 flex items-center justify-center font-bold">
                  {initials}
                </div>
                <div className="leading-tight">
                  <div className="text-sm font-semibold">{user.displayName || "Your Account"}</div>
                  <div className="text-xs opacity-90">{user.email}</div>
                </div>
              </div>
              <div className="mt-3 rounded-xl bg-white/10 ring-1 ring-white/20 p-3">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Crown size={18} className="text-yellow-300" />
                  Premium
                </div>
                <p className="text-xs opacity-90 mt-1">
                  Personalized roadmaps and deeper insights.
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl transition w-full"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};
