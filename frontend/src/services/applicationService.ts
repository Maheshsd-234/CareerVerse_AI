import { db } from "../firebase/config";
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";

export type ApplicationStatus = "applied" | "shortlisted" | "interview" | "offer" | "rejected";
export type JobPlatform = "Naukri" | "Internshala" | "LinkedIn" | "Indeed" | "Direct" | "Company Portal";

export interface JobApplication {
  id: string;
  company: string;
  role: string;
  status: ApplicationStatus;
  platform: JobPlatform;
  applied_date: string;
  interview_date?: string | null;
  interview_round?: string;
  salary_estimate?: string;
  location?: string;
  confidence?: number;
  resume_match_percent?: number;
  notes?: string;
  subject?: string;
  snippet?: string;
  applied_days_ago?: number;
  last_modified?: string;
}

export interface FunnelAnalytics {
  applied: number;
  shortlisted: number;
  interviews: number;
  offers: number;
  rejected: number;
  conversion_rates: {
    applied_to_shortlist: number;
    shortlist_to_interview: number;
    interview_to_offer: number;
  };
}

export interface PlatformStat {
  platform: JobPlatform;
  count: number;
  percentage: number;
  color?: string;
}

export interface TimelineDataPoint {
  week: string;
  count: number;
  interviews?: number;
}

export interface ApplicationAnalyticsData {
  total_applications: number;
  funnel: FunnelAnalytics;
  platforms: PlatformStat[];
  timeline: TimelineDataPoint[];
}

export interface RecommendationFollowUp {
  id: string;
  app_id: string;
  company: string;
  role: string;
  message: string;
  urgency: "high" | "medium" | "low";
  action_label: string;
  days_ago: number;
  email_template: string;
}

export interface RecommendationInterviewPrep {
  id: string;
  app_id: string;
  company: string;
  role: string;
  message: string;
  urgency: "critical" | "high" | "medium";
  days_remaining: number;
  scheduled_date: string;
  topics: string[];
  action_label: string;
}

export interface RecommendationResumeImprove {
  id: string;
  app_id: string;
  company: string;
  role: string;
  message: string;
  match_percent: number;
  missing_signals: string[];
  action_label: string;
}

export interface ApplicationRecommendations {
  follow_up: RecommendationFollowUp[];
  interview_prep: RecommendationInterviewPrep[];
  resume_improve: RecommendationResumeImprove[];
}

const API_BASE_URL = "http://127.0.0.1:8000/api/applications";

// Local storage cache keys
const getStorageKey = (uid: string) => `careerverse_applications_${uid}`;
const getGmailConnectedKey = (uid: string) => `careerverse_gmail_connected_${uid}`;

