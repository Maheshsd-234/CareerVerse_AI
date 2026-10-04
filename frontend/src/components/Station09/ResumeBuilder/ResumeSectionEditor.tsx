import React, { useState } from 'react';
import type {
  ResumeDocument,
  PersonalInfo,
  ExperienceEntry,
  EducationEntry,
  SkillEntry,
  ProjectEntry,
  CertificationEntry
} from '../../../types/station09.types';
import {
  User,
  FileText,
  Briefcase,
  GraduationCap,
  Wrench,
  FolderGit2,
  Award,
  Plus,
  Trash2,
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface ResumeSectionEditorProps {
  resume: ResumeDocument;
  onChange: (updatedResume: ResumeDocument) => void;
  onSectionSave?: (sectionName: string) => void;
}

type TabType = 'personal' | 'summary' | 'experience' | 'skills' | 'projects' | 'education' | 'certifications';

export const ResumeSectionEditor: React.FC<ResumeSectionEditorProps> = ({
  resume,
  onChange,
  onSectionSave
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('personal');

  // Personal Info helpers
  const handlePersonalInfoChange = (field: keyof PersonalInfo, value: string) => {
    const updated = {
      ...resume,
      personalInfo: {
        ...resume.personalInfo,
        [field]: value
      }
    };
    onChange(updated);
  };

  // Summary helper
  const handleSummaryChange = (summary: string) => {
    onChange({ ...resume, summary });
  };

  // Experience helpers
  const handleAddExperience = () => {
    const newExp: ExperienceEntry = {
      id: `exp_${Date.now()}`,
      company: '',
      role: '',
      duration: '',
      description: '',
      bullets: [''],
      skills: [],
      isHighlight: false
    };
    onChange({ ...resume, experience: [newExp, ...resume.experience] });
  };

  const handleUpdateExperience = (index: number, field: keyof ExperienceEntry, val: any) => {
    const exps = [...resume.experience];
    exps[index] = { ...exps[index], [field]: val };
    onChange({ ...resume, experience: exps });
  };

  const handleDeleteExperience = (index: number) => {
    const exps = resume.experience.filter((_, i) => i !== index);
    onChange({ ...resume, experience: exps });
  };

  const handleAddExpBullet = (expIndex: number) => {
    const exps = [...resume.experience];
    exps[expIndex].bullets.push('');
    onChange({ ...resume, experience: exps });
  };

  const handleUpdateExpBullet = (expIndex: number, bulletIndex: number, text: string) => {
    const exps = [...resume.experience];
    exps[expIndex].bullets[bulletIndex] = text;
    onChange({ ...resume, experience: exps });
  };

  const handleDeleteExpBullet = (expIndex: number, bulletIndex: number) => {
    const exps = [...resume.experience];
    exps[expIndex].bullets.splice(bulletIndex, 1);
    onChange({ ...resume, experience: exps });
  };

  // Skills helpers
  const handleAddSkill = () => {
    const newSkill: SkillEntry = {
      skillId: `sk_${Date.now()}`,
      skillName: '',
      level: 'intermediate',
      yearsOfExperience: 1,
      isHighlight: false,
      relatedProjects: []
    };
    onChange({ ...resume, skills: [...resume.skills, newSkill] });
  };

  const handleUpdateSkill = (index: number, field: keyof SkillEntry, val: any) => {
    const skills = [...resume.skills];
    skills[index] = { ...skills[index], [field]: val };
    onChange({ ...resume, skills });
  };

  const handleDeleteSkill = (index: number) => {
    const skills = resume.skills.filter((_, i) => i !== index);
    onChange({ ...resume, skills });
  };

  // Project helpers
  const handleAddProject = () => {
    const newProj: ProjectEntry = {
      id: `proj_${Date.now()}`,
      title: '',
      description: '',
      duration: '',
      technologies: [],
      achievements: ['']
    };
    onChange({ ...resume, projects: [...resume.projects, newProj] });
  };

  const handleUpdateProject = (index: number, field: keyof ProjectEntry, val: any) => {
    const projects = [...resume.projects];
    projects[index] = { ...projects[index], [field]: val };
    onChange({ ...resume, projects });
  };

  const handleDeleteProject = (index: number) => {
    const projects = resume.projects.filter((_, i) => i !== index);
    onChange({ ...resume, projects });
  };

  // Education helpers
  const handleAddEducation = () => {
    const newEdu: EducationEntry = {
      id: `edu_${Date.now()}`,
      institution: '',
      degree: '',
      field: '',
      graduationDate: '',
      gpa: '',
      relevantCoursework: []
    };
    onChange({ ...resume, education: [...resume.education, newEdu] });
  };

  const handleUpdateEducation = (index: number, field: keyof EducationEntry, val: any) => {
    const edu = [...resume.education];
    edu[index] = { ...edu[index], [field]: val };
    onChange({ ...resume, education: edu });
  };

  const handleDeleteEducation = (index: number) => {
    const edu = resume.education.filter((_, i) => i !== index);
    onChange({ ...resume, education: edu });
  };

  // Certifications helpers
  const handleAddCertification = () => {
    const newCert: CertificationEntry = {
      id: `cert_${Date.now()}`,
      title: '',
      issuer: '',
      issueDate: '',
      credentialUrl: ''
    };
    onChange({ ...resume, certifications: [...resume.certifications, newCert] });
  };

  const handleUpdateCertification = (index: number, field: keyof CertificationEntry, val: any) => {
    const certs = [...resume.certifications];
    certs[index] = { ...certs[index], [field]: val };
    onChange({ ...resume, certifications: certs });
  };

  const handleDeleteCertification = (index: number) => {
    const certs = resume.certifications.filter((_, i) => i !== index);
    onChange({ ...resume, certifications: certs });
  };

  const tabs = [
    { id: 'personal', label: 'Contact', icon: <User className="w-4 h-4" /> },
    { id: 'summary', label: 'Summary', icon: <FileText className="w-4 h-4" /> },
    { id: 'experience', label: `Experience (${resume.experience.length})`, icon: <Briefcase className="w-4 h-4" /> },
    { id: 'skills', label: `Skills (${resume.skills.length})`, icon: <Wrench className="w-4 h-4" /> },
    { id: 'projects', label: `Projects (${resume.projects.length})`, icon: <FolderGit2 className="w-4 h-4" /> },
    { id: 'education', label: `Education (${resume.education.length})`, icon: <GraduationCap className="w-4 h-4" /> },
    { id: 'certifications', label: `Certs (${resume.certifications.length})`, icon: <Award className="w-4 h-4" /> }
  ];

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
      {/* Section Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-5 border-b border-slate-800 scrollbar-thin scrollbar-thumb-slate-700">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="space-y-4">
        {/* PERSONAL INFO TAB */}
        {activeTab === 'personal' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  value={resume.personalInfo.fullName}
                  onChange={(e) => handlePersonalInfoChange('fullName', e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Email Address *</label>
                <input
                  type="email"
                  value={resume.personalInfo.email}
                  onChange={(e) => handlePersonalInfoChange('email', e.target.value)}
                  placeholder="e.g. alex@example.com"
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Phone Number *</label>
                <input
                  type="text"
                  value={resume.personalInfo.phone}
                  onChange={(e) => handlePersonalInfoChange('phone', e.target.value)}
                  placeholder="e.g. +1 (555) 234-5678"
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Location (City, State/Country)</label>
                <input
                  type="text"
                  value={resume.personalInfo.location}
                  onChange={(e) => handlePersonalInfoChange('location', e.target.value)}
                  placeholder="e.g. San Francisco, CA"
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">LinkedIn Profile URL</label>
                <input
                  type="url"
                  value={resume.personalInfo.linkedin || ''}
                  onChange={(e) => handlePersonalInfoChange('linkedin', e.target.value)}
                  placeholder="https://linkedin.com/in/username"
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Portfolio / GitHub Website</label>
                <input
                  type="url"
                  value={resume.personalInfo.portfolio || ''}
                  onChange={(e) => handlePersonalInfoChange('portfolio', e.target.value)}
                  placeholder="https://github.com/username"
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* SUMMARY TAB */}
        {activeTab === 'summary' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-300">
                Professional Executive Summary (ATS Parsed Section)
              </label>
              <span className="text-xs text-slate-400">
                {resume.summary.length} characters (Ideal: 250-400)
              </span>
            </div>

            <textarea
              rows={5}
              value={resume.summary}
              onChange={(e) => handleSummaryChange(e.target.value)}
              placeholder="Concise 3-4 sentence pitch emphasizing technical domain, years of proven experience, and primary business value..."
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 leading-relaxed resize-y"
            />

            <div className="bg-indigo-950/30 border border-indigo-500/20 rounded-xl p-3 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
              <p className="text-xs text-indigo-300">
                <strong>ATS Tip:</strong> Mention your target role title and 3-4 core technologies in the summary so parsers immediately match you to job qualifications.
              </p>
            </div>
          </div>
        )}

        {/* EXPERIENCE TAB */}
        {activeTab === 'experience' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-400">Chronological list of professional roles.</p>
              <button
                type="button"
                onClick={handleAddExperience}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow"
              >
                <Plus className="w-3.5 h-3.5" /> Add Experience
              </button>
            </div>

            {resume.experience.map((exp, index) => (
              <div key={exp.id || index} className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wide">
                    Position #{index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteExperience(index)}
                    className="p-1 rounded text-rose-400 hover:bg-rose-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">Job Title *</label>
                    <input
                      type="text"
                      value={exp.role}
                      onChange={(e) => handleUpdateExperience(index, 'role', e.target.value)}
                      placeholder="e.g. Senior Software Engineer"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">Company / Organization *</label>
                    <input
                      type="text"
                      value={exp.company}
                      onChange={(e) => handleUpdateExperience(index, 'company', e.target.value)}
                      placeholder="e.g. Acme Inc"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">Duration *</label>
                    <input
                      type="text"
                      value={exp.duration}
                      onChange={(e) => handleUpdateExperience(index, 'duration', e.target.value)}
                      placeholder="e.g. Jun 2022 - Present"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-medium text-slate-300">
                      Measurable Accomplishments / Bullets
                    </label>
                    <button
                      type="button"
                      onClick={() => handleAddExpBullet(index)}
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add Bullet
                    </button>
                  </div>

                  <div className="space-y-2">
                    {exp.bullets.map((bullet, bIdx) => (
                      <div key={bIdx} className="flex items-center gap-2">
                        <span className="text-slate-500 text-xs">•</span>
                        <input
                          type="text"
                          value={bullet}
                          onChange={(e) => handleUpdateExpBullet(index, bIdx, e.target.value)}
                          placeholder="e.g. Spearheaded microservice decoupling, improving response times by 35%."
                          className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                        />
                        {exp.bullets.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleDeleteExpBullet(index, bIdx)}
                            className="p-1 text-slate-500 hover:text-rose-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SKILLS TAB */}
        {activeTab === 'skills' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-400">Technical competencies & level ratings.</p>
              <button
                type="button"
                onClick={handleAddSkill}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow"
              >
                <Plus className="w-3.5 h-3.5" /> Add Skill
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {resume.skills.map((skill, index) => (
                <div key={skill.skillId || index} className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 flex flex-col justify-between gap-2">
                  <div className="flex items-center justify-between">
                    <input
                      type="text"
                      value={skill.skillName}
                      onChange={(e) => handleUpdateSkill(index, 'skillName', e.target.value)}
                      placeholder="e.g. Python"
                      className="bg-transparent font-medium text-xs text-slate-100 placeholder-slate-500 border-b border-slate-700 focus:border-indigo-500 focus:outline-none pb-0.5 w-2/3"
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteSkill(index)}
                      className="text-slate-500 hover:text-rose-400 p-0.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-2 mt-1">
                    <select
                      value={skill.level}
                      onChange={(e) => handleUpdateSkill(index, 'level', e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded text-[11px] text-slate-300 px-2 py-1 focus:outline-none"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                      <option value="expert">Expert</option>
                    </select>

                    <label className="flex items-center gap-1 text-[11px] text-slate-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={skill.isHighlight || false}
                        onChange={(e) => handleUpdateSkill(index, 'isHighlight', e.target.checked)}
                        className="rounded border-slate-700 text-indigo-600 focus:ring-0"
                      />
                      Highlight
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PROJECTS TAB */}
        {activeTab === 'projects' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-400">Personal, open-source, or academic projects.</p>
              <button
                type="button"
                onClick={handleAddProject}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow"
              >
                <Plus className="w-3.5 h-3.5" /> Add Project
              </button>
            </div>

            {resume.projects.map((proj, index) => (
              <div key={proj.id || index} className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wide">
                    Project #{index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteProject(index)}
                    className="p-1 rounded text-rose-400 hover:bg-rose-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">Project Title *</label>
                    <input
                      type="text"
                      value={proj.title}
                      onChange={(e) => handleUpdateProject(index, 'title', e.target.value)}
                      placeholder="e.g. Distributed Analytics Dashboard"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">GitHub / Live URL</label>
                    <input
                      type="url"
                      value={proj.link || ''}
                      onChange={(e) => handleUpdateProject(index, 'link', e.target.value)}
                      placeholder="https://github.com/..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Overview Description</label>
                  <textarea
                    rows={2}
                    value={proj.description}
                    onChange={(e) => handleUpdateProject(index, 'description', e.target.value)}
                    placeholder="Briefly describe the objective, architecture, and deployment..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 resize-none"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* EDUCATION TAB */}
        {activeTab === 'education' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-400">Degrees, academic institutions, and GPA.</p>
              <button
                type="button"
                onClick={handleAddEducation}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow"
              >
                <Plus className="w-3.5 h-3.5" /> Add Education
              </button>
            </div>

            {resume.education.map((edu, index) => (
              <div key={edu.id || index} className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wide">
                    Degree #{index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteEducation(index)}
                    className="p-1 rounded text-rose-400 hover:bg-rose-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">Institution *</label>
                    <input
                      type="text"
                      value={edu.institution}
                      onChange={(e) => handleUpdateEducation(index, 'institution', e.target.value)}
                      placeholder="e.g. University of California, Berkeley"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">Degree & Major *</label>
                    <input
                      type="text"
                      value={edu.degree}
                      onChange={(e) => handleUpdateEducation(index, 'degree', e.target.value)}
                      placeholder="e.g. B.S. in Computer Science"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">Graduation Date</label>
                    <input
                      type="text"
                      value={edu.graduationDate}
                      onChange={(e) => handleUpdateEducation(index, 'graduationDate', e.target.value)}
                      placeholder="e.g. May 2024"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">GPA (optional)</label>
                    <input
                      type="text"
                      value={edu.gpa || ''}
                      onChange={(e) => handleUpdateEducation(index, 'gpa', e.target.value)}
                      placeholder="e.g. 3.8 / 4.0"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CERTIFICATIONS TAB */}
        {activeTab === 'certifications' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-400">Industry certifications and credentials.</p>
              <button
                type="button"
                onClick={handleAddCertification}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow"
              >
                <Plus className="w-3.5 h-3.5" /> Add Certification
              </button>
            </div>

            {resume.certifications.map((cert, index) => (
              <div key={cert.id || index} className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wide">
                    Credential #{index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteCertification(index)}
                    className="p-1 rounded text-rose-400 hover:bg-rose-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">Certification Title *</label>
                    <input
                      type="text"
                      value={cert.title}
                      onChange={(e) => handleUpdateCertification(index, 'title', e.target.value)}
                      placeholder="e.g. AWS Solutions Architect"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">Issuer *</label>
                    <input
                      type="text"
                      value={cert.issuer}
                      onChange={(e) => handleUpdateCertification(index, 'issuer', e.target.value)}
                      placeholder="e.g. Amazon Web Services"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">Issue Date</label>
                    <input
                      type="text"
                      value={cert.issueDate}
                      onChange={(e) => handleUpdateCertification(index, 'issueDate', e.target.value)}
                      placeholder="e.g. Oct 2023"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
