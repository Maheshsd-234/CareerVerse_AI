/**
 * frontend/src/services/ragChatService.ts
 * ─────────────────────────────────────────
 * Authenticated SSE client for the Python RAG backend (POST /chat and POST /chat/analyze-doc).
 *
 * Backend SSE Contract:
 * - `event: sources` -> JSON array of { index, title, category, last_verified, url }
 * - `event: token`   -> JSON object of { text: string }
 * - `event: done`    -> JSON object {}
 * - `event: error`   -> JSON object of { message: string }
 */

import { auth } from "../firebase/config";
import type { ChatSource } from "../types";

export interface RagHistoryItem {
  role: "user" | "assistant";
  content: string;
}

export interface StreamChatOptions {
  signal?: AbortSignal;
  onSources?: (sources: ChatSource[]) => void;
  onMode?: (mode: string) => void;
  onToken?: (token: string) => void;
}

const rawBackendUrl = import.meta.env.VITE_RAG_BACKEND_URL?.trim() || "http://localhost:8000";
const RAG_BACKEND_URL = rawBackendUrl.replace(/\/+$/, "");

/**
 * Helper to fetch with Firebase authentication and automatic 401 token refresh retry (JSON body).
 */
async function fetchWithAuth(
  endpoint: string,
  bodyData: Record<string, unknown>,
  signal?: AbortSignal
): Promise<Response> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("Please sign in to chat with the AI Counselor.");
  }

  let idToken = await currentUser.getIdToken(false);

  const makeRequest = (token: string) =>
    fetch(`${RAG_BACKEND_URL}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(bodyData),
      signal,
    });

  let response: Response;
  try {
    response = await makeRequest(idToken);
  } catch (err: unknown) {
    if (signal?.aborted) {
      throw err;
    }
    throw new Error(
      "Could not connect to the CareerVerse AI Counselor. Please make sure the backend server is running."
    );
  }

  // Handle 401 with a single token refresh retry
  if (response.status === 401) {
    try {
      idToken = await currentUser.getIdToken(true);
      response = await makeRequest(idToken);
    } catch {
      throw new Error("Your session has expired. Please sign in again.");
    }

    if (response.status === 401) {
      throw new Error("Your session has expired. Please sign in again.");
    }
  }

  return response;
}

/**
 * Helper to fetch with Firebase authentication using multipart/form-data for document uploads.
 */
async function fetchWithAuthFormData(
  endpoint: string,
  formData: FormData,
  signal?: AbortSignal
): Promise<Response> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("Please sign in to chat with the AI Counselor.");
  }

  let idToken = await currentUser.getIdToken(false);

  const makeRequest = (token: string) =>
    fetch(`${RAG_BACKEND_URL}${endpoint}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
      signal,
    });

  let response: Response;
  try {
    response = await makeRequest(idToken);
  } catch (err: unknown) {
    if (signal?.aborted) {
      throw err;
    }
    throw new Error(
      "Could not connect to the CareerVerse AI Counselor. Please make sure the backend server is running."
    );
  }

  // Handle 401 with a single token refresh retry
  if (response.status === 401) {
    try {
      idToken = await currentUser.getIdToken(true);
      response = await makeRequest(idToken);
    } catch {
      throw new Error("Your session has expired. Please sign in again.");
    }

    if (response.status === 401) {
      throw new Error("Your session has expired. Please sign in again.");
    }
  }

  return response;
}

/**
 * Shared SSE streaming decoder and processor.
 */
