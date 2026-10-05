from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any, Union
from datetime import datetime

# ==================== RESUME MODELS ====================

class PersonalInfo(BaseModel):
    fullName: str = ""
    email: str = ""
    phone: str = ""
    location: str = ""
    portfolio: Optional[str] = None
    linkedin: Optional[str] = None

class ExperienceEntry(BaseModel):
    id: Optional[str] = None
    company: str = ""
    role: str = ""
    duration: str = ""
    description: str = ""
    bullets: List[str] = Field(default_factory=list)
    skills: List[str] = Field(default_factory=list)
    isHighlight: bool = False

class EducationEntry(BaseModel):
    id: Optional[str] = None
    institution: str = ""
    degree: str = ""
    field: str = ""
    graduationDate: str = ""
    gpa: Optional[str] = None
    relevantCoursework: List[str] = Field(default_factory=list)

class SkillEntry(BaseModel):
    skillId: Optional[str] = None
    skillName: str = ""
    level: str = Field(default="intermediate", pattern="^(beginner|intermediate|advanced|expert)$")
    endorsements: int = 0
    yearsOfExperience: float = 0
    isHighlight: bool = False
    relatedProjects: List[str] = Field(default_factory=list)

class ProjectEntry(BaseModel):
    id: Optional[str] = None
    title: str = ""
    description: str = ""
    duration: str = ""
    technologies: List[str] = Field(default_factory=list)
    link: Optional[str] = None
    achievements: List[str] = Field(default_factory=list)

class CertificationEntry(BaseModel):
    id: Optional[str] = None
    title: str = ""
    issuer: str = ""
    issueDate: str = ""
    credentialUrl: Optional[str] = None

class ATSOptimization(BaseModel):
    score: int = Field(0, ge=0, le=100)
    keywords: List[Union[str, Dict[str, Any]]] = Field(default_factory=list)
    missingKeywords: List[Union[str, Dict[str, Any]]] = Field(default_factory=list)
    suggestions: List[Union[str, Dict[str, Any]]] = Field(default_factory=list)
    lastOptimizedAt: Optional[str] = None

class ResumeVersion(BaseModel):
    version: int = 1
    createdAt: Optional[str] = None
    summary: str = ""

class Resume(BaseModel):
    id: Optional[str] = None
    userId: str = "anonymous"
    title: str = "Untitled Resume"
    template: str = Field(default="ats_optimized", pattern="^(ats_optimized|modern|minimal)$")
    createdAt: Optional[Union[datetime, str]] = None
    updatedAt: Optional[Union[datetime, str]] = None
    isPrimary: bool = False
    personalInfo: PersonalInfo = Field(default_factory=PersonalInfo)
    summary: str = ""
    experience: List[ExperienceEntry] = Field(default_factory=list)
    education: List[EducationEntry] = Field(default_factory=list)
    skills: List[SkillEntry] = Field(default_factory=list)
    projects: List[ProjectEntry] = Field(default_factory=list)
    certifications: List[CertificationEntry] = Field(default_factory=list)
    atsOptimization: ATSOptimization = Field(default_factory=ATSOptimization)
    versions: List[ResumeVersion] = Field(default_factory=list)
    currentVersion: int = 1

class ResumeCreateRequest(BaseModel):
    template: str = Field(default="ats_optimized", pattern="^(ats_optimized|modern|minimal)$")
    userId: Optional[str] = "guest_user"
    title: Optional[str] = None
    personalInfo: Optional[PersonalInfo] = None

class ResumeSectionUpdateRequest(BaseModel):
    section: str
    data: Union[dict, list, str, Any]

class ResumeExportRequest(BaseModel):
    format: str = Field(..., pattern="^(pdf_formatted|pdf_ats|docx|txt)$")
    resume_data: Optional[Dict[str, Any]] = None

class ResumeDuplicateRequest(BaseModel):
    newTitle: str

# ==================== ATS ANALYSIS MODELS ====================

class KeywordMatch(BaseModel):
    keyword: str
    count: int = 0
    found: bool = True
    locations: List[int] = Field(default_factory=list)

class MissingKeyword(BaseModel):
    keyword: str
    priority: str = Field(default="medium", pattern="^(high|medium|low)$")

class KeywordAnalysis(BaseModel):
    found: List[KeywordMatch] = Field(default_factory=list)
    missing: List[MissingKeyword] = Field(default_factory=list)
    foundCount: int = 0
    totalChecked: int = 0
    matchPercentage: float = 0.0

class FormattingIssue(BaseModel):
    id: str
    severity: str = Field(..., pattern="^(error|warning|info)$")
    type: str
    description: str
    suggestion: str

class RequiredSkill(BaseModel):
    skill: str
    found: bool
    frequency: int

class JDComparison(BaseModel):
    jobDescriptionId: Optional[str] = "custom_jd"
    matchPercentage: float = 0.0
    requiredSkills: List[RequiredSkill] = Field(default_factory=list)
    niceToHaveSkills: List[RequiredSkill] = Field(default_factory=list)
    matchingSkills: List[str] = Field(default_factory=list)
    missingSkills: List[str] = Field(default_factory=list)
    recommendations: List[str] = Field(default_factory=list)

class Recommendation(BaseModel):
    action: str
    impact: str = Field(..., pattern="^(high|medium|low)$")

class Recommendations(BaseModel):
    immediate: List[Recommendation] = Field(default_factory=list)
    shortTerm: List[Recommendation] = Field(default_factory=list)
    longTerm: List[Recommendation] = Field(default_factory=list)

class ATSScore(BaseModel):
    overall: float = Field(0, ge=0, le=100)
    formatting: float = Field(0, ge=0, le=100)
    readability: float = Field(0, ge=0, le=100)
    keywords: float = Field(0, ge=0, le=100)
    metrics: float = Field(0, ge=0, le=100)
    parsing: float = Field(0, ge=0, le=100)

class ATSAnalysis(BaseModel):
    id: Optional[str] = None
    userId: str = "guest_user"
    resumeId: Optional[str] = None
    analyzedAt: Optional[Union[datetime, str]] = None
    atsScore: ATSScore = Field(default_factory=ATSScore)
    keywords: KeywordAnalysis = Field(default_factory=KeywordAnalysis)
    formattingIssues: List[FormattingIssue] = Field(default_factory=list)
    jdComparison: Optional[JDComparison] = None
    recommendations: Recommendations = Field(default_factory=Recommendations)
    parsedText: str = ""
    warnings: List[str] = Field(default_factory=list)
    fileName: Optional[str] = None

class ATSAnalyzeRequest(BaseModel):
    jobDescription: Optional[str] = None
    userId: Optional[str] = "guest_user"

class ATSAnalyzeResponse(BaseModel):
    success: bool
    analysis: Optional[ATSAnalysis] = None
    error: Optional[str] = None
