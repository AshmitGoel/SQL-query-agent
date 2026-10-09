import { useEffect, useRef, useState } from 'react';
import { useChat } from './hooks/useChat';
import { useDarkMode } from './hooks/useDarkMode';
import { healthCheck } from './api/client';
import Header from './components/Header';
import ChatInput from './components/ChatInput';
import ChatMessage from './components/ChatMessage';
import WelcomeScreen from './components/WelcomeScreen';
import SchemaPanel from './components/SchemaPanel';
import SessionsSidebar from './components/SessionsSidebar';

export default function App() {
  const { messages, sessionId, isLoading, sendMessage, clearChat, loadSession, getSavedSessions, deleteSavedSession } = useChat();
  const { isDark, toggle } = useDarkMode();
  const [schemaPanelOpen, setSchemaPanelOpen] = useState(false);
  const [sessionsSidebarOpen, setSessionsSidebarOpen] = useState(false);

  // Warm up the backend server on app load (Render free tier spins down)
  useEffect(() => {
    healthCheck().catch(() => {});
  }, []);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const hasMessages = messages.length > 0;

  return (
    <div className="flex h-screen flex-col bg-slate-50 dark:bg-surface-darker transition-colors duration-300">
      {/* Header */}
      <Header isDark={isDark} onToggleDark={toggle} onNewChat={clearChat} onOpenHistory={() => setSessionsSidebarOpen(true)} />

      {/* Main content area */}
      <main className="relative flex flex-1 flex-col overflow-hidden">
        {/* Chat messages / Welcome */}
        <div className="flex-1 overflow-y-auto">
          {hasMessages ? (
            <div className="mx-auto max-w-3xl space-y-4 px-4 py-6">
              {messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} isDark={isDark} />
              ))}
              <div ref={messagesEndRef} />
            </div>
          ) : (
            <WelcomeScreen onSendExample={sendMessage} />
          )}
        </div>

        {/* Floating Schema button */}
        <button
          onClick={() => setSchemaPanelOpen((prev) => !prev)}
          className="absolute right-4 bottom-20 z-20 flex h-10 w-10 items-center justify-center
            rounded-full shadow-lg
            bg-white dark:bg-surface-card-dark
            border border-slate-200 dark:border-border-dark
            text-slate-600 dark:text-text-muted-dark
            hover:bg-slate-100 dark:hover:bg-surface-darker
            transition-colors duration-200"
          aria-label={schemaPanelOpen ? 'Close database schema panel' : 'Open database schema panel'}
        >
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <ellipse cx="12" cy="5" rx="9" ry="3" />
            <path d="M3 5v6c0 1.66 4.03 3 9 3s9-1.34 9-3V5" />
            <path d="M3 11v6c0 1.66 4.03 3 9 3s9-1.34 9-3v-6" />
          </svg>
        </button>

        {/* Chat Input */}
        <ChatInput onSend={sendMessage} isLoading={isLoading} />
      </main>

      {/* Sessions Sidebar */}
      <SessionsSidebar
        isOpen={sessionsSidebarOpen}
        onClose={() => setSessionsSidebarOpen(false)}
        currentSessionId={sessionId}
        onSelectSession={loadSession}
        onNewChat={clearChat}
        getSessions={getSavedSessions}
        onDeleteSession={deleteSavedSession}
      />

      {/* Schema Panel */}
      <SchemaPanel isOpen={schemaPanelOpen} onClose={() => setSchemaPanelOpen(false)} />
    </div>
  );
}
