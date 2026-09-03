import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  History,
  MessageSquarePlus,
  Send,
  Sparkles,
  ArrowRight,
  Trash2,
  Clock,
} from "lucide-react";
import { formatGroqError, groqService } from "../../services/groqService";
import { firestoreService } from "../../services/firestoreService";
import { useAuth } from "../../hooks/useAuth";
import { TypingAnimation } from "../ui/Loading";
import { Button } from "../ui/UI";
import { FormattedMessage } from "./FormattedMessage";
import type { ChatMessage, ChatSession } from "../../types";

const newMessageId = () => crypto.randomUUID();
const activeChatKey = (uid: string) => `cv_active_chat_session_${uid}`;

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
  return `Route Chat · ${new Date().toLocaleDateString()}`;
};

const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

const PROMPT_SUGGESTIONS = [
  "What is the best career route after 10th standard in India?",
  "Compare 12th Science (PCM) vs Commerce with Maths career scopes.",
  "How can I become an AI Engineer in India starting from 1st year?",
  "Which high-demand skills should I learn for tech placements in 2026?",
];

export const ChatBot: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [currentSessionCreatedAt, setCurrentSessionCreatedAt] = useState<Date | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(true);

  const messagesRef = useRef<ChatMessage[]>([]);
  const sendingRef = useRef(false);
  const currentSessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    currentSessionIdRef.current = currentSessionId;
  }, [currentSessionId]);

  // Load all sessions & restore active session
  const loadSessions = useCallback(async () => {
    if (!user) return [];
    setSessionsLoading(true);
    try {
      await firestoreService.migrateLegacyChat(user.uid);
      const list = await firestoreService.listChatSessions(user.uid);
      setSessions(list);

      // Restore active session if current view is empty
      if (list.length > 0 && (!currentSessionIdRef.current || messagesRef.current.length === 0)) {
        const savedActiveId = localStorage.getItem(activeChatKey(user.uid));
        const matched = (savedActiveId && list.find((s) => s.id === savedActiveId)) || list[0];
        if (matched) {
          setCurrentSessionId(matched.id);
          setCurrentSessionCreatedAt(matched.createdAt);
          setMessages(normalizeMessages(matched.messages));
          localStorage.setItem(activeChatKey(user.uid), matched.id);
        }
      }

      return list;
    } catch (error) {
      console.error("Failed to load chat sessions:", error);
      return [];
    } finally {
      setSessionsLoading(false);
    }
  }, [user]);

  // Synchronously load cached local sessions immediately on user mount
  useEffect(() => {
    if (!user) return;

    // 1. Instant local restore
    const local = firestoreService.getLocalSessions(user.uid);
    if (local.length > 0) {
      setSessions(local);
      const savedActiveId = localStorage.getItem(activeChatKey(user.uid));
      const matched = (savedActiveId && local.find((s) => s.id === savedActiveId)) || local[0];
      if (matched && messagesRef.current.length === 0) {
        setCurrentSessionId(matched.id);
        setCurrentSessionCreatedAt(matched.createdAt);
        setMessages(normalizeMessages(matched.messages));
      }
    }

    // 2. Fresh Firestore sync
    void loadSessions();
  }, [user, loadSessions]);

  // Start a fresh new chat session
  const startNewChat = useCallback(() => {
    if (user) {
      localStorage.removeItem(activeChatKey(user.uid));
    }
    setCurrentSessionId(null);
    setCurrentSessionCreatedAt(null);
    setMessages([]);
    setInput("");
  }, [user]);

  // Switch to an existing session from Transit Logs
  const openSession = useCallback((session: ChatSession) => {
    if (user) {
      localStorage.setItem(activeChatKey(user.uid), session.id);
    }
    setCurrentSessionId(session.id);
    setCurrentSessionCreatedAt(session.createdAt);
    setMessages(normalizeMessages(session.messages));
  }, [user]);

  // Delete a specific session
  const handleDeleteSession = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (!user) return;

    try {
      await firestoreService.deleteChatSession(user.uid, sessionId);
      const remaining = sessions.filter((s) => s.id !== sessionId);
      setSessions(remaining);

      // If the currently open session was deleted, switch to next available or start new
      if (currentSessionId === sessionId) {
        if (remaining.length > 0) {
          const next = remaining[0];
          openSession(next);
        } else {
          startNewChat();
        }
      }
    } catch (err) {
      console.error("Failed to delete session:", err);
    }
  };

  // Clear all sessions
  const handleClearAllSessions = async () => {
    if (!user) return;
    const confirmed = window.confirm("Are you sure you want to delete all transit logs?");
    if (!confirmed) return;

    try {
      await firestoreService.clearAllChatSessions(user.uid);
      setSessions([]);
      startNewChat();
    } catch (err) {
      console.error("Failed to clear sessions:", err);
    }
  };

  // Send message and automatically persist session in Firestore & LocalStorage
  const handleSendMessage = async (e?: React.FormEvent, customPrompt?: string) => {
    if (e) e.preventDefault();
    const content = (customPrompt ?? input).trim();
    if (!content || loading || sendingRef.current || !user) return;

    sendingRef.current = true;
    setInput("");
    setLoading(true);
    setIsStreaming(true);

    const sessionId = currentSessionId || newMessageId();
    const sessionCreatedAt = currentSessionCreatedAt || new Date();
    if (!currentSessionId) {
      setCurrentSessionId(sessionId);
      setCurrentSessionCreatedAt(sessionCreatedAt);
      localStorage.setItem(activeChatKey(user.uid), sessionId);
    }

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

    const updatedWithUser = [...messagesRef.current, userMessage];
    setMessages([...updatedWithUser, assistantMessage]);

    const updateAssistant = (text: string) => {
      const updatedAssistant: ChatMessage = { ...assistantMessage, content: text };
      setMessages([...updatedWithUser, updatedAssistant]);
    };

    let assistantText = "";
    try {
      for await (const chunk of groqService.streamChat(content)) {
        assistantText += chunk;
        updateAssistant(assistantText);
      }
    } catch (error) {
      console.error("Chat stream error:", error);
      if (!assistantText.trim()) {
        assistantText = formatGroqError(error);
        updateAssistant(assistantText);
      }
    } finally {
      // Complete assistant message & save permanently to Firestore & localStorage
      const finalAssistant: ChatMessage = {
        ...assistantMessage,
        content: assistantText || "Sorry, I could not generate a response. Please try again.",
      };
      const finalMessageList = normalizeMessages([...updatedWithUser, finalAssistant]);
      setMessages(finalMessageList);

      const sessionObj: ChatSession = {
        id: sessionId,
        title: buildSessionTitle(finalMessageList),
        messages: finalMessageList,
        createdAt: sessionCreatedAt,
        updatedAt: new Date(),
      };

      try {
        await firestoreService.saveChatSession(user.uid, sessionObj);
        setSessions((prev) => [
          sessionObj,
          ...prev.filter((s) => s.id !== sessionId),
        ]);
      } catch (saveErr) {
        console.error("Failed to save chat to Firestore:", saveErr);
      }

      setLoading(false);
      setIsStreaming(false);
      sendingRef.current = false;
    }
  };

  return (
    <div className="flex h-full min-h-0 bg-[#FAFAF7] rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
      {/* Session History Sidebar */}
      <aside className="w-72 shrink-0 border-r border-gray-200 bg-white flex flex-col hidden sm:flex">
        {/* New Chat Button */}
        <div className="p-3.5 border-b border-gray-200">
          <button
            type="button"
            onClick={startNewChat}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-[#4F46E5] text-white text-xs font-display font-bold hover:bg-[#4338CA] transition cursor-pointer shadow-xs"
          >
            <MessageSquarePlus size={16} />
            New Counseling Session
          </button>
        </div>

        {/* Sidebar Header */}
        <div className="px-3.5 py-2.5 flex items-center justify-between border-b border-gray-100">
          <div className="flex items-center gap-1.5 text-[10px] font-data font-bold text-[#6B7280] uppercase tracking-wider">
            <History size={13} className="text-[#4F46E5]" />
            Transit Logs ({sessions.length})
          </div>

          {sessions.length > 0 && (
            <button
              type="button"
              onClick={handleClearAllSessions}
              className="text-[10px] font-data text-red-500 hover:text-red-700 hover:underline cursor-pointer"
              title="Clear all saved transit logs"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {sessionsLoading && sessions.length === 0 ? (
            <div className="p-4 space-y-2 animate-pulse">
              <div className="h-8 bg-gray-100 rounded-xl w-full" />
              <div className="h-8 bg-gray-100 rounded-xl w-4/5" />
              <div className="h-8 bg-gray-100 rounded-xl w-3/4" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-8 px-3">
              <p className="text-xs font-data text-gray-400">No past logs recorded</p>
              <p className="text-[11px] font-body text-gray-400 mt-1">
                Your conversations will be saved here automatically.
              </p>
            </div>
          ) : (
            sessions.map((session) => {
              const isSelected = currentSessionId === session.id;
              const dateObj =
                session.updatedAt instanceof Date
                  ? session.updatedAt
                  : new Date(session.updatedAt as string | number);

              return (
                <div
                  key={session.id}
                  onClick={() => openSession(session)}
                  className={`group relative w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition cursor-pointer ${
                    isSelected
                      ? "bg-[#4F46E5]/10 border border-[#4F46E5]/25 text-[#4F46E5]"
                      : "hover:bg-gray-100 text-[#12122B] border border-transparent"
                  }`}
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <p className={`text-xs font-display font-medium truncate ${isSelected ? "font-bold text-[#4F46E5]" : "text-[#12122B]"}`}>
                      {session.title}
                    </p>
                    <span className="text-[10px] font-data text-gray-400 flex items-center gap-1 mt-0.5">
                      <Clock size={10} />
                      {formatTimeAgo(dateObj)}
                    </span>
                  </div>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={(e) => handleDeleteSession(e, session.id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer shrink-0"
                    title="Delete log"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* Chat Area */}
      <div className="flex flex-col flex-1 min-w-0 bg-[#FAFAF7]">
        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center max-w-lg mx-auto py-8">
              <div className="w-12 h-12 rounded-2xl bg-[#4F46E5]/10 text-[#4F46E5] flex items-center justify-center mb-3">
                <Sparkles size={24} />
              </div>
              <h3 className="text-2xl font-display font-bold text-[#12122B] mb-2">
                24/7 AI Career Counselor
              </h3>
              <p className="text-xs font-body text-[#6B7280] mb-6">
                Trained on Indian educational streams, entrance exams, tier-1/2 college pathways, and modern hiring trends.
              </p>

              {/* Prompt Suggestions */}
              <div className="w-full space-y-2 text-left">
                <span className="text-[10px] font-data font-bold text-[#6B7280] uppercase tracking-wider block px-1">
                  Suggested Waypoint Queries:
                </span>
                {PROMPT_SUGGESTIONS.map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(undefined, prompt)}
                    className="w-full p-2.5 rounded-xl bg-white border border-gray-200 hover:border-[#4F46E5] hover:bg-[#4F46E5]/5 text-xs font-display font-medium text-[#12122B] transition flex items-center justify-between text-left cursor-pointer group"
                  >
                    <span>{prompt}</span>
                    <ArrowRight
                      size={14}
                      className="text-gray-300 group-hover:text-[#4F46E5] transition-transform group-hover:translate-x-1"
                    />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`px-4 sm:px-5 py-3.5 rounded-2xl text-xs sm:text-sm font-body leading-relaxed ${
                    message.role === "user"
                      ? "max-w-md lg:max-w-lg bg-[#4F46E5] text-white rounded-br-xs shadow-xs"
                      : "max-w-2xl lg:max-w-3xl xl:max-w-4xl bg-white text-[#12122B] border border-gray-200/90 rounded-bl-xs shadow-xs"
                  }`}
                >
                  <FormattedMessage
                    content={message.content}
                    isUser={message.role === "user"}
                  />
                </div>
              </motion.div>
            ))
          )}

          {/* Typing Indicator with 3 pulsing dots in Signal Blue */}
          {isStreaming && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl rounded-bl-xs shadow-xs flex items-center gap-2">
                <span className="text-xs font-data text-[#6B7280]">Counselor is mapping</span>
                <TypingAnimation />
              </div>
            </motion.div>
          )}
        </div>

        {/* Chat Input Bar */}
        <form
          onSubmit={handleSendMessage}
          className="border-t border-gray-200 p-4 bg-white shrink-0"
        >
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about careers, 10th/12th streams, college pathways, skills, or exams..."
              disabled={loading}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4F46E5] text-xs font-body disabled:bg-gray-100"
            />
            <Button
              type="submit"
              disabled={loading || !input.trim()}
              size="md"
            >
              <Send size={16} />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
