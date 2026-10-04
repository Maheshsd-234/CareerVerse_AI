import React, { useEffect, useRef } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import {
  User,
  GraduationCap,
  Wrench,
  Briefcase,
  FolderGit2,
  Award,
  Plus,
  Trash2,
  Sparkles,
  Link as LinkIcon,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { Button } from "../ui/UI";
import type { ResumeData } from "../../types/resume.types";

interface Props {
  initialData: ResumeData;
  onChange: (data: ResumeData) => void;
  isSaving: boolean;
  onResetToSample: () => void;
}

export const ResumeForm: React.FC<Props> = ({
  initialData,
  onChange,
  isSaving,
  onResetToSample,
}) => {
  const {
    register,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm<ResumeData>({
    defaultValues: initialData,
    mode: "onChange",
  });

  // Keep form in sync if initialData loads asynchronously from Firestore
  const isFirstLoad = useRef(true);
  useEffect(() => {
    if (isFirstLoad.current && initialData && initialData.fullName) {
      reset(initialData);
      isFirstLoad.current = false;
    }
  }, [initialData, reset]);

  // Field Arrays for Dynamic Sections
  const {
    fields: educationFields,
    append: appendEducation,
    remove: removeEducation,
  } = useFieldArray({ control, name: "education" });

  const {
    fields: skillFields,
    append: appendSkill,
    remove: removeSkill,
  } = useFieldArray({ control, name: "skills" });

  const {
    fields: experienceFields,
    append: appendExperience,
    remove: removeExperience,
  } = useFieldArray({ control, name: "experience" });

  const {
    fields: projectFields,
    append: appendProject,
    remove: removeProject,
  } = useFieldArray({ control, name: "projects" });

  const {
    fields: certFields,
    append: appendCert,
    remove: removeCert,
  } = useFieldArray({ control, name: "certifications" });

  // Debounced watcher to trigger parent state update & Firestore auto-save
  useEffect(() => {
    const subscription = watch((value) => {
      const timer = setTimeout(() => {
        onChange(value as ResumeData);
      }, 350);
      return () => clearTimeout(timer);
    });
    return () => subscription.unsubscribe();
  }, [watch, onChange]);

  return (
    <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
      {/* SECTION 1: PERSONAL INFORMATION */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#4F46E5]/10 text-[#4F46E5] flex items-center justify-center">
              <User size={16} />
            </div>
            <div>
              <h3 className="text-sm font-display font-bold text-[#12122B]">
                1. Personal Information
              </h3>
              <p className="text-[11px] text-[#6B7280]">Contact info & online handles</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onResetToSample}
            className="text-[11px] font-data text-[#4F46E5] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw size={12} />
            Fill Sample Data
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="text-xs font-data font-bold text-[#4B5563] uppercase block mb-1">
              Full Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Mahesh S D"
              {...register("fullName", { required: "Full name is required" })}
              className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs font-body focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
            />
          </div>

          <div>
            <label className="text-xs font-data font-bold text-[#4B5563] uppercase block mb-1">
              Target Headline
            </label>
            <input
              type="text"
              placeholder="e.g. SDE 1 / Full Stack Developer"
              {...register("headline")}
              className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs font-body focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
            />
          </div>

          <div>
            <label className="text-xs font-data font-bold text-[#4B5563] uppercase block mb-1">
              Email Address *
            </label>
            <input
              type="email"
              placeholder="e.g. mahesh@example.com"
              {...register("email", { required: "Email is required" })}
              className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs font-body focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
            />
          </div>

          <div>
            <label className="text-xs font-data font-bold text-[#4B5563] uppercase block mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              placeholder="e.g. +91 98765 43210"
              {...register("phone")}
              className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs font-body focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
            />
          </div>

          <div>
            <label className="text-xs font-data font-bold text-[#4B5563] uppercase block mb-1">
              Location (City, Country)
            </label>
            <input
              type="text"
              placeholder="e.g. Bengaluru, India"
              {...register("location")}
              className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs font-body focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
            />
          </div>

          <div>
            <label className="text-xs font-data font-bold text-[#4B5563] uppercase block mb-1">
              LinkedIn URL
            </label>
            <input
              type="text"
              placeholder="linkedin.com/in/username"
              {...register("linkedinUrl")}
              className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs font-body focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
            />
          </div>

          <div>
            <label className="text-xs font-data font-bold text-[#4B5563] uppercase block mb-1">
              GitHub URL
            </label>
            <input
              type="text"
              placeholder="github.com/username"
              {...register("githubUrl")}
              className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs font-body focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
            />
          </div>

          <div>
            <label className="text-xs font-data font-bold text-[#4B5563] uppercase block mb-1">
              Portfolio / Website URL
            </label>
            <input
              type="text"
              placeholder="myportfolio.dev"
              {...register("portfolioUrl")}
              className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs font-body focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
            />
          </div>
        </div>
      </div>

      {/* SECTION 2: PROFESSIONAL SUMMARY */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-200 shadow-sm space-y-3">
        <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100">
          <div className="w-8 h-8 rounded-xl bg-[#14B8A6]/10 text-[#14B8A6] flex items-center justify-center">
            <Sparkles size={16} />
          </div>
          <div>
            <h3 className="text-sm font-display font-bold text-[#12122B]">
              2. Professional Summary
            </h3>
            <p className="text-[11px] text-[#6B7280]">Short 2-3 sentence elevator pitch for recruiters</p>
          </div>
        </div>

        <textarea
          rows={3}
          placeholder="e.g. Computer Science student passionate about scalable web architecture, clean code, and API engineering..."
          {...register("summary")}
          className="w-full p-3 rounded-xl border border-gray-300 text-xs font-body focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
        />
      </div>

      {/* SECTION 3: EDUCATION */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#4F46E5]/10 text-[#4F46E5] flex items-center justify-center">
              <GraduationCap size={16} />
            </div>
            <div>
              <h3 className="text-sm font-display font-bold text-[#12122B]">
                3. Education
              </h3>
              <p className="text-[11px] text-[#6B7280]">Degrees, College, GPA & passing years</p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              appendEducation({
                institution: "",
                degree: "B.Tech / B.E",
                branch: "Computer Science",
                gpa: "",
                startYear: 2022,
                endYear: 2026,
              })
            }
            className="text-xs"
          >
            <Plus size={14} className="mr-1" /> Add Degree
          </Button>
        </div>

        <div className="space-y-4">
          {educationFields.map((field, idx) => (
            <div
              key={field.id}
              className="p-4 rounded-2xl bg-[#FAFAF7] border border-gray-200 space-y-3 relative group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-data font-bold text-[#4F46E5]">
                  Degree 0{idx + 1}
                </span>
                {educationFields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeEducation(idx)}
                    className="text-gray-400 hover:text-red-500 cursor-pointer"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-[11px] font-data font-bold text-gray-600 uppercase block mb-1">
                    College / Institution Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. RV College of Engineering / NIT Surathkal"
                    {...register(`education.${idx}.institution` as const)}
                    className="w-full px-3 py-1.5 rounded-xl border border-gray-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-data font-bold text-gray-600 uppercase block mb-1">
                    Degree
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. B.Tech / B.E / BCA"
                    {...register(`education.${idx}.degree` as const)}
                    className="w-full px-3 py-1.5 rounded-xl border border-gray-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-data font-bold text-gray-600 uppercase block mb-1">
                    Branch / Specialization
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Computer Science & Eng"
                    {...register(`education.${idx}.branch` as const)}
                    className="w-full px-3 py-1.5 rounded-xl border border-gray-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-data font-bold text-gray-600 uppercase block mb-1">
                    GPA / Percentage
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 8.5 / 10.0 or 85%"
                    {...register(`education.${idx}.gpa` as const)}
                    className="w-full px-3 py-1.5 rounded-xl border border-gray-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-data font-bold text-gray-600 uppercase block mb-1">
                      Start Year
                    </label>
                    <input
                      type="number"
                      placeholder="2022"
                      {...register(`education.${idx}.startYear` as const)}
                      className="w-full px-3 py-1.5 rounded-xl border border-gray-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-data font-bold text-gray-600 uppercase block mb-1">
                      End Year
                    </label>
                    <input
                      type="number"
                      placeholder="2026"
                      {...register(`education.${idx}.endYear` as const)}
                      className="w-full px-3 py-1.5 rounded-xl border border-gray-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 4: TECHNICAL SKILLS */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#F5A623]/10 text-[#F5A623] flex items-center justify-center">
              <Wrench size={16} />
            </div>
            <div>
              <h3 className="text-sm font-display font-bold text-[#12122B]">
                4. Technical Skills
              </h3>
              <p className="text-[11px] text-[#6B7280]">Categorized skill groups (Languages, Frameworks, Tools)</p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => appendSkill({ category: "New Category", items: ["Skill A", "Skill B"] })}
            className="text-xs"
          >
            <Plus size={14} className="mr-1" /> Add Category
          </Button>
        </div>

        <div className="space-y-3">
          {skillFields.map((field, idx) => (
            <div
              key={field.id}
              className="p-3.5 rounded-2xl bg-[#FAFAF7] border border-gray-200 grid grid-cols-1 sm:grid-cols-3 gap-3 items-center"
            >
              <div>
                <label className="text-[11px] font-data font-bold text-gray-600 uppercase block mb-1">
                  Category Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Languages / Cloud"
                  {...register(`skills.${idx}.category` as const)}
                  className="w-full px-3 py-1.5 rounded-xl border border-gray-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                />
              </div>

              <div className="sm:col-span-2 flex items-center gap-2">
                <div className="flex-1">
                  <label className="text-[11px] font-data font-bold text-gray-600 uppercase block mb-1">
                    Skills (Comma separated)
                  </label>
                  <Controller
                    control={control}
                    name={`skills.${idx}.items` as const}
                    render={({ field: { value, onChange } }) => (
                      <input
                        type="text"
                        placeholder="React, TypeScript, Next.js, Node.js"
                        value={Array.isArray(value) ? value.join(", ") : value || ""}
                        onChange={(e) => {
                          const parsed = e.target.value
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean);
                          onChange(parsed);
                        }}
                        className="w-full px-3 py-1.5 rounded-xl border border-gray-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                      />
                    )}
                  />
                </div>

                {skillFields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSkill(idx)}
                    className="p-2 text-gray-400 hover:text-red-500 cursor-pointer mt-5"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 5: EXPERIENCE / INTERNSHIPS */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#4F46E5]/10 text-[#4F46E5] flex items-center justify-center">
              <Briefcase size={16} />
            </div>
            <div>
              <h3 className="text-sm font-display font-bold text-[#12122B]">
                5. Experience & Internships
              </h3>
              <p className="text-[11px] text-[#6B7280]">Work experience, internships, or student leadership</p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              appendExperience({
                company: "",
                role: "Software Development Intern",
                duration: "Jun 2024 - Aug 2024",
                bullets: ["Built features...", "Wrote tests..."],
                isCurrentRole: false,
              })
            }
            className="text-xs"
          >
            <Plus size={14} className="mr-1" /> Add Experience
          </Button>
        </div>

        <div className="space-y-4">
          {experienceFields.map((field, idx) => (
            <div
              key={field.id}
              className="p-4 rounded-2xl bg-[#FAFAF7] border border-gray-200 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-data font-bold text-[#4F46E5]">
                  Experience 0{idx + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeExperience(idx)}
                  className="text-gray-400 hover:text-red-500 cursor-pointer"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-data font-bold text-gray-600 uppercase block mb-1">
                    Company / Organization
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Infosys / Startup Inc"
                    {...register(`experience.${idx}.company` as const)}
                    className="w-full px-3 py-1.5 rounded-xl border border-gray-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-data font-bold text-gray-600 uppercase block mb-1">
                    Role Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. SDE Intern / Frontend Intern"
                    {...register(`experience.${idx}.role` as const)}
                    className="w-full px-3 py-1.5 rounded-xl border border-gray-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[11px] font-data font-bold text-gray-600 uppercase block mb-1">
                    Duration
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. May 2024 - Aug 2024"
                    {...register(`experience.${idx}.duration` as const)}
                    className="w-full px-3 py-1.5 rounded-xl border border-gray-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[11px] font-data font-bold text-gray-600 uppercase block mb-1">
                    Key Achievements & Responsibilities (1 bullet per line)
                  </label>
                  <Controller
                    control={control}
                    name={`experience.${idx}.bullets` as const}
                    render={({ field: { value, onChange } }) => (
                      <textarea
                        rows={3}
                        placeholder="• Built REST API microservices reducing latency by 20%&#10;• Led sprint daily standups and implemented Redis caching"
                        value={Array.isArray(value) ? value.join("\n") : value || ""}
                        onChange={(e) => {
                          const bullets = e.target.value
                            .split("\n")
                            .map((b) => b.replace(/^[•\-\*]\s*/, "").trim())
                            .filter(Boolean);
                          onChange(bullets);
                        }}
                        className="w-full p-3 rounded-xl border border-gray-300 text-xs bg-white font-body focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                      />
                    )}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 6: KEY PROJECTS */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#14B8A6]/10 text-[#14B8A6] flex items-center justify-center">
              <FolderGit2 size={16} />
            </div>
            <div>
              <h3 className="text-sm font-display font-bold text-[#12122B]">
                6. Technical Projects
              </h3>
              <p className="text-[11px] text-[#6B7280]">Key personal, hackathon, or capstone projects</p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              appendProject({
                title: "New Project",
                description: "Built end-to-end full-stack solution with real-time sync...",
                technologies: ["React", "TypeScript", "Node.js"],
                link: "",
                date: "2025",
              })
            }
            className="text-xs"
          >
            <Plus size={14} className="mr-1" /> Add Project
          </Button>
        </div>

        <div className="space-y-4">
          {projectFields.map((field, idx) => (
            <div
              key={field.id}
              className="p-4 rounded-2xl bg-[#FAFAF7] border border-gray-200 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-data font-bold text-[#14B8A6]">
                  Project 0{idx + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeProject(idx)}
                  className="text-gray-400 hover:text-red-500 cursor-pointer"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-data font-bold text-gray-600 uppercase block mb-1">
                    Project Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. AI Career Navigator"
                    {...register(`projects.${idx}.title` as const)}
                    className="w-full px-3 py-1.5 rounded-xl border border-gray-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-data font-bold text-gray-600 uppercase block mb-1">
                    Project / GitHub Link
                  </label>
                  <input
                    type="text"
                    placeholder="https://github.com/..."
                    {...register(`projects.${idx}.link` as const)}
                    className="w-full px-3 py-1.5 rounded-xl border border-gray-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[11px] font-data font-bold text-gray-600 uppercase block mb-1">
                    Technologies Used (Comma separated)
                  </label>
                  <Controller
                    control={control}
                    name={`projects.${idx}.technologies` as const}
                    render={({ field: { value, onChange } }) => (
                      <input
                        type="text"
                        placeholder="React, TypeScript, Docker, Redis"
                        value={Array.isArray(value) ? value.join(", ") : value || ""}
                        onChange={(e) => {
                          const tech = e.target.value
                            .split(",")
                            .map((t) => t.trim())
                            .filter(Boolean);
                          onChange(tech);
                        }}
                        className="w-full px-3 py-1.5 rounded-xl border border-gray-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                      />
                    )}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[11px] font-data font-bold text-gray-600 uppercase block mb-1">
                    Description & Measurable Impact
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Describe problem solved, architecture used, and outcomes achieved..."
                    {...register(`projects.${idx}.description` as const)}
                    className="w-full p-3 rounded-xl border border-gray-300 text-xs bg-white font-body focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 7: CERTIFICATIONS */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#F5A623]/10 text-[#F5A623] flex items-center justify-center">
              <Award size={16} />
            </div>
            <div>
              <h3 className="text-sm font-display font-bold text-[#12122B]">
                7. Certifications & Achievements
              </h3>
              <p className="text-[11px] text-[#6B7280]">Cloud credentials, hackathon wins, honors</p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              appendCert({
                name: "AWS Certified Cloud Practitioner",
                issuer: "Amazon Web Services",
                date: "2024",
              })
            }
            className="text-xs"
          >
            <Plus size={14} className="mr-1" /> Add Cert
          </Button>
        </div>

        <div className="space-y-3">
          {certFields.map((field, idx) => (
            <div
              key={field.id}
              className="p-3.5 rounded-2xl bg-[#FAFAF7] border border-gray-200 grid grid-cols-1 sm:grid-cols-3 gap-3 items-center"
            >
              <div>
                <label className="text-[11px] font-data font-bold text-gray-600 uppercase block mb-1">
                  Certificate Name
                </label>
                <input
                  type="text"
                  placeholder="AWS Solutions Architect"
                  {...register(`certifications.${idx}.name` as const)}
                  className="w-full px-3 py-1.5 rounded-xl border border-gray-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                />
              </div>

              <div>
                <label className="text-[11px] font-data font-bold text-gray-600 uppercase block mb-1">
                  Issuer / Authority
                </label>
                <input
                  type="text"
                  placeholder="Amazon / Google / Coursera"
                  {...register(`certifications.${idx}.issuer` as const)}
                  className="w-full px-3 py-1.5 rounded-xl border border-gray-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                />
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <label className="text-[11px] font-data font-bold text-gray-600 uppercase block mb-1">
                    Year / Date
                  </label>
                  <input
                    type="text"
                    placeholder="2024"
                    {...register(`certifications.${idx}.date` as const)}
                    className="w-full px-3 py-1.5 rounded-xl border border-gray-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => removeCert(idx)}
                  className="p-2 text-gray-400 hover:text-red-500 cursor-pointer mt-5"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </form>
  );
};
