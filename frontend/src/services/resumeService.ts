import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/config";
import type { UserResume } from "../types/resume.types";

const LOCAL_STORAGE_KEY_PREFIX = "careerverse_resume_draft_";

export const resumeService = {
  /**
   * Upserts users/{uid}/resumes/{resumeId} in Firestore and syncs with localStorage
   */
  saveResume: async (uid: string, resume: UserResume): Promise<string> => {
    if (!uid) throw new Error("User ID is required to save resume");
    const resumeId = resume.resumeId || "default-resume";

    // 1. Always save to localStorage immediately for bulletproof offline recovery
    try {
      localStorage.setItem(
        `${LOCAL_STORAGE_KEY_PREFIX}${uid}`,
        JSON.stringify({
          ...resume,
          resumeId,
          updatedAt: new Date().toISOString(),
        })
      );
    } catch (lsErr) {
      console.warn("LocalStorage cache error:", lsErr);
    }

    // 2. Save to Firestore
    try {
      const resumeRef = doc(db, "users", uid, "resumes", resumeId);
      const payload = {
        resumeId,
        templateId: resume.templateId || "clean-simple",
        title: resume.title || "My Software Engineering Resume",
        data: resume.data,
        isDefault: resume.isDefault ?? true,
        updatedAt: serverTimestamp(),
        createdAt: resume.createdAt || serverTimestamp(),
        isDeleted: false,
      };

      await setDoc(resumeRef, payload, { merge: true });
      return resumeId;
    } catch (error) {
      console.warn("Firestore save resume failed, local draft preserved:", error);
      // Return resumeId so UX is not blocked even if offline
      return resumeId;
    }
  },

  /**
   * Fetches a single resume by ID
   */
  getResume: async (uid: string, resumeId: string): Promise<UserResume | null> => {
    if (!uid || !resumeId) return null;

    try {
      const resumeRef = doc(db, "users", uid, "resumes", resumeId);
      const snap = await getDoc(resumeRef);

      if (snap.exists()) {
        const data = snap.data();
        if (data && !data.isDeleted) {
          return {
            resumeId: snap.id,
            templateId: data.templateId || "clean-simple",
            title: data.title || "My Resume",
            data: data.data,
            pdfUrl: data.pdfUrl,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(),
            isDefault: data.isDefault,
          };
        }
      }
    } catch (err) {
      console.warn("Firestore fetch single resume error:", err);
    }

    // Fallback to localStorage draft
    try {
      const cached = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}${uid}`);
      if (cached) {
        return JSON.parse(cached) as UserResume;
      }
    } catch {}

    return null;
  },

  /**
   * Fetches all resumes for the user sorted by updatedAt descending
   */
  getAllResumes: async (uid: string): Promise<UserResume[]> => {
    if (!uid) return [];

    try {
      const resumesRef = collection(db, "users", uid, "resumes");
      const q = query(resumesRef, orderBy("updatedAt", "desc"));
      const snapshot = await getDocs(q);

      const list: UserResume[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        if (!d.isDeleted) {
          list.push({
            resumeId: docSnap.id,
            templateId: d.templateId || "clean-simple",
            title: d.title || "My Resume",
            data: d.data,
            pdfUrl: d.pdfUrl,
            createdAt: d.createdAt?.toDate ? d.createdAt.toDate() : new Date(),
            updatedAt: d.updatedAt?.toDate ? d.updatedAt.toDate() : new Date(),
            isDefault: d.isDefault,
          });
        }
      });

      return list;
    } catch (err) {
      console.warn("Firestore getAllResumes failed, checking local storage:", err);
      try {
        const cached = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}${uid}`);
        if (cached) {
          return [JSON.parse(cached) as UserResume];
        }
      } catch {}
      return [];
    }
  },

  /**
   * Gets the latest or default resume for the user
   */
  getLatestUserResume: async (uid: string): Promise<UserResume | null> => {
    const all = await resumeService.getAllResumes(uid);
    if (all.length > 0) return all[0];

    // Check localStorage
    try {
      const cached = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}${uid}`);
      if (cached) {
        return JSON.parse(cached) as UserResume;
      }
    } catch {}

    return null;
  },

  /**
   * Soft-deletes a resume
   */
  deleteResume: async (uid: string, resumeId: string): Promise<void> => {
    if (!uid || !resumeId) return;
    try {
      const resumeRef = doc(db, "users", uid, "resumes", resumeId);
      await updateDoc(resumeRef, {
        isDeleted: true,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn("Failed to soft-delete resume in Firestore:", err);
    }

    try {
      localStorage.removeItem(`${LOCAL_STORAGE_KEY_PREFIX}${uid}`);
    } catch {}
  },
};

export const {
  saveResume,
  getResume,
  getAllResumes,
  getLatestUserResume,
  deleteResume,
} = resumeService;

