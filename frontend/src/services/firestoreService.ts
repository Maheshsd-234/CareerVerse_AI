import { db } from "../firebase/config";
import {
  doc,
  updateDoc,
  getDoc,
  setDoc,
  collection,
  query,
  getDocs,
} from "firebase/firestore";
import type { User, AssessmentResult, ChatMessage, ChatSession } from "../types";

const chatHistoryLocalKey = (uid: string) => `cv_chat_history_${uid}`;

type StoredChatSession = {
  id: string;
  title: string;
  messages: ReturnType<typeof serializeChatMessages>;
  createdAt: string;
  updatedAt: string;
};

const parseDateSafely = (value: unknown): Date => {
  if (value instanceof Date && !isNaN(value.getTime())) return value;
  if (!value) return new Date();
  if (typeof (value as { toDate?: () => Date }).toDate === "function") {
    try {
      const d = (value as { toDate: () => Date }).toDate();
      if (!isNaN(d.getTime())) return d;
    } catch {}
  }
  if (typeof (value as { seconds?: number }).seconds === "number") {
    return new Date((value as { seconds: number }).seconds * 1000);
  }
  const d = new Date(String(value));
  return isNaN(d.getTime()) ? new Date() : d;
};

const serializeSession = (session: ChatSession): StoredChatSession => ({
  id: session.id,
  title: session.title,
  messages: serializeChatMessages(session.messages),
  createdAt: parseDateSafely(session.createdAt).toISOString(),
  updatedAt: parseDateSafely(session.updatedAt).toISOString(),
});

const parseSession = (raw: StoredChatSession | Record<string, unknown>): ChatSession => ({
  id: String(raw.id || crypto.randomUUID()),
  title: String(raw.title ?? "Chat"),
  messages: parseChatMessages(raw.messages as unknown[]),
  createdAt: parseDateSafely(raw.createdAt),
  updatedAt: parseDateSafely(raw.updatedAt),
});

const readLocalSessions = (uid: string): ChatSession[] => {
  try {
    const raw = localStorage.getItem(chatHistoryLocalKey(uid));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as (StoredChatSession | Record<string, unknown>)[];
    return parsed
      .map(parseSession)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  } catch {
    return [];
  }
};

const writeLocalSessions = (uid: string, sessions: (StoredChatSession | ChatSession)[]) => {
  try {
    const serialized = sessions.map((s) => ("messages" in s && Array.isArray(s.messages) && typeof s.messages[0]?.timestamp === "object" && s.messages[0]?.timestamp instanceof Date)
      ? serializeSession(s as ChatSession)
      : (s as StoredChatSession)
    );
    localStorage.setItem(chatHistoryLocalKey(uid), JSON.stringify(serialized));
  } catch {
    // ignore quota errors
  }
};

const serializeChatMessages = (messages: ChatMessage[]) =>
  messages.map((message) => ({
    id: String(message.id),
    role: message.role,
    content: String(message.content ?? ""),
    timestamp:
      message.timestamp instanceof Date
        ? message.timestamp.toISOString()
        : typeof (message.timestamp as { toDate?: () => Date })?.toDate === "function"
          ? (message.timestamp as { toDate: () => Date }).toDate().toISOString()
          : String(message.timestamp ?? new Date().toISOString()),
  }));

const parseChatMessages = (raw: unknown[]): ChatMessage[] =>
  (raw || []).map((item) => {
    const message = item as Record<string, unknown>;
    return {
      id: String(message.id ?? crypto.randomUUID()),
      role: message.role as ChatMessage["role"],
      content: String(message.content ?? ""),
      timestamp: new Date(String(message.timestamp ?? Date.now())),
    };
  });

