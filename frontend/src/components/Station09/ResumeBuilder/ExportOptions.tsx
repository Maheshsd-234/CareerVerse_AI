import React, { useState } from 'react';
import { Download, FileText, FileCheck, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { station09Service } from '../../../services/station09Service';

interface ExportOptionsProps {
  resumeId: string;
  userId?: string;
  resumeTitle?: string;
}

type ExportFormat = 'pdf_formatted' | 'pdf_ats' | 'docx' | 'txt';

export const ExportOptions: React.FC<ExportOptionsProps> = ({
  resumeId,
  userId = 'guest_user',
  resumeTitle = 'Resume'
}) => {
  const [loadingFormat, setLoadingFormat] = useState<ExportFormat | null>(null);
  const [successFormat, setSuccessFormat] = useState<ExportFormat | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleExport = async (format: ExportFormat) => {
    try {
      setLoadingFormat(format);
      setErrorMessage(null);

      const { blob, filename } = await station09Service.exportResume(resumeId, format, userId);

      // Trigger browser download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setSuccessFormat(format);
      setTimeout(() => setSuccessFormat(null), 3000);
    } catch (err: any) {
      console.error('Export error:', err);
      setErrorMessage(err.message || 'Failed to generate exported document.');
    } finally {
      setLoadingFormat(null);
    }
  };

  const exportButtons: {
    format: ExportFormat;
    label: string;
    sublabel: string;
    badge: string;
    icon: React.ReactNode;
    colorClasses: string;
  }[] = [
    {
      format: 'pdf_formatted',
      label: 'Styled PDF',
      sublabel: 'Executive typography & clean accents',
      badge: 'Visual Best',
      icon: <Download className="w-4 h-4 text-indigo-400" />,
      colorClasses: 'hover:border-indigo-500/50 hover:bg-indigo-950/20'
    },
    {
      format: 'pdf_ats',
      label: 'ATS-Proof PDF',
      sublabel: '100% single-column parser compliant',
      badge: 'Highest Match',
      icon: <FileCheck className="w-4 h-4 text-emerald-400" />,
      colorClasses: 'hover:border-emerald-500/50 hover:bg-emerald-950/20'
    },
    {
      format: 'docx',
      label: 'Word (.docx)',
      sublabel: 'Editable formatted Microsoft Word',
      badge: 'Recruiter Edit',
      icon: <FileText className="w-4 h-4 text-blue-400" />,
      colorClasses: 'hover:border-blue-500/50 hover:bg-blue-950/20'
    },
    {
      format: 'txt',
      label: 'Plain ASCII (.txt)',
      sublabel: 'Raw text for direct copy/paste',
      badge: 'Job Portals',
      icon: <FileText className="w-4 h-4 text-amber-400" />,
      colorClasses: 'hover:border-amber-500/50 hover:bg-amber-950/20'
    }
  ];

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <Download className="w-4 h-4 text-indigo-400" /> Export Documents
          </h3>
          <p className="text-xs text-slate-400">Download formatted files in any of 4 standard recruiting formats.</p>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2 text-xs text-rose-300">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {exportButtons.map((btn) => {
          const isLoading = loadingFormat === btn.format;
          const isSuccess = successFormat === btn.format;

          return (
            <button
              key={btn.format}
              type="button"
              disabled={!!loadingFormat}
              onClick={() => handleExport(btn.format)}
              className={`p-3.5 rounded-xl border border-slate-800 bg-slate-950/80 text-left transition-all duration-200 group relative ${btn.colorClasses} ${
                loadingFormat ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:shadow-lg'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                  ) : isSuccess ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    btn.icon
                  )}
                </div>
                <span className="text-[10px] font-semibold text-slate-400 px-2 py-0.5 rounded-full bg-slate-800/80 border border-slate-700/60">
                  {btn.badge}
                </span>
              </div>

              <h4 className="text-xs font-bold text-slate-100 group-hover:text-indigo-300 transition-colors">
                {btn.label}
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">
                {btn.sublabel}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
