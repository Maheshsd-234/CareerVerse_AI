import React from 'react';
import type { ResumeTemplateId } from '../../../types/station09.types';
import { ShieldCheck, Sparkles, FileText, CheckCircle2 } from 'lucide-react';

interface TemplateOption {
  id: ResumeTemplateId;
  name: string;
  badge: string;
  badgeColor: string;
  description: string;
  accent: string;
  icon: React.ReactNode;
}

const TEMPLATES: TemplateOption[] = [
  {
    id: 'ats_optimized',
    name: 'ATS Optimized',
    badge: '98% ATS Pass',
    badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    description: 'Single-column machine-friendly layout designed to score maximum points with ATS parsers.',
    accent: '#10b981',
    icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />
  },
  {
    id: 'modern',
    name: 'Modern Professional',
    badge: 'Visual Appeal',
    badgeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    description: 'Clean typography with contemporary accents, ideal for tech startups and product roles.',
    accent: '#6366f1',
    icon: <Sparkles className="w-5 h-5 text-indigo-400" />
  },
  {
    id: 'minimal',
    name: 'Clean Minimal',
    badge: 'Executive',
    badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    description: 'Classic serif elegance with balanced margins and distraction-free hierarchy.',
    accent: '#f59e0b',
    icon: <FileText className="w-5 h-5 text-amber-400" />
  }
];

interface TemplateSelectorProps {
  selectedTemplate: ResumeTemplateId;
  onSelect: (templateId: ResumeTemplateId) => void;
  disabled?: boolean;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  selectedTemplate,
  onSelect,
  disabled = false
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Select Resume Architecture
        </label>
        <span className="text-xs text-indigo-400 font-medium">3 Curated Templates</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {TEMPLATES.map((tmpl) => {
          const isSelected = selectedTemplate === tmpl.id;
          return (
            <button
              key={tmpl.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(tmpl.id)}
              className={`relative text-left p-3.5 rounded-xl border transition-all duration-200 group ${
                isSelected
                  ? 'bg-slate-800/90 border-indigo-500 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/50'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-850/80'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="p-2 rounded-lg bg-slate-800 border border-slate-700/60">
                  {tmpl.icon}
                </div>
                {isSelected ? (
                  <span className="flex items-center text-xs font-semibold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Active
                  </span>
                ) : (
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${tmpl.badgeColor}`}>
                    {tmpl.badge}
                  </span>
                )}
              </div>

              <h4 className="text-sm font-semibold text-slate-100 group-hover:text-indigo-300 transition-colors">
                {tmpl.name}
              </h4>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                {tmpl.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
