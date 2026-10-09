import axios from 'axios';
import type { QueryRequest, QueryResponse, SessionHistory, SessionInfo } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 120000,
});

export async function sendQuery(request: QueryRequest): Promise<QueryResponse> {
  const response = await apiClient.post<QueryResponse>('/query', request);
  return response.data;
}

export async function executeSQL(sql: string, sessionId?: string): Promise<{
  session_id: string;
  results: Record<string, unknown>[] | null;
  error: string | null;
}> {
  const response = await apiClient.post('/query/execute', {
    message: sql,
    session_id: sessionId,
  });
  return response.data;
}

export async function getSessionHistory(sessionId: string): Promise<SessionHistory> {
  const response = await apiClient.get<SessionHistory>(`/sessions/${sessionId}/history`);
  return response.data;
}

export async function getSchema(): Promise<{ schema: string }> {
  const response = await apiClient.get<{ schema: string }>('/schema');
  return response.data;
}

export async function healthCheck(): Promise<{ status: string; version: string }> {
  const response = await apiClient.get('/health');
  return response.data;
}

export async function getSessions(): Promise<{ sessions: SessionInfo[] }> {
  const response = await apiClient.get('/sessions');
  return response.data;
}

export async function deleteSession(sessionId: string): Promise<void> {
  await apiClient.delete(`/sessions/${sessionId}`);
}
