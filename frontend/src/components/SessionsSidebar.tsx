import { useEffect, useState } from 'react';
import type { SessionInfo } from '../types';

interface SessionsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentSessionId?: string;
  onSelectSession: (sessionId: string) => void;
  onNewChat: () => void;
  getSessions: () => SessionInfo[];
  onDeleteSession: (sessionId: string) => void;
}

function getRelativeTime(dateString: string): string {
  const now = Date.now();
  const date = new Date(dateString).getTime();
  const diffMs = now - date;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) === 1 ? '' : 's'} ago`;
  return new Date(dateString).toLocaleDateString();
}

export default function SessionsSidebar({
  isOpen,
  onClose,
  currentSessionId,
  onSelectSession,
  onNewChat,
  getSessions,
  onDeleteSession,
}: SessionsSidebarProps) {
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Refresh sessions list when sidebar opens
  useEffect(() => {
    if (isOpen) {
      setSessions(getSessions());
    }
  }, [isOpen, getSessions]);

  const handleDelete = (sessionId: string) => {
    if (deletingId === sessionId) {
      onDeleteSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.session_id !== sessionId));
      setDeletingId(null);
    } else {
      setDeletingId(sessionId);
    }
  };

  const handleSelect = (sessionId: string) => {
    onSelectSession(sessionId);
    onClose();
  };

  const handleNewChat = () => {
    onNewChat();
    onClose();
  };

  useEffect(() => {
    if (!isOpen) {
      setDeletingId(null);
    }
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 transition-opacity duration-300"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-80 flex-col
          bg-white dark:bg-surface-dark
          border-r border-slate-200 dark:border-border-dark
          shadow-xl transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none'}`}
        role="dialog"
        aria-label="Chat history sidebar"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-border-dark px-4 py-3">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-text-dark">
            Chat History
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 dark:text-text-muted-dark
              hover:bg-slate-100 dark:hover:bg-surface-card-dark
              transition-colors duration-200"
            aria-label="Close chat history"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* New Chat button */}
        <div className="px-3 pt-3 pb-1">
          <button
            onClick={handleNewChat}
            className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2.5
              text-sm font-medium bg-primary text-white hover:bg-primary/90
              transition-colors duration-200"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
            New Chat
          </button>
        </div>

        {/* Sessions list */}
        <div className="flex-1 overflow-y-auto px-3 py-2">
          {sessions.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400 dark:text-text-muted-dark">
              No previous conversations
            </div>
          ) : (
            <ul className="space-y-1" role="list">
              {sessions.map((session) => {
                const isActive = session.session_id === currentSessionId;
                const isConfirmingDelete = deletingId === session.session_id;

                return (
                  <li key={session.session_id}>
                    <div
                      className={`group relative flex items-start gap-2 rounded-lg px-3 py-2.5 cursor-pointer
                        transition-colors duration-150
                        ${isActive
                          ? 'bg-primary/10 dark:bg-primary/20 border border-primary/30'
                          : 'hover:bg-slate-50 dark:hover:bg-surface-card-dark border border-transparent'
                        }`}
                      onClick={() => handleSelect(session.session_id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleSelect(session.session_id);
                        }
                      }}
                      aria-current={isActive ? 'true' : undefined}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-700 dark:text-text-dark">
                          {session.title.length > 40
                            ? session.title.slice(0, 40) + '…'
                            : session.title}
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-xs text-slate-400 dark:text-text-muted-dark">
                            {getRelativeTime(session.updated_at)}
                          </span>
                          <span
                            className="inline-flex items-center rounded-full px-1.5 py-0.5
                              text-xs font-medium bg-slate-100 dark:bg-surface-card-dark
                              text-slate-500 dark:text-text-muted-dark"
                          >
                            {session.message_count} msg{session.message_count !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(session.session_id);
                        }}
                        className={`mt-0.5 shrink-0 rounded p-1 transition-colors duration-150
                          ${isConfirmingDelete
                            ? 'text-red-500 bg-red-50 dark:bg-red-900/30'
                            : 'text-slate-400 dark:text-text-muted-dark opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30'
                          }`}
                        aria-label={isConfirmingDelete ? 'Confirm delete' : 'Delete session'}
                        title={isConfirmingDelete ? 'Click again to confirm' : 'Delete'}
                      >
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          <path d="M10 11v6" />
                          <path d="M14 11v6" />
                          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                        </svg>
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>
    </>
  );
}
