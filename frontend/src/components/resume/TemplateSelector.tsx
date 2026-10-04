import React from "react";
import { Check, Sparkles, Layout } from "lucide-react";
import { RESUME_TEMPLATES, type ResumeTemplateId } from "../../types/resume.types";

interface Props {
  selectedTemplate: ResumeTemplateId;
  onSelectTemplate: (id: ResumeTemplateId) => void;
}

export const TemplateSelector: React.FC<Props> = ({ selectedTemplate, onSelectTemplate }) => {
  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 shadow-xs">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Layout size={16} className="text-[#4F46E5]" />
          <h3 className="text-xs font-data font-bold uppercase tracking-wider text-[#12122B]">
            Select Resume Template
          </h3>
        </div>
        <span className="text-[11px] font-data text-[#6B7280]">
          2 Layouts Available
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {RESUME_TEMPLATES.map((tmpl) => {
          const isSelected = selectedTemplate === tmpl.id;
          return (
            <button
              key={tmpl.id}
              type="button"
              onClick={() => onSelectTemplate(tmpl.id)}
              className={`p-3.5 rounded-xl border-2 text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                isSelected
                  ? "border-[#4F46E5] bg-[#4F46E5]/5 shadow-xs"
                  : "border-gray-200 hover:border-gray-300 bg-[#FAFAF7]"
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-xs font-display font-bold text-[#12122B]">
                    {tmpl.name}
                  </span>
                  <span
                    className={`text-[9px] font-data font-bold px-1.5 py-0.5 rounded ${
                      isSelected
                        ? "bg-[#4F46E5] text-white"
                        : "bg-gray-200 text-[#6B7280]"
                    }`}
                  >
                    {tmpl.badge}
                  </span>
                </div>
                <p className="text-[11px] font-body text-[#6B7280] leading-relaxed">
                  {tmpl.description}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between text-[11px]">
                <span className="font-data font-semibold text-[#4F46E5]">
                  {isSelected ? "Active Template" : "Click to Apply"}
                </span>
                {isSelected && (
                  <span className="w-5 h-5 rounded-full bg-[#4F46E5] text-white flex items-center justify-center">
                    <Check size={12} />
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
