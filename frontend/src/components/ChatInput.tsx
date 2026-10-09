import { useState, useRef, useCallback, type KeyboardEvent, type ChangeEvent } from 'react';

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
}

export default function ChatInput({ onSend, isLoading }: ChatInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const lineHeight = 24; // approx 1 row
    const maxHeight = lineHeight * 4;
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
  }, []);

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    adjustHeight();
  };

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed);
    setValue('');
    // Reset height after clearing
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    });
  }, [value, isLoading, onSend]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className="border-t bg-white dark:bg-surface-dark border-slate-200 dark:border-border-dark
        px-4 py-3 transition-colors duration-300"
    >
      <div
        className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border
          bg-slate-50 dark:bg-surface-darker border-slate-200 dark:border-border-dark
          px-4 py-2 shadow-sm transition-colors duration-200
          focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20"
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          rows={1}
          placeholder="Ask a question about the database..."
          aria-label="Message input"
          className="flex-1 resize-none bg-transparent text-sm leading-6
            text-slate-800 dark:text-text-dark placeholder-slate-400 dark:placeholder-text-muted-dark
            outline-none disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={isLoading || !value.trim()}
          aria-label="Send message"
          className="flex-shrink-0 rounded-xl p-2
            bg-primary text-white
            hover:bg-primary-hover
            disabled:opacity-40 disabled:cursor-not-allowed
            transition-colors duration-200"
        >
          {isLoading ? (
            /* Spinner */
            <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          ) : (
            /* Arrow up icon */
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
              <line x1="12" y1="19" x2="12" y2="5" />
              <polyline points="5 12 12 5 19 12" />
            </svg>
          )}
        </button>
      </div>
      <p className="mt-1.5 text-center text-xs text-slate-400 dark:text-text-muted-dark select-none">
        Press Enter to send, Shift+Enter for a new line
      </p>
    </div>
  );
}
