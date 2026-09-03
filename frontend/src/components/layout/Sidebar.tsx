import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Navigation,
  Compass,
  TrendingUp,
  BarChart3,
  MapPin,
  PenTool,
  MessageSquare,
  Briefcase,
  Menu,
  X,
} from "lucide-react";

const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard", stationCode: "01" },
  { icon: Navigation, label: "Career Navigator", path: "/career-navigator", stationCode: "02" },
  { icon: Compass, label: "Role Explorer", path: "/role-explorer", stationCode: "03" },
  { icon: BarChart3, label: "Skill Gap", path: "/skill-gap", stationCode: "04" },
  { icon: MapPin, label: "Roadmap", path: "/roadmap", stationCode: "05" },
  { icon: PenTool, label: "Assessment", path: "/assessment", stationCode: "06" },
  { icon: MessageSquare, label: "AI Counselor", path: "/chatbot", stationCode: "07" },
  { icon: TrendingUp, label: "Market Trends", path: "/trending", stationCode: "08" },
  { icon: Briefcase, label: "Live Jobs", path: "/live-jobs", stationCode: "09" },
];

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile Trigger Button */}
      <button
        className="md:hidden fixed top-20 left-4 z-40 bg-[#12122B] text-white p-2.5 rounded-xl shadow-lg border border-white/20"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle navigation"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-[calc(100vh-64px)] w-64 bg-white border-r border-gray-200/90 shadow-sm transition-transform duration-300 z-40 md:z-0 flex flex-col justify-between ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="p-4 space-y-1 overflow-y-auto">
          {/* Section Header */}
          <div className="px-3 py-2 text-[11px] font-data font-bold uppercase tracking-wider text-[#6B7280]">
            Waypoint Stations
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {sidebarItems.map(({ icon: Icon, label, path, stationCode }) => {
              const isActive = location.pathname === path;
              return (
                <Link
                  key={path}
                  to={path}
                  onClick={() => setIsOpen(false)}
                  className={`group relative flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all duration-150 font-display ${
                    isActive
                      ? "bg-[#4F46E5] text-white shadow-sm font-bold"
                      : "text-[#12122B]/80 hover:text-[#12122B] hover:bg-gray-100/80 font-medium"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      size={18}
                      className={isActive ? "text-white stroke-[2.2]" : "text-[#6B7280] group-hover:text-[#4F46E5]"}
                    />
                    <span className="text-sm tracking-tight">{label}</span>
                  </div>

                  <span
                    className={`text-[10px] font-data font-bold px-1.5 py-0.5 rounded ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-gray-100 text-[#6B7280] group-hover:bg-gray-200"
                    }`}
                  >
                    {stationCode}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer Station Indicator */}
        <div className="p-4 border-t border-gray-100">
          <div className="rounded-xl p-3 bg-[#FAFAF7] border border-gray-200/80 flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-[#14B8A6] animate-pulse" />
            <div className="text-xs font-data">
              <p className="font-bold text-[#12122B] leading-none">Metro Line 01</p>
              <p className="text-[11px] text-[#6B7280] mt-0.5">Indian Education Route</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs md:hidden z-30 top-16"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};
