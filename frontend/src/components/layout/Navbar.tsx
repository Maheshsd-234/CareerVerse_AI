import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronDown, Crown, LogOut, Menu, Sparkles, X, MapPin } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

export const Navbar: React.FC = () => {
  const { user, appUser, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement | null>(null);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const initials = useMemo(() => {
    const name = appUser?.displayName || user?.displayName?.trim();
    if (name) {
      const parts = name.split(/\s+/).filter(Boolean);
      const first = parts[0]?.[0] ?? "";
      const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
      return (first + last).toUpperCase();
    }
    const email = user?.email ?? "";
    return (email[0] ?? "U").toUpperCase();
  }, [appUser?.displayName, user?.displayName, user?.email]);

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
    <nav className="bg-[#12122B] text-white border-b border-white/10 relative z-50">
      <div className="w-full px-4 sm:px-6">
        <div className="flex justify-between items-center h-16">
          {/* Logo with Wayfinding Route Tag */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-[#4F46E5] flex items-center justify-center shadow-sm shadow-[#4F46E5]/40 transition group-hover:scale-105">
              <span className="font-display font-extrabold text-white tracking-tighter text-sm">
                CV
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-display font-bold text-lg text-white leading-tight tracking-tight flex items-center gap-1.5">
                CareerVerse <span className="text-[#F5A623] text-xs font-data font-bold">AI</span>
              </span>
              <span className="text-[10px] font-data font-medium text-gray-400 tracking-wider uppercase hidden sm:inline">
                Wayfinding Platform
              </span>
            </div>
          </Link>

          {/* Desktop Right Nav & Profile */}
          {user && (
            <div className="hidden md:flex items-center gap-4">
              {/* Route Indicator pill */}
              <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-data">
                <span className="w-2 h-2 rounded-full bg-[#14B8A6] animate-pulse" />
                <span className="text-gray-300">Live Route</span>
                <span className="text-white/40">|</span>
                <span className="text-[#F5A623] font-semibold">
                  {appUser?.selectedCareer || "Exploring"}
                </span>
              </div>

              <div ref={profileRef} className="relative">
                <button
                  type="button"
                  onClick={() => setProfileOpen((v) => !v)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-white/10 transition border border-white/10"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#4F46E5] flex items-center justify-center font-display font-bold text-xs text-white">
                    {initials}
                  </div>
                  <span className="text-xs font-display font-medium text-gray-200 max-w-[120px] truncate">
                    {appUser?.displayName || user.displayName || user.email?.split("@")[0]}
                  </span>
                  <ChevronDown
                    size={16}
                    className={`text-gray-400 transition-transform duration-200 ${
                      profileOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white text-[#12122B] shadow-2xl ring-1 ring-black/10 overflow-hidden z-50">
                    <div className="p-4 bg-[#12122B] text-white border-b border-white/10">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#4F46E5] flex items-center justify-center font-display font-bold text-white text-base">
                          {initials}
                        </div>
                        <div className="leading-tight overflow-hidden">
                          <div className="text-sm font-display font-bold text-white truncate">
                            {appUser?.displayName || user.displayName || "Student Pilot"}
                          </div>
                          <div className="text-xs font-data text-gray-400 truncate">{user.email}</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
                        <div className="flex items-center gap-1.5 text-xs font-data text-[#F5A623]">
                          <MapPin size={14} />
                          <span>Track: {appUser?.selectedCareer || "General Route"}</span>
                        </div>
                        <span className="text-[10px] font-data px-2 py-0.5 rounded bg-[#14B8A6]/20 text-[#14B8A6] font-bold">
                          ACTIVE
                        </span>
                      </div>
                    </div>

                    <div className="p-2">
                      <button
                        type="button"
                        onClick={() => {
                          setProfileOpen(false);
                          void handleLogout();
                        }}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-gray-100 transition text-sm font-display font-semibold text-red-600"
                      >
                        <span className="flex items-center gap-2">
                          <LogOut size={16} />
                          Sign Out
                        </span>
                        <span className="text-xs font-data text-gray-400">Exit Session</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          {user && (
            <button
              className="md:hidden p-2 rounded-lg bg-white/10 text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          )}
        </div>

        {/* Mobile Dropdown */}
        {user && mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/10 space-y-3">
            <div className="flex items-center gap-3 px-2">
              <div className="w-9 h-9 rounded-lg bg-[#4F46E5] flex items-center justify-center font-bold text-white text-sm">
                {initials}
              </div>
              <div className="leading-tight">
                <div className="text-sm font-bold text-white">{appUser?.displayName || user.displayName || "Account"}</div>
                <div className="text-xs text-gray-400">{user.email}</div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/20 text-red-300 border border-red-500/30 rounded-xl transition w-full text-sm font-semibold"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};
