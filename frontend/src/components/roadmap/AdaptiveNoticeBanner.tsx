import React from "react";
import { AlertCircle, Sparkles, X, ArrowRight } from "lucide-react";
import type { AdaptationNotice } from "../../types/roadmapEngine.types";

interface AdaptiveNoticeBannerProps {
  notice: AdaptationNotice | null | undefined;
  onDismiss: () => void;
}

export const AdaptiveNoticeBanner: React.FC<AdaptiveNoticeBannerProps> = ({
  notice,
  onDismiss,
}) => {
  if (!notice) return null;

  const isRemediation = notice.type === "remediation";

  return (
    <div
      className={`rounded-2xl p-4 sm:p-5 border flex items-start justify-between gap-4 animate-in slide-in-from-top-2 duration-300 ${
        isRemediation
          ? "bg-amber-950/30 border-amber-500/40 text-amber-200"
          : "bg-emerald-950/30 border-emerald-500/40 text-emerald-200"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`p-2 rounded-xl shrink-0 ${
            isRemediation ? "bg-amber-500/20 text-amber-400" : "bg-emerald-500/20 text-emerald-400"
          }`}
        >
          {isRemediation ? <AlertCircle size={20} /> : <Sparkles size={20} />}
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider">
              {isRemediation ? "Adaptive Remediation Engine" : "Velocity Acceleration"}
            </span>
          </div>
          <h4 className="text-sm font-bold text-white">{notice.title}</h4>
          <p className="text-xs opacity-90 font-body leading-relaxed">{notice.message}</p>
        </div>
      </div>

      <button
        onClick={onDismiss}
        className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 shrink-0"
        title="Dismiss notice"
      >
        <X size={16} />
      </button>
    </div>
  );
};
