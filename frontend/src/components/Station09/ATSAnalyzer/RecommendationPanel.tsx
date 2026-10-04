import React from 'react';
import type { RecommendationsData } from '../../../types/station09.types';
import { Zap, Clock, Calendar, ArrowRight, CheckCircle2 } from 'lucide-react';

interface RecommendationPanelProps {
  data: RecommendationsData;
}

export const RecommendationPanel: React.FC<RecommendationPanelProps> = ({ data }) => {
  const { immediate = [], shortTerm = [], longTerm = [] } = data;

  const totalRecommendations = immediate.length + shortTerm.length + longTerm.length;

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" /> Actionable Next Steps ({totalRecommendations})
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Prioritized adjustments to boost ATS pass rates and recruiter interview callbacks.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* IMMEDIATE ACTIONS */}
        {immediate.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-rose-400 uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5" /> Immediate Priority (Quick Wins)
            </div>

            <div className="space-y-2">
              {immediate.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 flex items-start gap-3 hover:border-slate-700 transition-colors"
                >
                  <span className="p-1 rounded-md bg-rose-500/10 text-rose-400 mt-0.5 shrink-0">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                  <div className="flex-1">
                    <p className="text-xs text-slate-200 font-medium leading-relaxed">{item.action}</p>
                  </div>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20 shrink-0">
                    {item.impact} impact
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SHORT-TERM ACTIONS */}
        {shortTerm.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider">
              <Clock className="w-3.5 h-3.5" /> Short-Term Enhancements
            </div>

            <div className="space-y-2">
              {shortTerm.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 flex items-start gap-3 hover:border-slate-700 transition-colors"
                >
                  <span className="p-1 rounded-md bg-amber-500/10 text-amber-400 mt-0.5 shrink-0">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                  <div className="flex-1">
                    <p className="text-xs text-slate-200 font-medium leading-relaxed">{item.action}</p>
                  </div>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 shrink-0">
                    {item.impact} impact
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LONG-TERM ACTIONS */}
        {longTerm.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider">
              <Calendar className="w-3.5 h-3.5" /> Long-Term Career Growth
            </div>

            <div className="space-y-2">
              {longTerm.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 flex items-start gap-3 hover:border-slate-700 transition-colors"
                >
                  <span className="p-1 rounded-md bg-indigo-500/10 text-indigo-400 mt-0.5 shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </span>
                  <div className="flex-1">
                    <p className="text-xs text-slate-200 font-medium leading-relaxed">{item.action}</p>
                  </div>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 shrink-0">
                    {item.impact} impact
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
