# LangGraph Workflow

A detailed breakdown of the AI agent workflow that powers the SQL Query Agent.

---

## Table of Contents

- [Overview](#overview)
- [Workflow Diagram](#workflow-diagram)
- [State Management](#state-management)
- [Node Descriptions](#node-descriptions)
  - [1. detect_intent](#1-detect_intent)
  - [2. validate_scope](#2-validate_scope)
  - [3. retrieve_schema](#3-retrieve_schema)
  - [4. generate_sql](#4-generate_sql)
  - [5. validate_sql](#5-validate_sql)
  - [6. optimize_sql](#6-optimize_sql)
  - [7. generate_explanation](#7-generate_explanation)
  - [8. build_response](#8-build_response)
- [Conditional Routing Logic](#conditional-routing-logic)
- [Error Handling](#error-handling)
- [LLM Configuration](#llm-configuration)

---

## Overview

The agent workflow is implemented as a LangGraph `StateGraph` — a directed graph where each node is an async Python function that reads from and writes to a shared state dictionary. The graph is compiled once at module load time and invoked per request via `graph.ainvoke()`.

The workflow processes a user's natural language message through up to 8 sequential steps:

1. **Classify** the user's intent.
2. **Guard** against out-of-scope requests.
3. **Load** the database schema.
4. **Generate** a SQL query using the LLM.
5. **Validate** the generated SQL for safety and correctness.
6. **Optimize** the SQL query via the LLM.
7. **Explain** the query in plain English.
8. **Build** the final response with optional query execution.

Conditional edges allow the workflow to short-circuit at two points: after scope validation (for out-of-scope requests) and after SQL validation (for unsafe or invalid queries).

---

## Workflow Diagram

```
                        ┌─────────────────┐
                        │  Entry Point     │
                        └────────┬────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │   1. detect_intent      │
                    │   (Gemini LLM call)     │
                    └────────────┬───────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │   2. validate_scope     │
                    └────────────┬───────────┘
                                 │
                        ┌────────┴────────┐
                        │                 │
               is_in_scope=False    is_in_scope=True
                        │                 │
                        ▼                 ▼
              ┌──────────────┐  ┌────────────────────────┐
              │              │  │   3. retrieve_schema     │
              │              │  └────────────┬───────────┘
              │              │               │
              │              │               ▼
              │              │  ┌────────────────────────┐
              │              │  │   4. generate_sql       │
              │              │  │   (Gemini LLM call)     │
              │              │  └────────────┬───────────┘
              │              │               │
              │              │               ▼
              │              │  ┌────────────────────────┐
              │              │  │   5. validate_sql       │
              │              │  └────────────┬───────────┘
              │              │               │
              │              │      ┌────────┴────────┐
              │              │      │                 │
              │              │ is_valid=False    is_valid=True
              │              │      │                 │
              │              │      │                 ▼
              │              │      │    ┌────────────────────────┐
              │              │      │    │   6. optimize_sql       │
              │              │      │    │   (Gemini LLM call)     │
              │              │      │    └────────────┬───────────┘
              │              │      │                 │
              │              │      │                 ▼
              │              │      │    ┌────────────────────────┐
              │              │      │    │   7. generate_explanation│
              │              │      │    │   (Gemini LLM call)     │
              │              │      │    └────────────┬───────────┘
              │              │      │                 │
              │              │      │                 │
              ▼              ▼      ▼                 ▼
            ┌──────────────────────────────────────────┐
            │          8. build_response                 │
            └────────────────────┬─────────────────────┘
                                 │
                                 ▼
                            ┌─────────┐
                            │   END   │
                            └─────────┘
```

---

## State Management

The workflow uses a `TypedDict` called `AgentState` as its shared state container. Every node function receives the full state and returns a partial dict of updated fields.

```python
class AgentState(TypedDict):
    user_message: str               # The original user input
    session_id: str                 # UUID session identifier
    chat_history: list[dict]        # Previous messages in this session
    intent: str                     # Classified intent label
    is_in_scope: bool               # Whether the request is database-related
    schema_info: str                # Text representation of the DB schema
    generated_sql: str              # SQL produced by the LLM
    is_valid_sql: bool              # Whether validation passed
    validation_errors: list[str]    # List of validation error messages
    optimized_sql: str              # Optimized version of the SQL
    explanation: str                # Plain-English query explanation
    query_results: list[dict] | None  # Rows returned by query execution
    error: str | None               # Execution error message, if any
    response_message: str           # Final human-readable response text
```

### Initial State

When `process_query()` is called, it constructs the initial state with the user's message, session ID, and chat history. All other fields are initialized to sensible defaults (empty strings, `False`, `None`, empty lists).

### State Flow

Each node reads only the fields it needs and returns only the fields it sets. LangGraph merges the returned dict into the existing state before passing it to the next node.

| Node                  | Reads                                           | Writes                                    |
|-----------------------|-------------------------------------------------|-------------------------------------------|
| `detect_intent`       | `user_message`                                  | `intent`                                  |
| `validate_scope`      | `intent`                                        | `is_in_scope`, `response_message`         |
| `retrieve_schema`     | —                                               | `schema_info`                             |
| `generate_sql`        | `user_message`, `intent`, `schema_info`, `chat_history` | `generated_sql`                 |
| `validate_sql`        | `generated_sql`, `schema_info`                  | `is_valid_sql`, `validation_errors`       |
| `optimize_sql`        | `generated_sql`, `schema_info`                  | `optimized_sql`                           |
| `generate_explanation` | `optimized_sql`, `generated_sql`               | `explanation`                             |
| `build_response`      | `is_in_scope`, `validation_errors`, `optimized_sql`, `generated_sql`, `explanation` | `response_message`, `query_results`, `error` |

---

## Node Descriptions

### 1. detect_intent

**Purpose**: Classify the user's message into one of five intent categories using the LLM.

**LLM Call**: Yes (Gemini)

**Intent Categories**:

| Intent          | Description                                                 | Example                                |
|-----------------|-------------------------------------------------------------|----------------------------------------|
| `generate_sql`  | User wants to retrieve data or needs a new SQL query        | "Show me all customers from California" |
| `optimize_sql`  | User provides an existing SQL query and wants it optimized  | "Optimize: SELECT * FROM orders WHERE..." |
| `debug_sql`     | User provides a SQL query with errors and wants it fixed    | "Fix this query: SELCT * FORM users"   |
| `explain_sql`   | User provides a SQL query and wants a plain-English explanation | "What does SELECT COUNT(*) FROM orders GROUP BY status do?" |
| `out_of_scope`  | Request is not related to SQL or databases                  | "Write me a poem about cats"           |

**Fallback**: If the LLM returns an unrecognized intent, it defaults to `generate_sql`.

**Processing**: The LLM response is stripped, lowercased, and underscores are normalized. The result is checked against the set of valid intents.

See [PROMPTS.md](./PROMPTS.md) for the exact prompt text.

---

### 2. validate_scope

**Purpose**: Gate the workflow — reject out-of-scope requests early without consuming further LLM calls or database queries.

**LLM Call**: No

**Logic**:
- If `intent == "out_of_scope"`: sets `is_in_scope = False` and writes a fixed rejection message explaining the assistant's capabilities.
- Otherwise: sets `is_in_scope = True` and passes through.

**Rejection Message**:
> "I'm sorry, but I can only help with SQL-related queries. I can generate SQL queries, optimize existing ones, debug SQL errors, or explain SQL statements. Please ask me something related to SQL!"

---

### 3. retrieve_schema

**Purpose**: Dynamically load the current database schema so the LLM has accurate table/column information.

**LLM Call**: No

**Implementation**: Calls `get_schema()` which:
1. Queries `sqlite_master` for all table names.
2. For each table, runs `PRAGMA table_info()` to get columns (name, type, nullability, default, PK status).
3. Runs `PRAGMA foreign_key_list()` to get foreign key relationships.
4. Formats everything into a text block.

**Output Format**:
```
Table: Customers
  - CustomerID (INTEGER) NOT NULL PRIMARY KEY
  - FirstName (TEXT) NOT NULL
  - LastName (TEXT) NOT NULL
  ...

Table: Orders
  - OrderID (INTEGER) NOT NULL PRIMARY KEY
  - CustomerID (INTEGER) NOT NULL
  ...
  FK: CustomerID -> Customers(CustomerID)
```

This approach means the agent automatically adapts if the schema changes — no hardcoded schema knowledge.

---

### 4. generate_sql

**Purpose**: Use Gemini to generate a SQL query from the user's natural language request, informed by the database schema and conversation history.

**LLM Call**: Yes (Gemini)

**Input Adaptation**: The node adjusts the user message based on intent:
- `generate_sql` / `explain_sql` → User message as-is
- `debug_sql` → Prefixed with "Fix the following SQL query or issue:"
- `optimize_sql` → Prefixed with "Rewrite and optimize the following SQL:"

**Conversation History**: If previous messages exist in the session, they are formatted as `role: content` pairs and appended to the system prompt under a `CONVERSATION HISTORY` section. This enables multi-turn follow-ups like "Now filter that by status = 'Shipped'".

**Post-Processing**: Markdown code fences (` ```sql ... ``` `) are stripped from the response since some models wrap SQL output.

See [PROMPTS.md](./PROMPTS.md) for the exact prompt text.

---

### 5. validate_sql

**Purpose**: Verify that the generated SQL is safe to execute and references valid schema objects.

**LLM Call**: No

**Validation Checks**:

1. **Empty check** — If no SQL was generated, validation fails with "No SQL was generated."

2. **Destructive keyword detection** (two-pass):
   - **Pass 1 (sqlparse)**: Parses the SQL with `sqlparse` and checks `statement.get_type()` and the first token against: `DELETE`, `UPDATE`, `INSERT`, `DROP`, `ALTER`, `TRUNCATE`, `CREATE`.
   - **Pass 2 (regex)**: Scans the uppercased SQL for whole-word matches of each destructive keyword using `\b...\b` patterns as a fallback.

3. **Table name validation**: Extracts table names from `FROM` and `JOIN` clauses using the regex `(?:FROM|JOIN)\s+(\w+)`. Each referenced table is checked against the set of known tables parsed from `schema_info`. Unknown tables produce a validation error.

**Output**: Sets `is_valid_sql` to `True`/`False` and populates `validation_errors` with descriptive error messages.

---

### 6. optimize_sql

**Purpose**: Ask Gemini to review the generated SQL and suggest optimizations.

**LLM Call**: Yes (Gemini)

**Behavior**: The LLM receives the SQL query and the full database schema. It is instructed to return the optimized version or the original if it's already optimal. This may include:
- Selecting specific columns instead of `SELECT *`
- Adding more efficient JOIN patterns
- Rewriting subqueries as JOINs
- Improving WHERE clause structure

**Post-Processing**: Markdown code fences are stripped from the response.

See [PROMPTS.md](./PROMPTS.md) for the exact prompt text.

---

### 7. generate_explanation

**Purpose**: Produce a plain-English explanation of the SQL query that non-technical users can understand.

**LLM Call**: Yes (Gemini)

**Input**: Uses the optimized SQL if available, falling back to the original generated SQL.

**Style**: The prompt asks for a step-by-step explanation in clear, non-technical language. The goal is to help users understand what the query does without needing to read SQL.

See [PROMPTS.md](./PROMPTS.md) for the exact prompt text.

---

### 8. build_response

**Purpose**: Compile the final response by assembling explanation text, executing the query, and handling any errors.

**LLM Call**: No

**Three Branches**:

1. **Out-of-scope** (`is_in_scope == False`): Returns immediately — `response_message` was already set by `validate_scope`.

2. **Validation failed** (`validation_errors` is non-empty): Joins all validation errors into a single string and returns an error response asking the user to rephrase.

3. **Success** (valid SQL exists):
   - Selects the optimized SQL (falls back to generated SQL).
   - Calls `execute_query(sql)` to run the query against SQLite.
   - Catches any execution exception and stores the error.
   - Builds `response_message` from the explanation + any execution warnings.
   - Sets `query_results` with the returned rows.

---

## Conditional Routing Logic

The workflow uses two conditional edges to create early-exit paths:

### After `validate_scope`

```python
def _route_after_scope(state: AgentState) -> str:
    if not state.get("is_in_scope", True):
        return "build_response"    # Skip to end
    return "retrieve_schema"        # Continue pipeline
```

This saves 3-4 LLM calls for out-of-scope requests by jumping directly to `build_response`.

### After `validate_sql`

```python
def _route_after_validation(state: AgentState) -> str:
    if state.get("is_valid_sql", False):
        return "optimize_sql"       # Continue pipeline
    return "build_response"         # Skip to end with errors
```

Invalid SQL skips optimization and explanation — there's no value in optimizing or explaining a query that won't be executed.

### Edge Map

```
detect_intent ─────────────► validate_scope
validate_scope ──conditional─► retrieve_schema  (in-scope)
                             ► build_response   (out-of-scope)
retrieve_schema ───────────► generate_sql
generate_sql ──────────────► validate_sql
validate_sql ──conditional──► optimize_sql      (valid)
                             ► build_response   (invalid)
optimize_sql ──────────────► generate_explanation
generate_explanation ──────► build_response
build_response ────────────► END
```

---

## Error Handling

Errors are handled at multiple levels:

### Node Level

- `detect_intent`: Unrecognized intents default to `generate_sql` rather than failing.
- `validate_sql`: Produces descriptive error messages collected in `validation_errors`.
- `build_response`: Wraps `execute_query()` in a try/except. Execution errors are stored in `state["error"]` and included in the response message, but don't crash the workflow.

### API Level

The `query_endpoint` route handler wraps the entire `process_query()` call in a try/except. If any unhandled exception occurs, it returns a `QueryResponse` with an error message rather than a 500 error.

```python
except Exception as e:
    return QueryResponse(
        sql=None,
        explanation=None,
        message=f"An error occurred: {str(e)}",
        is_sql=False,
        error=str(e),
        session_id=session_id,
    )
```

### Frontend Level

The `useChat` hook catches Axios errors and replaces the loading placeholder with a user-friendly error message: "Sorry, something went wrong. Please try again."

---

## LLM Configuration

All LLM calls use the same configuration:

```python
ChatGoogleGenerativeAI(
    model="gemini-2.0-flash",              # Fast, cost-effective model
    google_api_key=settings.GEMINI_API_KEY, # From .env
    temperature=0,                          # Deterministic output
    convert_system_message_to_human=True,   # Gemini API compatibility
)
```

**Why temperature=0**: SQL generation requires precision. Non-deterministic output could produce syntactically valid but semantically different queries for the same input.

**Why convert_system_message_to_human**: The Gemini API does not natively support system messages in the same way as OpenAI's API. This flag prepends the system message to the first human message, preserving the intended behavior.

**Model choice (gemini-2.0-flash)**: Balances speed, cost, and capability. Fast enough for interactive use while being capable enough for SQL generation. Configurable via the `MODEL_NAME` environment variable.
