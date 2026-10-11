import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";
import type { User } from "firebase/auth";
import { auth, db } from "../firebase/config";
import { doc, setDoc, getDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import type { User as AppUser } from "../types";

const toDateIfTimestamp = (value: unknown) => {
  if (value instanceof Timestamp) return value.toDate();
  return value;
};

export const authService = {
  ensureUserProfile: async (
    user: User,
    displayName?: string,
    currentStage?: string
  ): Promise<void> => {
    try {
      const userRef = doc(db, "users", user.uid);
      const existing = await getDoc(userRef);

      const nameToSave =
        displayName || user.displayName || user.email?.split("@")[0] || "Student";
      
      const stageToSave =
        currentStage || localStorage.getItem(`cv_user_stage_${user.uid}`) || "school";

      if (existing.exists()) {
        const existingData = existing.data() as AppUser;
        const updates: Partial<AppUser> = {};
        if (displayName && existingData.displayName !== displayName) {
          updates.displayName = displayName;
        }
        if (currentStage && existingData.currentStage !== currentStage) {
          updates.currentStage = currentStage;
        }
        if (Object.keys(updates).length > 0) {
          await setDoc(userRef, updates, { merge: true });
        }
        return;
      }

      await setDoc(
        userRef,
        {
          uid: user.uid,
          email: user.email ?? "",
          displayName: nameToSave,
          currentStage: stageToSave,
          createdAt: serverTimestamp(),
          skills: [],
          selectedCareer: null,
          assessmentScore: null,
        } satisfies Omit<AppUser, "createdAt"> & { createdAt: unknown },
        { merge: true }
      );
    } catch (error) {
      console.warn("ensureUserProfile (Firestore sync):", error);
    }
  },

  // Register
  register: async (
    email: string,
    password: string,
    displayName: string,
    currentStage?: string
  ) => {
    let user: User;

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      user = userCredential.user;
    } catch (err: any) {
      // If user already exists in Auth, attempt login with provided credentials
      if (err?.code === "auth/email-already-in-use") {
        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );
        user = userCredential.user;
      } else {
        throw err;
      }
    }

    if (displayName) {
      try {
        await updateProfile(user, { displayName });
      } catch (e) {
        console.warn("updateProfile error:", e);
      }
    }

    if (currentStage) {
      localStorage.setItem(`cv_user_stage_${user.uid}`, currentStage);
    }

    await authService.ensureUserProfile(user, displayName, currentStage);
    return user;
  },

  // Login
  login: async (email: string, password: string) => {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    await authService.ensureUserProfile(userCredential.user);
    return userCredential.user;
  },

  // Logout
  logout: async () => {
    await signOut(auth);
  },

  // Get current user
  getCurrentUser: (): User | null => {
    return auth.currentUser;
  },

  // Listen to auth state
  onAuthStateChange: (callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, callback);
  },

  // Get user profile
  getUserProfile: async (uid: string): Promise<AppUser | null> => {
    const localStage = localStorage.getItem(`cv_user_stage_${uid}`);
    try {
      const docSnap = await getDoc(doc(db, "users", uid));
      if (!docSnap.exists()) {
        const currentUser = auth.currentUser;
        if (currentUser && currentUser.uid === uid) {
          return {
            uid: currentUser.uid,
            email: currentUser.email || "",
            displayName:
              currentUser.displayName ||
              currentUser.email?.split("@")[0] ||
              "Student",
            currentStage: localStage || "school",
            createdAt: new Date(),
            skills: [],
            selectedCareer: null,
            assessmentScore: null,
          };
        }
        return null;
      }
      const data = docSnap.data() as AppUser & { createdAt?: unknown };
      return {
        ...data,
        displayName:
          data.displayName ||
          auth.currentUser?.displayName ||
          data.email?.split("@")[0] ||
          "Student",
        currentStage: data.currentStage || localStage || "school",
        createdAt: toDateIfTimestamp(data.createdAt),
      } as AppUser;
    } catch (error) {
      console.warn("getUserProfile warning:", error);
      const currentUser = auth.currentUser;
      if (currentUser && currentUser.uid === uid) {
        return {
          uid: currentUser.uid,
          email: currentUser.email || "",
          displayName:
            currentUser.displayName ||
            currentUser.email?.split("@")[0] ||
            "Student",
          currentStage: localStage || "school",
          createdAt: new Date(),
          skills: [],
          selectedCareer: null,
          assessmentScore: null,
        };
      }
      return null;
    }
  },
};
