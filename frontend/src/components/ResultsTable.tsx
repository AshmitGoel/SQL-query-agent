import { useCallback } from 'react';

interface ResultsTableProps {
  results: Record<string, unknown>[];
}

export default function ResultsTable({ results }: ResultsTableProps) {
  if (results.length === 0) {
    return (
      <p className="text-sm text-slate-500 dark:text-text-muted-dark italic">
        Query returned no results.
      </p>
    );
  }

  const columns = Object.keys(results[0]);

  const exportToCsv = useCallback(() => {
    const header = columns.join(',');
    const rows = results.map((row) =>
      columns
        .map((col) => {
          const val = row[col];
          const str = val === null || val === undefined ? '' : String(val);
          // Escape double-quotes and wrap in quotes if needed
          return str.includes(',') || str.includes('"') || str.includes('\n')
            ? `"${str.replace(/"/g, '""')}"`
            : str;
        })
        .join(',')
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'query_results.csv';
    link.click();
    URL.revokeObjectURL(url);
  }, [columns, results]);

  return (
    <div className="mt-3 space-y-2">
      {/* Header row: count + export */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500 dark:text-text-muted-dark">
          {results.length} row{results.length !== 1 ? 's' : ''} returned
        </span>
        <button
          onClick={exportToCsv}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium
            text-primary hover:bg-primary-light dark:hover:bg-surface-card-dark
            transition-colors duration-200"
          aria-label="Export results to CSV"
        >
          <svg
            className="h-3.5 w-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Export CSV
        </button>
      </div>

      {/* Scrollable table container */}
      <div
        className="overflow-auto rounded-lg border border-slate-200 dark:border-border-dark max-h-72"
        role="region"
        aria-label="Query results table"
        tabIndex={0}
      >
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 bg-slate-100 dark:bg-surface-card-dark">
            <tr>
              {columns.map((col) => (
                <th
                  key={col}
                  className="whitespace-nowrap px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider
                    text-slate-600 dark:text-text-muted-dark"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-border-dark">
            {results.map((row, idx) => (
              <tr
                key={idx}
                className={
                  idx % 2 === 0
                    ? 'bg-white dark:bg-surface-dark'
                    : 'bg-slate-50 dark:bg-surface-darker'
                }
              >
                {columns.map((col) => (
                  <td
                    key={col}
                    className="whitespace-nowrap px-3 py-2 text-slate-700 dark:text-text-dark"
                  >
                    {row[col] === null || row[col] === undefined
                      ? <span className="italic text-slate-400">NULL</span>
                      : String(row[col])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
