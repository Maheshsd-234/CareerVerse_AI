import React, { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { History, MessageSquarePlus, Send } from "lucide-react";
import { formatGeminiError, geminiService } from "../services/geminiService";
import { firestoreService } from "../services/firestoreService";
import { useAuth } from "../hooks/useAuth";
import { TypingAnimation } from "./Loading";
import type { ChatMessage, ChatSession } from "../types";

const newMessageId = () => crypto.randomUUID();
const pendingArchiveKey = (uid: string) => `careerverse_pending_chat_${uid}`;

const normalizeMessages = (raw: ChatMessage[]): ChatMessage[] => {
  const seen = new Set<string>();
  return raw.map((message) => {
    let id = message.id;
    if (!id || seen.has(id)) {
      id = newMessageId();
    }
    seen.add(id);
    const timestamp =
      message.timestamp instanceof Date
        ? message.timestamp
        : new Date(message.timestamp as string | number);
    return { ...message, id, timestamp };
  });
};

const buildSessionTitle = (messages: ChatMessage[]) => {
  const firstUser = messages.find((m) => m.role === "user" && m.content.trim());
  if (firstUser) {
    const title = firstUser.content.trim().slice(0, 48);
    return title.length < firstUser.content.trim().length ? `${title}...` : title;
  }
  return `Chat · ${new Date().toLocaleDateString()}`;
};

const hasSavableMessages = (messages: ChatMessage[]) =>
  messages.some((m) => m.content.trim());

export const ChatBot: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [viewingSessionId, setViewingSessionId] = useState<string | null>(null);
  const [sessionsLoading, setSessionsLoading] = useState(true);

  const messagesRef = useRef<ChatMessage[]>([]);
  const sendingRef = useRef(false);
  const viewingSessionIdRef = useRef<string | null>(null);
  const lastSendRef = useRef<{ content: string; at: number } | null>(null);
  const archiveInFlightRef = useRef(false);
  const userIdRef = useRef<string | null>(null);

  const isViewingHistory = viewingSessionId !== null;

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    viewingSessionIdRef.current = viewingSessionId;
  }, [viewingSessionId]);

  const loadSessions = useCallback(async () => {
    if (!user) return [];
    setSessionsLoading(true);
    try {
      await firestoreService.migrateLegacyChat(user.uid);
      const list = await firestoreService.listChatSessions(user.uid);
      setSessions(list);
      return list;
    } catch (error) {
      console.error("Failed to load chat sessions:", error);
      return [];
    } finally {
      setSessionsLoading(false);
    }
  }, [user]);

  const archiveCurrentChat = useCallback(
    async (sourceMessages?: ChatMessage[]): Promise<boolean> => {
      if (!user || archiveInFlightRef.current) return false;

      const toSave = normalizeMessages(sourceMessages ?? messagesRef.current).filter(
        (m) => m.content.trim()
      );
      if (!hasSavableMessages(toSave)) return false;

      archiveInFlightRef.current = true;
      try {
        const now = new Date();
        const session: ChatSession = {
          id: newMessageId(),
          title: buildSessionTitle(toSave),
          messages: toSave,
          createdAt: now,
          updatedAt: now,
        };

        await firestoreService.saveChatSession(user.uid, session);
        setSessions((prev) => {
          const rest = prev.filter((s) => s.id !== session.id);
          return [session, ...rest].sort(
            (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
          );
        });
        await loadSessions();
        return true;
      } catch (error) {
        console.error("Failed to archive chat:", error);
        return false;
      } finally {
        archiveInFlightRef.current = false;
      }
    },
    [user, loadSessions]
  );

  const startNewChat = useCallback(async () => {
    const snapshot = [...messagesRef.current];
    if (viewingSessionIdRef.current === null && hasSavableMessages(snapshot)) {
      await archiveCurrentChat(snapshot);
    }
    setMessages([]);
    setViewingSessionId(null);
    setInput("");
  }, [archiveCurrentChat]);

  const openSession = (session: ChatSession) => {
    setViewingSessionId(session.id);
    setMessages(normalizeMessages(session.messages));
    setInput("");
  };

  // Load history on login; restore chat saved before refresh
  useEffect(() => {
    const uid = user?.uid ?? null;
    if (!uid) {
      userIdRef.current = null;
      setSessions([]);
      setMessages([]);
      return;
    }
    if (userIdRef.current === uid) return;
    userIdRef.current = uid;

    void (async () => {
      const raw = sessionStorage.getItem(pendingArchiveKey(uid));
      if (raw) {
        sessionStorage.removeItem(pendingArchiveKey(uid));
        try {
          const pending = JSON.parse(raw) as { messages: ChatMessage[] };
          if (pending.messages?.length) {
            await archiveCurrentChat(
              pending.messages.map((m) => ({
                ...m,
                timestamp: new Date(m.timestamp),
              }))
            );
          }
        } catch (error) {
          console.error("Failed to restore pending chat:", error);
        }
      }

      await loadSessions();
      setMessages([]);
      setViewingSessionId(null);
    })();
  }, [user?.uid, loadSessions, archiveCurrentChat]);

  // Archive when navigating away from chatbot
  const prevPathRef = useRef(location.pathname);
  useEffect(() => {
    const prev = prevPathRef.current;
    prevPathRef.current = location.pathname;

    if (
      user &&
      prev === "/chatbot" &&
      location.pathname !== "/chatbot" &&
      viewingSessionIdRef.current === null &&
      hasSavableMessages(messagesRef.current)
    ) {
      void archiveCurrentChat([...messagesRef.current]);
    }
  }, [location.pathname, user, archiveCurrentChat]);

  // Save to sessionStorage before refresh / tab close
  useEffect(() => {
    if (!user) return;

    const persistOnExit = () => {
      if (sendingRef.current || viewingSessionIdRef.current !== null) return;
      const current = messagesRef.current;
      if (!hasSavableMessages(current)) return;

      sessionStorage.setItem(
        pendingArchiveKey(user.uid),
        JSON.stringify({ messages: current })
      );
    };

    window.addEventListener("beforeunload", persistOnExit);
    window.addEventListener("pagehide", persistOnExit);
    return () => {
      window.removeEventListener("beforeunload", persistOnExit);
      window.removeEventListener("pagehide", persistOnExit);
    };
  }, [user]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user || loading || sendingRef.current || isViewingHistory)
      return;

    const now = Date.now();
    const trimmed = input.trim();
    const last = lastSendRef.current;
    if (last && last.content === trimmed && now - last.at < 1200) {
      return;
    }
    sendingRef.current = true;
    lastSendRef.current = { content: trimmed, at: now };

    const content = trimmed;
    const userMessage: ChatMessage = {
      id: newMessageId(),
      role: "user",
      content,
      timestamp: new Date(),
    };

    const assistantMessage: ChatMessage = {
      id: newMessageId(),
      role: "assistant",
      content: "",
      timestamp: new Date(),
    };

    setInput("");
    setLoading(true);
    setIsStreaming(true);

    setMessages((prev) => [...prev, userMessage, assistantMessage]);

    const updateAssistant = (text: string) => {
      const updatedAssistant: ChatMessage = { ...assistantMessage, content: text };
      setMessages((prev) =>
        prev.map((message) =>
          message.id === assistantMessage.id ? updatedAssistant : message
        )
      );
    };

    let assistantText = "";
    try {
      for await (const chunk of geminiService.streamChat(content)) {
        assistantText += chunk;
        updateAssistant(assistantText);
      }
    } catch (error) {
      console.error("Chat stream error:", error);
      if (!assistantText.trim()) {
        updateAssistant(formatGeminiError(error));
      }
    } finally {
      setLoading(false);
      setIsStreaming(false);
      sendingRef.current = false;
    }
  };

  return (
    <div className="flex h-full min-h-0 bg-gray-50">
      <aside className="w-64 shrink-0 border-r border-gray-200 bg-white flex flex-col">
        <div className="p-3 border-b border-gray-200">
          <button
            type="button"
            onClick={() => void startNewChat()}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition"
          >
            <MessageSquarePlus size={18} />
            New chat
          </button>
        </div>

        <div className="px-3 py-2 flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
          <History size={14} />
          History
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-1">
          {sessionsLoading ? (
            <p className="text-sm text-gray-400 px-2 py-4">Loading...</p>
          ) : sessions.length === 0 ? (
            <p className="text-sm text-gray-400 px-2 py-4">No past chats yet</p>
          ) : (
            sessions.map((session) => (
              <button
                key={session.id}
                type="button"
                onClick={() => openSession(session)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition truncate ${
                  viewingSessionId === session.id
                    ? "bg-indigo-50 text-indigo-700 font-medium"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
                title={session.title}
              >
                {session.title}
              </button>
            ))
          )}
        </div>
      </aside>

      <div className="flex flex-col flex-1 min-w-0">
        {isViewingHistory && (
          <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 text-sm text-amber-800 flex items-center justify-between">
            <span>Viewing a past conversation</span>
            <button
              type="button"
              onClick={() => void startNewChat()}
              className="text-indigo-600 font-medium hover:underline"
            >
              Start new chat
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-center">
              <div className="max-w-md">
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  Career Advisor Bot
                </h3>
                <p className="text-gray-600">
                  Ask me anything about careers, skills, education paths, or job
                  markets in India!
                </p>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                    message.role === "user"
                      ? "bg-indigo-600 text-white rounded-br-none"
                      : "bg-white text-gray-800 rounded-bl-none shadow-md"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))
          )}
          {isStreaming && messages.length === 0 && (
            <div className="flex justify-start">
              <div className="bg-white text-gray-800 px-4 py-3 rounded-lg rounded-bl-none shadow-md">
                <TypingAnimation />
              </div>
            </div>
          )}
        </div>

        <form
          onSubmit={handleSendMessage}
          className="border-t border-gray-200 p-4 bg-white"
        >
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                isViewingHistory
                  ? "Start a new chat to continue..."
                  : "Ask about careers, skills, or education..."
              }
              disabled={loading || isViewingHistory}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 disabled:bg-gray-100"
            />
            <button
              type="submit"
              disabled={loading || !input.trim() || isViewingHistory}
              className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition"
            >
              <Send size={20} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
