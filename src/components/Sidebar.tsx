import React from "react";
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
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: Navigation, label: "Career Navigator", path: "/career-navigator" },
  { icon: Compass, label: "Role Explorer", path: "/role-explorer" },
  { icon: BarChart3, label: "Skill Gap", path: "/skill-gap" },
  { icon: MapPin, label: "Roadmap", path: "/roadmap" },
  { icon: PenTool, label: "Assessment", path: "/assessment" },
  { icon: MessageSquare, label: "Chatbot", path: "/chatbot" },
  { icon: TrendingUp, label: "Trending", path: "/trending" },
];

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile Toggle */}
      <button
        className="md:hidden fixed top-[72px] left-4 z-40 bg-indigo-600 text-white p-2 rounded-lg"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-[calc(100vh-64px)] w-64 bg-white border-r border-gray-200 shadow-lg transition-transform duration-300 z-40 md:z-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <nav className="p-4 space-y-2">
          {sidebarItems.map(({ icon: Icon, label, path }) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                  isActive
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 md:hidden z-30 top-16"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};
