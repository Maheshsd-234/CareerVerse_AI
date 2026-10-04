import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Inbox,
  Send,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Filter,
  Search,
  Plus,
  RefreshCw,
  ExternalLink,
  Mail,
  Copy,
  Check,
  Building2,
  Sparkles,
  ChevronRight,
  X,
  FileText,
  Briefcase,
  Layers,
  Award,
  BookOpen,
  ShieldCheck,
  CheckSquare,
  Compass,
  HelpCircle,
  LogOut,
} from "lucide-react";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../../firebase/config";
import { useAuth } from "../../hooks/useAuth";
import {
  applicationService,
  DEFAULT_30_APPLICATIONS,
  type JobApplication,
  type ApplicationStatus,
  type JobPlatform,
  type ApplicationAnalyticsData,
  type ApplicationRecommendations,
} from "../../services/applicationService";

export const ApplicationTrackerPage: React.FC = () => {
  const { user } = useAuth();
  const uid = user?.uid || "guest_user";

  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [isGmailConnected, setIsGmailConnected] = useState(false);
  const [connectedEmail, setConnectedEmail] = useState<string>("");

  // First-time visit detection
  const [showFirstTimeModal, setShowFirstTimeModal] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showFirebaseHelp, setShowFirebaseHelp] = useState<boolean>(false);
  const [directEmailInput, setDirectEmailInput] = useState<string>("");
  const [manualToken, setManualToken] = useState<string>("");
  const [showManualInput, setShowManualInput] = useState<boolean>(false);

  // Live Email Parser Modal
  const [showPasteModal, setShowPasteModal] = useState<boolean>(false);
  const [pasteSender, setPasteSender] = useState<string>("jobs-noreply@linkedin.com");
  const [pasteSubject, setPasteSubject] = useState<string>("Application status update: shortlisted");
  const [pasteBody, setPasteBody] = useState<string>(
    "Dear Candidate, We are pleased to inform you that your application for Software Engineer at Microsoft has been shortlisted for the technical interview round. Please choose your slot below."
  );
  const [isParsingEmail, setIsParsingEmail] = useState<boolean>(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date_desc");

  // Modals
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedApp, setSelectedApp] = useState<JobApplication | null>(null);
  const [emailModalData, setEmailModalData] = useState<{ company: string; role: string; template: string } | null>(null);
  const [prepModalData, setPrepModalData] = useState<{ company: string; role: string; date?: string; topics: string[] } | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [syncSuccessToast, setSyncSuccessToast] = useState<string | null>(null);

  // New Application Form State
  const [newCompany, setNewCompany] = useState("");
  const [newRole, setNewRole] = useState("");
  const [newPlatform, setNewPlatform] = useState<JobPlatform>("LinkedIn");
  const [newStatus, setNewStatus] = useState<ApplicationStatus>("applied");
  const [newLocation, setNewLocation] = useState("Bangalore");
  const [newSalary, setNewSalary] = useState("₹10-15 LPA");
  const [newNotes, setNewNotes] = useState("");

  // Load applications & check first-time status
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const data = await applicationService.getApplications(uid);
        if (alive) {
          setApplications(data);
          const connected = applicationService.isGmailConnected(uid);
          setIsGmailConnected(connected);
          const savedEmail = applicationService.getConnectedEmail(uid);
          if (savedEmail) {
            setConnectedEmail(savedEmail);
          } else if (user?.email) {
            setConnectedEmail(user.email);
          }

          // Check if first-time visit
          const onboarded = localStorage.getItem(`careerverse_tracker_onboarded_${uid}`);
          if (!onboarded) {
            setShowFirstTimeModal(true);
          }
        }
      } catch (err) {
        console.error("Failed to load applications:", err);
        if (alive) {
          setApplications(DEFAULT_30_APPLICATIONS);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [uid, user]);

  // Connect with Google & authorize Gmail scope
  const handleConnectGoogleOAuth = async () => {
    setSyncing(true);
    setAuthError(null);
    setShowFirebaseHelp(false);
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope("https://www.googleapis.com/auth/gmail.readonly");
      provider.setCustomParameters({ prompt: "select_account" });
      const cred = await signInWithPopup(auth, provider);
      const oauthCred = GoogleAuthProvider.credentialFromResult(cred);
      const accessToken = oauthCred?.accessToken;
      const userEmail = cred.user.email || user?.email || "student@gmail.com";

      const res = await applicationService.syncRealGmail(uid, accessToken, userEmail);
      setApplications(res.applications);
      setIsGmailConnected(true);
      setConnectedEmail(res.connected_email || userEmail);
      localStorage.setItem(`careerverse_tracker_onboarded_${uid}`, "true");
      setShowFirstTimeModal(false);
      setShowConnectModal(false);
      if (res.synced_count > 0) {
        setSyncSuccessToast(`Parsed ${res.synced_count} real applications from ${userEmail} (past 30 days)!`);
      } else {
        setSyncSuccessToast(`Connected to ${userEmail}! Found 0 emails in past 30 days. Incoming job updates will auto-track.`);
      }
      setTimeout(() => setSyncSuccessToast(null), 4500);
    } catch (err: any) {
      console.warn("Google OAuth error:", err);
      if (err.code === "auth/operation-not-allowed") {
        setAuthError(
          "Google Sign-In is disabled in Firebase for project 'careerverse-ai-21c80'. Enable it in Firebase Console, OR connect your email address directly below!"
        );
        setShowFirebaseHelp(true);
      } else if (err.code === "auth/popup-blocked") {
        setAuthError("Sign-in popup was blocked. Please allow popups for localhost to sign in with Google.");
      } else if (err.code === "auth/popup-closed-by-user") {
        setAuthError("Google Sign-In was closed before completion.");
      } else {
        setAuthError(err.message || "Failed to authorize Google account.");
      }
    } finally {
      setSyncing(false);
    }
  };

  // Connect directly with Student Email ID
  const handleConnectDirectEmail = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const emailToUse = directEmailInput.trim() || user?.email || "student@gmail.com";
    if (!emailToUse.includes("@")) {
      setAuthError("Please enter a valid email address (e.g. mahesh@gmail.com).");
      return;
    }
    setSyncing(true);
    setAuthError(null);
    try {
      const res = await applicationService.syncRealGmail(uid, undefined, emailToUse);
      setApplications(res.applications);
      setIsGmailConnected(true);
      setConnectedEmail(res.connected_email || emailToUse);
      localStorage.setItem(`careerverse_tracker_onboarded_${uid}`, "true");
      setShowFirstTimeModal(false);
      setShowConnectModal(false);
      setSyncSuccessToast(`Connected to ${emailToUse}! Application tracker is active.`);
      setTimeout(() => setSyncSuccessToast(null), 4000);
    } catch (err: any) {
      console.warn("Email connection error:", err);
      setAuthError(err.message || "Failed to connect email address.");
    } finally {
      setSyncing(false);
    }
  };

  // Live AI Email Parsing
  const handleParseCustomEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pasteBody.trim()) return;
    setIsParsingEmail(true);
    try {
      const newApp = await applicationService.parseAndAddSingleEmail(
        uid,
        pasteSender,
        pasteSubject,
        pasteBody
      );
      setApplications((prev) => [newApp, ...prev.filter((a) => a.id !== newApp.id)]);
      setShowPasteModal(false);
      setPasteBody("");
      setSyncSuccessToast(`Parsed notification from ${newApp.company} (${newApp.status.toUpperCase()}) with AI!`);
      setTimeout(() => setSyncSuccessToast(null), 4000);
    } catch (err: any) {
      alert("Failed to parse email: " + (err.message || String(err)));
    } finally {
      setIsParsingEmail(false);
    }
  };

  // Explore with demo data
  const handleExploreWithDemo = () => {
    localStorage.setItem(`careerverse_tracker_onboarded_${uid}`, "true");
    setShowFirstTimeModal(false);
    setSyncSuccessToast("Loaded 30 benchmark applications! You can connect your real Gmail anytime from the top bar.");
    setTimeout(() => setSyncSuccessToast(null), 4000);
  };

  // Disconnect email
  const handleDisconnectEmail = () => {
    applicationService.setGmailConnected(uid, false);
    applicationService.setConnectedEmail(uid, "");
    setIsGmailConnected(false);
    setConnectedEmail("");
    setSyncSuccessToast("Disconnected Gmail account.");
    setTimeout(() => setSyncSuccessToast(null), 3000);
  };

  // Handle Sync Inbox
  const handleSyncInbox = async () => {
    setSyncing(true);
    try {
      const res = await applicationService.syncInbox(uid);
      setApplications(res.applications);
      setIsGmailConnected(true);
      setShowConnectModal(false);
      setSyncSuccessToast(`Synced ${res.synced_count} job applications from your inbox!`);
      setTimeout(() => setSyncSuccessToast(null), 4000);
    } catch (err) {
      console.error("Sync error:", err);
    } finally {
      setSyncing(false);
    }
  };

  // Handle Status Update
  const handleStatusChange = async (appId: string, newSt: ApplicationStatus) => {
    const updated = await applicationService.updateApplication(uid, appId, { status: newSt });
    setApplications(updated);
    if (selectedApp && selectedApp.id === appId) {
      setSelectedApp({ ...selectedApp, status: newSt });
    }
  };

  // Handle Add Application
  const handleAddApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompany.trim() || !newRole.trim()) return;

    const updated = await applicationService.addApplication(uid, {
      company: newCompany.trim(),
      role: newRole.trim(),
      platform: newPlatform,
      status: newStatus,
      location: newLocation,
      salary_estimate: newSalary,
      notes: newNotes,
    });
    setApplications(updated);
    setShowAddModal(false);
    setNewCompany("");
    setNewRole("");
    setNewNotes("");
    setSyncSuccessToast("Application added to tracker!");
    setTimeout(() => setSyncSuccessToast(null), 3000);
  };

  // Derived Analytics
  const analytics: ApplicationAnalyticsData = useMemo(() => {
    return applicationService.calculateAnalytics(applications);
  }, [applications]);

  // Derived Recommendations
  const recommendations: ApplicationRecommendations = useMemo(() => {
    return applicationService.deriveRecommendations(applications);
  }, [applications]);

  // Filtered & Sorted Application List
  const filteredApplications = useMemo(() => {
    return applications
      .filter((app) => {
        const matchesSearch =
          app.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
          app.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (app.location && app.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (app.notes && app.notes.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesStatus =
          statusFilter === "all" ? true : app.status.toLowerCase() === statusFilter.toLowerCase();

        const matchesPlatform =
          platformFilter === "all" ? true : app.platform.toLowerCase() === platformFilter.toLowerCase();

        return matchesSearch && matchesStatus && matchesPlatform;
      })
      .sort((a, b) => {
        if (sortBy === "date_desc") {
          return new Date(b.applied_date).getTime() - new Date(a.applied_date).getTime();
        }
        if (sortBy === "date_asc") {
          return new Date(a.applied_date).getTime() - new Date(b.applied_date).getTime();
        }
        if (sortBy === "company_asc") {
          return a.company.localeCompare(b.company);
        }
        if (sortBy === "match_desc") {
          return (b.resume_match_percent || 0) - (a.resume_match_percent || 0);
        }
        return 0;
      });
  }, [applications, searchQuery, statusFilter, platformFilter, sortBy]);

  // Helper colors
  const getStatusColor = (status: ApplicationStatus) => {
    switch (status) {
      case "offer":
        return "bg-emerald-500/15 text-emerald-700 border-emerald-500/30";
      case "interview":
        return "bg-amber-500/15 text-amber-700 border-amber-500/30 ring-1 ring-amber-400/40";
      case "shortlisted":
        return "bg-purple-500/15 text-purple-700 border-purple-500/30";
      case "applied":
        return "bg-blue-500/15 text-blue-700 border-blue-500/30";
      case "rejected":
        return "bg-rose-500/15 text-rose-700 border-rose-500/30";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getPlatformBadge = (platform: JobPlatform) => {
    switch (platform) {
      case "Naukri":
        return "bg-blue-600 text-white";
      case "Internshala":
        return "bg-emerald-600 text-white";
      case "LinkedIn":
        return "bg-[#0A66C2] text-white";
      case "Indeed":
        return "bg-indigo-600 text-white";
      default:
        return "bg-amber-600 text-white";
    }
  };

  const copyTemplateToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Toast Notification */}
      {syncSuccessToast && (
        <div className="fixed top-20 right-6 z-50 bg-[#12122B] text-white px-5 py-3 rounded-2xl shadow-2xl border border-emerald-500/40 flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 size={18} className="text-emerald-400" />
          <span className="text-sm font-medium">{syncSuccessToast}</span>
        </div>
      )}

      {/* Header Station 10 Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#12122B] via-[#1A1A3A] to-[#25254B] p-6 md:p-8 text-white shadow-xl border border-white/10">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[#4F46E5]/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-[#14B8A6]/20 blur-3xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-data font-bold tracking-wider uppercase text-[#F5A623]">
              <Sparkles size={13} className="text-[#F5A623]" />
              STATION 10 • APPLICATION TRACKER
            </div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-display font-extrabold tracking-tight">
              Unified Automated Hiring Radar
            </h1>
            <p className="text-gray-300 text-sm md:text-base max-w-2xl">
              Connect Gmail once to automatically scan, track, and manage all your job applications across Naukri, Internshala, LinkedIn, and Indeed in real-time.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* If Gmail is connected, show email badge & resync; else show Connect button */}
            {isGmailConnected && connectedEmail ? (
              <div className="flex flex-wrap items-center gap-2">
                <div className="px-3.5 py-2 rounded-xl bg-white/10 border border-white/20 text-xs font-data flex items-center gap-2 text-white shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-gray-300">Connected:</span>
                  <b className="text-white truncate max-w-[140px] sm:max-w-[200px]">{connectedEmail}</b>
                </div>
                <button
                  onClick={handleConnectGoogleOAuth}
                  disabled={syncing}
                  title="Rescan real inbox"
                  className="px-3 py-2 rounded-xl bg-white text-[#12122B] hover:bg-gray-100 font-display font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
                >
                  <RefreshCw size={13} className={syncing ? "animate-spin text-[#4F46E5]" : "text-[#4F46E5]"} />
                  <span>{syncing ? "Scanning..." : "Resync Inbox"}</span>
                </button>
                <button
                  onClick={handleDisconnectEmail}
                  title="Disconnect email"
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-colors"
                >
                  <LogOut size={14} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowConnectModal(true)}
                className="px-4 py-2.5 rounded-xl bg-white text-[#12122B] hover:bg-gray-100 font-display font-bold text-sm shadow-md transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.87c2.26-2.09 3.675-5.17 3.675-9.15z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.87-3.05c-1.08.72-2.45 1.16-4.06 1.16-3.13 0-5.78-2.11-6.73-4.96H1.25v3.15C3.25 21.36 7.34 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.27 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.25C.45 8.24 0 10.06 0 12s.45 3.76 1.25 5.39l4.02-3.15z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.25 2.64 1.25 6.61l4.02 3.15c.95-2.85 3.6-4.96 6.73-4.96z"/>
                </svg>
                Connect Real Gmail
              </button>
            )}

            {/* Parse Job Email Button */}
            <button
              onClick={() => setShowPasteModal(true)}
              className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-display font-semibold text-xs border border-white/20 shadow-xs transition-all flex items-center gap-1.5 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Mail size={14} className="text-[#38BDF8]" />
              <span>Parse Job Email</span>
            </button>

            {/* Manual Add Button */}
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2.5 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white font-display font-bold text-sm shadow-md transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus size={16} />
              Add Application
            </button>
          </div>
        </div>

        {/* Sync Status Sub-strip */}
        <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs font-data text-gray-300">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Gmail Realtime Parser: <b className="text-white">Active</b> (Naukri, Internshala, LinkedIn, Indeed)</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Tracking: <b className="text-white">{applications.length} Applications (Past 30 Days)</b></span>
            <span>Upcoming Interviews: <b className="text-[#F5A623]">{analytics.funnel.interviews} Scheduled</b></span>
          </div>
        </div>
      </div>

      {/* SECTION 1: FUNNEL GAUGES (Visual) */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-200/80 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-data font-bold uppercase tracking-wider text-[#4F46E5] bg-[#4F46E5]/10 px-2.5 py-0.5 rounded-md">
                SECTION 01
              </span>
              <h2 className="text-xl font-display font-bold text-[#12122B]">
                Your Application Funnel
              </h2>
            </div>
            <p className="text-xs text-[#6B7280] font-data mt-1">
              Visual pipeline showing volume progression and conversion velocity across each stage
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-data text-[#6B7280]">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#3B82F6]" /> Applied
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#8B5CF6] ml-2" /> Shortlisted
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#F5A623] ml-2" /> Interview
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#10B981] ml-2" /> Offer
          </div>
        </div>

        {/* 4 Stage Visual Funnel Gauges Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Applied Gauge */}
          <div className="relative p-5 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-data font-bold text-blue-900 uppercase">Stage 01</span>
              <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600">
                <Send size={16} />
              </span>
            </div>
            <div className="my-3">
              <div className="text-3xl font-display font-extrabold text-[#12122B]">
                {analytics.funnel.applied}
              </div>
              <div className="text-xs font-medium text-blue-900">Total Applied</div>
            </div>
            <div className="w-full bg-blue-200/80 rounded-full h-2 overflow-hidden">
              <div className="bg-blue-600 h-full rounded-full w-full" />
            </div>
            <div className="mt-2 text-[11px] font-data text-blue-700">
              100% Top of Funnel
            </div>
          </div>

          {/* 2. Shortlisted Gauge */}
          <div className="relative p-5 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-data font-bold text-purple-900 uppercase">Stage 02</span>
              <span className="px-2 py-0.5 rounded-full bg-purple-600 text-white text-[11px] font-data font-bold">
                {analytics.funnel.conversion_rates.applied_to_shortlist}% Conv
              </span>
            </div>
            <div className="my-3">
              <div className="text-3xl font-display font-extrabold text-[#12122B]">
                {analytics.funnel.shortlisted}
              </div>
              <div className="text-xs font-medium text-purple-900">Shortlisted Profiles</div>
            </div>
            <div className="w-full bg-purple-200/80 rounded-full h-2 overflow-hidden">
              <div
                className="bg-purple-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, analytics.funnel.conversion_rates.applied_to_shortlist)}%` }}
              />
            </div>
            <div className="mt-2 text-[11px] font-data text-purple-700">
              {analytics.funnel.shortlisted} of {analytics.funnel.applied} passed ATS screening
            </div>
          </div>

          {/* 3. Interviews Gauge */}
          <div className="relative p-5 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-300 shadow-xs flex flex-col justify-between ring-2 ring-amber-400/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-data font-bold text-amber-900 uppercase">Stage 03</span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[11px] font-data font-bold">
                {analytics.funnel.conversion_rates.shortlist_to_interview}% Conv
              </span>
            </div>
            <div className="my-3">
              <div className="text-3xl font-display font-extrabold text-[#12122B]">
                {analytics.funnel.interviews}
              </div>
              <div className="text-xs font-medium text-amber-900">Technical Interviews</div>
            </div>
            <div className="w-full bg-amber-200/80 rounded-full h-2 overflow-hidden">
              <div
                className="bg-amber-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, analytics.funnel.conversion_rates.shortlist_to_interview)}%` }}
              />
            </div>
            <div className="mt-2 text-[11px] font-data text-amber-800 font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              Round 2 Amazon & Razorpay active
            </div>
          </div>

          {/* 4. Offers Gauge */}
          <div className="relative p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-data font-bold text-emerald-900 uppercase">Stage 04</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[11px] font-data font-bold">
                Goal: 1st Offer
              </span>
            </div>
            <div className="my-3">
              <div className="text-3xl font-display font-extrabold text-[#12122B]">
                {analytics.funnel.offers}
              </div>
              <div className="text-xs font-medium text-emerald-900">Job Offers Extended</div>
            </div>
            <div className="w-full bg-emerald-200/80 rounded-full h-2 overflow-hidden">
              <div
                className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${analytics.funnel.offers > 0 ? 100 : 8}%` }}
              />
            </div>
            <div className="mt-2 text-[11px] font-data text-emerald-700">
              Clear upcoming rounds to convert
            </div>
          </div>
        </div>

        {/* Funnel Conversion Bar Track */}
        <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs font-data mb-2 text-[#6B7280]">
            <span className="font-bold text-[#12122B]">End-to-End Pipeline Conversion Flow</span>
            <span>Applied (30) → Shortlisted (6) → Interviews (2) → Offers (0)</span>
          </div>
          <div className="w-full h-3 rounded-full bg-gray-200 flex overflow-hidden">
            <div style={{ width: "65%" }} className="bg-blue-500" title="Applied (30)" />
            <div style={{ width: "20%" }} className="bg-purple-500" title="Shortlisted (6)" />
            <div style={{ width: "15%" }} className="bg-amber-500" title="Interviews (2)" />
          </div>
        </div>
      </div>

      {/* SECTION 2: ACTIONABLE RECOMMENDATIONS (3 Cards) */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-data font-bold uppercase tracking-wider text-[#4F46E5] bg-[#4F46E5]/10 px-2.5 py-0.5 rounded-md">
            SECTION 02
          </span>
          <h2 className="text-xl font-display font-bold text-[#12122B]">
            Actionable Recommendations (AI-Generated)
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Follow Up (5 companies) */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200/80 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-data font-bold flex items-center gap-1.5">
                  <Clock size={13} />
                  Follow Up ({recommendations.follow_up.length} companies)
                </span>
                <span className="text-xs font-data text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded-md">
                  Action Today
                </span>
              </div>
              <h3 className="font-display font-bold text-lg text-[#12122B]">
                "Follow up with TCS (applied 8 days ago)"
              </h3>
              <p className="text-xs text-[#6B7280] leading-relaxed">
                Candidate applications under review for &gt;7 days have an 80% higher interview callback rate when followed up with a polite professional note.
              </p>

              <div className="space-y-2 pt-2 border-t border-gray-100">
                {recommendations.follow_up.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-[#12122B]">{item.company}</p>
                      <p className="text-[11px] text-[#6B7280]">Applied {item.days_ago} days ago</p>
                    </div>
                    <button
                      onClick={() =>
                        setEmailModalData({
                          company: item.company,
                          role: item.role,
                          template: item.email_template,
                        })
                      }
                      className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-[11px] transition-colors"
                    >
                      Email Template
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                if (recommendations.follow_up.length > 0) {
                  setEmailModalData({
                    company: recommendations.follow_up[0].company,
                    role: recommendations.follow_up[0].role,
                    template: recommendations.follow_up[0].email_template,
                  });
                }
              }}
              className="mt-5 w-full py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-display font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <Mail size={14} /> Send Follow-up Email
            </button>
          </div>

          {/* Card 2: Interview Prep (2 companies) */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-amber-300 ring-2 ring-amber-400/20 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-data font-bold flex items-center gap-1.5">
                  <Calendar size={13} />
                  Interview Prep ({recommendations.interview_prep.length} companies)
                </span>
                <span className="text-xs font-data text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-md animate-pulse">
                  Urgent Priority
                </span>
              </div>
              <h3 className="font-display font-bold text-lg text-[#12122B]">
                "Interview in 4 days: Amazon Round 2 - PREPARE NOW"
              </h3>
              <p className="text-xs text-[#6B7280] leading-relaxed">
                Technical Round 2 scheduled for <b>Oct 1</b> on Amazon Chime. Focus on System Design fundamentals & core DSA traversals.
              </p>

              <div className="space-y-2 pt-2 border-t border-gray-100">
                {recommendations.interview_prep.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/60 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-amber-950">{item.company}</p>
                      <p className="text-[11px] text-amber-800">
                        {item.scheduled_date} ({item.days_remaining} days left)
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        setPrepModalData({
                          company: item.company,
                          role: item.role,
                          date: item.scheduled_date,
                          topics: item.topics,
                        })
                      }
                      className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium text-[11px] transition-colors"
                    >
                      Prep Guide
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <Link
              to="/assessment"
              className="mt-5 w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-display font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
            >
              <Award size={14} /> Launch Mock Interview Prep
            </Link>
          </div>

          {/* Card 3: Resume Improve (3 companies) */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200/80 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-data font-bold flex items-center gap-1.5">
                  <FileText size={13} />
                  Resume Improve ({recommendations.resume_improve.length} companies)
                </span>
                <span className="text-xs font-data text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded-md">
                  ATS Match
                </span>
              </div>
              <h3 className="font-display font-bold text-lg text-[#12122B]">
                "Improve resume for Microsoft (match: 65%)"
              </h3>
              <p className="text-xs text-[#6B7280] leading-relaxed">
                Roles at Microsoft and TCS currently score below the 75% interview threshold. Adding Cloud/Kubernetes raises confidence.
              </p>

              <div className="space-y-2 pt-2 border-t border-gray-100">
                {recommendations.resume_improve.slice(0, 2).map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-xl bg-purple-50/70 border border-purple-100 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-[#12122B]">{item.company}</p>
                      <p className="text-[11px] text-purple-700 font-medium">Match: {item.match_percent}%</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {item.missing_signals.slice(0, 1).map((s, idx) => (
                        <span key={idx} className="text-[10px] bg-white px-1.5 py-0.5 rounded border border-purple-200 text-purple-800">
                          +{s}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Link
              to="/skill-gap"
              className="mt-5 w-full py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-display font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <Sparkles size={14} /> Optimize Resume in Station 04 / 09
            </Link>
          </div>
        </div>
      </div>

      {/* SECTION 3: ANALYTICS CHARTS (Visual) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Platform Breakdown Pie / Donut Chart (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 md:p-7 shadow-sm border border-gray-200/80 space-y-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-data font-bold uppercase tracking-wider text-[#4F46E5] bg-[#4F46E5]/10 px-2.5 py-0.5 rounded-md">
                SECTION 03A
              </span>
              <h3 className="font-display font-bold text-lg text-[#12122B]">
                Applications By Platform
              </h3>
            </div>
            <p className="text-xs text-[#6B7280] font-data mt-1">
              Distribution across Naukri, Internshala, and LinkedIn
            </p>
          </div>

          {/* Donut Chart SVG Visual */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-2">
            <div className="relative w-44 h-44 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* Background Ring */}
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#E5E7EB" strokeWidth="14" />
                {/* Naukri Segment (12 / 30 = 40%) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#3B82F6"
                  strokeWidth="14"
                  strokeDasharray="95.5 238.8"
                  strokeDashoffset="0"
                />
                {/* Internshala Segment (10 / 30 = 33.3%) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#10B981"
                  strokeWidth="14"
                  strokeDasharray="79.6 238.8"
                  strokeDashoffset="-95.5"
                />
                {/* LinkedIn Segment (8 / 30 = 26.7%) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#0A66C2"
                  strokeWidth="14"
                  strokeDasharray="63.7 238.8"
                  strokeDashoffset="-175.1"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-display font-extrabold text-[#12122B]">30</span>
                <span className="text-[10px] font-data text-[#6B7280] uppercase">Total Apps</span>
              </div>
            </div>

            {/* Platform Legend */}
            <div className="space-y-3 w-full sm:w-auto">
              <div className="flex items-center justify-between gap-4 text-xs font-medium">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#3B82F6]" />
                  <span>Naukri</span>
                </div>
                <span className="font-data font-bold text-[#12122B]">12 (40%)</span>
              </div>
              <div className="flex items-center justify-between gap-4 text-xs font-medium">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#10B981]" />
                  <span>Internshala</span>
                </div>
                <span className="font-data font-bold text-[#12122B]">10 (33%)</span>
              </div>
              <div className="flex items-center justify-between gap-4 text-xs font-medium">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#0A66C2]" />
                  <span>LinkedIn</span>
                </div>
                <span className="font-data font-bold text-[#12122B]">8 (27%)</span>
              </div>
              <div className="pt-2 border-t border-gray-100 text-[11px] font-data text-[#6B7280]">
                Indeed / Direct: 0 (Ready for sync)
              </div>
            </div>
          </div>
        </div>

        {/* Applications Over Time Line Chart (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 md:p-7 shadow-sm border border-gray-200/80 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-data font-bold uppercase tracking-wider text-[#4F46E5] bg-[#4F46E5]/10 px-2.5 py-0.5 rounded-md">
                  SECTION 03B
                </span>
                <h3 className="font-display font-bold text-lg text-[#12122B]">
                  Applications Over Time
                </h3>
              </div>
              <p className="text-xs text-[#6B7280] font-data mt-1">
                Weekly velocity of new applications submitted and milestone triggers
              </p>
            </div>
            <span className="text-xs font-data text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/60">
              +18.4% Momentum
            </span>
          </div>

          {/* Interactive Trend SVG Chart */}
          <div className="h-44 w-full relative pt-4">
            <svg className="w-full h-full" viewBox="0 0 400 120" preserveAspectRatio="none">
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#4F46E5" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {/* Grid Lines */}
              <line x1="0" y1="30" x2="400" y2="30" stroke="#F3F4F6" strokeDasharray="3 3" />
              <line x1="0" y1="70" x2="400" y2="70" stroke="#F3F4F6" strokeDasharray="3 3" />
              <line x1="0" y1="110" x2="400" y2="110" stroke="#E5E7EB" />

              {/* Area */}
              <path
                d="M 20 85 Q 100 65 160 55 T 280 30 T 380 60 L 380 110 L 20 110 Z"
                fill="url(#areaGradient)"
              />
              {/* Line */}
              <path
                d="M 20 85 Q 100 65 160 55 T 280 30 T 380 60"
                fill="transparent"
                stroke="#4F46E5"
                strokeWidth="3.5"
                strokeLinecap="round"
              />

              {/* Points */}
              <circle cx="20" cy="85" r="4.5" fill="#4F46E5" stroke="#ffffff" strokeWidth="2" />
              <circle cx="140" cy="60" r="4.5" fill="#4F46E5" stroke="#ffffff" strokeWidth="2" />
              <circle cx="260" cy="35" r="5" fill="#F5A623" stroke="#ffffff" strokeWidth="2" />
              <circle cx="380" cy="60" r="4.5" fill="#14B8A6" stroke="#ffffff" strokeWidth="2" />
            </svg>

            {/* X-axis labels */}
            <div className="flex justify-between text-[11px] font-data text-[#6B7280] pt-2 px-2">
              <span>Week 1 (6 apps)</span>
              <span>Week 2 (8 apps)</span>
              <span className="text-[#F5A623] font-bold">Week 3 (10 apps • Amazon Round 1)</span>
              <span>Week 4 (6 apps • Round 2)</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 4: APPLICATION LIST (Table & Filtering) */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-200/80 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-data font-bold uppercase tracking-wider text-[#4F46E5] bg-[#4F46E5]/10 px-2.5 py-0.5 rounded-md">
                SECTION 04
              </span>
              <h2 className="text-xl font-display font-bold text-[#12122B]">
                All Tracked Applications ({filteredApplications.length})
              </h2>
            </div>
            <p className="text-xs text-[#6B7280] font-data mt-1">
              Filter by status, search by role or company, and manually update records
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-72">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search company or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-100">
          {/* Status Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: "all", label: "All", count: applications.length },
              { id: "applied", label: "Applied", count: analytics.funnel.applied - analytics.funnel.shortlisted },
              { id: "shortlisted", label: "Shortlisted", count: analytics.funnel.shortlisted - analytics.funnel.interviews },
              { id: "interview", label: "Interviews", count: analytics.funnel.interviews },
              { id: "offer", label: "Offers", count: analytics.funnel.offers },
              { id: "rejected", label: "Rejected", count: analytics.funnel.rejected },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  statusFilter === tab.id
                    ? "bg-[#12122B] text-white shadow-xs font-bold"
                    : "bg-gray-100 text-[#6B7280] hover:bg-gray-200"
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          {/* Platform and Sort Dropdowns */}
          <div className="flex items-center gap-2">
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-[#12122B] focus:outline-none"
            >
              <option value="all">All Platforms</option>
              <option value="Naukri">Naukri (12)</option>
              <option value="Internshala">Internshala (10)</option>
              <option value="LinkedIn">LinkedIn (8)</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-[#12122B] focus:outline-none"
            >
              <option value="date_desc">Applied (Newest)</option>
              <option value="date_asc">Applied (Oldest)</option>
              <option value="company_asc">Company (A-Z)</option>
              <option value="match_desc">ATS Match %</option>
            </select>
          </div>
        </div>

        {/* Applications Table / Cards */}
        {loading ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-10 h-10 border-4 border-[#4F46E5]/20 border-t-[#4F46E5] rounded-full animate-spin mx-auto" />
            <p className="text-xs font-data text-[#6B7280]">Scanning synced applications...</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="py-16 text-center space-y-4 bg-gray-50/80 rounded-2xl border border-dashed border-gray-200 p-6">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#4F46E5] mx-auto">
              <Inbox size={28} />
            </div>
            <div className="space-y-1">
              <p className="font-display font-bold text-base text-[#12122B]">
                {isGmailConnected && connectedEmail
                  ? `No job applications found in the past 30 days for ${connectedEmail}`
                  : "No applications found in the past 30 days"}
              </p>
              <p className="text-xs text-[#6B7280] max-w-md mx-auto">
                CareerVerse AI is listening for notification emails from <b>Naukri, Internshala, LinkedIn, Indeed</b>, and company portals. As new job emails arrive, your live radar will update automatically.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setShowPasteModal(true)}
                className="px-4 py-2.5 bg-[#4F46E5] text-white rounded-xl text-xs font-bold font-display shadow-md hover:bg-[#4338CA] transition-colors flex items-center gap-1.5"
              >
                <Mail size={14} />
                Paste &amp; Parse an Email Now
              </button>
              <button
                onClick={() => {
                  setApplications(DEFAULT_30_APPLICATIONS);
                  localStorage.setItem(`careerverse_applications_${uid}`, JSON.stringify(DEFAULT_30_APPLICATIONS));
                  setSyncSuccessToast("Loaded 30 benchmark applications for exploration.");
                }}
                className="px-4 py-2.5 bg-white border border-gray-200 text-[#12122B] rounded-xl text-xs font-semibold hover:bg-gray-100 transition-colors shadow-xs"
              >
                Explore 30 Sample Benchmarks (Demo)
              </button>
            </div>
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="py-16 text-center space-y-3 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <Inbox size={32} className="mx-auto text-gray-400" />
            <p className="font-display font-bold text-sm text-[#12122B]">No applications match your filter</p>
            <p className="text-xs text-[#6B7280]">Try clearing search or filters</p>
            <button
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
                setPlatformFilter("all");
              }}
              className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium text-[#4F46E5]"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-[11px] font-data uppercase tracking-wider text-[#6B7280]">
                  <th className="py-3 px-3">Company & Role</th>
                  <th className="py-3 px-3">Platform</th>
                  <th className="py-3 px-3">Applied Date</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">ATS Match</th>
                  <th className="py-3 px-3 text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredApplications.map((app) => (
                  <tr
                    key={app.id}
                    className="hover:bg-gray-50/70 transition-colors group cursor-pointer"
                    onClick={() => setSelectedApp(app)}
                  >
                    {/* Company & Role */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gray-100 border border-gray-200/80 flex items-center justify-center font-display font-extrabold text-[#12122B] text-xs">
                          {app.company.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-display font-bold text-[#12122B] group-hover:text-[#4F46E5] transition-colors">
                            {app.company}
                          </p>
                          <p className="text-xs text-[#6B7280] font-medium">{app.role}</p>
                          {app.interview_date && (
                            <span className="inline-flex items-center gap-1 mt-0.5 text-[10px] font-data font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                              <Calendar size={11} /> Interview: {app.interview_date}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Platform */}
                    <td className="py-3.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-data font-bold ${getPlatformBadge(app.platform)}`}>
                        {app.platform}
                      </span>
                    </td>

                    {/* Applied Date */}
                    <td className="py-3.5 px-3 text-xs font-data text-[#6B7280]">
                      <div>{app.applied_date}</div>
                      {app.applied_days_ago !== undefined && (
                        <div className="text-[10px] text-gray-400">{app.applied_days_ago} days ago</div>
                      )}
                    </td>

                    {/* Status Dropdown */}
                    <td className="py-3.5 px-3" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={app.status}
                        onChange={(e) => handleStatusChange(app.id, e.target.value as ApplicationStatus)}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full border transition-colors cursor-pointer ${getStatusColor(
                          app.status
                        )}`}
                      >
                        <option value="applied">Applied</option>
                        <option value="shortlisted">Shortlisted</option>
                        <option value="interview">Interview</option>
                        <option value="offer">Offer</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </td>

                    {/* ATS Match */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-12 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              (app.resume_match_percent || 70) >= 80
                                ? "bg-emerald-500"
                                : (app.resume_match_percent || 70) >= 70
                                ? "bg-blue-500"
                                : "bg-purple-500"
                            }`}
                            style={{ width: `${app.resume_match_percent || 70}%` }}
                          />
                        </div>
                        <span className="text-xs font-data font-bold text-[#12122B]">
                          {app.resume_match_percent || 75}%
                        </span>
                      </div>
                    </td>

                    {/* Quick Action */}
                    <td className="py-3.5 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setSelectedApp(app)}
                        className="px-2.5 py-1 text-xs text-[#4F46E5] hover:bg-[#4F46E5]/10 rounded-lg font-medium transition-colors"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 0: First-Time Onboarding Pop-up */}
      {showFirstTimeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#12122B] text-white rounded-3xl max-w-lg w-full p-6 md:p-8 space-y-5 shadow-2xl border border-white/10 relative overflow-hidden max-h-[95vh] overflow-y-auto">
            {/* Glow Highlights */}
            <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-[#4F46E5]/30 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-[#14B8A6]/30 blur-3xl" />

            <div className="relative z-10 flex items-center justify-between">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F5A623]/20 border border-[#F5A623]/40 text-xs font-data font-bold uppercase tracking-wider text-[#F5A623]">
                <Sparkles size={14} className="text-[#F5A623]" />
                STATION 10 • ONE-CLICK AUTO TRACKER
              </div>
              <button
                onClick={() => {
                  setShowFirstTimeModal(false);
                  localStorage.setItem(`careerverse_tracker_onboarded_${uid}`, "true");
                }}
                className="text-gray-400 hover:text-white p-1 rounded-lg transition-colors"
                title="Dismiss"
              >
                <X size={20} />
              </button>
            </div>

            <div className="relative z-10 space-y-2.5">
              <h2 className="text-2xl sm:text-3xl font-display font-extrabold tracking-tight text-white leading-tight">
                Got messed up with multiple job applications across different platforms?
              </h2>
              <p className="text-sm text-gray-300 leading-relaxed font-body">
                Applied to 30+ jobs across <b>Naukri, Internshala, LinkedIn, and Indeed</b> and lost track of who shortlisted you or when your interviews are?
              </p>
              <p className="text-xs text-gray-400 leading-relaxed">
                Connect your email once. CareerVerse AI will automatically scan and parse your incoming job notifications, detect interview dates, and build your live hiring radar with <b>zero manual Excel tracking</b>.
              </p>
            </div>

            {/* Error & Firebase Resolution Guide */}
            {authError && (
              <div className="relative z-10 p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-xs text-rose-200 space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle size={18} className="shrink-0 text-rose-400 mt-0.5" />
                  <div>
                    <p className="font-bold text-white text-sm">Google Sign-In is not enabled yet in your Firebase Console</p>
                    <p className="text-gray-300 mt-0.5 leading-relaxed">
                      Firebase project <span className="font-mono text-amber-300 bg-black/40 px-1.5 py-0.5 rounded">careerverse-ai-21c80</span> requires Google authentication to be turned on.
                    </p>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-black/30 border border-white/5 space-y-1.5 text-[11px] text-gray-300">
                  <p className="font-semibold text-white">How to enable 1-Click Google OAuth in 30 seconds:</p>
                  <ol className="list-decimal list-inside space-y-1 text-gray-300">
                    <li>Go to Firebase Console &gt; Authentication &gt; Sign-in method</li>
                    <li>Click <b>Google</b> &rarr; toggle <b>Enable</b> &rarr; choose Support Email &rarr; click <b>Save</b></li>
                  </ol>
                  <div className="pt-2">
                    <a
                      href="https://console.firebase.google.com/project/careerverse-ai-21c80/authentication/providers"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-gray-900 font-bold font-display text-xs transition-colors"
                    >
                      Open Firebase Console (Sign-in Providers)
                      <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* DIRECT OPTION 1: Connect Candidate Email Directly (No Firebase OAuth toggle needed) */}
            <div className="relative z-10 p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Mail size={14} className="text-[#38BDF8]" />
                  Option 1: Connect Your Email Directly
                </span>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-semibold">
                  Instant • No Setup
                </span>
              </div>
              <p className="text-xs text-gray-300">
                Enter your Gmail or student mail address where you receive job applications:
              </p>
              <form onSubmit={handleConnectDirectEmail} className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  required
                  value={directEmailInput}
                  onChange={(e) => setDirectEmailInput(e.target.value)}
                  placeholder="e.g. mahesh@gmail.com"
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white text-xs placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
                />
                <button
                  type="submit"
                  disabled={syncing}
                  className="px-4 py-2.5 rounded-xl bg-[#38BDF8] hover:bg-[#0EA5E9] text-gray-900 font-display font-bold text-xs shrink-0 transition-colors shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {syncing ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      Connect &amp; Track &rarr;
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Divider */}
            <div className="relative z-10 flex items-center gap-3">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-[10px] text-gray-400 uppercase font-data font-bold tracking-wider">
                Or With Google OAuth
              </span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* OPTION 2: Google OAuth Popup */}
            <div className="relative z-10 space-y-2.5">
              <button
                onClick={handleConnectGoogleOAuth}
                disabled={syncing}
                className="w-full py-3.5 px-6 rounded-2xl bg-white text-[#12122B] hover:bg-gray-100 font-display font-bold text-sm shadow-xl flex items-center justify-center gap-3 transition-all transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              >
                {syncing ? (
                  <>
                    <RefreshCw size={18} className="animate-spin text-[#4F46E5]" />
                    Connecting &amp; Scanning Gmail...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.87c2.26-2.09 3.675-5.17 3.675-9.15z"/>
                      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.87-3.05c-1.08.72-2.45 1.16-4.06 1.16-3.13 0-5.78-2.11-6.73-4.96H1.25v3.15C3.25 21.36 7.34 24 12 24z"/>
                      <path fill="#FBBC05" d="M5.27 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.25C.45 8.24 0 10.06 0 12s.45 3.76 1.25 5.39l4.02-3.15z"/>
                      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.25 2.64 1.25 6.61l4.02 3.15c.95-2.85 3.6-4.96 6.73-4.96z"/>
                    </svg>
                    <span>Connect with Google Account (1-Click)</span>
                  </>
                )}
              </button>

              <button
                onClick={handleExploreWithDemo}
                className="w-full py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 text-gray-200 font-display font-medium text-xs border border-white/10 transition-colors"
              >
                Preview with 30 Sample Applications First →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: Connect Real Gmail / Sync Settings Modal */}
      {showConnectModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 md:p-8 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowConnectModal(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                <Mail size={24} />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-[#12122B]">
                  Connect Candidate Gmail
                </h3>
                <p className="text-xs text-[#6B7280]">
                  {isGmailConnected && connectedEmail ? `Currently linked to: ${connectedEmail}` : "Real-time automated status parsing"}
                </p>
              </div>
            </div>

            {authError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-2">
                <div className="flex items-start gap-2">
                  <AlertTriangle size={15} className="shrink-0 text-rose-500 mt-0.5" />
                  <span>{authError}</span>
                </div>
                <div className="pt-1">
                  <a
                    href="https://console.firebase.google.com/project/careerverse-ai-21c80/authentication/providers"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 hover:underline"
                  >
                    Open Firebase Console to enable Google provider <ExternalLink size={11} />
                  </a>
                </div>
              </div>
            )}

            {/* Direct Email Connect Box */}
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-2.5">
              <label className="block text-xs font-bold text-[#12122B]">
                Connect with Your Email Address Directly:
              </label>
              <form onSubmit={handleConnectDirectEmail} className="flex gap-2">
                <input
                  type="email"
                  required
                  value={directEmailInput}
                  onChange={(e) => setDirectEmailInput(e.target.value)}
                  placeholder="e.g. yourname@gmail.com"
                  className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                />
                <button
                  type="submit"
                  disabled={syncing}
                  className="px-3.5 py-2 bg-[#12122B] hover:bg-[#25254B] text-white rounded-xl text-xs font-bold font-display shrink-0 transition-colors"
                >
                  Save &amp; Link
                </button>
              </form>
            </div>

            <div className="space-y-3 text-xs text-[#6B7280] leading-relaxed bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <p className="font-semibold text-[#12122B]">How CareerVerse Gmail Sync works:</p>
              <ul className="space-y-1.5 list-disc list-inside">
                <li>Queries notifications from <b>Naukri, Internshala, LinkedIn, and Indeed</b>.</li>
                <li>Extracts company, role, status updates, and interview dates automatically.</li>
                <li>Read-only permissions: CareerVerse cannot compose, modify, or delete your emails.</li>
              </ul>
            </div>

            <div className="space-y-2.5 pt-2">
              {/* Google OAuth Button */}
              <button
                onClick={handleConnectGoogleOAuth}
                disabled={syncing}
                className="w-full py-3 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white font-display font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2.5 cursor-pointer"
              >
                {syncing ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    Connecting &amp; Scanning Inbox...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.87c2.26-2.09 3.675-5.17 3.675-9.15z"/>
                      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.87-3.05c-1.08.72-2.45 1.16-4.06 1.16-3.13 0-5.78-2.11-6.73-4.96H1.25v3.15C3.25 21.36 7.34 24 12 24z"/>
                      <path fill="#FBBC05" d="M5.27 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.25C.45 8.24 0 10.06 0 12s.45 3.76 1.25 5.39l4.02-3.15z"/>
                      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.25 2.64 1.25 6.61l4.02 3.15c.95-2.85 3.6-4.96 6.73-4.96z"/>
                    </svg>
                    <span>{isGmailConnected ? "Reconnect / Change Google Account" : "Authorize with Google Account"}</span>
                  </>
                )}
              </button>

              {/* Demo fallback sync */}
              <button
                onClick={handleSyncInbox}
                disabled={syncing}
                className="w-full py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-display font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <RefreshCw size={13} />
                Load 30 Curated Benchmark Applications
              </button>

              <button
                onClick={() => setShowConnectModal(false)}
                className="w-full py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-[#12122B] text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1.5: Live AI Email Parser Modal */}
      {showPasteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowPasteModal(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-[#4F46E5]">
                <Mail size={24} />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-[#12122B]">
                  Live AI Email Parser
                </h3>
                <p className="text-xs text-[#6B7280]">
                  Paste any job notification email to test real-time parsing
                </p>
              </div>
            </div>

            <form onSubmit={handleParseCustomEmail} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#12122B] mb-1">
                  Sender (Job Portal or Recruiter)
                </label>
                <select
                  value={pasteSender}
                  onChange={(e) => setPasteSender(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-medium"
                >
                  <option value="jobs-noreply@linkedin.com">LinkedIn (jobs-noreply@linkedin.com)</option>
                  <option value="naukri@notification.naukri.com">Naukri (naukri@notification.naukri.com)</option>
                  <option value="internshala@internshala.com">Internshala (internshala@internshala.com)</option>
                  <option value="jobs@indeed.com">Indeed (jobs@indeed.com)</option>
                  <option value="careers@company.com">Direct Career Portal (careers@company.com)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#12122B] mb-1">
                  Email Subject Line
                </label>
                <input
                  type="text"
                  required
                  value={pasteSubject}
                  onChange={(e) => setPasteSubject(e.target.value)}
                  placeholder="e.g. Your application for SDE-1 at Amazon has been shortlisted"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#12122B] mb-1">
                  Email Body / Notification Snippet
                </label>
                <textarea
                  rows={4}
                  required
                  value={pasteBody}
                  onChange={(e) => setPasteBody(e.target.value)}
                  placeholder="Paste the email content received from the recruiter or portal..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-mono"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isParsingEmail}
                  className="flex-1 py-2.5 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white font-display font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-2"
                >
                  {isParsingEmail ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      Parsing with AI...
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} />
                      Parse &amp; Add to Radar
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPasteModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-[#12122B]"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Add Application Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600"
            >
              <X size={18} />
            </button>

            <div>
              <h3 className="font-display font-bold text-xl text-[#12122B]">
                Add Job Application Manually
              </h3>
              <p className="text-xs text-[#6B7280]">Track applications submitted off-platform or directly</p>
            </div>

            <form onSubmit={handleAddApplication} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#12122B] mb-1">Company Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Google, Zomato, TCS"
                  value={newCompany}
                  onChange={(e) => setNewCompany(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#12122B] mb-1">Job Role</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SDE-1, Backend Developer, Data Analyst"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#12122B] mb-1">Platform</label>
                  <select
                    value={newPlatform}
                    onChange={(e) => setNewPlatform(e.target.value as JobPlatform)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-medium"
                  >
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="Naukri">Naukri</option>
                    <option value="Internshala">Internshala</option>
                    <option value="Indeed">Indeed</option>
                    <option value="Direct">Direct Career Portal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#12122B] mb-1">Current Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as ApplicationStatus)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-medium"
                  >
                    <option value="applied">Applied</option>
                    <option value="shortlisted">Shortlisted</option>
                    <option value="interview">Interview Scheduled</option>
                    <option value="offer">Offer Extended</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#12122B] mb-1">Location</label>
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    placeholder="Bangalore / Remote"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#12122B] mb-1">Salary Range</label>
                  <input
                    type="text"
                    value={newSalary}
                    onChange={(e) => setNewSalary(e.target.value)}
                    placeholder="₹12-18 LPA"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#12122B] mb-1">Recruiter Notes / Reference ID</label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Application portal ID, referral contact name, or interview round notes..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5]"
                />
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white font-display font-bold text-xs shadow-md transition-colors"
                >
                  Save Application
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-[#12122B]"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Application Details Drawer */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedApp(null)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600"
            >
              <X size={18} />
            </button>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center font-display font-extrabold text-[#4F46E5] text-base">
                {selectedApp.company.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 className="font-display font-bold text-xl text-[#12122B]">
                  {selectedApp.company}
                </h3>
                <p className="text-xs font-medium text-[#6B7280]">{selectedApp.role}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-data font-bold ${getPlatformBadge(selectedApp.platform)}`}>
                    {selectedApp.platform}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusColor(selectedApp.status)}`}>
                    {selectedApp.status.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* Email Snippet */}
            {selectedApp.snippet && (
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-1.5">
                <div className="flex items-center gap-1.5 text-[11px] font-data font-bold uppercase text-[#6B7280]">
                  <Mail size={12} />
                  Parsed Email Notification
                </div>
                <p className="text-xs text-[#12122B] leading-relaxed italic">
                  "{selectedApp.snippet}"
                </p>
                {selectedApp.confidence && (
                  <p className="text-[10px] font-data text-emerald-600 font-semibold pt-1">
                    ✓ AI Status Confidence: {Math.round(selectedApp.confidence * 100)}%
                  </p>
                )}
              </div>
            )}

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs font-data">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-gray-400 uppercase text-[10px]">Applied Date</p>
                <p className="font-bold text-[#12122B] mt-0.5">{selectedApp.applied_date}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-gray-400 uppercase text-[10px]">Resume ATS Score</p>
                <p className="font-bold text-[#12122B] mt-0.5">{selectedApp.resume_match_percent || 75}% Match</p>
              </div>
              {selectedApp.interview_date && (
                <div className="col-span-2 p-3 bg-amber-50 rounded-xl border border-amber-200">
                  <p className="text-amber-800 uppercase text-[10px] font-bold">Upcoming Interview</p>
                  <p className="font-bold text-amber-950 mt-0.5">{selectedApp.interview_date}</p>
                  {selectedApp.interview_round && (
                    <p className="text-xs text-amber-900 mt-1">{selectedApp.interview_round}</p>
                  )}
                </div>
              )}
            </div>

            {/* Change Status */}
            <div>
              <label className="block text-xs font-semibold text-[#12122B] mb-1">Update Status</label>
              <select
                value={selectedApp.status}
                onChange={(e) => handleStatusChange(selectedApp.id, e.target.value as ApplicationStatus)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-medium"
              >
                <option value="applied">Applied</option>
                <option value="shortlisted">Shortlisted</option>
                <option value="interview">Interview Scheduled</option>
                <option value="offer">Offer Extended</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {/* Close */}
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setSelectedApp(null)}
                className="w-full py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-[#12122B]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Follow-up Email Template Generator */}
      {emailModalData && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setEmailModalData(null)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600"
            >
              <X size={18} />
            </button>

            <div>
              <span className="text-[11px] font-data font-bold text-blue-600 uppercase">
                Station 10 • Quick Action
              </span>
              <h3 className="font-display font-bold text-xl text-[#12122B]">
                Follow-up Email Template
              </h3>
              <p className="text-xs text-[#6B7280]">
                Tailored for {emailModalData.company} ({emailModalData.role})
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200">
              <pre className="text-xs text-[#12122B] font-mono whitespace-pre-wrap leading-relaxed">
                {emailModalData.template}
              </pre>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => copyTemplateToClipboard(emailModalData.template)}
                className="flex-1 py-2.5 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white font-display font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-2"
              >
                {copiedEmail ? (
                  <>
                    <Check size={14} className="text-emerald-300" />
                    Copied to Clipboard!
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    Copy Email Template
                  </>
                )}
              </button>
              <button
                onClick={() => setEmailModalData(null)}
                className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-[#12122B]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: Interview Prep Checklist */}
      {prepModalData && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setPrepModalData(null)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600"
            >
              <X size={18} />
            </button>

            <div>
              <span className="text-[11px] font-data font-bold text-amber-600 uppercase">
                Station 10 • Interview Intelligence
              </span>
              <h3 className="font-display font-bold text-xl text-[#12122B]">
                {prepModalData.company} Prep Checklist
              </h3>
              <p className="text-xs text-[#6B7280]">
                Scheduled for {prepModalData.date} • {prepModalData.role}
              </p>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-semibold text-[#12122B]">High-Signal Preparation Modules:</p>
              {prepModalData.topics.map((t, idx) => (
                <div key={idx} className="p-3 bg-amber-50/70 border border-amber-200/60 rounded-xl flex items-center gap-2.5 text-xs text-amber-950 font-medium">
                  <CheckCircle2 size={16} className="text-amber-600 shrink-0" />
                  <span>{t}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Link
                to="/assessment"
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-display font-bold text-xs text-center shadow-md transition-colors"
              >
                Launch Mock Practice (Station 06)
              </Link>
              <button
                onClick={() => setPrepModalData(null)}
                className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-[#12122B]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
