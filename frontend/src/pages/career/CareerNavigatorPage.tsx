import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Award,
  BookOpen,
  Compass,
  Sparkles,
  TrendingUp,
  X,
  ArrowRight,
  Check,
  GraduationCap,
  Briefcase,
  CheckCircle2,
  HelpCircle,
  Gem,
} from "lucide-react";
import { Card, Badge, Button } from "../../components/ui/UI";
import { careerPaths, getExamInfo } from "../../data/careerPaths";

const UNDERGRADUATE_DEGREE_FILTERS = [
  { id: "all", label: "All Master's Programs", tag: "Explore All" },
  { id: "B.E / B.Tech", label: "B.E / B.Tech", tag: "Engineering" },
  { id: "B.Com", label: "B.Com / B.Com (Hons)", tag: "Commerce" },
  { id: "B.Sc / BCA", label: "B.Sc / BCA", tag: "Science & IT" },
  { id: "BBA / BMS", label: "BBA / BMS", tag: "Management" },
  { id: "MBBS / BDS", label: "MBBS / BDS", tag: "Medical & Dental" },
  { id: "BA / LLB", label: "BA / LLB", tag: "Arts & Law" },
];

export const CareerNavigatorPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState("After 10th");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [selectedDegreeCompleted, setSelectedDegreeCompleted] = useState("all");
  const [selectedPathId, setSelectedPathId] = useState<string | null>(null);
  const [selectedStreamKey, setSelectedStreamKey] = useState<string | null>(null);

  const categories = [
    { id: "After 10th", label: "After 10th (PU & Diploma)", badge: "Stage 01" },
    { id: "After 12th", label: "After 12th (Undergraduate)", badge: "Stage 02" },
    { id: "Masters", label: "Masters (Postgraduate Programs)", badge: "Stage 03" },
  ];

  const subcategories: Record<string, string[]> = {
    "After 10th": ["PU Stream", "Polytechnic Diploma"],
    "After 12th": ["Engineering & Tech", "Medical & Dental", "Commerce & Finance", "Computing & IT", "Law & Humanities"],
    Masters: ["Engineering & Tech", "Management & Strategy", "Computing & IT", "Commerce & Finance", "Medical & Dental", "Science & Analytics", "Law & Humanities", "Design & UX"],
  };

  // Filter paths based on active category, subcategory, and Masters completed degree
  const filteredPaths = useMemo(() => {
    return careerPaths.filter((path) => {
      if (path.category !== selectedCategory) return false;
      if (selectedSubcategory && path.subcategory !== selectedSubcategory) return false;

      // If viewing Masters and user selected what degree they completed:
      if (selectedCategory === "Masters" && selectedDegreeCompleted !== "all") {
        const eligible = path.eligibleDegrees || [];
        const matches =
          eligible.includes(selectedDegreeCompleted) ||
          eligible.includes("All Degrees") ||
          eligible.some((d) => d.toLowerCase().includes(selectedDegreeCompleted.toLowerCase()));
        if (!matches) return false;
      }

      return true;
    });
  }, [selectedCategory, selectedSubcategory, selectedDegreeCompleted]);

  const selectedPath = useMemo(
    () => (selectedPathId ? careerPaths.find((p) => p.id === selectedPathId) ?? null : null),
    [selectedPathId]
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
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Wayfinding Hero */}
      <div className="bg-[#12122B] text-white rounded-3xl p-6 sm:p-8 border border-white/10 shadow-xl relative overflow-hidden">
        <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[#4F46E5]/20 blur-3xl" />
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-data font-bold tracking-wider uppercase bg-[#4F46E5] text-white">
            <Compass size={14} />
            STATION 02 · CAREER NAVIGATOR
          </span>
          <span className="text-xs font-mono text-gray-400">All-India Education & Masters Roadmap</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-display font-bold mb-2 text-white">
          Indian Education & Career Transit Line
        </h1>
        <p className="text-sm sm:text-base font-body text-gray-300 max-w-2xl">
          Explore structured educational branches from 10th standard (PU & Polytechnic Diploma), Bachelor Degrees, through high-ROI Master’s programs (M.Tech, MBA, MCA, MDS, LLM).
        </p>
      </div>

      {/* Stage Selector with 3 Clear Sequential Stages */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-display font-bold text-[#12122B] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#4F46E5]" />
            Choose Your Transit Stage
          </h2>
          <span className="text-xs font-data text-[#6B7280]">Select stage to explore routes</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-white p-2 rounded-2xl border border-gray-200 shadow-xs">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setSelectedSubcategory(null);
                  setSelectedPathId(null);
                  setSelectedStreamKey(null);
                  if (cat.id !== "Masters") setSelectedDegreeCompleted("all");
                }}
                className={`relative py-3.5 px-4 rounded-xl font-display font-bold text-sm transition-colors text-left flex items-center justify-between cursor-pointer ${
                  isSelected ? "text-white" : "text-[#12122B]/70 hover:text-[#12122B] hover:bg-gray-50"
                }`}
              >
                {isSelected && (
                  <motion.div
                    layoutId="activeNavigatorStage"
                    className="absolute inset-0 bg-[#4F46E5] rounded-xl shadow-md shadow-[#4F46E5]/25"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                <div className="relative z-10 flex flex-col">
                  <span className="text-xs font-data font-semibold text-amber-300 opacity-90 uppercase">
                    {cat.badge}
                  </span>
                  <span className="text-sm font-bold leading-tight">{cat.label}</span>
                </div>
                <ArrowRight size={16} className="relative z-10 opacity-70" />
              </button>
            );
          })}
        </div>
      </div>

      {/* SPECIAL SMART DROPDOWN FOR MASTERS SECTION */}
      {selectedCategory === "Masters" && (
        <div className="bg-gradient-to-r from-[#12122B] to-[#1E1E42] text-white p-5 sm:p-6 rounded-2xl border border-white/10 shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-[#F5A623]/20 text-[#F5A623]">
                <GraduationCap size={20} />
              </span>
              <div>
                <h3 className="text-base font-display font-bold text-white">
                  What Undergraduate Degree Did You Complete?
                </h3>
                <p className="text-xs font-body text-gray-300">
                  Select your completed degree to view matching high-value Master's specializations & career ROI:
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {UNDERGRADUATE_DEGREE_FILTERS.map((deg) => {
              const isChosen = selectedDegreeCompleted === deg.id;
              return (
                <button
                  key={deg.id}
                  onClick={() => setSelectedDegreeCompleted(deg.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-display font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    isChosen
                      ? "bg-[#F5A623] text-[#12122B] shadow-md shadow-[#F5A623]/25 ring-2 ring-white/30 scale-102"
                      : "bg-white/10 text-white hover:bg-white/20 border border-white/15"
                  }`}
                >
                  <span>{deg.label}</span>
                  {deg.id !== "all" && (
                    <span className={`text-[10px] font-data px-1.5 py-0.2 rounded ${isChosen ? "bg-[#12122B]/20 text-[#12122B]" : "bg-white/15 text-gray-300"}`}>
                      {deg.tag}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Subcategory Stream Filter */}
      {subcategories[selectedCategory] && subcategories[selectedCategory].length > 1 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-data font-semibold text-[#6B7280] mr-1 uppercase">
            Domain filter:
          </span>
          <button
            onClick={() => setSelectedSubcategory(null)}
            className={`px-3 py-1.5 rounded-lg text-xs font-display font-bold transition-all ${
              selectedSubcategory === null
                ? "bg-[#12122B] text-white"
                : "bg-white border border-gray-200 text-[#12122B] hover:border-gray-300"
            }`}
          >
            All Tracks
          </button>
          {subcategories[selectedCategory].map((sub) => (
            <button
              key={sub}
              onClick={() => setSelectedSubcategory(sub)}
              className={`px-3 py-1.5 rounded-lg text-xs font-display font-bold transition-all ${
                selectedSubcategory === sub
                  ? "bg-[#4F46E5] text-white"
                  : "bg-white border border-gray-200 text-[#12122B] hover:border-gray-300"
              }`}
            >
              {sub}
            </button>
          ))}
        </div>
      )}

      {/* Results Count / Hint */}
      <div className="flex items-center justify-between px-1 text-xs font-data text-[#6B7280]">
        <span>Showing {filteredPaths.length} academic and career pathways</span>
        {selectedCategory === "Masters" && selectedDegreeCompleted !== "all" && (
          <span className="text-[#4F46E5] font-bold">
            Filtered for {selectedDegreeCompleted} graduates
          </span>
        )}
      </div>

      {/* Paths Grid with 2-4deg tilt + signal glow on hover */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPaths.map((path) => {
          const isSelected = selectedPathId === path.id;
          return (
            <motion.div
              key={path.id}
              whileHover={{
                rotate: 1.2,
                scale: 1.015,
                boxShadow: "0 14px 30px -8px rgba(79, 70, 229, 0.18)",
              }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              onClick={() => {
                setSelectedPathId(path.id);
                setSelectedStreamKey(null);
              }}
              className={`bg-white rounded-2xl border p-6 cursor-pointer flex flex-col justify-between transition-colors ${
                isSelected
                  ? "border-[#4F46E5] ring-2 ring-[#4F46E5]/30 shadow-md"
                  : "border-gray-200/90 hover:border-[#4F46E5]/40"
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className="text-xs font-data font-bold px-2.5 py-0.5 rounded-full bg-[#FAFAF7] border border-gray-200 text-[#12122B]">
                    {path.subcategory}
                  </span>
                  {path.duration && (
                    <span className="text-xs font-data text-[#6B7280]">
                      ⏱ {path.duration} Years
                    </span>
                  )}
                </div>

                <h3 className="text-xl font-display font-bold text-[#12122B] mb-2">
                  {path.name}
                </h3>
                <p className="text-xs font-body text-[#6B7280] leading-relaxed mb-4 line-clamp-2">
                  {path.futureScope}
                </p>

                {/* Eligible degrees for Masters */}
                {path.eligibleDegrees && path.eligibleDegrees.length > 0 && (
                  <div className="mb-3 p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80">
                    <span className="text-[10px] font-data font-bold text-amber-900 uppercase block mb-1">
                      🎓 Eligible Degrees:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {path.eligibleDegrees.slice(0, 3).map((deg, dIdx) => (
                        <span key={dIdx} className="text-[11px] font-display font-semibold text-amber-900 bg-white px-2 py-0.5 rounded border border-amber-200">
                          {deg}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* High ROI Value note if present */}
                {path.valueProposition && (
                  <div className="mb-4 flex items-start gap-1.5 text-xs font-body text-[#0F766E] bg-[#14B8A6]/10 p-2.5 rounded-xl border border-[#14B8A6]/20">
                    <Gem size={14} className="mt-0.5 shrink-0 text-[#14B8A6]" />
                    <span className="line-clamp-2 text-[11px] leading-tight">
                      {path.valueProposition}
                    </span>
                  </div>
                )}

                {path.careerOptions && path.careerOptions.length > 0 && (
                  <div className="space-y-1.5 mb-4">
                    {path.careerOptions.slice(0, 3).map((option, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs font-body text-[#12122B]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#14B8A6]" />
                        <span className="line-clamp-1">{option}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs font-display font-semibold text-[#4F46E5] flex items-center gap-1">
                  Inspect Route Map <ArrowRight size={14} />
                </span>
                <span className="text-[10px] font-data text-[#6B7280]">
                  {path.salaryRange}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Selected Path Deep Dive Modal */}
      <AnimatePresence>
        {selectedPath && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#12122B]/60 backdrop-blur-xs"
              onClick={() => setSelectedPathId(null)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden max-h-[90vh] flex flex-col z-10"
            >
              {/* Modal Header */}
              <div className="bg-[#12122B] text-white p-6 border-b border-white/10 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded text-[10px] font-data font-bold bg-[#4F46E5] text-white uppercase">
                      ROUTE INSPECTION
                    </span>
                    <span className="text-xs font-data text-gray-400">{selectedPath.category}</span>
                  </div>
                  <h2 className="text-2xl font-display font-bold text-white">
                    {selectedPath.name}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedPathId(null)}
                  className="p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition cursor-pointer"
                  aria-label="Close modal"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto space-y-6">
                <p className="text-sm font-body text-[#12122B]/90 leading-relaxed">
                  {selectedPath.futureScope}
                </p>

                {/* High Value Proposition Callout */}
                {selectedPath.valueProposition && (
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200">
                    <div className="flex items-center gap-2 mb-1.5 text-emerald-800">
                      <Gem size={18} className="text-[#14B8A6]" />
                      <h4 className="text-xs font-data font-bold uppercase tracking-wider">
                        High Career Value & Placement ROI
                      </h4>
                    </div>
                    <p className="text-xs font-body text-[#12122B] leading-relaxed">
                      {selectedPath.valueProposition}
                    </p>
                  </div>
                )}

                {/* Eligible Undergraduate Degrees */}
                {selectedPath.eligibleDegrees && selectedPath.eligibleDegrees.length > 0 && (
                  <div className="p-4 rounded-2xl bg-[#FAFAF7] border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <GraduationCap size={16} className="text-[#4F46E5]" />
                      <h4 className="text-xs font-data font-bold uppercase text-[#12122B]">
                        Eligible Prior Qualifications & Degrees:
                      </h4>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedPath.eligibleDegrees.map((deg, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-lg text-xs font-display font-bold bg-white text-[#12122B] border border-gray-300"
                        >
                          {deg}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sub-branch stream selector */}
                {streamKeys.length > 0 && (
                  <div>
                    <h3 className="text-xs font-data font-bold uppercase tracking-wider text-[#6B7280] mb-2 flex items-center gap-1.5">
                      <BookOpen size={14} className="text-[#4F46E5]" />
                      Select Academic Branch Track
                    </h3>
                    <div className="flex gap-2 flex-wrap">
                      {streamKeys.map((key) => {
                        const isCurrentStream = (selectedStreamKey ?? streamKeys[0]) === key;
                        return (
                          <button
                            key={key}
                            onClick={() => setSelectedStreamKey(key)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-display font-bold transition-all cursor-pointer ${
                              isCurrentStream
                                ? "bg-[#4F46E5] text-white shadow-md shadow-[#4F46E5]/20 ring-2 ring-[#4F46E5]/40"
                                : "bg-[#FAFAF7] border border-gray-200 text-[#12122B] hover:border-gray-300"
                            }`}
                          >
                            {key}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Active Stream Details */}
                {activeStream && (
                  <div className="p-5 rounded-2xl bg-[#FAFAF7] border border-gray-200 space-y-5">
                    <div>
                      <h4 className="text-base font-display font-bold text-[#12122B]">
                        {activeStream.title || selectedStreamKey}
                      </h4>
                    </div>

                    {/* Target Roles */}
                    {activeStream.roles && activeStream.roles.length > 0 && (
                      <div>
                        <span className="text-xs font-data font-bold text-[#6B7280] uppercase block mb-1.5">
                          Target Roles & Occupations:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {activeStream.roles.map((r, rIdx) => (
                            <span
                              key={rIdx}
                              className="px-2.5 py-1 rounded-md text-xs font-bold bg-[#14B8A6]/15 text-[#0F766E] border border-[#14B8A6]/25"
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Eligibility */}
                    {activeStream.eligibility && activeStream.eligibility.length > 0 && (
                      <div>
                        <span className="text-xs font-data font-bold text-[#6B7280] uppercase block mb-1.5">
                          Eligibility Criteria:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {activeStream.eligibility.map((el, eIdx) => (
                            <span
                              key={eIdx}
                              className="px-2.5 py-1 rounded-md text-xs font-medium bg-white border border-gray-200 text-[#12122B]"
                            >
                              {el}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Rich Entrance & Qualifying Exams Cards */}
                    {activeStream.exams && activeStream.exams.length > 0 && (
                      <div>
                        <span className="text-xs font-data font-bold text-[#6B7280] uppercase block mb-2 flex items-center gap-1.5">
                          <Award size={14} className="text-[#F5A623]" />
                          Entrance Exams & Scope:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {activeStream.exams.map((examName, exIdx) => {
                            const info = getExamInfo(examName);
                            return (
                              <div
                                key={exIdx}
                                className="p-3 bg-white rounded-xl border border-gray-200 shadow-xs flex flex-col justify-between"
                              >
                                <div>
                                  <div className="flex items-center justify-between gap-1 mb-1">
                                    <span className="text-xs font-data font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200">
                                      {info.shortName}
                                    </span>
                                    <span className="text-[10px] font-data text-[#6B7280] truncate max-w-[140px]">
                                      {info.scope}
                                    </span>
                                  </div>
                                  <p className="text-[11px] font-body text-[#12122B] leading-snug">
                                    {info.description}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Wayfinding Key Insights */}
                    {activeStream.mustKnow && activeStream.mustKnow.length > 0 && (
                      <div className="pt-3 border-t border-gray-200/80">
                        <span className="text-xs font-data font-bold text-[#4F46E5] uppercase block mb-2 flex items-center gap-1.5">
                          <Sparkles size={14} className="text-[#4F46E5]" />
                          Wayfinding Key Insights & Action Plan:
                        </span>
                        <ul className="space-y-2 text-xs font-body text-[#12122B]">
                          {activeStream.mustKnow.map((mk, mIdx) => (
                            <li key={mIdx} className="flex items-start gap-2 bg-white/70 p-2.5 rounded-xl border border-gray-200/70">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#4F46E5] mt-1 flex-shrink-0" />
                              <span className="leading-relaxed">{mk}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Overall Government & Entrance Exams Breakdown */}
                {selectedPath.governmentExams && selectedPath.governmentExams.length > 0 && (
                  <div className="p-5 rounded-2xl border border-gray-200 bg-white space-y-3">
                    <div className="flex items-center gap-2 text-[#F5A623]">
                      <Award size={18} />
                      <h4 className="text-xs font-data font-bold uppercase text-[#12122B]">
                        Comprehensive Examination Track
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {selectedPath.governmentExams.map((exam, idx) => {
                        const info = getExamInfo(exam);
                        return (
                          <div
                            key={idx}
                            className="p-3 rounded-xl bg-[#FAFAF7] border border-gray-200 shadow-xs"
                          >
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span className="text-xs font-data font-bold text-[#12122B]">
                                {info.shortName}
                              </span>
                              <span className="text-[10px] font-data text-[#4F46E5] bg-[#4F46E5]/10 px-1.5 py-0.5 rounded">
                                {info.scope}
                              </span>
                            </div>
                            <p className="text-[11px] font-body text-[#6B7280] leading-snug">
                              {info.description}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end">
                <Button onClick={() => setSelectedPathId(null)} variant="primary">
                  Close Inspection
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
