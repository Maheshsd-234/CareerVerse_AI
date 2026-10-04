import React, { useState } from 'react';
import type { KeywordAnalysisData } from '../../../types/station09.types';
import { Tag, CheckCircle2, AlertTriangle, Search, Filter } from 'lucide-react';

interface KeywordAnalysisProps {
  data: KeywordAnalysisData;
}

export const KeywordAnalysis: React.FC<KeywordAnalysisProps> = ({ data }) => {
  const [filterType, setFilterType] = useState<'all' | 'found' | 'missing'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { found = [], missing = [], matchPercentage = 0, foundCount = 0, totalChecked = 0 } = data;

  const filteredFound = found.filter((k) =>
    k.keyword.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredMissing = missing.filter((k) =>
    k.keyword.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      {/* Header & Match Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Tag className="w-4 h-4 text-indigo-400" /> ATS Keyword Optimization
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Identified {foundCount} of {totalChecked} core industry competencies.
          </p>
        </div>

        <div className="text-right">
          <span className="text-lg font-bold text-indigo-400">{matchPercentage}%</span>
          <span className="text-xs text-slate-400 ml-1">Density Match</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 via-emerald-500 to-teal-400 transition-all duration-500"
          style={{ width: `${Math.min(100, Math.max(5, matchPercentage))}%` }}
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
        <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-xl p-1">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
              filterType === 'all'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All ({found.length + missing.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('found')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
              filterType === 'found'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Found ({found.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('missing')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
              filterType === 'missing'
                ? 'bg-rose-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Missing ({missing.length})
          </button>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search keywords..."
            className="bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-44"
          />
        </div>
      </div>

      {/* Keywords Grid */}
      <div className="space-y-4 pt-2">
        {/* FOUND KEYWORDS */}
        {(filterType === 'all' || filterType === 'found') && filteredFound.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Present Keywords ({filteredFound.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {filteredFound.map((k, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs px-2.5 py-1 rounded-lg font-medium"
                >
                  <span>{k.keyword}</span>
                  <span className="text-[10px] bg-emerald-500/20 px-1.5 py-0.2 rounded-full font-mono text-emerald-200">
                    {k.count}x
                  </span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* MISSING KEYWORDS */}
        {(filterType === 'all' || filterType === 'missing') && filteredMissing.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-rose-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" /> Recommended Additions ({filteredMissing.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {filteredMissing.map((k, idx) => {
                const isHigh = k.priority === 'high';
                return (
                  <span
                    key={idx}
                    className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border font-medium ${
                      isHigh
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                        : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                    }`}
                  >
                    <span>{k.keyword}</span>
                    <span
                      className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded-full ${
                        isHigh ? 'bg-rose-500/20 text-rose-200' : 'bg-amber-500/20 text-amber-200'
                      }`}
                    >
                      {k.priority}
                    </span>
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
