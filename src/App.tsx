import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { Navbar } from "./components/Navbar";
import { Sidebar } from "./components/Sidebar";

// Pages
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { DashboardPage } from "./pages/DashboardPage";
import { CareerNavigatorPage } from "./pages/CareerNavigatorPage";
import { RoleExplorerPage } from "./pages/RoleExplorerPage";
import { SkillGapPage } from "./pages/SkillGapPage";
import { RoadmapPage } from "./pages/RoadmapPage";
import { AssessmentPage } from "./pages/AssessmentPage";
import { ChatbotPage } from "./pages/ChatbotPage";
import { TrendingPage } from "./pages/TrendingPage";

const AppRoutes: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-600">
        <div className="text-center">
          <div className="inline-block">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 rounded-full border-4 border-white/20"></div>
              <div className="absolute inset-0 rounded-full border-4 border-white border-t-transparent animate-spin"></div>
            </div>
          </div>
          <p className="text-white mt-4 font-medium">Loading CareerVerse...</p>
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
            <div className="flex flex-col h-screen bg-gray-100">
              <Navbar />
              <div className="flex flex-1 min-h-0">
                <Sidebar />
                <main className="flex-1 overflow-y-auto">
                  <div className="w-full px-4 py-4 md:px-6 md:py-6">
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
