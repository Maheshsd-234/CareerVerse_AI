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
  updateUserStage: (stage: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange((firebaseUser) => {
      void (async () => {
        try {
          setUser(firebaseUser);

          if (firebaseUser) {
            try {
              const profile = await authService.getUserProfile(firebaseUser.uid);
              setAppUser(profile);
            } catch (e) {
              console.error("Failed to load user profile:", e);
              setAppUser(null);
            }
          } else {
            setAppUser(null);
          }
        } finally {
          setLoading(false);
        }
      })();
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const fbUser = await authService.login(email, password);
      if (fbUser) {
        const profile = await authService.getUserProfile(fbUser.uid);
        setAppUser(profile);
      }
    } finally {
      setLoading(false);
    }
  };

  const register = async (
    email: string,
    password: string,
    displayName: string,
    currentStage?: string
  ) => {
    setLoading(true);
    try {
      const fbUser = await authService.register(email, password, displayName, currentStage);
      if (fbUser) {
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
    } finally {
      setLoading(false);
    }
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