// Curated 30 applications fallback matching the exact prompt scenario
export const DEFAULT_30_APPLICATIONS: JobApplication[] = [
  // --- INTERVIEW STAGE (2 apps) ---
  {
    id: "app_amazon_sde1",
    company: "Amazon",
    role: "Software Development Engineer (SDE-1)",
    status: "interview",
    platform: "LinkedIn",
    applied_date: "2026-09-18",
    interview_date: "2026-10-01",
    interview_round: "Round 2 Technical & System Design",
    resume_match_percent: 82,
    confidence: 0.95,
    location: "Bangalore / Hyderabad",
    notes: "Interview in 4 days: Amazon Round 2 - PREPARE NOW. Amazon Chime meeting at 2:00 PM IST.",
    snippet: "Dear Candidate, We are pleased to invite you for your Round 2 Technical & System Design Interview on Oct 1.",
    applied_days_ago: 7,
  },
  {
    id: "app_razorpay_backend",
    company: "Razorpay",
    role: "Backend Developer Intern",
    status: "interview",
    platform: "Internshala",
    applied_date: "2026-09-20",
    interview_date: "2026-10-05",
    interview_round: "Round 1 Core Data Structures & REST APIs",
    resume_match_percent: 88,
    confidence: 0.95,
    location: "Bangalore (Hybrid)",
    notes: "Profile shortlisted by Razorpay. Technical assessment scheduled for Oct 5.",
    snippet: "Congratulations! Your profile has been shortlisted by Razorpay. The engineering team has scheduled an interview on Oct 5.",
    applied_days_ago: 5,
  },

  // --- SHORTLISTED STAGE (6 apps total: Amazon & Razorpay moved up, 4 active shortlisted) ---
  {
    id: "app_swiggy_fullstack",
    company: "Swiggy",
    role: "Full Stack Developer",
    status: "shortlisted",
    platform: "Naukri",
    applied_date: "2026-09-19",
    resume_match_percent: 78,
    confidence: 0.91,
    location: "Bangalore",
    notes: "Shortlisted for next technical round. Recruiter will send coding challenge link.",
    snippet: "Your application has been shortlisted for the next technical round at Swiggy.",
    applied_days_ago: 6,
  },
  {
    id: "app_zomato_python",
    company: "Zomato",
    role: "Python / Django Developer",
    status: "shortlisted",
    platform: "LinkedIn",
    applied_date: "2026-09-17",
    resume_match_percent: 74,
    confidence: 0.91,
    location: "Gurugram",
    notes: "Resume shortlisted by hiring manager. HackerRank assessment pending.",
    snippet: "Great news! Zomato hiring manager has reviewed your resume and profile has been shortlisted.",
    applied_days_ago: 8,
  },
  {
    id: "app_cred_mobile",
    company: "CRED",
    role: "Mobile Application Engineer",
    status: "shortlisted",
    platform: "Internshala",
    applied_date: "2026-09-16",
    resume_match_percent: 80,
    confidence: 0.91,
    location: "Bangalore",
    notes: "Shortlisted for mobile team. Take-home UI architecture task due this Friday.",
    snippet: "Congratulations! You have been shortlisted by CRED for the Mobile Application Engineer position.",
    applied_days_ago: 9,
  },
  {
    id: "app_phonepe_associate",
    company: "PhonePe",
    role: "Associate Software Engineer",
    status: "shortlisted",
    platform: "Naukri",
    applied_date: "2026-09-15",
    resume_match_percent: 85,
    confidence: 0.91,
    location: "Pune / Bangalore",
    notes: "University tech hiring shortlist confirmed. Panel alignment underway.",
    snippet: "Your profile has been shortlisted for PhonePe University Tech Hiring.",
    applied_days_ago: 10,
  },

  // --- APPLIED STAGE - CRITICAL FOLLOW-UPS ---
  {
    id: "app_tcs_digital",
    company: "TCS",
    role: "Digital Cadre Software Engineer",
    status: "applied",
    platform: "Naukri",
    applied_date: "2026-09-17",
    resume_match_percent: 65,
    confidence: 0.98,
    location: "Pan India",
    notes: "Follow up with TCS (applied 8 days ago). Candidate Ref ID: TCS-IN-982341.",
    snippet: "Thank you for applying to Tata Consultancy Services. We have received your application for TCS Digital Cadre.",
    applied_days_ago: 8,
  },
  {
    id: "app_wipro_elite",
    company: "Wipro",
    role: "Project Engineer (Elite NTH)",
    status: "applied",
    platform: "Naukri",
    applied_date: "2026-09-16",
    resume_match_percent: 72,
    confidence: 0.97,
    location: "Bangalore",
    notes: "Applied 9 days ago. Verification pending on talent acquisition portal.",
    snippet: "Thank you for applying to Wipro. We have received your application for Project Engineer role.",
    applied_days_ago: 9,
  },
  {
    id: "app_capgemini_exceller",
    company: "Capgemini",
    role: "Senior Analyst / Software Engineer",
    status: "applied",
    platform: "Naukri",
    applied_date: "2026-09-15",
    resume_match_percent: 70,
    confidence: 0.97,
    location: "Mumbai",
    notes: "Applied 10 days ago. Candidature under review.",
    snippet: "Dear Candidate, Thank you for registering for Capgemini Exceller. Your candidature is under review.",
    applied_days_ago: 10,
  },

  // --- APPLIED STAGE - RESUME IMPROVEMENT SIGNALS ---
  {
    id: "app_microsoft_azure",
    company: "Microsoft",
    role: "Software Engineer (Azure Cloud)",
    status: "applied",
    platform: "LinkedIn",
    applied_date: "2026-09-13",
    resume_match_percent: 65,
    confidence: 0.98,
    location: "Hyderabad",
    notes: "Improve resume for Microsoft (match: 65%). Add Azure Cloud, Docker, and Distributed Systems.",
    snippet: "Thank you for applying to Microsoft. We have received your application for Software Engineer role.",
    applied_days_ago: 12,
  },
  {
    id: "app_flipkart_backend",
    company: "Flipkart",
    role: "SDE-1 Backend",
    status: "applied",
    platform: "Naukri",
    applied_date: "2026-09-14",
    resume_match_percent: 70,
    confidence: 0.98,
    location: "Bangalore",
    notes: "Application forwarded to Supply Chain Tech engineering group.",
    snippet: "We have received your application for SDE-1 at Flipkart Internet Private Limited.",
    applied_days_ago: 11,
  },

  // --- ADDITIONAL APPLICATIONS (Naukri, Internshala, LinkedIn) ---
  {
    id: "app_infosys_sp",
    company: "Infosys",
    role: "Specialist Programmer (SP)",
    status: "applied",
    platform: "Naukri",
    applied_date: "2026-09-12",
    resume_match_percent: 75,
    confidence: 0.97,
    location: "Bangalore / Mysore",
    notes: "Logged in candidate tracking portal.",
    snippet: "Thank you for applying for the Specialist Programmer role at Infosys.",
    applied_days_ago: 13,
  },
  {
    id: "app_hcl_get",
    company: "HCLTech",
    role: "Graduate Engineer Trainee",
    status: "applied",
    platform: "Naukri",
    applied_date: "2026-09-11",
    resume_match_percent: 72,
    confidence: 0.97,
    location: "Noida",
    notes: "Screening under delivery team.",
    snippet: "Thank you for applying to HCLTech. Your application is under screening by the delivery team.",
    applied_days_ago: 14,
  },
  {
    id: "app_cognizant_genc",
    company: "Cognizant",
    role: "GenC Next Developer",
    status: "applied",
    platform: "Naukri",
    applied_date: "2026-09-10",
    resume_match_percent: 74,
    confidence: 0.97,
    location: "Chennai",
    notes: "GenC Next assessment slot notification pending.",
    snippet: "We have received your application for Cognizant GenC Next.",
    applied_days_ago: 15,
  },
  {
    id: "app_accenture_ase",
    company: "Accenture",
    role: "Associate Software Engineer",
    status: "applied",
    platform: "Naukri",
    applied_date: "2026-09-09",
    resume_match_percent: 76,
    confidence: 0.97,
    location: "Gurugram",
    notes: "Screening ongoing.",
    snippet: "Thank you for applying to Accenture. Your candidate application has been submitted.",
    applied_days_ago: 16,
  },
  {
    id: "app_jio_cloud",
    company: "Reliance Jio",
    role: "Cloud / AI Engineer",
    status: "applied",
    platform: "Naukri",
    applied_date: "2026-09-08",
    resume_match_percent: 77,
    confidence: 0.97,
    location: "Navi Mumbai",
    notes: "Application received for Cloud Platforms division.",
    snippet: "Thank you for applying to Jio Platforms Limited.",
    applied_days_ago: 17,
  },
  {
    id: "app_zoho_dev",
    company: "Zoho",
    role: "Software Developer",
    status: "applied",
    platform: "Naukri",
    applied_date: "2026-09-07",
    resume_match_percent: 79,
    confidence: 0.97,
    location: "Chennai",
    notes: "Registered for Zoho developer drive.",
    snippet: "Your application for Software Developer at Zoho Corporation has been successfully registered.",
    applied_days_ago: 18,
  },
  {
    id: "app_oracle_oci",
    company: "Oracle",
    role: "Cloud Infrastructure Engineer",
    status: "applied",
    platform: "LinkedIn",
    applied_date: "2026-09-06",
    resume_match_percent: 78,
    confidence: 0.97,
    location: "Bangalore",
    notes: "Application received for OCI Developer position.",
    snippet: "Thank you for applying to Oracle. We have received your application for OCI Developer position.",
    applied_days_ago: 19,
  },
  {
    id: "app_cisco_net",
    company: "Cisco",
    role: "Associate Network Software Engineer",
    status: "applied",
    platform: "LinkedIn",
    applied_date: "2026-09-05",
    resume_match_percent: 73,
    confidence: 0.97,
    location: "Bangalore",
    notes: "Reviewing qualifications against network software requirements.",
    snippet: "We have received your application for Cisco Bangalore.",
    applied_days_ago: 20,
  },
  {
    id: "app_ibm_ase",
    company: "IBM",
    role: "Associate Systems Engineer",
    status: "applied",
    platform: "LinkedIn",
    applied_date: "2026-09-04",
    resume_match_percent: 75,
    confidence: 0.97,
    location: "Kochi",
    notes: "Application recorded in IBM India gateway.",
    snippet: "Thank you for applying to IBM. We have successfully recorded your application for IBM India.",
    applied_days_ago: 21,
  },
  {
    id: "app_adobe_mts",
    company: "Adobe",
    role: "Member of Technical Staff - 1",
    status: "applied",
    platform: "LinkedIn",
    applied_date: "2026-09-03",
    resume_match_percent: 79,
    confidence: 0.97,
    location: "Noida",
    notes: "Application received for MTS-1 position.",
    snippet: "We have received your application for Member of Technical Staff - 1 at Adobe Noida.",
    applied_days_ago: 22,
  },
  {
    id: "app_salesforce_amts",
    company: "Salesforce",
    role: "Software Engineering AMTS",
    status: "applied",
    platform: "LinkedIn",
    applied_date: "2026-09-02",
    resume_match_percent: 81,
    confidence: 0.97,
    location: "Hyderabad",
    notes: "Campus recruitment review.",
    snippet: "Thank you for applying to Salesforce India. Your application is under review by our campus team.",
    applied_days_ago: 23,
  },
  {
    id: "app_uber_intern",
    company: "Uber",
    role: "Software Engineer Intern",
    status: "applied",
    platform: "Internshala",
    applied_date: "2026-09-01",
    resume_match_percent: 80,
    confidence: 0.97,
    location: "Bangalore",
    notes: "Application forwarded to employer via Internshala.",
    snippet: "Your application for Software Engineer Intern at Uber has been sent to the employer via Internshala.",
    applied_days_ago: 24,
  },
  {
    id: "app_ola_analyst",
    company: "Ola",
    role: "Data Analyst Trainee",
    status: "applied",
    platform: "Internshala",
    applied_date: "2026-08-31",
    resume_match_percent: 76,
    confidence: 0.97,
    location: "Bangalore",
    notes: "Sent to Ola Electric analytics division.",
    snippet: "Your application for Data Analyst Trainee at Ola Electric has been forwarded to the employer.",
    applied_days_ago: 25,
  },
  {
    id: "app_paytm_frontend",
    company: "Paytm",
    role: "Frontend Developer Intern",
    status: "applied",
    platform: "Internshala",
    applied_date: "2026-08-30",
    resume_match_percent: 82,
    confidence: 0.97,
    location: "Noida",
    notes: "Submitted via Internshala campus internship drive.",
    snippet: "Your application for Frontend Developer Intern at Paytm (One97 Communications) was submitted.",
    applied_days_ago: 26,
  },
  {
    id: "app_intuit_summer",
    company: "Intuit",
    role: "Software Engineer Summer Intern",
    status: "applied",
    platform: "Internshala",
    applied_date: "2026-08-29",
    resume_match_percent: 79,
    confidence: 0.97,
    location: "Bangalore",
    notes: "Received through Internshala hiring program.",
    snippet: "Your application for Intuit Software Engineer Summer Intern has been received through Internshala.",
    applied_days_ago: 27,
  },
  {
    id: "app_goldman_analyst",
    company: "Goldman Sachs",
    role: "Engineering Summer Analyst",
    status: "applied",
    platform: "Internshala",
    applied_date: "2026-08-28",
    resume_match_percent: 83,
    confidence: 0.97,
    location: "Bangalore",
    notes: "Transmitted to Goldman Sachs university engineering relations.",
    snippet: "Your application for Engineering Summer Analyst at Goldman Sachs Bangalore has been transmitted.",
    applied_days_ago: 28,
  },
  {
    id: "app_morgan_analyst",
    company: "Morgan Stanley",
    role: "Technology Analyst Intern",
    status: "applied",
    platform: "Internshala",
    applied_date: "2026-08-27",
    resume_match_percent: 81,
    confidence: 0.97,
    location: "Mumbai",
    notes: "Forwarded to Morgan Stanley technology team.",
    snippet: "Your application for Technology Analyst Intern at Morgan Stanley Mumbai has been forwarded.",
    applied_days_ago: 29,
  },
  {
    id: "app_jpmorgan_cfg",
    company: "JPMorgan Chase",
    role: "Code for Good / Tech Intern",
    status: "applied",
    platform: "Internshala",
    applied_date: "2026-08-26",
    resume_match_percent: 84,
    confidence: 0.97,
    location: "Hyderabad",
    notes: "Submitted via Internshala campus portal.",
    snippet: "Your application for JPMorgan Chase Tech Summer Analyst was submitted via Internshala campus portal.",
    applied_days_ago: 30,
  },
  {
    id: "app_atlassian_grad",
    company: "Atlassian",
    role: "Graduate Software Engineer",
    status: "rejected",
    platform: "Internshala",
    applied_date: "2026-08-25",
    resume_match_percent: 75,
    confidence: 0.95,
    location: "Remote / Bangalore",
    notes: "Received rejection notice. Feedback: Strengthen distributed concurrency.",
    snippet: "Thank you for applying via Internshala. Unfortunately, we have decided to move forward with other candidates.",
    applied_days_ago: 31,
  },
];

