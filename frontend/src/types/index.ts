export interface QueryRequest {
  message: string;
  session_id?: string;
  chat_history?: Array<{ role: string; content: string; sql?: string }>;
}

export interface QueryResponse {
  sql: string | null;
  explanation: string | null;
  message: string;
  is_sql: boolean;
  results: Record<string, unknown>[] | null;
  error: string | null;
  session_id: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sql?: string;
  explanation?: string;
  results?: Record<string, unknown>[] | null;
  error?: string | null;
  timestamp: Date;
  isLoading?: boolean;
}

export interface SessionHistory {
  session_id: string;
  history: Array<{
    role: string;
    content: string;
    sql?: string;
    timestamp: string;
  }>;
}

export interface SessionInfo {
  session_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}
