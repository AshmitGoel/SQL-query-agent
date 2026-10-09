# Architecture

A comprehensive technical overview of the SQL Query AI Agent system architecture.

---

## Table of Contents

- [System Overview](#system-overview)
- [Component Diagram](#component-diagram)
- [Backend Architecture](#backend-architecture)
- [Frontend Architecture](#frontend-architecture)
- [Data Flow](#data-flow)
- [Database Schema Diagram](#database-schema-diagram)
- [Security Considerations](#security-considerations)
- [Scalability Notes](#scalability-notes)

---

## System Overview

The SQL Query AI Agent is a full-stack application that converts natural language questions into SQL queries.It uses a multi-step AI agent pipeline powered by LangGraph and Google Gemini to classify intent, generate SQL, validate safety, optimize queries, and produce human-readable explanations — all before returning results from a SQLite database.

The system is split into two independently deployable services:

- **Backend** — A Python FastAPI server hosting the LangGraph agent workflow, database layer, and REST API.
- **Frontend** — A React + TypeScript SPA (built with Vite) providing a conversational chat interface.

Communication between the two is over HTTP/JSON. The backend is stateful within a process (in-memory session store) but stateless across restarts.

---

## Component Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT BROWSER                                 │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                        React Frontend (Vite)                          │  │
│  │                                                                       │  │
│  │  ┌────────────┐  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐  │  │
│  │  │   Header    │  │ WelcomeScreen│  │  SchemaPanel │  │  ChatInput  │  │  │
│  │  └────────────┘  └─────────────┘  └──────────────┘  └─────────────┘  │  │
│  │  ┌────────────────────────────────────────────────────┐               │  │
│  │  │               ChatMessage + ResultsTable           │               │  │
│  │  └────────────────────────────────────────────────────┘               │  │
│  │  ┌───────────────────────┐  ┌──────────────────────────┐             │  │
│  │  │  useChat (hook)       │  │  useDarkMode (hook)      │             │  │
│  │  └───────────┬───────────┘  └──────────────────────────┘             │  │
│  │              │                                                        │  │
│  │  ┌───────────▼───────────┐                                           │  │
│  │  │  api/client.ts        │  Axios HTTP client                        │  │
│  │  └───────────┬───────────┘                                           │  │
│  └──────────────┼────────────────────────────────────────────────────────┘  │
└─────────────────┼───────────────────────────────────────────────────────────┘
                  │  HTTP / JSON
                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FastAPI Backend (Uvicorn)                          │
│                                                                             │
│  ┌────────────────────────┐     ┌──────────────────────────────────────┐   │
│  │   API Layer            │     │   Core                               │   │
│  │   (api/routes.py)      │     │   ┌────────────┐ ┌───────────────┐  │   │
│  │                        │     │   │  config.py  │ │ conversation  │  │   │
│  │  POST /query           │────▶│   │  (Settings) │ │  _manager.py  │  │   │
│  │  POST /query/execute   │     │   └────────────┘ └───────────────┘  │   │
│  │  GET  /sessions/{id}   │     └──────────────────────────────────────┘   │
│  │  GET  /schema          │                                                │
│  │  GET  /health          │     ┌──────────────────────────────────────┐   │
│  └────────────┬───────────┘     │   LangGraph Agent Workflow           │   │
│               │                 │   (agents/workflow.py)               │   │
│               │                 │                                      │   │
│               └────────────────▶│   detect_intent                      │   │
│                                 │       ▼                              │   │
│                                 │   validate_scope ──► (out-of-scope)  │   │
│                                 │       ▼                              │   │
│                                 │   retrieve_schema                    │   │
│                                 │       ▼                              │   │
│                                 │   generate_sql (Gemini LLM)          │   │
│                                 │       ▼                              │   │
│                                 │   validate_sql ──► (invalid)         │   │
│                                 │       ▼                              │   │
│                                 │   optimize_sql (Gemini LLM)          │   │
│                                 │       ▼                              │   │
│                                 │   generate_explanation (Gemini LLM)  │   │
│                                 │       ▼                              │   │
│                                 │   build_response                     │   │
│                                 └──────────────┬───────────────────────┘   │
│                                                │                           │
│                                 ┌──────────────▼───────────────────────┐   │
│                                 │   Database Layer                      │   │
│                                 │   (database/connection.py)           │   │
│                                 │                                      │   │
│                                 │   get_schema()  ─► PRAGMA introspect │   │
│                                 │   execute_query() ─► SELECT only     │   │
│                                 │   init_database() ─► schema.sql +    │   │
│                                 │                      seed_data.py    │   │
│                                 └──────────────┬───────────────────────┘   │
│                                                │                           │
│                                 ┌──────────────▼───────────────────────┐   │
│                                 │        SQLite Database                │   │
│                                 │        (data/sample.db)              │   │
│                                 └──────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │   External Service: Google Gemini API (gemini-2.0-flash)           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Backend Architecture

### Framework: FastAPI 0.115

The backend uses FastAPI with Uvicorn as the ASGI server. The application is structured into four packages:

| Package     | Responsibility                                      |
|-------------|-----------------------------------------------------|
| `api/`      | Route handlers for all HTTP endpoints               |
| `agents/`   | LangGraph workflow definition and all agent nodes   |
| `core/`     | Application configuration and conversation manager  |
| `database/` | SQLite connection, schema DDL, and seed data        |
| `models/`   | Pydantic request/response schemas                   |

**Startup lifecycle** — The FastAPI `lifespan` context manager calls `init_database()` on startup. This reads `schema.sql`, creates tables if they don't exist, and seeds sample data when the tables are empty.

**CORS** — All origins are allowed in development via `CORSMiddleware`. This must be restricted for production deployments.

### LangGraph Agent

The core intelligence lives in `agents/workflow.py`. It defines a `StateGraph` compiled into an executable graph. The graph contains 8 nodes connected by edges and conditional edges. Each node is an async function that reads from and writes to a shared `AgentState` TypedDict.

The LLM is Google Gemini 2.0 Flash, accessed through LangChain's `ChatGoogleGenerativeAI` wrapper with `temperature=0` for deterministic output and `convert_system_message_to_human=True` for Gemini compatibility.

Three nodes invoke the LLM:
1. `detect_intent` — Intent classification
2. `generate_sql` — SQL generation (also handles debug/optimize intents)
3. `optimize_sql` — Query optimization
4. `generate_explanation` — Plain-English explanation

See [WORKFLOW.md](./WORKFLOW.md) for a detailed breakdown of each node.

### Database Layer

SQLite is accessed asynchronously via `aiosqlite`. The database layer exposes three functions:

| Function          | Description                                                        |
|-------------------|--------------------------------------------------------------------|
| `get_schema()`    | Introspects `sqlite_master` and `PRAGMA table_info/foreign_key_list` to build a text representation of the schema. |
| `execute_query()` | Runs a SQL string after verifying it starts with `SELECT`. Returns results as a list of dicts. |
| `init_database()` | Creates tables from `schema.sql` and seeds data from `seed_data.py` if empty. |

### Conversation Manager

`ConversationManager` is a singleton class that stores chat history in-memory using a `defaultdict(list)`. It supports:
- Session creation and lookup
- Adding messages with role, content, optional SQL, and timestamp
- Trimming history to the last 20 messages per session
- Formatting the last 10 messages as LLM context

Sessions are ephemeral — they are lost on server restart.

### Pydantic Models

| Model            | Purpose                                   |
|------------------|-------------------------------------------|
| `QueryRequest`   | `message: str`, `session_id: str | None`  |
| `QueryResponse`  | SQL, explanation, message, results, error, session_id, is_sql flag |
| `HealthResponse` | `status: str`, `version: str`             |

---

## Frontend Architecture

### Framework: React 18 + TypeScript + Vite

The frontend is a single-page application with no routing library — it presents a single chat view.

### Component Tree

```
App
├── Header                   # App title, dark mode toggle, new chat button
├── WelcomeScreen            # Shown when no messages; contains example queries
├── ChatMessage[]            # Rendered for each message in the conversation
│   └── ResultsTable         # Rendered inside assistant messages that have query results
├── SchemaPanel              # Slide-out panel showing the database schema
└── ChatInput                # Text input with send button
```

### State Management

State is managed entirely with React hooks — no external state library.

| Hook          | State                                      | Description                                    |
|---------------|--------------------------------------------|------------------------------------------------|
| `useChat`     | `messages`, `sessionId`, `isLoading`       | Core chat state. Sends queries, manages message list, handles loading placeholders. |
| `useDarkMode` | `isDark`                                   | Reads/writes `localStorage`, toggles `dark` class on `<html>`. Respects OS preference on first visit. |

### API Client

`api/client.ts` creates an Axios instance with:
- Base URL from `VITE_API_BASE_URL` (defaults to `http://localhost:8000`)
- 60-second timeout
- JSON content type

It exports typed functions: `sendQuery`, `executeSQL`, `getSessionHistory`, `getSchema`, `healthCheck`.

### Type Definitions

All TypeScript interfaces live in `types/index.ts`: `QueryRequest`, `QueryResponse`, `ChatMessage`, `SessionHistory`.

---

## Data Flow

### Request Lifecycle (Natural Language Query)

```
Step  Component              Action
────  ─────────────────────  ──────────────────────────────────────────────────
 1    ChatInput              User types a question and presses Enter.
 2    useChat hook           Creates a user ChatMessage, adds a loading
                             placeholder, sets isLoading = true.
 3    api/client.ts          POST /query { message, session_id } via Axios.
 4    routes.py              Receives QueryRequest, resolves session via
                             ConversationManager, retrieves chat history.
 5    workflow.py            process_query() initializes AgentState and
                             invokes the compiled LangGraph graph.
 6    detect_intent          Gemini classifies intent (generate_sql,
                             optimize_sql, debug_sql, explain_sql, or
                             out_of_scope).
 7    validate_scope         If out_of_scope → short-circuit to
                             build_response with a rejection message.
 8    retrieve_schema        Calls get_schema() → PRAGMA introspection of
                             all tables, columns, types, and foreign keys.
 9    generate_sql           Gemini generates a SELECT query using the
                             schema + conversation history as context.
10    validate_sql           Checks for destructive keywords (DELETE, DROP,
                             etc.), validates table names against the schema.
                             If invalid → short-circuit to build_response.
11    optimize_sql           Gemini reviews the query and returns an
                             optimized version (or the same query unchanged).
12    generate_explanation   Gemini produces a plain-English explanation of
                             the (optimized) SQL.
13    build_response         Calls execute_query(sql) to run the SQL against
                             SQLite. Compiles response_message, query_results,
                             and any execution errors.
14    routes.py              Stores the user message and assistant response in
                             ConversationManager. Returns QueryResponse.
15    useChat hook           Replaces the loading placeholder with the real
                             assistant message containing SQL, explanation,
                             and results.
16    ChatMessage            Renders the explanation text, SQL code block, and
                             ResultsTable.
```

### Direct SQL Execution Flow

```
ChatInput → POST /query/execute → execute_query() → SQLite → JSON response
```

This path bypasses the LangGraph agent entirely and runs user-provided SQL directly (SELECT only).

---

## Database Schema Diagram

```
┌──────────────────────┐          ┌──────────────────────────────────┐
│    Departments       │          │          Employees                │
├──────────────────────┤          ├──────────────────────────────────┤
│ DepartmentID (PK)    │◄────────┐│ EmployeeID (PK)                  │
│ DepartmentName       │         ││ FirstName                        │
│ ManagerID (FK) ──────┼────────┐││ LastName                         │
│ Budget               │        │││ Email (UNIQUE)                   │
│ Location             │        │││ Phone                            │
└──────────────────────┘        │││ HireDate                         │
                                │││ Salary                           │
                                ││├─ DepartmentID (FK) ──────────────┘
                                │└┤ ManagerID (FK) ──► self-reference │
                                │  │ JobTitle                         │
                                │  └──────────────────────────────────┘
                                │
                                └──── Departments.ManagerID ──► Employees.EmployeeID

┌──────────────────────────────────┐
│           Customers               │
├──────────────────────────────────┤
│ CustomerID (PK)                   │
│ FirstName                         │
│ LastName                          │
│ Email (UNIQUE)                    │
│ Phone                             │
│ Address                           │◄─────────────────────┐
│ City                              │                      │
│ State                             │                      │
│ ZipCode                           │                      │
│ JoinDate                          │                      │
└───────────────┬──────────────────┘                      │
                │                                          │
                │ 1:N                                      │
                ▼                                          │
┌──────────────────────────────────┐                      │
│            Orders                 │                      │
├──────────────────────────────────┤                      │
│ OrderID (PK)                      │                      │
│ CustomerID (FK) ──────────────────┘                      │
│ OrderDate                         │                      │
│ TotalAmount                       │                      │
│ Status                            │                      │
│ ShippingAddress                   │                      │
└───────────────┬──────────────────┘                      │
                │                                          │
                │ 1:N                                      │
                ▼                                          │
┌──────────────────────────────────┐   ┌──────────────────────────────┐
│          OrderItems               │   │         Products              │
├──────────────────────────────────┤   ├──────────────────────────────┤
│ OrderItemID (PK)                  │   │ ProductID (PK)                │
│ OrderID (FK) ─────────────────────┘   │ ProductName                   │
│ ProductID (FK) ──────────────────────▶│ Category                      │
│ Quantity                          │   │ Price                         │
│ UnitPrice                         │   │ StockQuantity                 │
└──────────────────────────────────┘   │ SupplierName                  │
                                       └──────────────────────────────┘
```

Relationships:
- **Departments ↔ Employees**: 1:N (a department has many employees). `Departments.ManagerID` also references `Employees.EmployeeID`.
- **Employees → Employees**: Self-referencing FK via `ManagerID` for the management hierarchy.
- **Customers → Orders**: 1:N (a customer places many orders).
- **Orders → OrderItems**: 1:N (an order contains many line items).
- **Products → OrderItems**: 1:N (a product appears in many order items).

---

## Security Considerations

### Read-Only Query Enforcement (Defense in Depth)

The system enforces read-only access at three levels:

1. **LLM Prompt** — The SQL generation prompt explicitly instructs Gemini to generate only `SELECT` statements and lists all forbidden keywords.
2. **SQL Validation Node** — `validate_sql` scans for destructive keywords (`DELETE`, `UPDATE`, `INSERT`, `DROP`, `ALTER`, `TRUNCATE`, `CREATE`) using both `sqlparse` statement-type detection and regex whole-word matching.
3. **Database Layer** — `execute_query()` checks that the SQL string starts with `SELECT` before executing. Any non-SELECT query raises a `ValueError`.

### Input Handling

- User input is passed to the LLM as a message, not interpolated into SQL. SQL generation is delegated to Gemini, avoiding direct string concatenation into queries.
- Pydantic models validate request structure on all API endpoints.

### API Key Management

- The Gemini API key is loaded from environment variables / `.env` file via `pydantic-settings`.
- The key is never exposed in API responses or frontend code.

### CORS

- Development: All origins allowed (`allow_origins=["*"]`).
- Production: This must be locked down to the specific frontend domain.

### Session Security

- Session IDs are UUIDs generated server-side. There is no authentication — anyone with a valid session ID can access that session's history.
- Conversation history is stored in-memory only. No sensitive data persists to disk beyond the SQLite database itself.

### Known Limitations

- No rate limiting on API endpoints.
- No authentication or authorization layer.
- CORS is fully open in the default configuration.
- In-memory session store means no isolation between server instances.

---

## Scalability Notes

### Current Design

The application is designed as a single-process, single-node system suitable for development, demos, and small-scale use.

| Component          | Scaling Characteristic                                  |
|--------------------|---------------------------------------------------------|
| SQLite             | Single-writer. Suitable for read-heavy workloads up to ~100 concurrent readers. |
| In-memory sessions | Lost on restart. Not shared across processes/instances. |
| Gemini API         | External service. Scaling depends on API quota and rate limits. |
| FastAPI/Uvicorn    | Single worker by default. Can run multiple workers but sessions won't be shared. |

### Scaling Path

To scale beyond a single node:

1. **Database** — Replace SQLite with PostgreSQL or MySQL. Update `connection.py` to use `asyncpg` or `aiomysql`. The schema is standard SQL and mostly portable.
2. **Session Store** — Replace the in-memory `ConversationManager` with Redis or a database-backed store. The `ConversationManager` interface is simple enough to swap.
3. **Multiple Workers** — Run Uvicorn with `--workers N` or deploy behind Gunicorn. Once sessions are externalized, this works out of the box.
4. **Horizontal Scaling** — Deploy multiple backend instances behind a load balancer. Requires externalized session store and shared database.
5. **Caching** — Schema introspection (`get_schema()`) queries PRAGMA on every request. Cache the result in-memory with a TTL since the schema changes rarely.
6. **LLM Costs** — Each query makes up to 4 Gemini API calls (intent, generation, optimization, explanation). Consider caching common queries or reducing the pipeline for simple requests.
7. **Frontend** — Static assets. Deploy to any CDN (Vercel, CloudFront, Netlify). Scales independently of the backend.