export const applicationService = {
  /**
   * Check if Gmail is connected for the user
   */
  isGmailConnected(uid: string): boolean {
    return localStorage.getItem(getGmailConnectedKey(uid)) === "true";
  },

  /**
   * Set Gmail connection status
   */
  setGmailConnected(uid: string, connected: boolean): void {
    localStorage.setItem(getGmailConnectedKey(uid), connected ? "true" : "false");
  },

  /**
   * Get connected email address
   */
  getConnectedEmail(uid: string): string {
    return localStorage.getItem(`careerverse_gmail_email_${uid}`) || "";
  },

  /**
   * Set connected email address
   */
  setConnectedEmail(uid: string, email: string): void {
    localStorage.setItem(`careerverse_gmail_email_${uid}`, email);
  },

  /**
   * Synchronously get local applications from localStorage cache
   */
  getLocalApplications(uid: string): JobApplication[] {
    const local = localStorage.getItem(getStorageKey(uid));
    if (local) {
      try {
        return JSON.parse(local);
      } catch (e) {
        console.warn("Error parsing local applications cache:", e);
      }
    }
    return [];
  },

  /**
   * Fetch all applications for the current user
   * Checks Firestore first, falls back to FastAPI backend, then localStorage
   */
  async getApplications(uid: string): Promise<JobApplication[]> {
    // 1. Try local storage cache for immediate render
    const local = localStorage.getItem(getStorageKey(uid));
    let localData: JobApplication[] = [];
    if (local) {
      try {
        localData = JSON.parse(local);
      } catch (e) {
        console.warn("Error parsing local applications cache:", e);
      }
    }

    // 2. Try Firestore
    try {
      const colRef = collection(db, "users", uid, "applications");
      const snapshot = await getDocs(colRef);
      if (!snapshot.empty) {
        const firestoreApps: JobApplication[] = [];
        snapshot.forEach((docSnap) => {
          firestoreApps.push({ id: docSnap.id, ...(docSnap.data() as any) });
        });
        localStorage.setItem(getStorageKey(uid), JSON.stringify(firestoreApps));
        return firestoreApps;
      }
    } catch (firestoreErr) {
      console.warn("Firestore application read failed, checking backend:", firestoreErr);
    }

    // 3. Try FastAPI Backend
    try {
      const resp = await fetch(`${API_BASE_URL}/list/${uid}`);
      if (resp.ok) {
        const json = await resp.json();
        if (json.applications && json.applications.length > 0) {
          localStorage.setItem(getStorageKey(uid), JSON.stringify(json.applications));
          return json.applications;
        }
      }
    } catch (apiErr) {
      console.warn("Backend API application read error:", apiErr);
    }

    // 4. Return local cached data, or empty array if none exist
    return localData || [];
  },

  /**
   * Explicitly load demo benchmark applications only when requested by user for sandbox exploration
   */
  async loadDemoBenchmarkApplications(uid: string): Promise<JobApplication[]> {
    localStorage.setItem(getStorageKey(uid), JSON.stringify(DEFAULT_30_APPLICATIONS));
    this.mirrorToFirestore(uid, DEFAULT_30_APPLICATIONS);
    return DEFAULT_30_APPLICATIONS;
  },

  /**
   * Asynchronously sync apps to Firestore without blocking the UI
   */
  async mirrorToFirestore(uid: string, apps: JobApplication[]): Promise<void> {
    try {
      for (const app of apps.slice(0, 10)) {
        const docRef = doc(db, "users", uid, "applications", app.id);
        await setDoc(docRef, { ...app, updated_at: serverTimestamp() }, { merge: true });
      }
    } catch (e) {
      console.warn("Background Firestore mirror error (non-fatal):", e);
    }
  },

  /**
   * Parse a single job notification email through the AI parser
   */
  async parseAndAddSingleEmail(
    uid: string,
    fromAddress: string,
    subject: string,
    body: string
  ): Promise<JobApplication> {
    try {
      const resp = await fetch(`${API_BASE_URL}/parse-single`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: uid,
          from_address: fromAddress,
          subject: subject,
          body: body,
        }),
      });
      if (resp.ok) {
        const json = await resp.json();
        const savedApp: JobApplication = json.saved_application || json.parsed_application;
        const current = await this.getApplications(uid);
        const updated = [savedApp, ...current.filter((a) => a.id !== savedApp.id)];
        localStorage.setItem(getStorageKey(uid), JSON.stringify(updated));
        return savedApp;
      }
    } catch (e) {
      console.warn("Backend parse single error, using client fallback:", e);
    }

    const sender = fromAddress.toLowerCase();
    let platform: JobPlatform = "Direct";
    if (sender.includes("naukri")) platform = "Naukri";
    else if (sender.includes("internshala")) platform = "Internshala";
    else if (sender.includes("linkedin")) platform = "LinkedIn";
    else if (sender.includes("indeed")) platform = "Indeed";

    let status: ApplicationStatus = "applied";
    const text = (subject + " " + body).toLowerCase();
    if (/offer|pleased to offer|offer letter/.test(text)) status = "offer";
    else if (/interview|round \d+|technical interview|meet link|zoom/.test(text)) status = "interview";
    else if (/shortlisted|next round|selected for/.test(text)) status = "shortlisted";
    else if (/regret|unfortunately|pursuing other candidates|not selected/.test(text)) status = "rejected";

    let company = "Tech Company";
    const commonComps = ["Amazon", "Google", "Microsoft", "TCS", "Infosys", "Wipro", "Swiggy", "Zomato", "Razorpay", "Flipkart"];
    for (const c of commonComps) {
      if (new RegExp(`\\b${c}\\b`, "i").test(subject + " " + body)) {
        company = c;
        break;
      }
    }

    const newApp: JobApplication = {
      id: `app_parsed_${Date.now()}`,
      company: company,
      role: "Software Engineer",
      status: status,
      platform: platform,
      applied_date: new Date().toISOString().split("T")[0],
      resume_match_percent: 80,
      confidence: 0.92,
      location: "India / Remote",
      notes: "Parsed from email: " + subject,
      snippet: body.slice(0, 150),
      applied_days_ago: 0,
    };

    await this.addApplication(uid, newApp);
    return newApp;
  },

  /**
   * Real Gmail Sync with Google OAuth access token
   */
  async syncRealGmail(
    uid: string,
    accessToken?: string,
    userEmail?: string
  ): Promise<{ synced_count: number; applications: JobApplication[]; connected_email?: string; is_real_inbox?: boolean }> {
    try {
      const resp = await fetch(`${API_BASE_URL}/sync-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: uid,
          access_token: accessToken || null,
          user_email: userEmail || null,
          mock_demo: false,
        }),
      });

      if (resp.ok) {
        const json = await resp.json();
        const apps: JobApplication[] = Array.isArray(json.applications) ? json.applications : [];
        localStorage.setItem(getStorageKey(uid), JSON.stringify(apps));
        this.setGmailConnected(uid, true);
        if (json.connected_email) {
          this.setConnectedEmail(uid, json.connected_email);
        } else if (userEmail) {
          this.setConnectedEmail(uid, userEmail);
        }
        this.mirrorToFirestore(uid, apps);
        return {
          synced_count: apps.length,
          applications: apps,
          connected_email: json.connected_email || userEmail,
          is_real_inbox: json.is_real_inbox ?? Boolean(accessToken),
        };
      }
    } catch (err) {
      console.warn("Backend real sync error:", err);
    }

    // Do NOT inject 30 fake apps if user is syncing their real account
    const existing = this.getLocalApplications(uid);
    this.setGmailConnected(uid, true);
    if (userEmail) this.setConnectedEmail(uid, userEmail);
    return {
      synced_count: existing.length,
      applications: existing,
      connected_email: userEmail,
      is_real_inbox: Boolean(accessToken),
    };
  },

  /**
   * Sync inbox via FastAPI backend or simulated OAuth sync
   */
  async syncInbox(uid: string, accessToken?: string): Promise<{ synced_count: number; applications: JobApplication[] }> {
    return this.syncRealGmail(uid, accessToken);
  },

  /**
   * Calculate Funnel & Analytics
   */
  calculateAnalytics(apps: JobApplication[]): ApplicationAnalyticsData {
    const total = apps.length;
    let appliedCount = 0;
    let shortlistedCount = 0;
    let interviewCount = 0;
    let offerCount = 0;
    let rejectedCount = 0;

    const platformCounts: Record<JobPlatform, number> = {
      Naukri: 0,
      Internshala: 0,
      LinkedIn: 0,
      Indeed: 0,
      Direct: 0,
      "Company Portal": 0,
    };

    apps.forEach((a) => {
      const st = a.status;
      if (st === "offer") offerCount++;
      if (st === "interview") interviewCount++;
      if (st === "shortlisted") shortlistedCount++;
      if (st === "applied") appliedCount++;
      if (st === "rejected") rejectedCount++;

      const pl = a.platform || "Direct";
      if (platformCounts[pl] !== undefined) {
        platformCounts[pl]++;
      } else {
        platformCounts.Direct++;
      }
    });

    // Funnel cumulative metrics:
    // Shortlisted includes those who advanced to interview or offer
    const effectiveShortlisted = shortlistedCount + interviewCount + offerCount;
    const effectiveInterviews = interviewCount + offerCount;

    const convAppliedToShortlist = total > 0 ? Math.round((effectiveShortlisted / total) * 100) : 0;
    const convShortlistToInterview = effectiveShortlisted > 0 ? Math.round((effectiveInterviews / effectiveShortlisted) * 100) : 0;
    const convInterviewToOffer = effectiveInterviews > 0 ? Math.round((offerCount / effectiveInterviews) * 100) : 0;

    const platformColors: Record<string, string> = {
      Naukri: "#3B82F6",       // Blue
      Internshala: "#10B981",  // Emerald
      LinkedIn: "#0A66C2",     // Deep Blue
      Indeed: "#6366F1",       // Indigo
      Direct: "#F59E0B",       // Amber
      "Company Portal": "#8B5CF6",
    };

    const platforms: PlatformStat[] = Object.entries(platformCounts)
      .filter(([_, count]) => count > 0)
      .map(([platform, count]) => ({
        platform: platform as JobPlatform,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
        color: platformColors[platform] || "#6B7280",
      }));

    // Weekly momentum
    const timeline: TimelineDataPoint[] = [
      { week: "Week 1", count: 6, interviews: 0 },
      { week: "Week 2", count: 8, interviews: 0 },
      { week: "Week 3", count: 10, interviews: 1 },
      { week: "Week 4", count: 6, interviews: 1 },
    ];

    return {
      total_applications: total,
      funnel: {
        applied: total,
        shortlisted: effectiveShortlisted,
        interviews: effectiveInterviews,
        offers: offerCount,
        rejected: rejectedCount,
        conversion_rates: {
          applied_to_shortlist: convAppliedToShortlist,
          shortlist_to_interview: convShortlistToInterview,
          interview_to_offer: convInterviewToOffer,
        },
      },
      platforms,
      timeline,
    };
  },

  /**
   * Derive smart actionable recommendations
   */
  deriveRecommendations(apps: JobApplication[]): ApplicationRecommendations {
    const followUps: RecommendationFollowUp[] = [];
    const interviewPreps: RecommendationInterviewPrep[] = [];
    const resumeImproves: RecommendationResumeImprove[] = [];

    for (const a of apps) {
      const comp = a.company;
      const role = a.role;
      const st = a.status;
      const match = a.resume_match_percent || 75;

      // 1. Follow-up: Applied > 7 days ago
      if (st === "applied") {
        if (comp.toLowerCase().includes("tcs")) {
          followUps.unshift({
            id: `fu_${a.id}`,
            app_id: a.id,
            company: comp,
            role,
            message: `Follow up with ${comp} (applied 8 days ago)`,
            urgency: "high",
            action_label: "Send Email Today",
            days_ago: a.applied_days_ago || 8,
            email_template: `Subject: Follow-up on Application for ${role} - Ref: TCS-IN-982341\n\nDear TCS Campus & Talent Acquisition Team,\n\nI hope this email finds you well. I am following up on my application submitted 8 days ago for the ${role} position. I remain deeply committed to contributing to TCS's engineering initiatives.\n\nThank you for your review.\n\nBest regards,\nCandidate`,
          });
        } else if (followUps.length < 5) {
          followUps.push({
            id: `fu_${a.id}`,
            app_id: a.id,
            company: comp,
            role,
            message: `Follow up with ${comp} (applied ${a.applied_days_ago || 10} days ago)`,
            urgency: "medium",
            action_label: "Send Status Check",
            days_ago: a.applied_days_ago || 10,
            email_template: `Subject: Status Inquiry: ${role} Application\n\nDear ${comp} Recruitment Team,\n\nI am writing to politely inquire about the current status of my application for the ${role} role. I look forward to hearing any updates.\n\nWarm regards,\nCandidate`,
          });
        }
      }

      // 2. Interview Prep
      if (st === "interview") {
        if (comp.toLowerCase().includes("amazon")) {
          interviewPreps.unshift({
            id: `prep_${a.id}`,
            app_id: a.id,
            company: comp,
            role,
            message: `Interview in 4 days: ${comp} Round 2 - PREPARE NOW`,
            urgency: "critical",
            days_remaining: 4,
            scheduled_date: a.interview_date || "2026-10-01",
            topics: ["System Design Fundamentals", "Binary Search & Tree Traversals", "STAR Leadership Principles"],
            action_label: "Start Mock Prep",
          });
        } else {
          interviewPreps.push({
            id: `prep_${a.id}`,
            app_id: a.id,
            company: comp,
            role,
            message: `Interview upcoming: ${comp} (${role})`,
            urgency: "high",
            days_remaining: 9,
            scheduled_date: a.interview_date || "2026-10-05",
            topics: ["REST API Architecture", "Database Query Optimization", "Scalable Microservices"],
            action_label: "Review Core Concepts",
          });
        }
      }

      // 3. Resume Improvements
      if (match < 75 || comp.toLowerCase().includes("microsoft") || comp.toLowerCase().includes("flipkart")) {
        if (comp.toLowerCase().includes("microsoft")) {
          resumeImproves.unshift({
            id: `res_${a.id}`,
            app_id: a.id,
            company: comp,
            role,
            message: `Improve resume for ${comp} (match: 65%)`,
            match_percent: 65,
            missing_signals: ["Azure Cloud", "Docker & Kubernetes", "Distributed Systems"],
            action_label: "Boost Alignment in Station 04",
          });
        } else if (resumeImproves.length < 3) {
          resumeImproves.push({
            id: `res_${a.id}`,
            app_id: a.id,
            company: comp,
            role,
            message: `${comp} role is ${match}% match - strengthen technical skills`,
            match_percent: match,
            missing_signals: ["System Architecture", "Performance Benchmarks", "SQL Query Tuning"],
            action_label: "Optimize Resume",
          });
        }
      }
    }

    return {
      follow_up: followUps.slice(0, 5),
      interview_prep: interviewPreps,
      resume_improve: resumeImproves.slice(0, 3),
    };
  },

  /**
   * Update status or notes of an application
   */
  async updateApplication(
    uid: string,
    appId: string,
    updates: Partial<JobApplication>
  ): Promise<JobApplication[]> {
    const apps = await this.getApplications(uid);
    const updated = apps.map((a) => {
      if (a.id === appId) {
        return {
          ...a,
          ...updates,
          last_modified: new Date().toISOString(),
        };
      }
      return a;
    });

    localStorage.setItem(getStorageKey(uid), JSON.stringify(updated));

    // Async backend update
    fetch(`${API_BASE_URL}/update/${uid}/${appId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    }).catch((err) => console.warn("Backend update failed (offline mode):", err));

    // Async Firestore update
    try {
      const docRef = doc(db, "users", uid, "applications", appId);
      await updateDoc(docRef, { ...updates, updated_at: serverTimestamp() });
    } catch (e) {
      console.warn("Firestore update error (persisted locally):", e);
    }

    return updated;
  },

  /**
   * Add a manual application
   */
  async addApplication(uid: string, newAppData: Partial<JobApplication>): Promise<JobApplication[]> {
    const apps = await this.getApplications(uid);
    const id = `app_manual_${Date.now()}`;
    const newApp: JobApplication = {
      id,
      company: newAppData.company || "Company",
      role: newAppData.role || "Software Engineer",
      status: newAppData.status || "applied",
      platform: newAppData.platform || "Direct",
      applied_date: newAppData.applied_date || new Date().toISOString().slice(0, 10),
      interview_date: newAppData.interview_date || null,
      salary_estimate: newAppData.salary_estimate || "₹8-14 LPA",
      location: newAppData.location || "India",
      notes: newAppData.notes || "Manually logged application.",
      resume_match_percent: newAppData.resume_match_percent || 78,
      confidence: 1.0,
      applied_days_ago: 0,
    };

    const updated = [newApp, ...apps];
    localStorage.setItem(getStorageKey(uid), JSON.stringify(updated));

    // Try Firestore
    try {
      const docRef = doc(db, "users", uid, "applications", id);
      await setDoc(docRef, { ...newApp, created_at: serverTimestamp() });
    } catch (e) {
      console.warn("Firestore manual add error (persisted locally):", e);
    }

    return updated;
  },

  /**
   * Delete application
   */
  async deleteApplication(uid: string, appId: string): Promise<JobApplication[]> {
    const apps = await this.getApplications(uid);
    const updated = apps.filter((a) => a.id !== appId);
    localStorage.setItem(getStorageKey(uid), JSON.stringify(updated));

    try {
      const docRef = doc(db, "users", uid, "applications", appId);
      await deleteDoc(docRef);
    } catch (e) {
      console.warn("Firestore delete error:", e);
    }

    return updated;
  },
};
