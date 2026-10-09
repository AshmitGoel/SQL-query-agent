import { useEffect, useState, useMemo } from 'react';
import { getSchema } from '../api/client';

interface SchemaPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TableInfo {
  name: string;
  sql: string;
  columns: string[];
}

export default function SchemaPanel({ isOpen, onClose }: SchemaPanelProps) {
  const [rawSchema, setRawSchema] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    async function fetchSchema() {
      setLoading(true);
      setError(null);
      try {
        const data = await getSchema();
        if (!cancelled) setRawSchema(data.schema);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load schema');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchSchema();
    return () => { cancelled = true; };
  }, [isOpen]);

  // Parse CREATE TABLE statements into structured data
  const tables: TableInfo[] = useMemo(() => {
    if (!rawSchema) return [];
    const tableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?["']?(\w+)["']?\s*\(([^;]+)\)/gi;
    const result: TableInfo[] = [];
    let match;

    while ((match = tableRegex.exec(rawSchema)) !== null) {
      const name = match[1];
      const body = match[2];
      const columns = body
        .split(',')
        .map((line) => line.trim())
        .filter((line) => line && !line.toUpperCase().startsWith('FOREIGN') && !line.toUpperCase().startsWith('PRIMARY') && !line.toUpperCase().startsWith('UNIQUE') && !line.toUpperCase().startsWith('CHECK') && !line.toUpperCase().startsWith('CONSTRAINT'))
        .map((line) => {
          const parts = line.split(/\s+/);
          const colName = (parts[0] || '').replace(/["']/g, '');
          const colType = parts[1] || '';
          return `${colName} ${colType}`.trim();
        });
      result.push({ name, sql: match[0], columns });
    }

    return result;
  }, [rawSchema]);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 dark:bg-black/40 transition-opacity duration-300 sm:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Panel */}
      <aside
        className={`fixed right-0 top-0 z-50 h-full w-80 transform transition-transform duration-300 ease-in-out
          bg-white dark:bg-surface-dark
          border-l border-slate-200 dark:border-border-dark
          shadow-xl
          ${isOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'}`}
        role="complementary"
        aria-label="Database schema panel"
      >
        {/* Panel Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-border-dark px-4 py-3">
          <div className="flex items-center gap-2">
            <svg
              className="h-5 w-5 text-primary"
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
            <h2 className="text-sm font-semibold text-slate-800 dark:text-text-dark">
              Database Schema
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 dark:text-text-muted-dark
              hover:bg-slate-100 dark:hover:bg-surface-card-dark
              transition-colors duration-200"
            aria-label="Close schema panel"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Panel Body */}
        <div className="overflow-y-auto p-4 h-[calc(100%-53px)]">
          {loading && (
            <div className="flex items-center justify-center py-8" role="status" aria-label="Loading schema">
              <svg className="h-6 w-6 animate-spin text-primary" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-3" role="alert">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {!loading && !error && tables.length === 0 && rawSchema && (
            <pre className="text-xs text-slate-600 dark:text-text-muted-dark whitespace-pre-wrap break-words">
              {rawSchema}
            </pre>
          )}

          {!loading && !error && tables.length > 0 && (
            <ul className="space-y-4" role="tree" aria-label="Database tables">
              {tables.map((table) => (
                <li key={table.name} role="treeitem">
                  <div className="flex items-center gap-2 mb-1.5">
                    <svg
                      className="h-4 w-4 text-primary flex-shrink-0"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden="true"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <line x1="3" y1="9" x2="21" y2="9" />
                      <line x1="9" y1="3" x2="9" y2="21" />
                    </svg>
                    <span className="text-sm font-semibold text-slate-800 dark:text-text-dark">
                      {table.name}
                    </span>
                  </div>
                  <ul className="ml-6 space-y-0.5 border-l-2 border-slate-200 dark:border-border-dark pl-3" role="group">
                    {table.columns.map((col, i) => (
                      <li key={i} className="text-xs text-slate-600 dark:text-text-muted-dark font-mono">
                        {col}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}

          {!loading && !error && !rawSchema && (
            <p className="text-sm text-slate-500 dark:text-text-muted-dark italic text-center py-8">
              No schema information available.
            </p>
          )}
        </div>
      </aside>
    </>
  );
}
