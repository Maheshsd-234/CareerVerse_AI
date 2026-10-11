import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  History,
  MessageSquarePlus,
  Send,
  Sparkles,
  ArrowRight,
  Trash2,
  Clock,
  Square,
  Download,
  FileText,
  Printer,
  ChevronDown,
  Paperclip,
  X,
} from "lucide-react";
import { streamRagChat, streamDocAnalysis, type RagHistoryItem } from "../../services/ragChatService";
import { firestoreService } from "../../services/firestoreService";
import { useAuth } from "../../hooks/useAuth";
import { Button } from "../ui/UI";
import { FormattedMessage } from "./FormattedMessage";
import { generateFollowUpSuggestions } from "../../utils/suggestions";
import { exportToMarkdown, exportToPDF } from "../../utils/exportSummary";
import type { ChatMessage, ChatSession, ChatSource } from "../../types";

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

    // Clean sources array to prevent Firestore undefined errors
    let cleanSources: ChatSource[] | null = null;
    if (message.sources && Array.isArray(message.sources)) {
      cleanSources = message.sources.map((s) => ({
        index: s.index,
        title: s.title || "Career Guide",
        category: s.category || "other",
        last_verified: s.last_verified || "",
        url: s.url ?? null,
      }));
    }

    const cleanMode = typeof message.mode === "string" ? message.mode : null;

    return { ...message, id, timestamp, sources: cleanSources, mode: cleanMode };
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
  "What is the eligibility criteria and exam pattern for JEE Advanced?",
  "Compare 12th Science (PCM) vs Commerce with Maths career scopes in India.",
  "How can I become an AI/ML Engineer in India starting from 1st year B.Tech?",
  "What are the typical fresher software engineer salaries in India?",
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
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const messagesRef = useRef<ChatMessage[]>([]);
  const sendingRef = useRef(false);
  const currentSessionIdRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    currentSessionIdRef.current = currentSessionId;
  }, [currentSessionId]);

  // Close export dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
    };
    if (showExportMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showExportMenu]);

  // Active session title
  const currentSessionTitle = useMemo(() => {
    const active = sessions.find((s) => s.id === currentSessionId);
    if (active) return active.title;
    return buildSessionTitle(messages);
  }, [sessions, currentSessionId, messages]);

  // Context-aware dynamic follow-up suggestions
  const followUpSuggestions = useMemo(() => {
    if (isStreaming || messages.length === 0) return [];
    return generateFollowUpSuggestions(messages);
  }, [messages, isStreaming]);

  // Smoothly keep chat scrolled to the latest token / message
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({
        behavior: isStreaming ? "auto" : "smooth",
      });
    }
  }, [messages, isStreaming]);

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
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (user) {
      localStorage.removeItem(activeChatKey(user.uid));
    }
    setCurrentSessionId(null);
    setCurrentSessionCreatedAt(null);
    setMessages([]);
    setInput("");
    setLoading(false);
    setIsStreaming(false);
  }, [user]);

  // Switch to an existing session from Transit Logs
  const openSession = useCallback((session: ChatSession) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (user) {
      localStorage.setItem(activeChatKey(user.uid), session.id);
    }
    setCurrentSessionId(session.id);
    setCurrentSessionCreatedAt(session.createdAt);
    setMessages(normalizeMessages(session.messages));
    setLoading(false);
    setIsStreaming(false);
  }, [user]);

  // Stop response generation mid-stream
  const handleStopResponse = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
    setLoading(false);
    sendingRef.current = false;
  };

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      alert("Selected file exceeds the 15MB limit. Please choose a smaller document.");
      e.target.value = "";
      return;
    }

    const validExtensions = [".pdf", ".txt", ".md"];
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!validExtensions.includes(ext)) {
      alert("Please upload a PDF (.pdf), Text (.txt), or Markdown (.md) document.");
      e.target.value = "";
      return;
    }

    setSelectedFile(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Send message and stream answer from RAG backend
  const handleSendMessage = async (e?: React.FormEvent, customPrompt?: string) => {
    if (e) e.preventDefault();

    const fileToProcess = selectedFile;
    const defaultDocPrompt =
      "Analyze this document and provide the top 5 most important, high-yield exam/interview questions with detailed model answers, key concepts tested, and page references.";
    const rawContent = (customPrompt ?? input).trim();
    const effectivePrompt = rawContent || (fileToProcess ? defaultDocPrompt : "");

    if (!effectivePrompt || loading || sendingRef.current) return;

    // Friendly prompt for signed-out users
    if (!user) {
      const signedOutNotice: ChatMessage = {
        id: newMessageId(),
        role: "assistant",
        content: "Please sign in to chat with the 24/7 AI Career Counselor.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, signedOutNotice]);
      return;
    }

    sendingRef.current = true;
    setInput("");
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setLoading(true);
    setIsStreaming(true);

    const abortCtrl = new AbortController();
    abortControllerRef.current = abortCtrl;

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
      content: fileToProcess
        ? `📎 **[Attached: ${fileToProcess.name}]**\n\n${effectivePrompt}`
        : effectivePrompt,
      timestamp: new Date(),
    };

    let capturedSources: ChatSource[] = [];
    let capturedMode: string | null = null;

    const assistantMessage: ChatMessage = {
      id: newMessageId(),
      role: "assistant",
      content: "",
      timestamp: new Date(),
      sources: [],
      mode: null,
    };

    const updatedWithUser = [...messagesRef.current, userMessage];
    setMessages([...updatedWithUser, assistantMessage]);

    let assistantText = "";

    const updateAssistant = (
      text: string,
      sources: ChatSource[],
      mode: string | null
    ) => {
      const updatedAssistant: ChatMessage = {
        ...assistantMessage,
        content: text,
        sources: sources.length > 0 ? sources : null,
        mode: mode ?? null,
      };
      setMessages([...updatedWithUser, updatedAssistant]);
    };

    try {
      // Build conversation history (only prior user & assistant turns, last 6 turns)
      const ragHistory: RagHistoryItem[] = messagesRef.current
        .filter((m) => (m.role === "user" || m.role === "assistant") && m.content.trim())
        .slice(-6)
        .map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }));

      const stream = fileToProcess
        ? streamDocAnalysis(fileToProcess, effectivePrompt, {
            signal: abortCtrl.signal,
            onMode: (mode) => {
              capturedMode = mode;
              updateAssistant(assistantText, capturedSources, capturedMode);
            },
            onSources: (sources) => {
              capturedSources = sources;
              updateAssistant(assistantText, capturedSources, capturedMode);
            },
          })
        : streamRagChat(effectivePrompt, ragHistory, {
            signal: abortCtrl.signal,
            onMode: (mode) => {
              capturedMode = mode;
              updateAssistant(assistantText, capturedSources, capturedMode);
            },
            onSources: (sources) => {
              capturedSources = sources;
              updateAssistant(assistantText, capturedSources, capturedMode);
            },
          });

      for await (const chunk of stream) {
        if (abortCtrl.signal.aborted) break;
        assistantText += chunk;
        updateAssistant(assistantText, capturedSources, capturedMode);
      }
    } catch (error: unknown) {
      if (!abortCtrl.signal.aborted) {
        console.error("Chat stream error:", error);
        const errMsg =
          error instanceof Error
            ? error.message
            : "Could not connect to the AI Counselor. Please try again.";

        if (!assistantText.trim()) {
          assistantText = errMsg;
          updateAssistant(assistantText, capturedSources, capturedMode);
        } else {
          // Append error notice if stream dropped mid-way
          assistantText += `\n\n*(Note: Connection interrupted — ${errMsg})*`;
          updateAssistant(assistantText, capturedSources, capturedMode);
        }
      }
    } finally {
      // If user aborted before any text was received, remove the empty assistant message
      if (!assistantText.trim() && abortCtrl.signal.aborted) {
        setMessages(normalizeMessages(updatedWithUser));
      } else {
        // Complete assistant message & save permanently to Firestore
        const finalAssistant: ChatMessage = {
          ...assistantMessage,
          content: assistantText || "Response generation stopped.",
          sources: capturedSources.length > 0 ? capturedSources : null,
          mode: capturedMode ?? null,
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
          console.error("Failed to save chat session to Firestore:", saveErr);
        }
      }

      setLoading(false);
      setIsStreaming(false);
      sendingRef.current = false;
      abortControllerRef.current = null;
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
        {/* Chat Top Header */}
        <div className="px-4 py-3 bg-white border-b border-gray-200 flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[#4F46E5]/10 text-[#4F46E5] flex items-center justify-center shrink-0">
              <Sparkles size={16} />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs sm:text-sm font-display font-bold text-[#12122B] truncate max-w-[200px] sm:max-w-md">
                {currentSessionTitle}
              </h4>
              <div className="flex items-center gap-1.5 text-[10px] font-data text-emerald-600 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>RAG Verified • Indian Edu Domain</span>
              </div>
            </div>
          </div>

          {/* Export Counseling Summary Action */}
          {messages.length > 0 && (
            <div className="relative" ref={exportMenuRef}>
              <button
                type="button"
                onClick={() => setShowExportMenu((prev) => !prev)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 hover:border-[#4F46E5] bg-white hover:bg-[#4F46E5]/5 text-xs font-display font-medium text-[#12122B] transition cursor-pointer shadow-xs"
                title="Export Counseling Summary"
              >
                <Download size={13} className="text-[#4F46E5]" />
                <span className="hidden sm:inline">Export Summary</span>
                <ChevronDown size={12} className={`text-gray-400 transition-transform ${showExportMenu ? "rotate-180" : ""}`} />
              </button>

              {showExportMenu && (
                <div className="absolute right-0 mt-1.5 w-52 bg-white rounded-xl shadow-lg border border-gray-200 py-1.5 z-30 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="px-3 py-1.5 border-b border-gray-100">
                    <p className="text-[10px] font-data uppercase tracking-wider text-gray-400 font-semibold">
                      Export Transcript
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowExportMenu(false);
                      exportToPDF(currentSessionTitle, messages);
                    }}
                    className="w-full px-3 py-2 text-left text-xs font-display font-medium text-[#12122B] hover:bg-[#4F46E5]/5 hover:text-[#4F46E5] flex items-center gap-2 cursor-pointer transition"
                  >
                    <Printer size={14} className="text-[#4F46E5]" />
                    <div>
                      <div>Print / Save as PDF</div>
                      <div className="text-[10px] text-gray-400 font-normal">Formatted report with citations</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowExportMenu(false);
                      exportToMarkdown(currentSessionTitle, messages);
                    }}
                    className="w-full px-3 py-2 text-left text-xs font-display font-medium text-[#12122B] hover:bg-[#4F46E5]/5 hover:text-[#4F46E5] flex items-center gap-2 cursor-pointer transition"
                  >
                    <FileText size={14} className="text-emerald-600" />
                    <div>
                      <div>Download Markdown</div>
                      <div className="text-[10px] text-gray-400 font-normal">Plain .md summary with sources</div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

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
                Grounded guidance on Indian educational streams, entrance exams, tier-1/2 college pathways, and engineering roles.
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
            messages.map((message, idx) => {
              const isLatestAssistant =
                isStreaming &&
                idx === messages.length - 1 &&
                message.role === "assistant";

              return (
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
                    className={`px-4 sm:px-5 py-3.5 rounded-2xl text-xs sm:text-sm font-body leading-relaxed transition-all ${
                      message.role === "user"
                        ? "max-w-md lg:max-w-lg bg-[#4F46E5] text-white rounded-br-xs shadow-xs"
                        : "max-w-2xl lg:max-w-3xl xl:max-w-4xl bg-white text-[#12122B] border border-gray-200/90 rounded-bl-xs shadow-xs"
                    }`}
                  >
                    <FormattedMessage
                      content={message.content}
                      isUser={message.role === "user"}
                      sources={message.sources}
                      mode={message.mode}
                      isStreaming={isLatestAssistant}
                    />

                    {/* Dynamic Follow-Up Suggestion Chips */}
                    {idx === messages.length - 1 &&
                      message.role === "assistant" &&
                      !isStreaming &&
                      followUpSuggestions.length > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-gray-100/90">
                          <div className="flex items-center gap-1 text-[10px] font-data font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                            <Sparkles size={11} className="text-[#4F46E5]" />
                            <span>Suggested Follow-Ups</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {followUpSuggestions.map((suggestion, sIdx) => (
                              <button
                                key={sIdx}
                                type="button"
                                onClick={() => handleSendMessage(undefined, suggestion)}
                                className="group/chip text-left text-xs font-display font-medium bg-[#4F46E5]/5 hover:bg-[#4F46E5] text-[#4F46E5] hover:text-white border border-[#4F46E5]/20 hover:border-transparent px-2.5 py-1.5 rounded-lg transition-all duration-150 flex items-center gap-1.5 cursor-pointer shadow-2xs hover:shadow-xs active:scale-[0.98]"
                              >
                                <span>{suggestion}</span>
                                <ArrowRight
                                  size={11}
                                  className="text-[#4F46E5]/60 group-hover/chip:text-white group-hover/chip:translate-x-0.5 transition-transform"
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                </motion.div>
              );
            })
          )}

          {/* Anchor to scroll smoothly into view */}
          <div ref={messagesEndRef} className="h-1" />
        </div>

        {/* Chat Input Bar */}
        <form
          onSubmit={handleSendMessage}
          className="border-t border-gray-200 p-4 bg-white shrink-0"
        >
          {/* Attached Document Preview & Action Suggestions */}
          {selectedFile && (
            <div className="mb-3 p-2.5 bg-indigo-50/70 border border-indigo-200/80 rounded-xl flex flex-col gap-2 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-[#4F46E5] text-white flex items-center justify-center shrink-0">
                    <FileText size={15} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-display font-bold text-[#12122B] truncate max-w-[200px] sm:max-w-md">
                      {selectedFile.name}
                    </p>
                    <p className="text-[10px] font-data text-gray-500">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for Analysis
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="p-1 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                  title="Remove document"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Document Quick Action Presets */}
              <div className="flex flex-wrap gap-1.5 pt-1 border-t border-indigo-100">
                <button
                  type="button"
                  onClick={() =>
                    handleSendMessage(
                      undefined,
                      "Analyze this document and generate the top 5 most important, high-yield exam/interview questions with detailed model answers, key concepts tested, and page references."
                    )
                  }
                  className="text-[11px] font-display font-medium bg-white hover:bg-[#4F46E5] text-[#4F46E5] hover:text-white border border-indigo-200 px-2 py-1 rounded-lg transition shadow-2xs cursor-pointer flex items-center gap-1 active:scale-[0.98]"
                >
                  🎯 <span>Top 5 High-Yield Questions</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleSendMessage(
                      undefined,
                      "Provide a comprehensive summary of this document, including key eligibility criteria, important dates, and critical takeaways."
                    )
                  }
                  className="text-[11px] font-display font-medium bg-white hover:bg-[#4F46E5] text-[#4F46E5] hover:text-white border border-indigo-200 px-2 py-1 rounded-lg transition shadow-2xs cursor-pointer flex items-center gap-1 active:scale-[0.98]"
                >
                  📋 <span>Summarize Key Dates & Rules</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleSendMessage(
                      undefined,
                      "Extract all core topics, syllabus weightages, and must-know preparation tips from this document."
                    )
                  }
                  className="text-[11px] font-display font-medium bg-white hover:bg-[#4F46E5] text-[#4F46E5] hover:text-white border border-indigo-200 px-2 py-1 rounded-lg transition shadow-2xs cursor-pointer flex items-center gap-1 active:scale-[0.98]"
                >
                  💡 <span>Extract Core Concepts</span>
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".pdf,.txt,.md,application/pdf,text/plain,text/markdown"
              className="hidden"
            />

            {/* Upload File / PDF Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading || isStreaming}
              className={`p-2.5 rounded-xl border transition cursor-pointer shrink-0 flex items-center justify-center ${
                selectedFile
                  ? "bg-[#4F46E5] text-white border-[#4F46E5] shadow-xs"
                  : "bg-white text-gray-500 hover:text-[#4F46E5] hover:bg-gray-100 border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              }`}
              title="Attach PDF or Document for Q&A and Top 5 Questions"
            >
              <Paperclip size={16} />
            </button>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                isStreaming
                  ? "Counselor is analyzing..."
                  : selectedFile
                  ? "Ask anything about this document, or click a preset above..."
                  : "Ask about exams, cutoffs, degrees, or attach a PDF..."
              }
              disabled={loading || isStreaming}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4F46E5] text-xs font-body disabled:bg-gray-100 disabled:text-gray-400"
            />

            {isStreaming ? (
              <Button
                type="button"
                onClick={handleStopResponse}
                size="md"
                className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-1.5 px-3.5"
                title="Stop response"
              >
                <Square size={14} fill="currentColor" />
                <span className="text-xs font-display">Stop</span>
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={loading || (!input.trim() && !selectedFile)}
                size="md"
              >
                <Send size={16} />
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
