import { useState, useCallback } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import ReactMarkdown from 'react-markdown';
import type { ChatMessage as ChatMessageType } from '../types';
import ResultsTable from './ResultsTable';

interface ChatMessageProps {
  message: ChatMessageType;
  isDark: boolean;
}

export default function ChatMessage({ message, isDark }: ChatMessageProps) {
  const isUser = message.role === 'user';

  // Loading state – animated dots
  if (message.isLoading) {
    return (
      <div className="flex justify-start" role="status" aria-label="Loading response">
        <div
          className="max-w-[80%] rounded-2xl rounded-tl-sm px-4 py-3
            bg-white dark:bg-surface-card-dark
            border border-slate-200 dark:border-border-dark
            shadow-sm"
        >
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-slate-400 dark:bg-text-muted-dark animate-bounce [animation-delay:-0.3s]" />
            <span className="h-2 w-2 rounded-full bg-slate-400 dark:bg-text-muted-dark animate-bounce [animation-delay:-0.15s]" />
            <span className="h-2 w-2 rounded-full bg-slate-400 dark:bg-text-muted-dark animate-bounce" />
          </div>
        </div>
      </div>
    );
  }

  // User message
  if (isUser) {
    return (
      <div className="flex justify-end">
        <div
          className="max-w-[80%] rounded-2xl rounded-tr-sm px-4 py-3
            bg-primary text-white shadow-sm"
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    );
  }

  // Determine what to show as the text content
  // If we have SQL + explanation, don't show message.content (it's the same as explanation)
  const hasSQL = Boolean(message.sql);
  const showContent = !hasSQL && message.content;

  // Assistant message
  return (
    <div className="flex justify-start">
      <div
        className="max-w-[85%] rounded-2xl rounded-tl-sm px-4 py-3 space-y-3
          bg-white dark:bg-surface-card-dark
          border border-slate-200 dark:border-border-dark
          shadow-sm transition-colors duration-200"
      >
        {/* Content text — only shown when there's no SQL (e.g., out-of-scope responses) */}
        {showContent && (
          <div className="text-sm leading-relaxed text-slate-800 dark:text-text-dark prose-sm">
            <MarkdownContent content={message.content} />
          </div>
        )}

        {/* SQL block */}
        {message.sql && (
          <SqlBlock sql={message.sql} isDark={isDark} />
        )}

        {/* Explanation */}
        {message.explanation && (
          <div className="rounded-lg bg-slate-50 dark:bg-surface-darker px-4 py-3 transition-colors duration-200">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-text-muted-dark">
              Explanation
            </p>
            <div className="text-sm leading-relaxed text-slate-700 dark:text-text-dark">
              <MarkdownContent content={message.explanation} />
            </div>
          </div>
        )}

        {/* Results table */}
        {message.results && message.results.length > 0 && (
          <ResultsTable results={message.results} />
        )}

        {/* Empty results */}
        {message.results && message.results.length === 0 && (
          <p className="text-sm italic text-slate-500 dark:text-text-muted-dark">
            Query returned no results.
          </p>
        )}

        {/* Error */}
        {message.error && (
          <div
            className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 px-3 py-2"
            role="alert"
          >
            <p className="text-sm text-red-600 dark:text-red-400">
              <span className="font-semibold">Error:</span> {message.error}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Markdown Renderer ─── */

function MarkdownContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      components={{
        h3: ({ children }) => (
          <h3 className="text-sm font-semibold text-slate-800 dark:text-text-dark mt-3 mb-1">
            {children}
          </h3>
        ),
        h4: ({ children }) => (
          <h4 className="text-sm font-semibold text-slate-700 dark:text-text-dark mt-2 mb-1">
            {children}
          </h4>
        ),
        p: ({ children }) => (
          <p className="mb-2 last:mb-0">{children}</p>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal list-outside ml-4 mb-2 space-y-1.5">{children}</ol>
        ),
        ul: ({ children }) => (
          <ul className="list-disc list-outside ml-4 mb-2 space-y-1">{children}</ul>
        ),
        li: ({ children }) => (
          <li className="text-sm leading-relaxed">{children}</li>
        ),
        strong: ({ children }) => (
          <strong className="font-semibold text-slate-900 dark:text-white">{children}</strong>
        ),
        code: ({ children, className }) => {
          // Inline code
          if (!className) {
            return (
              <code className="rounded bg-slate-100 dark:bg-surface-darker px-1.5 py-0.5 text-xs font-mono text-indigo-600 dark:text-indigo-400">
                {children}
              </code>
            );
          }
          // Block code (shouldn't appear in explanations but handle it)
          return (
            <code className="block rounded bg-slate-100 dark:bg-surface-darker p-2 text-xs font-mono my-2">
              {children}
            </code>
          );
        },
        hr: () => (
          <hr className="my-3 border-slate-200 dark:border-border-dark" />
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

/* ─── SQL Code Block Sub-Component ─── */

function SqlBlock({ sql, isDark }: { sql: string; isDark: boolean }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(sql);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = sql;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [sql]);

  return (
    <div className="relative rounded-lg overflow-hidden border border-slate-200 dark:border-border-dark">
      {/* Header bar */}
      <div className="flex items-center justify-between bg-slate-100 dark:bg-surface-darker px-3 py-1.5">
        <span className="text-xs font-medium text-slate-500 dark:text-text-muted-dark">SQL</span>
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs
            text-slate-500 dark:text-text-muted-dark
            hover:bg-slate-200 dark:hover:bg-surface-card-dark
            transition-colors duration-200"
          aria-label={copied ? 'Copied to clipboard' : 'Copy SQL to clipboard'}
        >
          {copied ? (
            <>
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Copied
            </>
          ) : (
            <>
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              Copy
            </>
          )}
        </button>
      </div>

      {/* Syntax highlighted code */}
      <SyntaxHighlighter
        language="sql"
        style={isDark ? oneDark : oneLight}
        customStyle={{
          margin: 0,
          borderRadius: 0,
          fontSize: '0.8125rem',
          lineHeight: '1.5',
        }}
      >
        {sql}
      </SyntaxHighlighter>
    </div>
  );
}