async function* processSseResponse(
  response: Response,
  options?: StreamChatOptions
): AsyncGenerator<string, void, unknown> {
  if (!response.ok) {
    if (response.status === 429) {
      throw new Error("You are sending requests too quickly. Please wait a moment and try again.");
    }
    if (response.status === 422) {
      throw new Error("Message or file is too large or formatted incorrectly.");
    }
    if (response.status === 413) {
      throw new Error("Uploaded file is too large. Maximum file size is 15MB.");
    }

    let detail = "The AI Counselor is temporarily unavailable. Please try again in a moment.";
    try {
      const errorJson = await response.json();
      if (errorJson?.detail && typeof errorJson.detail === "string") {
        detail = errorJson.detail;
      }
    } catch {
      // Use fallback error message
    }
    throw new Error(detail);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("Streaming not supported by this browser environment.");
  }

  const decoder = new TextDecoder("utf-8");
  let buffer = "";
  let currentEvent = "";

  try {
    while (true) {
      if (options?.signal?.aborted) {
        await reader.cancel();
        return;
      }

      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) {
          currentEvent = "";
          continue;
        }
        if (trimmed.startsWith(":")) {
          continue;
        }

        if (trimmed.startsWith("event: ")) {
          currentEvent = trimmed.slice(7).trim();
          continue;
        }

        if (trimmed.startsWith("data: ")) {
          const rawData = trimmed.slice(6).trim();

          if (currentEvent === "mode") {
            try {
              const parsed = JSON.parse(rawData) as { mode?: string };
              if (parsed.mode) {
                options?.onMode?.(parsed.mode);
              }
            } catch (err) {
              console.warn("Failed to parse SSE mode payload:", err);
            }
            continue;
          }

          if (currentEvent === "sources") {
            try {
              const sources = JSON.parse(rawData) as ChatSource[];
              options?.onSources?.(sources);
            } catch (err) {
              console.warn("Failed to parse SSE sources payload:", err);
            }
            continue;
          }

          if (currentEvent === "token") {
            try {
              const parsed = JSON.parse(rawData) as { text?: string };
              const tokenText = parsed.text ?? "";
              if (tokenText) {
                options?.onToken?.(tokenText);
                yield tokenText;
              }
            } catch {
              if (rawData) {
                options?.onToken?.(rawData);
                yield rawData;
              }
            }
            continue;
          }

          if (currentEvent === "done") {
            return;
          }

          if (currentEvent === "error") {
            let errorMsg = "An error occurred while generating the response.";
            try {
              const parsed = JSON.parse(rawData) as { message?: string };
              if (parsed.message) errorMsg = parsed.message;
            } catch {
              if (rawData) errorMsg = rawData;
            }
            throw new Error(errorMsg);
          }

          if (rawData === "[DONE]") {
            return;
          }

          try {
            const parsed = JSON.parse(rawData);
            if (typeof parsed === "string") {
              options?.onToken?.(parsed);
              yield parsed;
            } else if (parsed?.text) {
              options?.onToken?.(parsed.text);
              yield parsed.text;
            }
          } catch {
            if (rawData) {
              options?.onToken?.(rawData);
              yield rawData;
            }
          }
        }
      }
    }
  } catch (err: unknown) {
    if (options?.signal?.aborted) {
      return;
    }
    throw err;
  }
}

/**
 * Stream a chat response from the Python RAG backend.
 */
export async function* streamRagChat(
  userMessage: string,
  history: RagHistoryItem[] = [],
  options?: StreamChatOptions
): AsyncGenerator<string, void, unknown> {
  const trimmedHistory = history
    .filter((h) => h.content && h.content.trim())
    .slice(-6);

  const response = await fetchWithAuth(
    "/chat",
    {
      message: userMessage,
      history: trimmedHistory,
    },
    options?.signal
  );

  yield* processSseResponse(response, options);
}

/**
 * Stream a document / PDF analysis response from the Python backend (POST /chat/analyze-doc).
 */
export async function* streamDocAnalysis(
  file: File,
  prompt?: string,
  options?: StreamChatOptions
): AsyncGenerator<string, void, unknown> {
  const formData = new FormData();
  formData.append("file", file);
  if (prompt && prompt.trim()) {
    formData.append("prompt", prompt.trim());
  }

  const response = await fetchWithAuthFormData(
    "/chat/analyze-doc",
    formData,
    options?.signal
  );

  yield* processSseResponse(response, options);
}
