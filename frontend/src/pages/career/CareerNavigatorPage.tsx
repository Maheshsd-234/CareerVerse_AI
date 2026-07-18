import React, { useMemo, useState } from "react";
import { Award, BookOpen, GraduationCap, MapPin, Sparkles, TrendingUp, X } from "lucide-react";
import { Card, Badge, Button } from "../../components/ui/UI";
import { careerPaths } from "../../data/careerPaths";

export const CareerNavigatorPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState("After 10th");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [selectedPathId, setSelectedPathId] = useState<string | null>(null);
  const [selectedStreamKey, setSelectedStreamKey] = useState<string | null>(null);

  const categories = ["After 10th", "After 12th", "Diploma", "Degree"];

  const subcategories = {
    "After 10th": ["Stream Selection"],
    "After 12th": ["Science", "Commerce", "Arts"],
    Diploma: ["Technical"],
    Degree: ["Advanced"],
  };

  const filteredPaths = careerPaths.filter(
    (path) =>
      path.category === selectedCategory &&
      (!selectedSubcategory || path.subcategory === selectedSubcategory)
  );

  const selectedPath = useMemo(
    () => (selectedPathId ? filteredPaths.find((p) => p.id === selectedPathId) ?? null : null),
    [filteredPaths, selectedPathId]
  );

  const streamKeys = useMemo(() => {
    if (!selectedPath?.streams) return [];
    return Object.keys(selectedPath.streams);
  }, [selectedPath?.streams]);

  const activeStream = useMemo(() => {
    if (!selectedPath?.streams) return null;
    const key = selectedStreamKey ?? streamKeys[0];
    return key ? selectedPath.streams[key] ?? null : null;
  }, [selectedPath?.streams, selectedStreamKey, streamKeys]);

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl p-8">
        <h1 className="text-4xl font-bold mb-2">Career Navigator</h1>
        <p className="text-lg opacity-90">
          Explore different career paths and education options available in India
        </p>
      </div>

      {/* Category Selection */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Choose Your Stage</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => {
                setSelectedCategory(category);
                setSelectedSubcategory(null);
              }}
              className={`p-4 rounded-lg font-medium transition ${
                selectedCategory === category
                  ? "bg-indigo-600 text-white shadow-lg"
                  : "bg-white border-2 border-gray-200 text-gray-900 hover:border-indigo-600"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Subcategory Selection */}
      {subcategories[selectedCategory as keyof typeof subcategories].length > 1 && (
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-3">Select Stream</h3>
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => setSelectedSubcategory(null)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                selectedSubcategory === null
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-200 text-gray-900 hover:bg-gray-300"
              }`}
            >
              All
            </button>
            {subcategories[selectedCategory as keyof typeof subcategories].map((sub) => (
              <button
                key={sub}
                onClick={() => setSelectedSubcategory(sub)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  selectedSubcategory === sub
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-200 text-gray-900 hover:bg-gray-300"
                }`}
              >
                {sub}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Career Paths Grid */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Available Paths ({filteredPaths.length})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredPaths.map((path) => (
            <Card key={path.id} className="hover:shadow-lg transition">
              <div className="mb-4">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{path.name}</h3>
                <p className="text-sm text-gray-600 mb-3">{path.futureScope}</p>
              </div>

              {/* Career Options */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">
                  Career Options:
                </h4>
                <div className="flex flex-wrap gap-2">
                  {path.careerOptions.map((option) => (
                    <Badge key={option} variant="primary">
                      {option}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Skills */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">
                  Required Skills:
                </h4>
                <div className="flex flex-wrap gap-2">
                  {path.requiredSkills.slice(0, 3).map((skill) => (
                    <Badge key={skill} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                  {path.requiredSkills.length > 3 && (
                    <Badge variant="secondary">
                      +{path.requiredSkills.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-2 mb-4 pb-4 border-t pt-4">
                <div className="flex items-center gap-2">
                  <Award size={18} className="text-indigo-600" />
                  <span className="text-sm text-gray-700">{path.salaryRange}</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp size={18} className="text-green-600" />
                  <span className="text-sm text-gray-700">{path.duration}yr</span>
                </div>
                <div className="flex items-center gap-2 col-span-2">
                  <MapPin size={18} className="text-purple-600" />
                  <span className="text-sm text-gray-700">
                    {path.governmentExams.slice(0, 2).join(", ")}
                    {path.governmentExams.length > 2 && "..."}
                  </span>
                </div>
              </div>

              <Button
                size="sm"
                className="w-full"
                variant="outline"
                onClick={() => {
                  setSelectedPathId(path.id);
                  setSelectedStreamKey(null);
                }}
              >
                Learn More
              </Button>
            </Card>
          ))}
        </div>
      </div>

      {/* Learn More Modal */}
      {selectedPath && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSelectedPathId(null)}
          />
          <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl ring-1 ring-black/5 overflow-hidden animate-slide-in">
            <div className="flex items-start justify-between p-6 border-b">
              <div>
                <h2 className="text-2xl font-extrabold text-gray-900">
                  {selectedPath.name}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Choose a stream/combination to see roles, exams, and what you should focus on.
                </p>
              </div>
              <button
                onClick={() => setSelectedPathId(null)}
                className="p-2 rounded-lg hover:bg-gray-100 transition"
                aria-label="Close"
              >
                <X />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Stream tabs */}
              {streamKeys.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {streamKeys.map((k) => {
                    const active = (selectedStreamKey ?? streamKeys[0]) === k;
                    return (
                      <button
                        key={k}
                        onClick={() => setSelectedStreamKey(k)}
                        className={`px-4 py-2 rounded-xl font-semibold text-sm transition ${
                          active
                            ? "bg-indigo-600 text-white shadow"
                            : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                        }`}
                      >
                        {k}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700">
                  This path doesn’t have stream options yet. Here’s the general overview.
                </div>
              )}

              {/* Stream content */}
              {activeStream ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Roles */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="rounded-2xl border p-5">
                      <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        <Sparkles size={18} className="text-indigo-600" />
                        {activeStream.title}
                      </h3>
                      <div className="mt-3">
                        <div className="text-xs font-semibold text-gray-600 mb-2">
                          Roles you can aim for
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {activeStream.roles.map((r: string) => (
                            <Badge key={r} variant="primary">
                              {r}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border p-5 bg-gray-50">
                      <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        <GraduationCap size={18} className="text-indigo-600" />
                        Eligibility checklist
                      </h3>
                      <ul className="mt-3 space-y-2 text-sm text-gray-700">
                        {activeStream.eligibility.map((t: string, idx: number) => (
                          <li key={idx} className="flex gap-2">
                            <span className="mt-1 h-2 w-2 rounded-full bg-indigo-600 flex-shrink-0" />
                            <span>{t}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Exams + Must know */}
                  <div className="space-y-4">
                    <div className="rounded-2xl border p-5">
                      <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        <BookOpen size={18} className="text-purple-600" />
                        Key exams / entries
                      </h3>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {activeStream.exams.map((e: string) => (
                          <Badge key={e} variant="secondary">
                            {e}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-2xl border p-5 bg-gradient-to-br from-indigo-50 to-purple-50">
                      <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        <Award size={18} className="text-indigo-600" />
                        What students should know (important)
                      </h3>
                      <ul className="mt-3 space-y-2 text-sm text-gray-700">
                        {activeStream.mustKnow.map((t: string, idx: number) => (
                          <li key={idx} className="flex gap-2">
                            <span className="mt-1 h-2 w-2 rounded-full bg-purple-600 flex-shrink-0" />
                            <span>{t}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="rounded-2xl border p-5">
                    <h3 className="text-sm font-bold text-gray-900">Career options</h3>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {selectedPath.careerOptions.map((c) => (
                        <Badge key={c} variant="primary">
                          {c}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl border p-5 bg-gray-50">
                    <h3 className="text-sm font-bold text-gray-900">Exams</h3>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {selectedPath.governmentExams.map((e) => (
                        <Badge key={e} variant="secondary">
                          {e}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center pt-2">
                <div className="text-xs text-gray-500 flex items-center gap-2">
                  <MapPin size={14} className="text-gray-400" />
                  Tip: choose based on strengths + long-term interest, not just trend.
                </div>
                <Button onClick={() => setSelectedPathId(null)}>Done</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
