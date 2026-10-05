import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { ResumeBuilderCard } from './ResumeBuilder/ResumeBuilderCard';
import { ATSAnalyzerCard } from './ATSAnalyzer/ATSAnalyzerCard';
import {
  FileText,
  Search,
  Sparkles,
  ShieldCheck,
  Zap,
  ArrowRight,
  Layers,
  CheckCircle2
} from 'lucide-react';

export const ResumeStation: React.FC = () => {
  const { user } = useAuth();
  const [activeCard, setActiveCard] = useState<'builder' | 'analyzer'>('builder');
  const [resumeForAnalysis, setResumeForAnalysis] = useState<string | null>(null);

  // When a resume is targeted for ATS audit from builder, switch to analyzer card
  const handleAnalyzeResume = (resumeId: string) => {
    setResumeForAnalysis(resumeId);
    setActiveCard('analyzer');
  };

  const userId = user?.uid || 'guest_user';

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Station 09 Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-950/80 text-indigo-300 border border-indigo-500/30">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Station 09 • Resume & ATS Studio
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Resume Station & ATS Optimization Hub
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Craft recruiter-ready, ATS-compliant engineering resumes with live previews, or stress-test existing resumes against actual job descriptions with instant keyword analysis.
            </p>
          </div>

          {/* Quick Stats Badges */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2.5 bg-slate-950 border border-slate-800 px-4 py-2.5 rounded-2xl shadow-md">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Pass Rate</p>
                <p className="text-xs font-bold text-slate-200">98% ATS Parsability</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 bg-slate-950 border border-slate-800 px-4 py-2.5 rounded-2xl shadow-md">
              <Zap className="w-4 h-4 text-amber-400" />
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Export Types</p>
                <p className="text-xs font-bold text-slate-200">PDF, DOCX, TXT</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mode Master Switcher */}
      <div className="flex justify-center">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-1.5 shadow-xl flex items-center gap-2 max-w-md w-full">
          <button
            type="button"
            onClick={() => setActiveCard('builder')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${
              activeCard === 'builder'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Resume Builder</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCard('analyzer')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${
              activeCard === 'analyzer'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>ATS Analyzer</span>
          </button>
        </div>
      </div>

      {/* Active Card View */}
      <div className="transition-all duration-300">
        {activeCard === 'builder' ? (
          <ResumeBuilderCard
            userId={userId}
            onAnalyze={handleAnalyzeResume}
          />
        ) : (
          <ATSAnalyzerCard
            preloadedResumeId={resumeForAnalysis}
            userId={userId}
          />
        )}
      </div>
    </div>
  );
};
export default ResumeStation;
