import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { Navbar } from "./components/layout/Navbar";
import { Sidebar } from "./components/layout/Sidebar";

// Pages
import { LoginPage } from "./pages/auth/LoginPage";
import { RegisterPage } from "./pages/auth/RegisterPage";
import { DashboardPage } from "./pages/assistant/DashboardPage";
import { CareerNavigatorPage } from "./pages/career/CareerNavigatorPage";
import { RoleExplorerPage } from "./pages/career/RoleExplorerPage";
import { SkillGapPage } from "./pages/career/SkillGapPage";
import { RoadmapPage } from "./pages/career/RoadmapPage";
import { AssessmentPage } from "./pages/career/AssessmentPage";
import { ChatbotPage } from "./pages/assistant/ChatbotPage";
import { TrendingPage } from "./pages/career/TrendingPage";
import { LiveJobsPage } from "./pages/career/LiveJobsPage";

const AppRoutes: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#12122B] text-white">
        <div className="text-center space-y-4">
          <div className="relative inline-flex items-center justify-center">
            <div className="w-12 h-12 rounded-full border-4 border-[#4F46E5]/20 border-t-[#4F46E5] animate-spin"></div>
            <span className="absolute w-2 h-2 rounded-full bg-[#F5A623] animate-ping" />
          </div>
          <p className="font-display font-bold text-lg text-white">
            Mapping your career route...
          </p>
          <p className="font-data text-xs text-gray-400">
            Calibrating Waypoint System
          </p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected Routes */}
      <Route
        path="/*"
        element={
          user ? (
            <div className="flex flex-col h-screen bg-[#FAFAF7] text-[#12122B]">
              <Navbar />
              <div className="flex flex-1 min-h-0">
                <Sidebar />
                <main className="flex-1 overflow-y-auto">
                  <div className="w-full px-4 py-6 md:px-8 md:py-8">
                    <Routes>
                      <Route path="/dashboard" element={<DashboardPage />} />
                      <Route
                        path="/career-navigator"
                        element={<CareerNavigatorPage />}
                      />
                      <Route path="/role-explorer" element={<RoleExplorerPage />} />
                      <Route path="/skill-gap" element={<SkillGapPage />} />
                      <Route path="/roadmap" element={<RoadmapPage />} />
                      <Route path="/assessment" element={<AssessmentPage />} />
                      <Route path="/chatbot" element={<ChatbotPage />} />
                      <Route path="/trending" element={<TrendingPage />} />
                      <Route path="/live-jobs" element={<LiveJobsPage />} />
                      <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                  </div>
                </main>
              </div>
            </div>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
