import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { History, MessageSquarePlus, Send, Sparkles, ArrowRight } from "lucide-react";
import { formatGeminiError, geminiService } from "../../services/geminiService";
import { firestoreService } from "../../services/firestoreService";
import { useAuth } from "../../hooks/useAuth";
import { TypingAnimation } from "../ui/Loading";
import { Button } from "../ui/UI";
import type { ChatMessage, ChatSession } from "../../types";

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
  return `Route Chat · ${new Date().toLocaleDateString()}`;
};

const hasSavableMessages = (messages: ChatMessage[]) =>
  messages.some((m) => m.content.trim());

const PROMPT_SUGGESTIONS = [
  "What is the best career route after 12th Science PCM?",
  "How can I become an AI Engineer in India starting from 1st year?",
  "Compare Chartered Accountancy (CA) vs MBA in Finance salaries.",
  "Which high-demand skills should I learn for tech placements in 2026?",
];

export const ChatBot: React.FC = () => {
  const { user } = useAuth();
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
  const archiveInFlightRef = useRef(false);

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
          updatedAt: now,
          createdAt: now,
        };

        await firestoreService.saveChatSession(user.uid, session);
        localStorage.removeItem(pendingArchiveKey(user.uid));

        setSessions((prev) => [
          session,
          ...prev.filter((s) => s.id !== session.id),
        ]);
        return true;
      } catch (error) {
        console.error("Failed to archive chat session:", error);
        return false;
      } finally {
        archiveInFlightRef.current = false;
      }
    },
    [user]
  );

  const startNewChat = useCallback(async () => {
    if (!isViewingHistory && hasSavableMessages(messagesRef.current)) {
      await archiveCurrentChat();
    }
    setViewingSessionId(null);
    setMessages([]);
    setInput("");
  }, [archiveCurrentChat, isViewingHistory]);

  const openSession = useCallback(
    async (session: ChatSession) => {
      if (!isViewingHistory && hasSavableMessages(messagesRef.current)) {
        await archiveCurrentChat();
      }
      setViewingSessionId(session.id);
      setMessages(normalizeMessages(session.messages));
    },
    [archiveCurrentChat, isViewingHistory]
  );

  useEffect(() => {
    if (!user) return;
    void loadSessions();
  }, [user, loadSessions]);

  const handleSendMessage = async (e?: React.FormEvent, customPrompt?: string) => {
    if (e) e.preventDefault();
    const content = (customPrompt ?? input).trim();
    if (!content || loading || isViewingHistory || sendingRef.current) return;

    sendingRef.current = true;
    setInput("");
    setLoading(true);
    setIsStreaming(true);

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
    <div className="flex h-full min-h-0 bg-[#FAFAF7] rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
      {/* Session History Sidebar */}
      <aside className="w-64 shrink-0 border-r border-gray-200 bg-white flex flex-col hidden sm:flex">
        <div className="p-3 border-b border-gray-200">
          <button
            type="button"
            onClick={() => void startNewChat()}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-[#4F46E5] text-white text-xs font-display font-bold hover:bg-[#4338CA] transition cursor-pointer shadow-xs"
          >
            <MessageSquarePlus size={16} />
            New Counseling Session
          </button>
        </div>

        <div className="px-3 py-2 flex items-center gap-2 text-[10px] font-data font-bold text-[#6B7280] uppercase tracking-wider">
          <History size={12} />
          Transit Logs
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-1">
          {sessionsLoading ? (
            <p className="text-xs font-data text-gray-400 px-2 py-4">Calibrating logs...</p>
          ) : sessions.length === 0 ? (
            <p className="text-xs font-data text-gray-400 px-2 py-4">No past logs recorded</p>
          ) : (
            sessions.map((session) => (
              <button
                key={session.id}
                type="button"
                onClick={() => openSession(session)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-display font-medium transition truncate cursor-pointer ${
                  viewingSessionId === session.id
                    ? "bg-[#4F46E5]/10 text-[#4F46E5] font-bold border border-[#4F46E5]/20"
                    : "text-[#12122B]/80 hover:bg-gray-100"
                }`}
                title={session.title}
              >
                {session.title}
              </button>
            ))
          )}
        </div>
      </aside>

      {/* Chat Area */}
      <div className="flex flex-col flex-1 min-w-0 bg-[#FAFAF7]">
        {isViewingHistory && (
          <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 text-xs font-data text-amber-900 flex items-center justify-between">
            <span>Viewing archived conversation log</span>
            <button
              type="button"
              onClick={() => void startNewChat()}
              className="text-[#4F46E5] font-bold hover:underline cursor-pointer"
            >
              Start new session →
            </button>
          </div>
        )}

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
                    onClick={() => handleSendMessage(undefined, prompt)}
                    className="w-full p-2.5 rounded-xl bg-white border border-gray-200 hover:border-[#4F46E5] hover:bg-[#4F46E5]/5 text-xs font-display font-medium text-[#12122B] transition flex items-center justify-between text-left cursor-pointer group"
                  >
                    <span>{prompt}</span>
                    <ArrowRight size={14} className="text-gray-300 group-hover:text-[#4F46E5] transition-transform group-hover:translate-x-1" />
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
                  className={`max-w-md lg:max-w-xl px-4 py-3 rounded-2xl text-sm font-body leading-relaxed ${
                    message.role === "user"
                      ? "bg-[#4F46E5] text-white rounded-br-xs shadow-xs"
                      : "bg-white text-[#12122B] border border-gray-200/90 rounded-bl-xs shadow-xs"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
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
                  : "Ask about careers, skills, 10th/12th streams, colleges, or salary scales..."
              }
              disabled={loading || isViewingHistory}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4F46E5] text-xs font-body disabled:bg-gray-100"
            />
            <Button
              type="submit"
              disabled={loading || !input.trim() || isViewingHistory}
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
