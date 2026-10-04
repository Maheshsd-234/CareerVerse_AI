import React from 'react';
import type { JDComparisonData } from '../../../types/station09.types';
import { Target, CheckCircle2, XCircle, Sparkles, TrendingUp } from 'lucide-react';

interface JDComparisonProps {
  data: JDComparisonData;
}

export const JDComparison: React.FC<JDComparisonProps> = ({ data }) => {
  const { matchPercentage = 0, matchingSkills = [], missingSkills = [], recommendations = [] } = data;

  const isStrongMatch = matchPercentage >= 80;
  const isModerateMatch = matchPercentage >= 60 && matchPercentage < 80;

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">Job Description Alignment</h3>
            <p className="text-xs text-slate-400">
              Bi-directional benchmark against your target vacancy requirements
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span
              className={`text-xl font-extrabold ${
                isStrongMatch ? 'text-emerald-400' : isModerateMatch ? 'text-indigo-400' : 'text-amber-400'
              }`}
            >
              {matchPercentage}%
            </span>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">JD Fit Score</p>
          </div>
        </div>
      </div>

      {/* Matching Skills vs Missing Skills */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
        {/* MATCHING SKILLS */}
        <div className="bg-slate-950/70 border border-slate-850 rounded-xl p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wide flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Matching Qualifications ({matchingSkills.length})
            </h4>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {matchingSkills.length > 0 ? (
              matchingSkills.map((skill, idx) => (
                <span
                  key={idx}
                  className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs px-2.5 py-1 rounded-lg font-medium"
                >
                  {skill}
                </span>
              ))
            ) : (
              <p className="text-xs text-slate-500 italic">No direct overlap detected with this JD.</p>
            )}
          </div>
        </div>

        {/* MISSING SKILLS */}
        <div className="bg-slate-950/70 border border-slate-850 rounded-xl p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-rose-400 uppercase tracking-wide flex items-center gap-1.5">
              <XCircle className="w-4 h-4" /> Missing JD Requirements ({missingSkills.length})
            </h4>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {missingSkills.length > 0 ? (
              missingSkills.map((skill, idx) => (
                <span
                  key={idx}
                  className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs px-2.5 py-1 rounded-lg font-medium"
                >
                  {skill}
                </span>
              ))
            ) : (
              <p className="text-xs text-emerald-400 italic font-medium">Full skill coverage satisfied for this JD!</p>
            )}
          </div>
        </div>
      </div>

      {/* JD Guidance */}
      {recommendations.length > 0 && (
        <div className="bg-indigo-950/20 border border-indigo-500/20 rounded-xl p-3.5 space-y-1.5">
          <div className="flex items-center gap-2 text-indigo-300 font-semibold text-xs">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Target Role Optimization Recommendations:</span>
          </div>
          <ul className="list-disc list-outside ml-4 space-y-1 text-xs text-slate-300">
            {recommendations.map((rec, idx) => (
              <li key={idx}>{rec}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
