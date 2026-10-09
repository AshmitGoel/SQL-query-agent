import uuid
from datetime import datetime, timezone
from collections import OrderedDict


class ConversationManager:
    """Manages conversation history in-memory. Resets on server restart."""

    def __init__(self, max_history_per_session: int = 50):
        self._sessions: OrderedDict[str, dict] = OrderedDict()
        self._messages: dict[str, list[dict]] = {}
        self._max_history = max_history_per_session

    async def init(self):
        """No-op for in-memory storage. Keeps interface compatible."""
        pass

    async def create_session(self) -> str:
        """Create a new conversation session and return its id."""
        session_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        self._sessions[session_id] = {
            "session_id": session_id,
            "title": "New Conversation",
            "created_at": now,
            "updated_at": now,
        }
        self._messages[session_id] = []
        return session_id

    async def get_or_create_session(self, session_id: str | None = None) -> str:
        """Get existing session or create a new one."""
        if session_id and await self.session_exists(session_id):
            return session_id
        return await self.create_session()

    async def session_exists(self, session_id: str) -> bool:
        """Check if a session exists."""
        return session_id in self._sessions

    async def add_message(
        self, session_id: str, role: str, content: str, sql: str | None = None
    ):
        """Add a message to a session's conversation history."""
        now = datetime.now(timezone.utc).isoformat()

        if session_id not in self._messages:
            self._messages[session_id] = []

        msg: dict = {
            "role": role,
            "content": content,
            "timestamp": now,
        }
        if sql:
            msg["sql"] = sql

        self._messages[session_id].append(msg)

        # Trim if too long
        if len(self._messages[session_id]) > self._max_history:
            self._messages[session_id] = self._messages[session_id][-self._max_history:]

        # Update session metadata
        if session_id in self._sessions:
            self._sessions[session_id]["updated_at"] = now

            # Auto-generate title from first user message
            if role == "user":
                user_msgs = [m for m in self._messages[session_id] if m["role"] == "user"]
                if len(user_msgs) == 1:
                    title = content[:50].strip()
                    if len(content) > 50:
                        title += "..."
                    self._sessions[session_id]["title"] = title

    async def get_history(self, session_id: str) -> list[dict]:
        """Get all messages for a session."""
        return self._messages.get(session_id, [])

    async def get_all_sessions(self) -> list[dict]:
        """Return all sessions ordered by most recently updated, with message count."""
        sessions = []
        for session_id, session in self._sessions.items():
            sessions.append({
                **session,
                "message_count": len(self._messages.get(session_id, [])),
            })
        # Sort by updated_at descending
        sessions.sort(key=lambda s: s["updated_at"], reverse=True)
        return sessions

    async def delete_session(self, session_id: str):
        """Delete a session and all its messages."""
        self._sessions.pop(session_id, None)
        self._messages.pop(session_id, None)

    async def clear_session(self, session_id: str):
        """Delete all messages for a session but keep the session itself."""
        if session_id in self._messages:
            self._messages[session_id] = []

    def get_context_for_llm(self, history: list[dict]) -> str:
        """Format conversation history as context string for the LLM."""
        if not history:
            return "No previous conversation."

        context_parts = []
        for msg in history[-10:]:
            role = "User" if msg["role"] == "user" else "Assistant"
            context_parts.append(f"{role}: {msg['content']}")
            if msg.get("sql"):
                context_parts.append(f"Generated SQL: {msg['sql']}")

        return "\n".join(context_parts)


# Singleton instance
conversation_manager = ConversationManager()
