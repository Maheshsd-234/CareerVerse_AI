import React, { createContext, useContext, useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { authService } from "../services/authService";
import type { User as AppUser } from "../types";

interface AuthContextType {
  user: User | null;
  appUser: AppUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    displayName: string,
    currentStage?: string
  ) => Promise<void>;
  loginAsGuest: (stage?: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  updateUserStage: (stage: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper to construct guest user
  const createGuestSession = (stage: string = "skills") => {
    const guestUid = localStorage.getItem("cv_guest_uid") || `guest_${Date.now()}`;
    localStorage.setItem("cv_guest_uid", guestUid);
    localStorage.setItem("cv_is_guest_mode", "true");
    localStorage.setItem(`cv_user_stage_${guestUid}`, stage);

    const mockFirebaseUser = {
      uid: guestUid,
      email: "guest@careerverse.ai",
      displayName: "Guest Engineer",
      emailVerified: true,
      isAnonymous: true,
    } as unknown as User;

    const mockProfile: AppUser = {
      uid: guestUid,
      email: "guest@careerverse.ai",
      displayName: "Guest Engineer",
      currentStage: stage,
      createdAt: new Date(),
      skills: ["Python", "FastAPI", "React", "TypeScript"],
      selectedCareer: "Full Stack Engineer",
      assessmentScore: 85,
    };

    return { mockFirebaseUser, mockProfile };
  };

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange((firebaseUser) => {
      void (async () => {
        try {
          if (firebaseUser) {
            setUser(firebaseUser);
            localStorage.removeItem("cv_is_guest_mode");
            try {
              const profile = await authService.getUserProfile(firebaseUser.uid);
              setAppUser(profile);
            } catch (e) {
              console.error("Failed to load user profile:", e);
              setAppUser(null);
            }
          } else {
            // Check if user was previously in guest mode
            const isGuest = localStorage.getItem("cv_is_guest_mode") === "true";
            if (isGuest) {
              const savedStage = localStorage.getItem("cv_guest_stage") || "skills";
              const { mockFirebaseUser, mockProfile } = createGuestSession(savedStage);
              setUser(mockFirebaseUser);
              setAppUser(mockProfile);
            } else {
              setUser(null);
              setAppUser(null);
            }
          }
        } finally {
          setLoading(false);
        }
      })();
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const fbUser = await authService.login(email, password);
    if (fbUser) {
      setUser(fbUser);
      localStorage.removeItem("cv_is_guest_mode");
      const profile = await authService.getUserProfile(fbUser.uid);
      setAppUser(profile);
    }
  };

  const register = async (
    email: string,
    password: string,
    displayName: string,
    currentStage?: string
  ) => {
    const fbUser = await authService.register(email, password, displayName, currentStage);
    if (fbUser) {
      setUser(fbUser);
      localStorage.removeItem("cv_is_guest_mode");
      if (currentStage) {
        localStorage.setItem(`cv_user_stage_${fbUser.uid}`, currentStage);
      }
      const profile = await authService.getUserProfile(fbUser.uid);
      if (profile) {
        setAppUser(profile);
      } else {
        setAppUser({
          uid: fbUser.uid,
          email: fbUser.email || "",
          displayName: displayName || fbUser.displayName || "Student",
          currentStage: currentStage || "school",
          createdAt: new Date(),
          skills: [],
          selectedCareer: null,
          assessmentScore: null,
        });
      }
    }
  };

  const loginAsGuest = async (stage: string = "skills") => {
    localStorage.setItem("cv_guest_stage", stage);
    const { mockFirebaseUser, mockProfile } = createGuestSession(stage);
    setUser(mockFirebaseUser);
    setAppUser(mockProfile);
  };

  const sendPasswordReset = async (email: string) => {
    await authService.sendPasswordReset(email);
  };

  const updateUserStage = async (stage: string) => {
    if (!user) return;
    localStorage.setItem(`cv_user_stage_${user.uid}`, stage);
    setAppUser((prev) => (prev ? { ...prev, currentStage: stage } : null));
    try {
      await authService.ensureUserProfile(user, appUser?.displayName, stage);
    } catch (e) {
      console.warn("Failed to persist stage:", e);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      localStorage.removeItem("cv_is_guest_mode");
      localStorage.removeItem("cv_guest_uid");
      localStorage.removeItem("cv_guest_stage");
      setUser(null);
      setAppUser(null);
      await authService.logout();
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        appUser,
        loading,
        login,
        register,
        loginAsGuest,
        sendPasswordReset,
        updateUserStage,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
