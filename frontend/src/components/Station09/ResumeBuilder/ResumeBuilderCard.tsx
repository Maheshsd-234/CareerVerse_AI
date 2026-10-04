import React, { useState, useEffect } from 'react';
import type { ResumeDocument, ResumeTemplateId } from '../../../types/station09.types';
import { TemplateSelector } from './TemplateSelector';
import { ResumeSectionEditor } from './ResumeSectionEditor';
import { ResumePreview } from './ResumePreview';
import { ExportOptions } from './ExportOptions';
import { station09Service } from '../../../services/station09Service';
import {
  FileText,
  Sparkles,
  Save,
  CheckCircle2,
  AlertCircle,
  Copy,
  Plus,
  Search,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  Clock
} from 'lucide-react';

interface ResumeBuilderCardProps {
  userId?: string;
  onAnalyze?: (resumeId: string) => void;
}

export const ResumeBuilderCard: React.FC<ResumeBuilderCardProps> = ({
  userId = 'guest_user',
  onAnalyze
}) => {
  const [resumes, setResumes] = useState<ResumeDocument[]>([]);
  const [selectedResume, setSelectedResume] = useState<ResumeDocument | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error' | null>(null);
  const [showTemplateModal, setShowTemplateModal] = useState<boolean>(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Load resumes on mount
  useEffect(() => {
    loadResumes();
  }, [userId]);

  const loadResumes = async () => {
    try {
      setLoading(true);
      const data = await station09Service.listResumes(userId);
      setResumes(data);
      if (data && data.length > 0) {
        setSelectedResume(data[0]);
      } else {
        // Auto-create initial resume
        const created = await station09Service.createResume('ats_optimized', userId);
        if (created.success) {
          setResumes([created.resume]);
          setSelectedResume(created.resume);
        }
      }
    } catch (err) {
      console.error('Failed to load resumes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResumeSelect = (resumeId: string) => {
    const found = resumes.find((r) => r.id === resumeId);
    if (found) {
      setSelectedResume(found);
    }
  };

  const handleCreateNew = async (template: ResumeTemplateId) => {
    try {
      setSaving(true);
      const res = await station09Service.createResume(template, userId);
      if (res.success) {
        setResumes((prev) => [res.resume, ...prev]);
        setSelectedResume(res.resume);
        setShowTemplateModal(false);
      }
    } catch (err) {
      console.error('Create resume error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateResume = (updated: ResumeDocument) => {
    setSelectedResume(updated);
    setSaveStatus('saving');

    // Debounced or direct update to server
    station09Service
      .updateResumeSection(updated.id, 'personalInfo', updated.personalInfo, userId)
      .then((res) => {
        if (res.atsScore !== undefined) {
          updated.atsOptimization.score = res.atsScore;
        }
        setResumes((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
        setSaveStatus('saved');
        setLastSaved(new Date());
      })
      .catch((err) => {
        console.error('Auto-save error:', err);
        setSaveStatus('error');
      });
  };

  const handleDuplicate = async () => {
    if (!selectedResume) return;
    try {
      setSaving(true);
      const res = await station09Service.duplicateResume(
        selectedResume.id,
        `${selectedResume.title} (Copy)`,
        userId
      );
      if (res.success) {
        setResumes((prev) => [res.resume, ...prev]);
        setSelectedResume(res.resume);
      }
    } catch (err) {
      console.error('Duplicate error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleTemplateChange = (tmplId: ResumeTemplateId) => {
    if (!selectedResume) return;
    const updated = { ...selectedResume, template: tmplId };
    handleUpdateResume(updated);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] bg-slate-900/60 border border-slate-800 rounded-3xl p-10 text-center">
        <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-200">Loading Resume Builder Workspace...</p>
        <p className="text-xs text-slate-400 mt-1">Calibrating ATS optimization engine</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Controls Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
        {/* Left: Resume switcher and title */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <FileText className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <select
                value={selectedResume?.id || ''}
                onChange={(e) => handleResumeSelect(e.target.value)}
                className="bg-slate-950 border border-slate-700/80 rounded-lg px-2.5 py-1 text-sm font-semibold text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                {resumes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setShowTemplateModal(true)}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors shadow"
              >
                <Plus className="w-3.5 h-3.5" /> New Resume
              </button>

              <button
                type="button"
                onClick={handleDuplicate}
                title="Duplicate this resume"
                className="p-1.5 text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-400 mt-1.5">
              <span className="flex items-center gap-1 font-mono">
                <Clock className="w-3 h-3 text-slate-500" />
                {lastSaved ? `Saved at ${lastSaved.toLocaleTimeString()}` : 'Auto-save active'}
              </span>
              <span>•</span>
              <span className="capitalize text-slate-300">
                Template: <strong>{selectedResume?.template.replace('_', ' ')}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Right: ATS score gauge & Switch to Analyzer CTA */}
        <div className="flex items-center gap-3 ml-auto">
          {selectedResume && (
            <div className="flex items-center gap-2.5 bg-slate-950 border border-slate-800 px-3.5 py-2 rounded-xl">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">ATS Score</p>
                <p className="text-sm font-bold text-emerald-400">
                  {selectedResume.atsOptimization?.score || 82}%
                </p>
              </div>
            </div>
          )}

          {onAnalyze && selectedResume && (
            <button
              type="button"
              onClick={() => onAnalyze(selectedResume.id)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-semibold transition-all group"
            >
              <Search className="w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition-transform" />
              <span>Full ATS Audit</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
            </button>
          )}
        </div>
      </div>

      {/* Template Selector Row */}
      {selectedResume && (
        <TemplateSelector
          selectedTemplate={selectedResume.template}
          onSelect={handleTemplateChange}
        />
      )}

      {/* Dual Panel Layout: Editor on Left, Live Preview on Right */}
      {selectedResume && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-6 space-y-6">
            <ResumeSectionEditor
              resume={selectedResume}
              onChange={handleUpdateResume}
            />

            {/* Export Cards */}
            <ExportOptions
              resumeId={selectedResume.id}
              userId={userId}
              resumeTitle={selectedResume.title}
            />
          </div>

          <div className="lg:col-span-6 sticky top-6">
            <ResumePreview resume={selectedResume} />
          </div>
        </div>
      )}

      {/* Create New Resume Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div>
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" /> Choose Template Architecture
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Select your starting foundation. All templates support multi-format exports.
              </p>
            </div>

            <div className="space-y-3">
              <TemplateSelector
                selectedTemplate="ats_optimized"
                onSelect={handleCreateNew}
                disabled={saving}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowTemplateModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 bg-slate-800"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
