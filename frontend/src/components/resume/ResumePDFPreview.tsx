import React, { useState, useRef } from "react";
import { pdf } from "@react-pdf/renderer";
import {
  Download,
  FileText,
  Loader2,
  Printer,
  Check,
  Sparkles,
  X,
  Mail,
  Phone,
  MapPin,
  Globe,
  Link as LinkIcon,
} from "lucide-react";
import { Button } from "../ui/UI";
import { ResumePDFDocument } from "./ResumePDFDocument";
import type { ResumeData, ResumeTemplateId } from "../../types/resume.types";

interface Props {
  data: ResumeData;
  templateId: ResumeTemplateId;
  isSaving?: boolean;
}

export const ResumePDFPreview: React.FC<Props> = ({
  data,
  templateId,
  isSaving = false,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [mobileModalOpen, setMobileModalOpen] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const printableRef = useRef<HTMLDivElement>(null);

  // Generate & Download PDF via @react-pdf/renderer
  const handleDownloadPDF = async () => {
    try {
      setIsDownloading(true);

      const doc = <ResumePDFDocument data={data} templateId={templateId} />;
      const blob = await pdf(doc).toBlob();

      // Ensure blob has application/pdf type
      const pdfBlob = new Blob([blob], { type: "application/pdf" });
      const url = URL.createObjectURL(pdfBlob);

      const link = document.createElement("a");
      const safeName = (data.fullName || "student")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "_");
      link.href = url;
      link.download = `resume_${safeName}_${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => URL.revokeObjectURL(url), 15000);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to generate PDF with react-pdf:", err);
      // Fallback: Trigger browser print window
      handlePrintResume();
    } finally {
      setIsDownloading(false);
    }
  };

  // Browser Print / Save as PDF Fallback
  const handlePrintResume = () => {
    const printContent = printableRef.current;
    if (!printContent) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to export or print your resume.");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Resume - ${data.fullName || "Student"}</title>
          <meta charset="utf-8" />
          <style>
            @page { size: A4; margin: 15mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #111827; margin: 0; padding: 0; background: #fff; font-size: 10pt; line-height: 1.5; }
            h1 { font-size: 18pt; margin: 0 0 3pt 0; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 800; }
            h2 { font-size: 11pt; border-bottom: 1.5px solid #111827; padding-bottom: 2pt; margin: 12pt 0 6pt 0; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700; }
            h3 { font-size: 10pt; margin: 0; font-weight: bold; }
            p { margin: 0 0 4pt 0; }
            .header { border-bottom: 1.5px solid #111827; padding-bottom: 8pt; margin-bottom: 10pt; }
            .subtitle { font-size: 9.5pt; color: #4B5563; margin-bottom: 6pt; font-weight: 600; }
            .contact-row { display: flex; flex-wrap: wrap; gap: 8pt; font-size: 9pt; color: #374151; margin-top: 4pt; }
            .entry { margin-bottom: 8pt; }
            .entry-header { display: flex; justify-content: space-between; font-weight: bold; font-size: 10pt; }
            .entry-sub { font-style: italic; color: #4B5563; font-size: 9pt; margin-bottom: 2pt; }
            .skills-row { display: flex; margin-bottom: 4pt; font-size: 9pt; }
            .skills-cat { width: 28%; font-weight: bold; }
            .skills-list { width: 72%; }
            ul { margin: 2pt 0 0 0; padding-left: 14pt; }
            li { margin-bottom: 2.5pt; font-size: 9pt; }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); };
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Render the Visual Sheet (HTML/CSS) for the UI Preview
  const renderVisualResumeSheet = () => {
    const isModern = templateId === "modern-minimal";

    return (
      <div
        ref={printableRef}
        className={`bg-white text-[#111827] shadow-lg rounded-sm mx-auto p-6 sm:p-8 transition-all w-full max-w-[640px] min-h-[840px] text-left text-[10.5px] leading-relaxed border ${isModern ? "border-t-4 border-t-[#4F46E5] border-gray-200" : "border-gray-200"
          }`}
        style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}
      >
        {/* Header */}
        <div
          className={`pb-3 mb-4 ${isModern
            ? "border-b border-indigo-100 bg-indigo-50/40 -mx-6 -mt-6 sm:-mx-8 sm:-mt-8 p-6 sm:p-8 mb-4"
            : "border-b-2 border-[#12122B]"
            }`}
        >
          <div className="flex items-start justify-between">
            <div className="w-full">
              {/* Full Name on own line */}
              <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-[#12122B] mb-0.5">
                {data.fullName || "Your Full Name"}
              </h1>
              {/* Subtitle / Headline on own line */}
              {data.headline && (
                <p className="text-xs font-bold text-[#4F46E5] mb-2">
                  {data.headline}
                </p>
              )}
            </div>
            {isModern && (
              <span className="hidden sm:inline-block px-2 py-0.5 text-[9px] font-bold font-data bg-[#4F46E5] text-white rounded shrink-0">
                ATS READY
              </span>
            )}
          </div>

          {/* Contact Details Row */}
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[9.5px] text-gray-700">
            {data.email && (
              <span className="flex items-center gap-1 font-medium">
                <Mail size={11} className="text-[#4F46E5]" />
                {data.email}
              </span>
            )}
            {data.phone && (
              <>
                <span className="text-gray-400">•</span>
                <span className="flex items-center gap-1">
                  <Phone size={11} className="text-[#4F46E5]" />
                  {data.phone}
                </span>
              </>
            )}
            {data.location && (
              <>
                <span className="text-gray-400">•</span>
                <span className="flex items-center gap-1">
                  <MapPin size={11} className="text-[#4F46E5]" />
                  {data.location}
                </span>
              </>
            )}
            {data.linkedinUrl && (
              <>
                <span className="text-gray-400">•</span>
                <span className="flex items-center gap-1 text-[#4F46E5]">
                  <LinkIcon size={11} />
                  {data.linkedinUrl.replace(/^https?:\/\/(www\.)?/, "")}
                </span>
              </>
            )}
            {data.githubUrl && (
              <>
                <span className="text-gray-400">•</span>
                <span className="flex items-center gap-1 text-[#4F46E5]">
                  <LinkIcon size={11} />
                  {data.githubUrl.replace(/^https?:\/\/(www\.)?/, "")}
                </span>
              </>
            )}
            {data.portfolioUrl && (
              <>
                <span className="text-gray-400">•</span>
                <span className="flex items-center gap-1 text-[#4F46E5]">
                  <Globe size={11} />
                  {data.portfolioUrl.replace(/^https?:\/\/(www\.)?/, "")}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Professional Summary */}
        {data.summary && (
          <div className="mb-4">
            <h2 className="text-[11px] font-black uppercase tracking-wider text-[#12122B] border-b border-gray-200 pb-1 mb-2">
              Professional Summary
            </h2>
            <p className="text-[10px] text-gray-700 leading-relaxed">
              {data.summary}
            </p>
          </div>
        )}

        {/* Education */}
        {data.education && data.education.length > 0 && (
          <div className="mb-4">
            <h2 className="text-[11px] font-black uppercase tracking-wider text-[#12122B] border-b border-gray-200 pb-1 mb-2">
              Education
            </h2>
            <div className="space-y-2.5">
              {data.education.map((edu, i) => (
                <div key={i} className="entry">
                  <div className="flex justify-between items-baseline text-[10px]">
                    <span className="font-bold text-gray-900">
                      {edu.degree} {edu.branch ? `in ${edu.branch}` : ""}
                    </span>
                    <span className="font-bold text-gray-700">
                      {edu.startYear} – {edu.endYear}
                    </span>
                  </div>
                  <div className="flex justify-between text-[9.5px] text-gray-600">
                    <span className="italic">{edu.institution}</span>
                    {edu.gpa ? <span>GPA / Marks: {edu.gpa}</span> : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Technical Skills */}
        {data.skills && data.skills.length > 0 && (
          <div className="mb-4">
            <h2 className="text-[11px] font-black uppercase tracking-wider text-[#12122B] border-b border-gray-200 pb-1 mb-2">
              Technical Skills
            </h2>
            <div className="space-y-1.5">
              {data.skills.map((cat, i) => (
                <div key={i} className="flex text-[10px] items-baseline">
                  <span className="w-1/3 font-bold text-gray-900 pr-2">
                    {cat.category}:
                  </span>
                  <span className="w-2/3 text-gray-700">
                    {Array.isArray(cat.items) ? cat.items.join(", ") : cat.items}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Experience & Internships */}
        {data.experience && data.experience.length > 0 && (
          <div className="mb-4">
            <h2 className="text-[11px] font-black uppercase tracking-wider text-[#12122B] border-b border-gray-200 pb-1 mb-2">
              Experience & Internships
            </h2>
            <div className="space-y-2.5">
              {data.experience.map((exp, i) => (
                <div key={i} className="entry">
                  <div className="flex justify-between items-baseline text-[10px]">
                    <span className="font-bold text-gray-900">{exp.role}</span>
                    <span className="text-[9.5px] font-medium text-gray-600">
                      {exp.duration}
                    </span>
                  </div>
                  <p className="text-[9.5px] text-gray-600 italic mb-1">
                    {exp.company}
                  </p>
                  {exp.bullets && exp.bullets.length > 0 && (
                    <ul className="list-disc pl-4 text-[9.5px] text-gray-700 space-y-0.5">
                      {exp.bullets.map((bullet, bidx) => (
                        <li key={bidx}>{bullet}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Key Projects */}
        {data.projects && data.projects.length > 0 && (
          <div className="mb-4">
            <h2 className="text-[11px] font-black uppercase tracking-wider text-[#12122B] border-b border-gray-200 pb-1 mb-2">
              Key Technical Projects
            </h2>
            <div className="space-y-2.5">
              {data.projects.map((proj, i) => (
                <div key={i} className="entry text-[10px]">
                  <div className="flex justify-between items-baseline">
                    <span className="font-bold text-gray-900">
                      {proj.title}
                      {proj.link && (
                        <span className="text-[#4F46E5] font-normal ml-1">
                          [{proj.link}]
                        </span>
                      )}
                    </span>
                    {proj.date && (
                      <span className="text-[9.5px] text-gray-500">
                        {proj.date}
                      </span>
                    )}
                  </div>
                  {proj.technologies && proj.technologies.length > 0 && (
                    <p className="text-[9px] font-semibold text-[#4F46E5] mt-0.5">
                      Tech: {Array.isArray(proj.technologies) ? proj.technologies.join(" | ") : proj.technologies}
                    </p>
                  )}
                  <p className="text-[9.5px] text-gray-700 mt-0.5">
                    {proj.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Certifications & Achievements */}
        {data.certifications && data.certifications.length > 0 && (
          <div>
            <h2 className="text-[11px] font-black uppercase tracking-wider text-[#12122B] border-b border-gray-200 pb-1 mb-2">
              Certifications & Achievements
            </h2>
            <div className="space-y-1.5">
              {data.certifications.map((cert, i) => (
                <div
                  key={i}
                  className="flex justify-between text-[10px] text-gray-800"
                >
                  <span className="font-medium">
                    <span className="font-bold">{cert.name}</span>
                    {cert.issuer ? ` — ${cert.issuer}` : ""}
                  </span>
                  <span className="text-[9.5px] text-gray-500">{cert.date}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-200 shadow-xl flex flex-col h-full space-y-4">
      {/* Top Action Header */}
      <div className="flex items-center justify-between gap-3 pb-4 border-b border-gray-100 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-[#4F46E5]" />
            <h3 className="text-base font-display font-bold text-[#12122B]">
              Live Document Preview
            </h3>
          </div>
          <p className="text-xs font-data text-[#6B7280] mt-0.5">
            {isSaving ? "Syncing changes..." : "Synchronized in real-time with form"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Print/Save Alternative */}
          <button
            type="button"
            onClick={handlePrintResume}
            title="Print or Save as PDF"
            className="p-2 rounded-xl text-gray-600 hover:text-[#4F46E5] hover:bg-indigo-50 border border-gray-200 transition-colors cursor-pointer"
          >
            <Printer size={16} />
          </button>

          {/* Download PDF Button */}
          <Button
            onClick={handleDownloadPDF}
            disabled={isDownloading}
            className="flex items-center gap-2 shadow-xs text-xs font-display font-bold"
          >
            {isDownloading ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Generating PDF...
              </>
            ) : downloadSuccess ? (
              <>
                <Check size={15} className="text-emerald-300" />
                Downloaded!
              </>
            ) : (
              <>
                <Download size={15} />
                Download PDF
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Desktop Preview Container */}
      <div className="w-full max-h-[750px] overflow-y-auto bg-gray-100/80 p-4 sm:p-6 rounded-2xl border border-gray-200/90 custom-scrollbar">
        {renderVisualResumeSheet()}
      </div>

      {/* Mobile Fullscreen Modal */}
      {mobileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
          <div
            className="absolute inset-0 bg-[#12122B]/75 backdrop-blur-xs"
            onClick={() => setMobileModalOpen(false)}
          />
          <div className="relative w-full max-w-3xl h-[92vh] bg-white rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col">
            <div className="p-4 bg-[#12122B] text-white flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-[#F5A623]" />
                <span className="text-sm font-display font-bold text-white">
                  Resume Preview · {data.fullName || "Student Resume"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={handleDownloadPDF} disabled={isDownloading}>
                  <Download size={14} className="mr-1" />
                  Download
                </Button>
                <button
                  onClick={() => setMobileModalOpen(false)}
                  className="p-2 rounded-xl bg-white/10 text-white hover:bg-white/20"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="flex-1 w-full overflow-y-auto p-4 bg-gray-100">
              {renderVisualResumeSheet()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumePDFPreview;