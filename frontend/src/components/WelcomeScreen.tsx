interface WelcomeScreenProps {
  onSendExample: (query: string) => void;
}

const EXAMPLE_QUERIES = [
  {
    label: 'Show all employees hired after January 2024',
    icon: '👥',
  },
  {
    label: 'What are the top 5 most expensive products?',
    icon: '💰',
  },
  {
    label: 'List all customers from California',
    icon: '📍',
  },
  {
    label: 'Show total orders by status',
    icon: '📊',
  },
];

export default function WelcomeScreen({ onSendExample }: WelcomeScreenProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
      {/* Database icon */}
      <div
        className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl
          bg-primary-light dark:bg-surface-card-dark transition-colors duration-300"
        aria-hidden="true"
      >
        <svg
          className="h-10 w-10 text-primary"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <ellipse cx="12" cy="5" rx="9" ry="3" />
          <path d="M3 5v6c0 1.66 4.03 3 9 3s9-1.34 9-3V5" />
          <path d="M3 11v6c0 1.66 4.03 3 9 3s9-1.34 9-3v-6" />
        </svg>
      </div>

      <h2 className="mb-2 text-2xl font-bold text-slate-800 dark:text-text-dark">
        SQL Query Assistant
      </h2>
      <p className="mb-8 max-w-md text-center text-sm text-slate-500 dark:text-text-muted-dark">
        Ask questions about your database in plain English. I&apos;ll generate SQL queries,
        explain them, and show you the results.
      </p>

      {/* Example query cards */}
      <div className="grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
        {EXAMPLE_QUERIES.map(({ label, icon }) => (
          <button
            key={label}
            onClick={() => onSendExample(label)}
            className="group flex items-start gap-3 rounded-xl border p-4 text-left
              bg-white dark:bg-surface-card-dark
              border-slate-200 dark:border-border-dark
              hover:border-primary hover:shadow-md dark:hover:border-primary
              transition-all duration-200"
            aria-label={`Example query: ${label}`}
          >
            <span className="text-xl" aria-hidden="true">
              {icon}
            </span>
            <span className="text-sm text-slate-700 dark:text-text-dark group-hover:text-primary transition-colors duration-200">
              {label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
