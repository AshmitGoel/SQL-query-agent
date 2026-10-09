import { useState, useCallback, useEffect } from 'react';
import type { ChatMessage, QueryResponse, SessionInfo } from '../types';
import { sendQuery } from '../api/client';

const STORAGE_KEY = 'sql-agent-sessions';

interface StoredSession {
  session_id: string;
  title: string;
  messages: ChatMessage[];
  updated_at: string;
}

function loadSessionsFromStorage(): StoredSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveSessionsToStorage(sessions: StoredSession[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch {
    // Storage full or unavailable — silently fail
  }
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);

  // Save current session to localStorage whenever messages change
  useEffect(() => {
    if (!sessionId || messages.length === 0) return;

    const stored = loadSessionsFromStorage();
    const nonLoading = messages.filter((m) => !m.isLoading);
    if (nonLoading.length === 0) return;

    // Derive title from first user message
    const firstUserMsg = nonLoading.find((m) => m.role === 'user');
    const title = firstUserMsg
      ? firstUserMsg.content.slice(0, 50) + (firstUserMsg.content.length > 50 ? '...' : '')
      : 'New Conversation';

    const existingIdx = stored.findIndex((s) => s.session_id === sessionId);
    const sessionData: StoredSession = {
      session_id: sessionId,
      title,
      messages: nonLoading,
      updated_at: new Date().toISOString(),
    };

    if (existingIdx >= 0) {
      stored[existingIdx] = sessionData;
    } else {
      stored.unshift(sessionData);
    }

    // Keep max 20 sessions
    saveSessionsToStorage(stored.slice(0, 20));
  }, [messages, sessionId]);

  const addMessage = useCallback((message: ChatMessage) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date(),
    };
    addMessage(userMessage);

    const loadingId = crypto.randomUUID();
    const loadingMessage: ChatMessage = {
      id: loadingId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true,
    };
    addMessage(loadingMessage);
    setIsLoading(true);

    try {
      const response: QueryResponse = await sendQuery({
        message: content,
        session_id: sessionId,
        chat_history: messages
          .filter((m) => !m.isLoading)
          .slice(-10)
          .map((m) => ({
            role: m.role,
            content: m.content,
            ...(m.sql ? { sql: m.sql } : {}),
          })),
      });

      if (response.session_id) {
        setSessionId(response.session_id);
      }

      const assistantMessage: ChatMessage = {
        id: loadingId,
        role: 'assistant',
        content: response.message,
        sql: response.sql || undefined,
        explanation: response.explanation || undefined,
        results: response.results,
        error: response.error,
        timestamp: new Date(),
      };

      setMessages((prev) =>
        prev.map((msg) => (msg.id === loadingId ? assistantMessage : msg))
      );
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: loadingId,
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      };
      setMessages((prev) =>
        prev.map((msg) => (msg.id === loadingId ? errorMessage : msg))
      );
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, addMessage]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setSessionId(undefined);
  }, []);

  const loadSession = useCallback((targetSessionId: string) => {
    const stored = loadSessionsFromStorage();
    const session = stored.find((s) => s.session_id === targetSessionId);
    if (session) {
      setMessages(session.messages.map((m) => ({
        ...m,
        timestamp: new Date(m.timestamp),
      })));
      setSessionId(targetSessionId);
    }
  }, []);

  const getSavedSessions = useCallback((): SessionInfo[] => {
    const stored = loadSessionsFromStorage();
    return stored.map((s) => ({
      session_id: s.session_id,
      title: s.title,
      created_at: s.updated_at,
      updated_at: s.updated_at,
      message_count: s.messages.length,
    }));
  }, []);

  const deleteSavedSession = useCallback((targetSessionId: string) => {
    const stored = loadSessionsFromStorage();
    saveSessionsToStorage(stored.filter((s) => s.session_id !== targetSessionId));
    // If deleting current session, clear chat
    if (targetSessionId === sessionId) {
      setMessages([]);
      setSessionId(undefined);
    }
  }, [sessionId]);

  return {
    messages,
    sessionId,
    isLoading,
    sendMessage,
    clearChat,
    loadSession,
    getSavedSessions,
    deleteSavedSession,
  };
}
