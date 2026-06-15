import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  TrendingUp,
  BarChart3,
  MapPin,
  Zap,
  ArrowRight,
  Loader,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { Card, Badge, Button, ProgressBar } from "../components/UI";
import { roles, trendingRoles } from "../data/roles";
import { LoadingCard } from "../components/Loading";

export const DashboardPage: React.FC = () => {
  const { appUser, user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setIsLoading(false), 500);
  }, []);

  if (isLoading) return <LoadingCard message="Loading your dashboard..." />;

  const recommendedCareer = appUser?.selectedCareer
    ? roles.find((r) => r.id === appUser.selectedCareer)
    : null;

  const trendingRolesData = trendingRoles
    .map((id) => roles.find((r) => r.id === id))
    .filter(Boolean);

  const skillsCount = appUser?.skills?.length || 0;
  const skillsPercentage = Math.min((skillsCount / 10) * 100, 100);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl p-8 shadow-lg">
        <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/10 blur-2xl animate-pulse" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-white/10 blur-2xl animate-pulse" />
        <h1 className="text-4xl font-bold mb-2">
          Welcome back, {(appUser && appUser.displayName) ? appUser.displayName : (user?.displayName || "Mahesh S D")}
          <span className="inline-block animate-bounce">👋</span>
        </h1>
        <p className="text-lg opacity-90">
          Let's continue building your perfect career path with AI guidance.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Recommended Career Card */}
        <Card className="hover:shadow-lg transition lg:col-span-2 animate-slide-in">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">
              Recommended Career
            </h3>
            <Zap className="text-yellow-500" size={24} />
          </div>
          {recommendedCareer ? (
            <div>
              <h4 className="text-2xl font-bold text-indigo-600 mb-2">
                {recommendedCareer.name}
              </h4>
              <p className="text-gray-600 mb-4">{recommendedCareer.description}</p>
              <Badge variant="accent" className="mb-4">
                {recommendedCareer.category}
              </Badge>
              <Button
                size="sm"
                onClick={() => navigate("/role-explorer")}
                className="flex items-center gap-2"
              >
                Explore <ArrowRight size={16} />
              </Button>
            </div>
          ) : (
            <div className="text-gray-500">
              <p className="mb-4">
                Take our assessment to get AI-powered career recommendations.
              </p>
              <Button
                size="sm"
                onClick={() => navigate("/assessment")}
                className="flex items-center gap-2"
              >
                Start Assessment <ArrowRight size={16} />
              </Button>
            </div>
          )}
        </Card>

        {/* Skills Progress */}
        <Card className="animate-slide-in delay-100">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Skills Progress</h3>
          <ProgressBar progress={skillsPercentage} label={`${skillsCount}/10`} />
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate("/skill-gap")}
            className="w-full mt-4"
          >
            Add Skills
          </Button>
        </Card>

        {/* Next Steps */}
        <Card className="animate-slide-in delay-200">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Next Step</h3>
          <p className="text-sm text-gray-600 mb-4">
            Complete your skill profile to get better recommendations.
          </p>
          <Button
            size="sm"
            onClick={() => navigate("/skill-gap")}
            className="w-full"
          >
            Update Skills
          </Button>
        </Card>
      </div>

      {/* Trending Roles */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="text-indigo-600" size={28} />
          Trending Roles Right Now
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {trendingRolesData.map((role) => (
            <Card
              key={role?.id}
              hover
              onClick={() => navigate(`/role-explorer?role=${role?.id}`)}
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-bold text-gray-900">{role?.name}</h3>
                <Badge variant="success">{role?.trendScore.toFixed(1)}/10</Badge>
              </div>
              <p className="text-sm text-gray-600 mb-4">{role?.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-indigo-600">
                  {role?.salaryRange}
                </span>
                <ArrowRight size={18} className="text-gray-400" />
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Career Paths", icon: MapPin, path: "/career-navigator" },
            { label: "Explore Roles", icon: BarChart3, path: "/role-explorer" },
            { label: "Build Roadmap", icon: MapPin, path: "/roadmap" },
            { label: "Chat with AI", icon: Zap, path: "/chatbot" },
          ].map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.path}
                onClick={() => navigate(action.path)}
                className="flex flex-col items-center gap-2 p-4 bg-white rounded-lg hover:shadow-md transition"
              >
                <Icon className="text-indigo-600" size={24} />
                <span className="text-sm font-medium text-gray-700">
                  {action.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
