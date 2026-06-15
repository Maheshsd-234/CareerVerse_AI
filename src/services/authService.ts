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
  ensureUserProfile: async (user: User, displayName?: string): Promise<void> => {
    const userRef = doc(db, "users", user.uid);
    const existing = await getDoc(userRef);
    if (existing.exists()) return;

    await setDoc(
      userRef,
      {
        uid: user.uid,
        email: user.email ?? "",
        displayName: displayName ?? user.displayName ?? "",
        createdAt: serverTimestamp(),
        skills: [],
        selectedCareer: null,
        assessmentScore: null,
      } satisfies Omit<AppUser, "createdAt"> & { createdAt: unknown },
      { merge: true }
    );
  },

  // Register
  register: async (email: string, password: string, displayName: string) => {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    const user = userCredential.user;

    await updateProfile(user, { displayName });
    await authService.ensureUserProfile(user, displayName);

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
    const docSnap = await getDoc(doc(db, "users", uid));
    if (!docSnap.exists()) return null;
    const data = docSnap.data() as AppUser & { createdAt?: unknown };
    return {
      ...data,
      createdAt: toDateIfTimestamp(data.createdAt),
    } as AppUser;
  },
};