export const firestoreService = {
  // Update user profile
  updateUserProfile: async (uid: string, updates: Partial<User>) => {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, updates);
  },

  // Update user skills
  updateUserSkills: async (uid: string, skills: string[]) => {
    await firestoreService.updateUserProfile(uid, { skills });
  },

  // Update selected career
  updateSelectedCareer: async (uid: string, career: string) => {
    await firestoreService.updateUserProfile(uid, { selectedCareer: career });
  },

  // Save assessment result
  saveAssessmentResult: async (
    uid: string,
    score: number,
    recommendedCareer: string,
    categories: Record<string, number>
  ) => {
    const result: AssessmentResult = {
      userId: uid,
      score,
      recommendedCareer,
      categories,
      createdAt: new Date(),
    };

    await setDoc(
      doc(db, "users", uid, "assessments", new Date().getTime().toString()),
      result
    );

    // Update user assessment score
    await firestoreService.updateUserProfile(uid, {
      assessmentScore: score,
      selectedCareer: recommendedCareer,
    });
  },

  // Get assessment results
  getAssessmentResults: async (uid: string): Promise<AssessmentResult[]> => {
    const q = query(
      collection(db, "users", uid, "assessments")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => doc.data() as AssessmentResult);
  },

  // Chat sessions under users/{uid}/data/chatHistory (same path rules as roadmap/chat)
  saveChatSession: async (uid: string, session: ChatSession) => {
    const historyRef = doc(db, "users", uid, "data", "chatHistory");
    const serialized = serializeSession(session);

    let sessions: StoredChatSession[] = [];
    try {
      const snap = await getDoc(historyRef);
      sessions = snap.exists()
        ? ((snap.data().sessions as StoredChatSession[]) ?? [])
        : [];
    } catch (error) {
      console.warn("Firestore read failed, using local cache:", error);
      sessions = readLocalSessions(uid).map(serializeSession);
    }

    const next = [serialized, ...sessions.filter((s) => s.id !== session.id)];
    writeLocalSessions(uid, next);

    try {
      await setDoc(
        historyRef,
        { sessions: next, lastUpdated: new Date().toISOString() },
        { merge: true }
      );
    } catch (error) {
      console.error("Firestore save failed; kept local copy:", error);
    }
  },

  getLocalSessions: (uid: string): ChatSession[] => {
    return readLocalSessions(uid);
  },

  listChatSessions: async (uid: string): Promise<ChatSession[]> => {
    try {
      const snap = await getDoc(doc(db, "users", uid, "data", "chatHistory"));
      if (snap.exists()) {
        const sessions = ((snap.data().sessions as StoredChatSession[]) ?? []).map(parseSession);
        writeLocalSessions(uid, sessions.map(serializeSession));
        return sessions.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
      }
    } catch (error) {
      console.warn("Firestore list failed, using local cache:", error);
    }
    return readLocalSessions(uid);
  },

  // Delete a specific chat session
  deleteChatSession: async (uid: string, sessionId: string) => {
    const historyRef = doc(db, "users", uid, "data", "chatHistory");
    const local = readLocalSessions(uid).filter((s) => s.id !== sessionId);
    writeLocalSessions(uid, local.map(serializeSession));

    try {
      const snap = await getDoc(historyRef);
      if (snap.exists()) {
        const existing = (snap.data().sessions as StoredChatSession[]) || [];
        const updated = existing.filter((s) => s.id !== sessionId);
        await setDoc(
          historyRef,
          { sessions: updated, lastUpdated: new Date().toISOString() },
          { merge: true }
        );
      }
    } catch (error) {
      console.error("Firestore delete failed; removed from local copy:", error);
    }
  },

  // Clear all chat sessions
  clearAllChatSessions: async (uid: string) => {
    const historyRef = doc(db, "users", uid, "data", "chatHistory");
    writeLocalSessions(uid, []);

    try {
      await setDoc(
        historyRef,
        { sessions: [], lastUpdated: new Date().toISOString() },
        { merge: true }
      );
    } catch (error) {
      console.error("Firestore clear failed; cleared local copy:", error);
    }
  },

  /** One-time migration from legacy single-chat document */
  migrateLegacyChat: async (uid: string): Promise<void> => {
    const legacySnap = await getDoc(doc(db, "users", uid, "data", "chat"));
    if (!legacySnap.exists() || legacySnap.data().migrated) return;

    const legacyMessages = parseChatMessages(
      (legacySnap.data().messages as unknown[]) || []
    ).filter((m) => m.content.trim());

    if (legacyMessages.length > 0 && !legacySnap.data().migrated) {
      const firstUser = legacyMessages.find((m) => m.role === "user");
      const session: ChatSession = {
        id: crypto.randomUUID(),
        title: (firstUser?.content.slice(0, 48) || "Previous chat").trim(),
        messages: legacyMessages,
        createdAt: new Date(String(legacySnap.data().lastUpdated ?? Date.now())),
        updatedAt: new Date(String(legacySnap.data().lastUpdated ?? Date.now())),
      };
      await firestoreService.saveChatSession(uid, session);
    }

    await setDoc(
      doc(db, "users", uid, "data", "chat"),
      { messages: [], migrated: true },
      { merge: true }
    );
  },

  // Save roadmap preferences + generated plan
  saveRoadmapData: async (
    uid: string,
    data: {
      roleId: string;
      experienceLevel: "Beginner" | "Intermediate" | "Experienced";
      years: number;
      hoursPerWeek: number;
      knownSkills: string[];
      plan: Record<string, { title: string; milestones: string[]; focusSkills: string[] }>;
      createdAt: Date;
    }
  ) => {
    await setDoc(doc(db, "users", uid, "data", "roadmap"), data, { merge: true });
  },

  getRoadmapData: async (uid: string) => {
    const docSnap = await getDoc(doc(db, "users", uid, "data", "roadmap"));
    return docSnap.exists() ? docSnap.data() : null;
  },

  saveAssessmentRun: async (
    uid: string,
    run: {
      seed: string;
      questions: unknown[];
      selectedQuestionIds: number[];
      createdAt: Date;
    }
  ) => {
    await setDoc(
      doc(db, "users", uid, "data", "assessmentRuns", Date.now().toString()),
      run
    );
  },
};
