import React, { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "../../hooks/useAuth";
import { authService } from "../../services/authService";
import {
  saveResume,
  getLatestUserResume,
} from "../../services/resumeService";
import type { ResumeData, UserResume, ResumeTemplateId } from "../../types/resume.types";
import { INITIAL_RESUME_DATA } from "../../types/resume.types";
import { ResumeForm } from "../../components/resume/ResumeForm";
import { ResumePDFPreview } from "../../components/resume/ResumePDFPreview";
import { TemplateSelector } from "../../components/resume/TemplateSelector";
import {
  FileText,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  Clock,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
} from "lucide-react";

export const ResumePage: React.FC = () => {
  const { user, appUser } = useAuth();

  const [templateId, setTemplateId] = useState<ResumeTemplateId>("clean-simple");
  const [resumeTitle, setResumeTitle] = useState<string>("My ATS Resume");
  const [resumeData, setResumeData] = useState<ResumeData>(INITIAL_RESUME_DATA);
  const [resumeId, setResumeId] = useState<string>(`resume_${Date.now()}`);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialMount = useRef<boolean>(true);

  // Load existing resume or prefill from profile on mount
  useEffect(() => {
    let isSubscribed = true;

    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        if (user?.uid) {
          // Log metric
          try {
            // @ts-ignore
            if (window?.gtag) window.gtag("event", "resume_builder_started", { uid: user.uid });
          } catch {}

          // 1. Try to load existing saved resume
          const existingResume = await getLatestUserResume(user.uid);

          if (existingResume && isSubscribed) {
            setResumeId(existingResume.resumeId);
            setTemplateId((existingResume.templateId as ResumeTemplateId) || "clean-simple");
            setResumeTitle(existingResume.title || "My ATS Resume");
            setResumeData(existingResume.data);
            setLastSavedTime(existingResume.updatedAt ? new Date(existingResume.updatedAt) : new Date());
            setIsLoading(false);
            return;
          }

          // 2. If no resume, prefill from student user profile & assessments
          const userProfile = appUser || (await authService.getUserProfile(user.uid));
          if (isSubscribed && userProfile) {
            const roleName = userProfile.selectedCareer || "Software Engineer";
            const prefilled: ResumeData = {
              ...INITIAL_RESUME_DATA,
              fullName: userProfile.displayName || user.displayName || INITIAL_RESUME_DATA.fullName,
              email: userProfile.email || user.email || INITIAL_RESUME_DATA.email,
              location: "India",
              headline: userProfile.selectedCareer
                ? `Aspiring ${roleName} | Computer Science Fresher`
                : INITIAL_RESUME_DATA.headline,
              summary: userProfile.selectedCareer
                ? `Motivated and detail-oriented student passionate about ${roleName}. Seeking an internship or entry-level role to leverage modern software engineering principles and collaborative problem-solving.`
                : INITIAL_RESUME_DATA.summary,
              education: [
                {
                  institution: "National Institute of Technology / University",
                  degree: "Bachelor of Technology (B.Tech)",
                  branch: "Computer Science & Engineering",
                  gpa: 8.5,
                  startYear: 2022,
                  endYear: 2026,
                },
              ],
              skills: userProfile.skills && userProfile.skills.length > 0
                ? [
                    {
                      category: "Core Technologies",
                      items: userProfile.skills,
                    },
                    {
                      category: "Tools & Frameworks",
                      items: ["Git", "GitHub", "VS Code", "Postman"],
                    },
                  ]
                : INITIAL_RESUME_DATA.skills,
            };

            setResumeData(prefilled);
          }
        }
      } catch (err: any) {
        console.error("Failed to load user resume or profile:", err);
      } finally {
        if (isSubscribed) {
          setIsLoading(false);
        }
      }
    };

    loadInitialData();

    return () => {
      isSubscribed = false;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [user, appUser]);

  // Debounced Auto-save to Firestore
  const handleAutoSave = useCallback(
    (newData: ResumeData) => {
      setResumeData(newData);

      if (!user?.uid) return;

      // Don't auto-save on the very first mount trigger before data loads
      if (isInitialMount.current) {
        isInitialMount.current = false;
        return;
      }

      setSaveStatus("saving");
      setErrorMessage(null);

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(async () => {
        try {
          const userResumeToSave: UserResume = {
            resumeId,
            templateId,
            title: resumeTitle,
            data: newData,
            createdAt: lastSavedTime || new Date(),
            updatedAt: new Date(),
            isDefault: true,
          };

          await saveResume(user.uid, userResumeToSave);
          setSaveStatus("saved");
          setLastSavedTime(new Date());

          try {
            // @ts-ignore
            if (window?.gtag) window.gtag("event", "resume_saved", { templateId });
          } catch {}
        } catch (err: any) {
          console.error("Auto-save error:", err);
          setSaveStatus("error");
          setErrorMessage("Failed to sync to cloud. Offline cache preserved.");
        }
      }, 600);
    },
    [user, resumeId, templateId, resumeTitle, lastSavedTime]
  );

  const handleTemplateChange = (newTemplateId: ResumeTemplateId) => {
    setTemplateId(newTemplateId);
    try {
      // @ts-ignore
      if (window?.gtag) window.gtag("event", "template_selected", { templateId: newTemplateId });
    } catch {}

    // Trigger save with new template
    if (user?.uid) {
      const userResumeToSave: UserResume = {
        resumeId,
        templateId: newTemplateId,
        title: resumeTitle,
        data: resumeData,
        createdAt: lastSavedTime || new Date(),
        updatedAt: new Date(),
        isDefault: true,
      };
      saveResume(user.uid, userResumeToSave).catch(console.error);
    }
  };

  const handleResetToSample = () => {
    setResumeData(INITIAL_RESUME_DATA);
    handleAutoSave(INITIAL_RESUME_DATA);
  };

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-4 border-[#4F46E5]/20 border-t-[#4F46E5] animate-spin"></div>
          <FileText className="w-5 h-5 text-[#4F46E5] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <div className="text-center">
          <h3 className="font-display font-bold text-lg text-[#12122B]">
            Initializing Transit Resume Studio
          </h3>
          <p className="font-data text-xs text-gray-500 mt-1">
            Loading student profile & resume templates...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Station Header */}
      <div className="bg-white border border-gray-200/90 rounded-2xl p-6 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-indigo-50/60 to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-data font-bold bg-[#4F46E5]/10 text-[#4F46E5] border border-[#4F46E5]/20">
                STATION 09.5
              </span>
              <span className="text-xs font-data text-gray-400">·</span>
              <span className="text-xs font-data text-gray-600 font-medium">
                Professional Resume Builder (Core Phase 1)
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-display font-extrabold text-[#12122B] tracking-tight">
              ATS-Optimized Transit Resume Studio
            </h1>
            <p className="text-xs md:text-sm text-gray-600 mt-1 max-w-2xl font-data">
              Build clean, hiring-ready single/multi-page resumes formatted for applicant tracking systems. Live PDF rendering with auto-save sync.
            </p>
          </div>

          {/* Sync & Auto-save Status Indicator */}
          <div className="flex items-center gap-3 self-start md:self-auto bg-[#FAFAF7] border border-gray-200/80 rounded-xl px-3.5 py-2">
            {saveStatus === "saving" && (
              <div className="flex items-center gap-2 text-indigo-600">
                <RefreshCw size={14} className="animate-spin" />
                <span className="text-xs font-data font-medium">Syncing changes...</span>
              </div>
            )}
            {saveStatus === "saved" && (
              <div className="flex items-center gap-2 text-emerald-600">
                <CheckCircle2 size={15} />
                <span className="text-xs font-data font-medium">
                  Auto-saved to Cloud
                </span>
              </div>
            )}
            {saveStatus === "error" && (
              <div className="flex items-center gap-2 text-amber-600" title={errorMessage || ""}>
                <AlertCircle size={15} />
                <span className="text-xs font-data font-medium">Saved locally</span>
              </div>
            )}
            {saveStatus === "idle" && lastSavedTime && (
              <div className="flex items-center gap-2 text-gray-500">
                <Clock size={14} />
                <span className="text-xs font-data">
                  Updated {lastSavedTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            )}
            {saveStatus === "idle" && !lastSavedTime && (
              <div className="flex items-center gap-2 text-gray-500">
                <ShieldCheck size={14} className="text-indigo-500" />
                <span className="text-xs font-data">Auto-save active</span>
              </div>
            )}
          </div>
        </div>

        {/* Template Selector in Header Bar */}
        <div className="mt-6 pt-5 border-t border-gray-100">
          <TemplateSelector
            selectedTemplate={templateId}
            onSelectTemplate={handleTemplateChange}
          />
        </div>
      </div>

      {/* Main Studio Grid: Form (Sticky on left) vs Live PDF (Sticky on right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form Editor (Span 7) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-gray-200/90 rounded-2xl p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-gray-100">
              <div>
                <h2 className="font-display font-bold text-lg text-[#12122B]">
                  Resume Information
                </h2>
                <p className="text-xs font-data text-gray-500">
                  Complete each waypoint section. All fields auto-save to your transit profile.
                </p>
              </div>

              <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-data text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
                <Sparkles size={13} />
                <span>Single-column ATS standard</span>
              </div>
            </div>

            {/* Form Component with Dynamic Arrays */}
            <ResumeForm
              initialData={resumeData}
              onChange={handleAutoSave}
              isSaving={saveStatus === "saving"}
              onResetToSample={handleResetToSample}
            />
          </div>
        </div>

        {/* Right Column: Live PDF Document Viewer & Actions (Span 5) */}
        <div className="lg:col-span-5 sticky top-4">
          <ResumePDFPreview
            data={resumeData}
            templateId={templateId}
            isSaving={saveStatus === "saving"}
          />

          {/* ATS Best Practice Tips Card */}
          <div className="mt-4 bg-white border border-gray-200/90 rounded-xl p-4 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-data font-bold text-[#12122B] mb-2">
              <HelpCircle size={15} className="text-[#4F46E5]" />
              <span>ATS Success Checklist</span>
            </div>
            <ul className="text-xs font-data text-gray-600 space-y-1.5 list-disc pl-4">
              <li>Use standard action verbs (Built, Engineered, Architected, Led).</li>
              <li>Include measurable metrics (e.g., "Reduced latency by 35%").</li>
              <li>Stick to standard section headers (Education, Experience, Projects).</li>
              <li>Ensure hyperlinks (GitHub / Portfolio) are valid and clickable.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ResumePage;
