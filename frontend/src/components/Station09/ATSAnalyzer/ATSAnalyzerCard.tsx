import React, { useState, useEffect } from 'react';
import type { ATSAnalysisResult, ResumeDocument } from '../../../types/station09.types';
import { FileUpload } from './FileUpload';
import { AnalysisResults } from './AnalysisResults';
import { station09Service } from '../../../services/station09Service';
import {
  Search,
  Sparkles,
  FileText,
  Briefcase,
  AlertCircle,
  Loader2,
  CheckCircle2,
  HelpCircle,
  TrendingUp,
  Cpu
} from 'lucide-react';

interface ATSAnalyzerCardProps {
  preloadedResumeId?: string | null;
  userId?: string;
}

export const ATSAnalyzerCard: React.FC<ATSAnalyzerCardProps> = ({
  preloadedResumeId,
  userId = 'guest_user'
}) => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState<string>('');
  const [analysis, setAnalysis] = useState<ATSAnalysisResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [preloadedResume, setPreloadedResume] = useState<ResumeDocument | null>(null);

  // If a preloadedResumeId was passed from ResumeBuilder, fetch it
  useEffect(() => {
    if (preloadedResumeId) {
      station09Service
        .getResume(preloadedResumeId, userId)
        .then((res) => {
          setPreloadedResume(res);
        })
        .catch((err) => {
          console.warn('Could not load preloaded resume:', err);
        });
    }
  }, [preloadedResumeId, userId]);

  const handleAnalyze = async () => {
    try {
      setLoading(true);
      setError(null);

      if (uploadedFile) {
        // Multipart file upload analysis
        const res = await station09Service.analyzeResumeFile(
          uploadedFile,
          jobDescription,
          userId,
          preloadedResumeId || undefined
        );
        if (res.success) {
          setAnalysis(res.analysis);
        } else {
          setError('Analysis failed to parse resume.');
        }
      } else if (preloadedResume) {
        // Direct structured resume object analysis
        const result = await station09Service.analyzeResumeObject(preloadedResume, jobDescription);
        setAnalysis(result);
      } else {
        setError('Please upload a resume file or select an existing resume to analyze.');
      }
    } catch (err: any) {
      console.error('ATS Analysis error:', err);
      setError(err?.response?.data?.detail || err.message || 'Failed to complete ATS analysis.');
    } finally {
      setLoading(false);
    }
  };

  const sampleJDs = [
    {
      title: 'Full Stack Engineer',
      text: 'Seeking a Full Stack Engineer with strong experience in React, Python, FastAPI, Docker, and AWS. Responsible for designing scalable REST APIs, microservices, and modern user interfaces.'
    },
    {
      title: 'Machine Learning Engineer',
      text: 'Looking for an ML Engineer proficient in Python, PyTorch, TensorFlow, Scikit-learn, and SQL. Must have experience deploying scalable deep learning models and data pipelines.'
    },
    {
      title: 'Cloud DevOps Engineer',
      text: 'Requirements: AWS, Kubernetes, Docker, Terraform, CI/CD pipelines, and Linux. Experience automating cloud infrastructure and monitoring high-availability clusters.'
    }
  ];

  if (analysis) {
    return (
      <AnalysisResults
        analysis={analysis}
        onReset={() => {
          setAnalysis(null);
          setUploadedFile(null);
          setPreloadedResume(null);
          setJobDescription('');
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Introduction Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-2">
              <Sparkles className="w-3.5 h-3.5" /> High-Accuracy ATS Parser
            </div>
            <h2 className="text-xl font-bold text-slate-100">
              ATS Compatibility & Keyword Matching Engine
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
              Upload your current resume or test against a real job description. We audit structural formatting, keyword density, and quantifiable outcomes using real Applicant Tracking System rules.
            </p>
          </div>
        </div>
      </div>

      {/* Main Dual Inputs: Upload on Left, JD on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: File Upload or Preloaded Resume */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" /> Step 1: Provide Resume Document
              </h3>
              <span className="text-[11px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                PDF, Word, or TXT
              </span>
            </div>

            {preloadedResume && !uploadedFile ? (
              <div className="bg-slate-950 border border-indigo-500/40 rounded-2xl p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-100 flex items-center gap-1.5">
                      {preloadedResume.title}
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                    </p>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      Imported from Resume Builder Card • {preloadedResume.template.replace('_', ' ')}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setPreloadedResume(null)}
                  className="text-xs text-slate-400 hover:text-slate-200 underline"
                >
                  Upload file instead
                </button>
              </div>
            ) : (
              <FileUpload
                selectedFile={uploadedFile}
                onFileSelect={(file) => {
                  setUploadedFile(file);
                  setPreloadedResume(null);
                }}
                onClear={() => setUploadedFile(null)}
                disabled={loading}
              />
            )}
          </div>
        </div>

        {/* Right Column: Job Description */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-indigo-400" /> Step 2: Target Job Description (Optional)
              </h3>
              <span className="text-[11px] text-slate-400">Boosts accuracy</span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Paste the vacancy details or pick a quick tech template to test qualification match percentages.
            </p>

            {/* Quick JD Template Chips */}
            <div className="flex flex-wrap gap-2">
              {sampleJDs.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setJobDescription(sample.text)}
                  className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-medium text-slate-300 hover:border-indigo-500/50 hover:text-indigo-300 transition-colors"
                >
                  + {sample.title}
                </button>
              ))}
            </div>

            <textarea
              rows={6}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste job description requirements, responsibilities, or desired qualifications..."
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-3.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 leading-relaxed resize-y"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center gap-3 text-xs text-rose-300">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Action Submit Button */}
      <div className="flex justify-center pt-2">
        <button
          type="button"
          disabled={(!uploadedFile && !preloadedResume) || loading}
          onClick={handleAnalyze}
          className={`flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-2xl font-bold text-sm text-white transition-all shadow-xl ${
            (!uploadedFile && !preloadedResume) || loading
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              : 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 hover:from-indigo-500 hover:to-indigo-500 shadow-indigo-600/30 cursor-pointer active:scale-95'
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>Analyzing ATS Keywords & Structure...</span>
            </>
          ) : (
            <>
              <Search className="w-4 h-4 text-white" />
              <span>Run Comprehensive ATS Compatibility Audit</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
