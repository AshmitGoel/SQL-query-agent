import uuid

from fastapi import APIRouter, HTTPException

from app.agents.workflow import process_query
from app.core.conversation import conversation_manager
from app.database.connection import execute_query, get_schema
from app.models.schemas import QueryRequest, QueryResponse

router = APIRouter()


@router.post("/query", response_model=QueryResponse)
async def query_endpoint(request: QueryRequest):
    """Process a natural language query and generate SQL."""
    session_id = await conversation_manager.get_or_create_session(request.session_id)

    # Prefer client-sent history (survives server restarts), fall back to server memory
    chat_history = request.chat_history or await conversation_manager.get_history(session_id)

    try:
        result = await process_query(
            message=request.message,
            session_id=session_id,
            chat_history=chat_history,
        )

        # Store conversation turn
        await conversation_manager.add_message(session_id, "user", request.message)

        sql = result.get("optimized_sql") or result.get("generated_sql")
        response_message = result.get("response_message", "")

        await conversation_manager.add_message(
            session_id, "assistant", response_message, sql=sql
        )

        return QueryResponse(
            sql=sql,
            explanation=result.get("explanation"),
            message=response_message,
            is_sql=result.get("is_in_scope", False) and bool(sql),
            results=result.get("query_results"),
            error=result.get("error"),
            session_id=session_id,
        )
    except Exception as e:
        return QueryResponse(
            sql=None,
            explanation=None,
            message=f"An error occurred: {str(e)}",
            is_sql=False,
            error=str(e),
            session_id=session_id,
        )


@router.get("/sessions")
async def list_sessions():
    """List all conversation sessions."""
    sessions = await conversation_manager.get_all_sessions()
    return {"sessions": sessions}


@router.get("/sessions/{session_id}/history")
async def get_session_history(session_id: str):
    """Get conversation history for a session."""
    history = await conversation_manager.get_history(session_id)
    return {"session_id": session_id, "history": history}


@router.delete("/sessions/{session_id}")
async def delete_session(session_id: str):
    """Delete a conversation session."""
    await conversation_manager.delete_session(session_id)
    return {"message": "Session deleted", "session_id": session_id}


@router.post("/query/execute")
async def execute_query_endpoint(request: QueryRequest):
    """Execute a raw SQL query directly against the database."""
    session_id = request.session_id or str(uuid.uuid4())

    try:
        results = await execute_query(request.message)
        return {
            "session_id": session_id,
            "results": results,
            "error": None,
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/schema")
async def get_schema_endpoint():
    """Get the database schema information."""
    try:
        schema_info = await get_schema()
        return {"schema": schema_info}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
