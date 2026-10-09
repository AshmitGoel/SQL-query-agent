from pydantic import BaseModel


class QueryRequest(BaseModel):
    """Request model for SQL query generation."""

    message: str
    session_id: str | None = None
    chat_history: list[dict] | None = None


class QueryResponse(BaseModel):
    """Response model for SQL query results."""

    sql: str | None = None
    explanation: str | None = None
    message: str
    is_sql: bool
    results: list[dict] | None = None
    error: str | None = None
    session_id: str


class HealthResponse(BaseModel):
    """Response model for health check endpoint."""

    status: str
    version: str


class SessionInfo(BaseModel):
    """Response model for session information."""

    session_id: str
    title: str
    created_at: str
    updated_at: str
    message_count: int
