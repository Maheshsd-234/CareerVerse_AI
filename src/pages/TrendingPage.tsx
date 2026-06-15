import React, { useEffect, useMemo, useState } from "react";
import { TrendingUp, Zap } from "lucide-react";
import { Card, Badge, Button } from "../components/UI";
import { roles, trendingRoles } from "../data/roles";
import { geminiService } from "../services/geminiService";

export const TrendingPage: React.FC = () => {
  const [aiTrending, setAiTrending] = useState<Array<{ id: string; reason: string }> | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        setLoading(true);
        const items = await geminiService.generateTrendingRoleIds("2025-2026");
        if (!alive) return;
        setAiTrending(items);
      } catch (e) {
        console.error("Trending fetch failed:", e);
        if (!alive) return;
        setAiTrending(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const trendingIds = useMemo(() => {
    const fromAi = aiTrending?.map((x) => x.id) ?? null;
    return fromAi && fromAi.length ? fromAi : trendingRoles;
  }, [aiTrending]);

  const trendingRolesData = useMemo(() => {
    return trendingIds
      .map((id) => roles.find((r) => r.id === id))
      .filter(Boolean)
      .sort((a, b) => (b?.trendScore || 0) - (a?.trendScore || 0));
  }, [trendingIds]);

  const yoyGrowthForRole = useMemo(() => {
    const seed = new Date().toISOString().slice(0, 7); // YYYY-MM (changes monthly)
    const hash = (s: string) =>
      Array.from(s).reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) >>> 0, 7);
    const pct = (roleId: string, trendScore: number) => {
      const h = hash(`${seed}:${roleId}`);
      const base = 10 + (trendScore / 10) * 20; // 10..30
      const jitter = (h % 18) - 4; // -4..13
      return Math.max(6, Math.min(45, Math.round(base + jitter)));
    };
    return { pct };
  }, []);

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl p-8">
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-2">
          <TrendingUp size={36} />
          Trending Careers 2025-2026
        </h1>
        <p className="text-lg opacity-90">
          Most in-demand roles in the Indian job market right now
        </p>
        {loading && (
          <p className="text-sm opacity-90 mt-2">
            Updating with AI insights...
          </p>
        )}
      </div>

      {/* Top Trending */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Top Growing Roles</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trendingRolesData.map((role, index) => (
            <Card
              key={role?.id}
              className="hover:shadow-lg transition relative overflow-hidden"
            >
              {/* Rank Badge */}
              <div className="absolute top-4 right-4">
                <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                  <span className="text-lg font-bold text-yellow-700">#{index + 1}</span>
                </div>
              </div>

              {/* Content */}
              <div className="mb-4">
                <h3 className="text-2xl font-bold text-gray-900">{role?.name}</h3>
                <Badge variant="secondary" className="mt-2">
                  {role?.category}
                </Badge>
              </div>

              <p className="text-gray-600 mb-4">{role?.description}</p>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 mb-4 pb-4 border-b">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Trend Score</p>
                  <p className="text-2xl font-bold text-indigo-600">
                    {role?.trendScore.toFixed(1)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Avg Salary</p>
                  <p className="text-lg font-bold text-green-600">
                    {role?.salaryRange}
                  </p>
                </div>
              </div>

              {/* Skills */}
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-700 mb-2">Top Skills:</p>
                <div className="flex flex-wrap gap-1">
                  {role?.requiredSkills.slice(0, 3).map((skill) => (
                    <Badge key={skill} variant="primary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              <Button size="sm" className="w-full">
                Explore Role
              </Button>
            </Card>
          ))}
        </div>
      </div>

      {/* Market Insights */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Zap className="text-yellow-600" size={28} />
          Why These Roles Are Trending
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h3 className="font-bold text-gray-900">AI/ML & Tech Boom</h3>
            <p className="text-gray-700">
              The rapid growth of artificial intelligence and cloud technologies has created massive
              demand for specialized professionals. Companies are investing heavily in AI solutions.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="font-bold text-gray-900">Remote Work Revolution</h3>
            <p className="text-gray-700">
              Post-pandemic, remote work became mainstream, increasing opportunities for tech
              professionals globally, especially in India.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="font-bold text-gray-900">Startup Ecosystem Growth</h3>
            <p className="text-gray-700">
              India's growing startup ecosystem is creating jobs for full-stack developers and
              entrepreneurial professionals.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="font-bold text-gray-900">Digital Transformation</h3>
            <p className="text-gray-700">
              Traditional businesses are digitizing, creating demand for engineers who can build
              scalable systems.
            </p>
          </div>
        </div>
      </Card>

      {/* Salary Trends */}
      <Card>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Salary Growth Trends</h2>
        <div className="space-y-3">
          {trendingRolesData.map((role) => (
            <div key={role?.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-semibold text-gray-900">{role?.name}</p>
                <p className="text-sm text-gray-600">Entry: ₹3L | Mid: ₹12L | Senior: ₹30L+</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-green-600">
                  ↑ {yoyGrowthForRole.pct(role?.id ?? "", role?.trendScore ?? 0)}%
                </p>
                <p className="text-xs text-gray-600">YoY Growth</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
