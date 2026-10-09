interface HeaderProps {
  isDark: boolean;
  onToggleDark: () => void;
  onNewChat: () => void;
  onOpenHistory: () => void;
}

export default function Header({ isDark, onToggleDark, onNewChat, onOpenHistory }: HeaderProps) {
  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 border-b
        bg-white dark:bg-surface-dark border-slate-200 dark:border-border-dark
        shadow-sm transition-colors duration-300"
      role="banner"
    >
      {/* Logo & Title */}
      <div className="flex items-center gap-2.5">
        <svg
          className="h-7 w-7 text-primary"
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
        <h1 className="text-lg font-semibold text-slate-800 dark:text-text-dark select-none">
          SQL Query Agent
        </h1>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* History */}
        <button
          onClick={onOpenHistory}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium
            text-slate-600 dark:text-text-muted-dark
            hover:bg-slate-100 dark:hover:bg-surface-card-dark
            transition-colors duration-200"
          aria-label="Open chat history"
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          History
        </button>

        {/* New Chat */}
        <button
          onClick={onNewChat}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium
            text-slate-600 dark:text-text-muted-dark
            hover:bg-slate-100 dark:hover:bg-surface-card-dark
            transition-colors duration-200"
          aria-label="Start new chat"
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          New Chat
        </button>

        {/* Dark Mode Toggle */}
        <button
          onClick={onToggleDark}
          className="rounded-lg p-2 text-slate-600 dark:text-text-muted-dark
            hover:bg-slate-100 dark:hover:bg-surface-card-dark
            transition-colors duration-200"
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? (
            /* Sun icon */
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
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            /* Moon icon */
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
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>
      </div>
    </header>
  );
}
