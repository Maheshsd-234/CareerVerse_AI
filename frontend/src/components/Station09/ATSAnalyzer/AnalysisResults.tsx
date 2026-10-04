import React, { useState } from 'react';
import type { ATSAnalysisResult } from '../../../types/station09.types';
import { KeywordAnalysis } from './KeywordAnalysis';
import { JDComparison } from './JDComparison';
import { RecommendationPanel } from './RecommendationPanel';
import {
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Layers,
  FileCheck,
  AlertTriangle,
  Code,
  FileText,
  TrendingUp,
  Cpu
} from 'lucide-react';

interface AnalysisResultsProps {
  analysis: ATSAnalysisResult;
  onReset?: () => void;
}

export const AnalysisResults: React.FC<AnalysisResultsProps> = ({ analysis, onReset }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'keywords' | 'jd' | 'recommendations' | 'formatting'>('overview');

  const { atsScore, keywords, formattingIssues = [], jdComparison, recommendations, parsedText, warnings = [], fileName } = analysis;

  const overall = Math.round(atsScore.overall);
  const scoreColor =
    overall >= 80 ? 'text-emerald-400' : overall >= 65 ? 'text-indigo-400' : 'text-amber-400';
  const scoreRingColor =
    overall >= 80 ? 'stroke-emerald-400' : overall >= 65 ? 'stroke-indigo-400' : 'stroke-amber-400';

  const breakdownMetrics = [
    { label: 'Formatting', value: Math.round(atsScore.formatting), desc: 'Layout & typography purity' },
    { label: 'Keywords Density', value: Math.round(atsScore.keywords), desc: 'Industry terminology presence' },
    { label: 'Readability', value: Math.round(atsScore.readability), desc: 'Parsing & skimming clarity' },
    { label: 'Quantified Metrics', value: Math.round(atsScore.metrics), desc: 'Numerical achievements' },
    { label: 'Parsing Fidelity', value: Math.round(atsScore.parsing), desc: 'Machine text extraction' }
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner & Overall Score Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-wrap items-center justify-between gap-6 relative z-10">
          {/* Left: Overall Ring */}
          <div className="flex items-center gap-5">
            <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-slate-800"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeDasharray={251.2}
                  strokeDashoffset={251.2 - (251.2 * overall) / 100}
                  strokeLinecap="round"
                  className={`${scoreRingColor} transition-all duration-1000 ease-out`}
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className={`text-2xl font-black ${scoreColor}`}>{overall}</span>
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">/ 100</span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  ATS Audit Completed
                </span>
                {fileName && (
                  <span className="text-xs text-slate-400 font-mono">
                    • {fileName}
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold text-slate-100 mt-1">
                {overall >= 80 ? 'Highly ATS-Compatible' : overall >= 65 ? 'Competitive with Moderate Fit' : 'Needs Optimization'}
              </h2>
              <p className="text-xs text-slate-400 mt-1 max-w-lg leading-relaxed">
                {overall >= 80
                  ? 'Your resume possesses strong single-column parsability, keyword alignment, and quantifiable achievements.'
                  : 'Review prioritized suggestions below to maximize your interview conversion rate across ATS algorithms.'}
              </p>
            </div>
          </div>

          {/* Right: Actions */}
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-all shadow"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Analyze Another Resume
            </button>
          )}
        </div>

        {/* 5-pillar score bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6 pt-5 border-t border-slate-800/80">
          {breakdownMetrics.map((m, idx) => (
            <div key={idx} className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
              <span className="text-[11px] font-semibold text-slate-400 block truncate">{m.label}</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-base font-bold text-slate-100">{m.value}%</span>
                <span className="text-[10px] text-slate-500">{m.value >= 75 ? 'Strong' : 'Improve'}</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-1.5 mt-2 overflow-hidden">
                <div
                  className={`h-full rounded-full ${m.value >= 75 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                  style={{ width: `${m.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Warnings if any */}
      {warnings.length > 0 && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">Audit Notice</h4>
            {warnings.map((w, i) => (
              <p key={i} className="text-xs text-amber-200">{w}</p>
            ))}
          </div>
        </div>
      )}

      {/* Navigation tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-800">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'overview'
              ? 'bg-indigo-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Layers className="w-3.5 h-3.5" /> Full Overview
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('keywords')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'keywords'
              ? 'bg-indigo-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" /> Keywords ({keywords.foundCount}/{keywords.totalChecked})
        </button>

        {jdComparison && (
          <button
            type="button"
            onClick={() => setActiveTab('jd')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'jd'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" /> Job Description Fit ({jdComparison.matchPercentage}%)
          </button>
        )}

        <button
          type="button"
          onClick={() => setActiveTab('recommendations')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'recommendations'
              ? 'bg-indigo-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" /> Recommendations ({recommendations.immediate.length + recommendations.shortTerm.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('formatting')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'formatting'
              ? 'bg-indigo-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <FileCheck className="w-3.5 h-3.5" /> Formatting & Parser ({formattingIssues.length} issues)
        </button>
      </div>

      {/* Tab Panels */}
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <KeywordAnalysis data={keywords} />
            {jdComparison && <JDComparison data={jdComparison} />}
            <RecommendationPanel data={recommendations} />
          </div>
        )}

        {activeTab === 'keywords' && <KeywordAnalysis data={keywords} />}

        {activeTab === 'jd' && jdComparison && <JDComparison data={jdComparison} />}

        {activeTab === 'recommendations' && <RecommendationPanel data={recommendations} />}

        {activeTab === 'formatting' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-indigo-400" /> Formatting & Parsing Analysis
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Evaluation of structural elements, multi-column tables, fonts, and extracted plain text.
              </p>
            </div>

            {/* Issues list */}
            {formattingIssues.length > 0 ? (
              <div className="space-y-2">
                {formattingIssues.map((issue, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl flex items-start gap-3"
                  >
                    <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-slate-200">{issue.description}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{issue.suggestion}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                <span>Zero structural formatting red-flags detected. Document is clean and machine-readable!</span>
              </div>
            )}

            {/* Simulated text snippet */}
            {parsedText && (
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <h4 className="text-xs font-semibold text-slate-300">
                  Extracted Raw Plain Text Snippet (First 500 Chars)
                </h4>
                <pre className="p-3 bg-slate-950 border border-slate-850 rounded-xl font-mono text-[11px] text-slate-400 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                  {parsedText}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
