import React, { useState } from 'react';
import type { ResumeDocument } from '../../../types/station09.types';
import { Eye, FileCode, Printer, ZoomIn, ZoomOut, CheckCircle2, ShieldCheck } from 'lucide-react';

interface ResumePreviewProps {
  resume: ResumeDocument;
}

export const ResumePreview: React.FC<ResumePreviewProps> = ({ resume }) => {
  const [viewMode, setViewMode] = useState<'styled' | 'ats_raw'>('styled');
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  const { personalInfo, summary, experience, education, skills, projects, certifications, template } = resume;

  const handlePrint = () => {
    const resumeEl = document.getElementById('printable-resume-node');
    if (!resumeEl) {
      window.print();
      return;
    }

    const printContent = resumeEl.innerHTML;
    const fontClass = template === 'minimal' ? 'Georgia, Cambria, serif' : '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

    const printHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${personalInfo.fullName || 'Resume'} - Print</title>
        <style>
          @page {
            size: letter portrait;
            margin: 12mm 15mm;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            margin: 0;
            padding: 0;
            background: #ffffff !important;
            color: #0f172a !important;
            font-family: ${fontClass};
            font-size: 10.5pt;
            line-height: 1.4;
          }
          .resume-container {
            width: 100%;
            max-width: 800px;
            margin: 0 auto;
            background: #ffffff !important;
          }
          h1 { font-size: 20pt; font-weight: bold; margin: 0 0 4px 0; }
          h2, h3 { font-size: 11pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; margin: 12px 0 6px 0; }
          p { margin: 3px 0; font-size: 10pt; }
          ul { margin: 4px 0; padding-left: 18px; }
          li { margin-bottom: 3px; font-size: 9.5pt; }
          a { color: #2563eb !important; text-decoration: none; }
          .border-b { border-bottom: 1px solid #cbd5e1; }
          .border-indigo-200 { border-color: #c7d2fe !important; }
          .text-indigo-900 { color: #1e1b4b !important; }
          .text-indigo-700 { color: #3730a3 !important; }
          .text-indigo-600 { color: #4338ca !important; }
          .text-slate-900 { color: #0f172a !important; }
          .text-slate-800 { color: #1e293b !important; }
          .text-slate-700 { color: #334155 !important; }
          .text-slate-600 { color: #475569 !important; }
          .text-slate-500 { color: #64748b !important; }
          .bg-slate-100 { background-color: #f1f5f9 !important; }
          .bg-indigo-50 { background-color: #eef2ff !important; }
          .rounded { border-radius: 4px; }
          .rounded-full { border-radius: 9999px; }
          .flex { display: flex; }
          .flex-wrap { flex-wrap: wrap; }
          .items-center { align-items: center; }
          .justify-between { justify-content: space-between; }
          .justify-center { justify-content: center; }
          .gap-1 { gap: 4px; }
          .gap-2 { gap: 8px; }
          .gap-x-3 { column-gap: 12px; }
          .gap-y-1 { row-gap: 4px; }
          .text-center { text-align: center; }
          .text-left { text-align: left; }
          .font-semibold { font-weight: 600; }
          .font-bold { font-weight: 700; }
          .font-medium { font-weight: 500; }
          .italic { font-style: italic; }
        </style>
      </head>
      <body>
        <div class="resume-container">
          ${printContent}
        </div>
      </body>
      </html>
    `;

    // Create an isolated hidden iframe
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(printHtml);
      doc.close();
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          if (iframe.parentNode) {
            document.body.removeChild(iframe);
          }
        }, 1500);
      }, 250);
    }
  };

  // Convert resume to simulated ATS parsed plaintext
  const generateAtsRawText = () => {
    const lines: string[] = [];
    lines.push(personalInfo.fullName.toUpperCase());
    lines.push([personalInfo.email, personalInfo.phone, personalInfo.location].filter(Boolean).join(' | '));
    if (personalInfo.linkedin || personalInfo.portfolio) {
      lines.push([personalInfo.linkedin, personalInfo.portfolio].filter(Boolean).join(' | '));
    }
    lines.push('\n--- SUMMARY ---');
    lines.push(summary || '(No summary provided)');

    lines.push('\n--- EXPERIENCE ---');
    experience.forEach((exp) => {
      lines.push(`${exp.role} - ${exp.company} (${exp.duration})`);
      if (exp.description) lines.push(exp.description);
      exp.bullets.forEach((b) => lines.push(`- ${b}`));
    });

    lines.push('\n--- TECHNICAL SKILLS ---');
    lines.push(skills.map((s) => s.skillName).filter(Boolean).join(', '));

    lines.push('\n--- PROJECTS ---');
    projects.forEach((p) => {
      lines.push(`${p.title} (${p.duration})`);
      if (p.description) lines.push(p.description);
      p.achievements.forEach((a) => lines.push(`- ${a}`));
    });

    lines.push('\n--- EDUCATION ---');
    education.forEach((edu) => {
      lines.push(`${edu.degree} in ${edu.field} - ${edu.institution} (${edu.graduationDate})`);
    });

    lines.push('\n--- CERTIFICATIONS ---');
    certifications.forEach((c) => {
      lines.push(`${c.title} - ${c.issuer} (${c.issueDate})`);
    });

    return lines.join('\n');
  };

  // Template-based styles
  const isAtsOptimized = template === 'ats_optimized';
  const isModern = template === 'modern';
  const isMinimal = template === 'minimal';

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col h-full">
      {/* Header controls bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViewMode('styled')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'styled'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Eye className="w-3.5 h-3.5" /> Rendered View
          </button>
          <button
            type="button"
            onClick={() => setViewMode('ats_raw')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'ats_raw'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" /> ATS Parser View
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setZoomLevel((prev) => Math.max(70, prev - 10))}
              className="p-1 text-slate-400 hover:text-slate-200"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono text-slate-400 px-1.5">{zoomLevel}%</span>
            <button
              type="button"
              onClick={() => setZoomLevel((prev) => Math.min(130, prev + 10))}
              className="p-1 text-slate-400 hover:text-slate-200"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium border border-slate-700 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" /> Print
          </button>
        </div>
      </div>

      {/* Main Preview Container */}
      <div className="flex-1 overflow-auto rounded-xl bg-slate-950/90 border border-slate-850 p-4 flex justify-center items-start min-h-[500px] max-h-[850px]">
        {viewMode === 'ats_raw' ? (
          <div className="w-full h-full bg-slate-900 border border-slate-800 rounded-xl p-5 text-slate-300 font-mono text-xs whitespace-pre-wrap leading-relaxed overflow-y-auto">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-3 pb-2 border-b border-slate-800">
              <ShieldCheck className="w-4 h-4" />
              <span>Applicant Tracking System (ATS) Parsed Token Output:</span>
            </div>
            {generateAtsRawText()}
          </div>
        ) : (
          <div
            id="printable-resume-node"
            style={{
              transform: `scale(${zoomLevel / 100})`,
              transformOrigin: 'top center',
              transition: 'transform 0.15s ease'
            }}
            className={`w-[794px] min-h-[1123px] bg-white text-slate-900 p-10 shadow-2xl rounded-sm print:m-0 print:p-8 print:shadow-none ${
              isMinimal ? 'font-serif' : 'font-sans'
            }`}
          >
            {/* Header: Personal Info */}
            <div className={`border-b pb-4 mb-5 ${isAtsOptimized ? 'text-left border-slate-300' : isModern ? 'text-center border-indigo-200' : 'text-center border-slate-300'}`}>
              <h1 className={`text-2xl font-bold tracking-tight ${isModern ? 'text-indigo-900' : 'text-slate-900'}`}>
                {personalInfo.fullName || 'Alex Morgan'}
              </h1>

              <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-slate-600 mt-2">
                {personalInfo.email && <span>{personalInfo.email}</span>}
                {personalInfo.phone && <span>• {personalInfo.phone}</span>}
                {personalInfo.location && <span>• {personalInfo.location}</span>}
                {personalInfo.linkedin && (
                  <span>
                    • <a href={personalInfo.linkedin} className="text-indigo-600 hover:underline" target="_blank" rel="noreferrer">LinkedIn</a>
                  </span>
                )}
                {personalInfo.portfolio && (
                  <span>
                    • <a href={personalInfo.portfolio} className="text-indigo-600 hover:underline" target="_blank" rel="noreferrer">Portfolio</a>
                  </span>
                )}
              </div>
            </div>

            {/* Summary */}
            {summary && (
              <div className="mb-5">
                <h3 className={`text-xs font-bold uppercase tracking-wider mb-1.5 pb-0.5 border-b ${
                  isModern ? 'text-indigo-700 border-indigo-200' : 'text-slate-800 border-slate-300'
                }`}>
                  Professional Summary
                </h3>
                <p className="text-xs text-slate-700 leading-relaxed text-justify">
                  {summary}
                </p>
              </div>
            )}

            {/* Work Experience */}
            {experience.length > 0 && (
              <div className="mb-5">
                <h3 className={`text-xs font-bold uppercase tracking-wider mb-2.5 pb-0.5 border-b ${
                  isModern ? 'text-indigo-700 border-indigo-200' : 'text-slate-800 border-slate-300'
                }`}>
                  Work Experience
                </h3>
                <div className="space-y-3">
                  {experience.map((exp, idx) => (
                    <div key={idx} className="text-xs">
                      <div className="flex justify-between items-baseline font-bold text-slate-900">
                        <span>{exp.role} <span className="font-normal text-slate-600">| {exp.company}</span></span>
                        <span className="text-[11px] text-slate-500 font-medium">{exp.duration}</span>
                      </div>
                      {exp.description && (
                        <p className="text-slate-600 mt-0.5 text-[11.5px] italic">{exp.description}</p>
                      )}
                      {exp.bullets.length > 0 && (
                        <ul className="list-disc list-outside ml-4 mt-1 space-y-0.5 text-slate-700 text-[11.5px] leading-snug">
                          {exp.bullets.map((b, bIdx) => (
                            b ? <li key={bIdx}>{b}</li> : null
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Skills */}
            {skills.length > 0 && (
              <div className="mb-5">
                <h3 className={`text-xs font-bold uppercase tracking-wider mb-2 pb-0.5 border-b ${
                  isModern ? 'text-indigo-700 border-indigo-200' : 'text-slate-800 border-slate-300'
                }`}>
                  Technical Skills & Competencies
                </h3>
                <div className="flex flex-wrap gap-1.5 text-xs text-slate-800">
                  {skills.map((s, idx) => (
                    <span
                      key={idx}
                      className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                        s.isHighlight
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {s.skillName} {s.level ? `(${s.level})` : ''}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Projects */}
            {projects.length > 0 && (
              <div className="mb-5">
                <h3 className={`text-xs font-bold uppercase tracking-wider mb-2.5 pb-0.5 border-b ${
                  isModern ? 'text-indigo-700 border-indigo-200' : 'text-slate-800 border-slate-300'
                }`}>
                  Key Engineering Projects
                </h3>
                <div className="space-y-2.5">
                  {projects.map((proj, idx) => (
                    <div key={idx} className="text-xs">
                      <div className="flex justify-between items-baseline font-bold text-slate-900">
                        <span>
                          {proj.title}
                          {proj.link && (
                            <a href={proj.link} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline font-normal text-[11px] ml-1.5">
                              [Live Demo / Code]
                            </a>
                          )}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">{proj.duration}</span>
                      </div>
                      {proj.description && (
                        <p className="text-slate-600 mt-0.5 text-[11.5px]">{proj.description}</p>
                      )}
                      {proj.achievements.length > 0 && (
                        <ul className="list-disc list-outside ml-4 mt-1 space-y-0.5 text-slate-700 text-[11.5px]">
                          {proj.achievements.map((ach, achIdx) => (
                            ach ? <li key={achIdx}>{ach}</li> : null
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Education */}
            {education.length > 0 && (
              <div className="mb-5">
                <h3 className={`text-xs font-bold uppercase tracking-wider mb-2 pb-0.5 border-b ${
                  isModern ? 'text-indigo-700 border-indigo-200' : 'text-slate-800 border-slate-300'
                }`}>
                  Education
                </h3>
                <div className="space-y-2">
                  {education.map((edu, idx) => (
                    <div key={idx} className="text-xs">
                      <div className="flex justify-between items-baseline font-bold text-slate-900">
                        <span>{edu.degree} in {edu.field} <span className="font-normal text-slate-600">— {edu.institution}</span></span>
                        <span className="text-[11px] text-slate-500 font-medium">{edu.graduationDate}</span>
                      </div>
                      {edu.gpa && <p className="text-[11px] text-slate-500 mt-0.5">GPA: {edu.gpa}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Certifications */}
            {certifications.length > 0 && (
              <div>
                <h3 className={`text-xs font-bold uppercase tracking-wider mb-2 pb-0.5 border-b ${
                  isModern ? 'text-indigo-700 border-indigo-200' : 'text-slate-800 border-slate-300'
                }`}>
                  Licenses & Certifications
                </h3>
                <div className="space-y-1">
                  {certifications.map((c, idx) => (
                    <div key={idx} className="flex justify-between text-xs text-slate-800">
                      <span>• <strong>{c.title}</strong> — {c.issuer}</span>
                      <span className="text-[11px] text-slate-500">{c.issueDate}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
