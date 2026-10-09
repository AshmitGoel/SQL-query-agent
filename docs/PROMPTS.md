# Prompts Reference

All LLM prompts used in the SQL Query AI Agent, with the exact text, template variables, and design rationale for each.

---

## Table of Contents

- [Overview](#overview)
- [1. Intent Detection Prompt](#1-intent-detection-prompt)
- [2. SQL Generation Prompt](#2-sql-generation-prompt)
- [3. SQL Optimization Prompt](#3-sql-optimization-prompt)
- [4. Explanation Generation Prompt](#4-explanation-generation-prompt)
- [Design Philosophy](#design-philosophy)

---

## Overview

The application uses four distinct LLM prompts, each crafted for a specific stage of the agent workflow. All prompts are sent as system messages via LangChain's `SystemMessage` class, paired with a `HumanMessage` containing the user's input.

All prompts target Google Gemini 2.0 Flash with `temperature=0` for deterministic, repeatable output.

---

## 1. Intent Detection Prompt

**Used in**: `detect_intent` node  
**Purpose**: Classify the user's message into exactly one of five intent categories.

### System Prompt (exact text)

```
You are an intent classifier for an SQL-only assistant. The assistant ONLY helps with SQL-related tasks on a company database. Classify the user's message into exactly one of the following intents:
- generate_sql: The user wants to retrieve data or asks a question that requires writing a new SQL query.
- optimize_sql: The user provides an existing SQL query and wants it optimized.
- debug_sql: The user provides a SQL query that has errors and wants help fixing it.
- explain_sql: The user provides a SQL query and wants it explained in plain English.
- out_of_scope: The user's request is NOT related to SQL or databases at all (e.g., writing poems, general knowledge, coding in other languages, math problems, etc.).

Respond with ONLY the intent label, nothing else.
```

### Human Message

```
{state["user_message"]}
```

The raw user message is passed directly — no template wrapping.

### Template Variables

None. This prompt is static.

### Design Rationale

| Instruction | Why |
|---|---|
| "You are an intent classifier for an SQL-only assistant" | Sets the LLM's role identity. Framing it as a classifier (not a general assistant) reduces the chance of the model trying to answer the question instead of classifying it. |
| "The assistant ONLY helps with SQL-related tasks on a company database" | Narrows the scope. Without this, the model might classify general data questions as in-scope. |
| Five explicit intent definitions with examples | Structured enumeration eliminates ambiguity. Each intent has a clear description and implied boundary. The parenthetical examples for `out_of_scope` establish the rejection pattern by listing diverse non-SQL tasks. |
| "Respond with ONLY the intent label, nothing else" | Forces single-token output. Without this, the model often includes reasoning or explanations, making parsing unreliable. |

### Fallback Behavior

If the LLM returns a value not in `{generate_sql, optimize_sql, debug_sql, explain_sql, out_of_scope}`, the system defaults to `generate_sql`. This ensures ambiguous inputs are handled productively rather than rejected.

---

## 2. SQL Generation Prompt

**Used in**: `generate_sql` node  
**Purpose**: Generate a SQL query from the user's natural language request, using the database schema and conversation history as context.

### System Prompt (exact text with template variables)

```
You are an expert SQL assistant. You generate SQL queries for a SQLite database.

RULES:
1. Generate ONLY SELECT queries. Never generate DELETE, UPDATE, INSERT, DROP, ALTER, TRUNCATE, or CREATE statements.
2. Use ONLY the tables and columns listed in the schema below.
3. Do NOT use any destructive operations.
4. Return ONLY the SQL query, no explanations, no markdown formatting, no code fences.
5. Make sure the query is valid SQLite syntax.

DATABASE SCHEMA:
{state['schema_info']}

```

**If conversation history exists**, this section is appended:

```
CONVERSATION HISTORY:
{history_text}

```

Where `history_text` is built from `state["chat_history"]`:

```python
for msg in state["chat_history"]:
    role = msg.get("role", "user")
    content = msg.get("content", "")
    history_text += f"{role}: {content}\n"
```

### Human Message

The human message varies by intent:

| Intent | Human Message |
|---|---|
| `generate_sql` | `{state["user_message"]}` |
| `explain_sql` | `{state["user_message"]}` |
| `debug_sql` | `Fix the following SQL query or issue:\n{state["user_message"]}` |
| `optimize_sql` | `Rewrite and optimize the following SQL:\n{state["user_message"]}` |

### Template Variables

| Variable | Source | Description |
|---|---|---|
| `{state['schema_info']}` | `retrieve_schema` node output | Full text representation of the database schema including table names, columns, types, constraints, and foreign keys. |
| `{history_text}` | Formatted `state["chat_history"]` | Role-content pairs from previous conversation turns. Only included when non-empty. |
| `{state["user_message"]}` | Original user input | The natural language question or SQL to fix/optimize. |

### Post-Processing

The LLM response is cleaned before being stored:

```python
sql = response.content.strip()
sql = re.sub(r"^```(?:sql)?\s*\n?", "", sql)   # Remove opening code fence
sql = re.sub(r"\n?```\s*$", "", sql)             # Remove closing code fence
sql = sql.strip()
```

### Design Rationale

| Instruction | Why |
|---|---|
| "expert SQL assistant" | Role priming. "Expert" quality framing produces more accurate SQL than generic assistant framing. |
| Rule 1: "Generate ONLY SELECT queries" + explicit list of forbidden keywords | First line of defense against destructive operations. Listing each keyword explicitly is more reliable than a general "no writes" instruction. |
| Rule 2: "Use ONLY the tables and columns listed in the schema below" | Prevents hallucination of non-existent tables or columns. Grounds the model in the actual schema. |
| Rule 3: "Do NOT use any destructive operations" | Redundant with Rule 1 but reinforces the safety constraint. LLMs respond better to repeated emphasis on critical instructions. |
| Rule 4: "Return ONLY the SQL query, no explanations, no markdown" | Ensures the output can be directly parsed and executed. Without this, models often wrap SQL in explanatory text or markdown fences. |
| Rule 5: "valid SQLite syntax" | SQLite has dialect differences from MySQL/PostgreSQL (e.g., no `LIMIT ... OFFSET` in older versions, different date functions). This anchors generation to the correct dialect. |
| Schema injection | Dynamic schema means the prompt works with any database, not just the sample one. The agent automatically adapts if tables are added or modified. |
| Conversation history | Enables multi-turn queries. "Now filter that by status" works because the model can see the previous query in context. |
| Intent-based message prefixing | Reuses a single generation node for three intents (generate, debug, optimize) by prepending task-specific instructions. |

---

## 3. SQL Optimization Prompt

**Used in**: `optimize_sql` node  
**Purpose**: Review a generated SQL query and return an optimized version.

### System Prompt (exact text with template variables)

```
You are an SQL optimization expert for SQLite databases.
Given a SQL query and the database schema, suggest an optimized version.
If the query is already optimal, return it unchanged.
Return ONLY the optimized SQL query, no explanations, no markdown.

DATABASE SCHEMA:
{state['schema_info']}
```

### Human Message

```
Optimize this SQL query:
{state['generated_sql']}
```

### Template Variables

| Variable | Source | Description |
|---|---|---|
| `{state['schema_info']}` | `retrieve_schema` node output | Full database schema for context. |
| `{state['generated_sql']}` | `generate_sql` node output | The SQL query to optimize. |

### Post-Processing

Same markdown fence stripping as the generation prompt.

### Design Rationale

| Instruction | Why |
|---|---|
| "SQL optimization expert for SQLite databases" | Narrows the optimization context to SQLite-specific patterns. PostgreSQL-style optimizations (e.g., CTEs, window functions on older SQLite) might not apply. |
| "suggest an optimized version" | Open-ended enough to allow various optimizations: index hints, column selection, join reordering, subquery elimination. |
| "If the query is already optimal, return it unchanged" | Critical instruction. Without this, the model might rewrite a perfectly good query into something different but not better, or refuse to respond because there's nothing to improve. |
| "Return ONLY the optimized SQL query" | Same rationale as the generation prompt — clean output for downstream processing. |
| Schema context | The model needs schema knowledge to suggest meaningful optimizations (e.g., knowing which columns are indexed or which tables are small). |

---

## 4. Explanation Generation Prompt

**Used in**: `generate_explanation` node  
**Purpose**: Produce a human-readable explanation of a SQL query.

### System Prompt (exact text)

```
You are a helpful assistant that explains SQL queries in plain English.
Given a SQL query, explain what it does step by step in clear, non-technical language that anyone can understand.
Be concise but thorough.
```

### Human Message

```
Explain this SQL query:
{sql_to_explain}
```

Where `sql_to_explain` is:

```python
sql_to_explain = state.get("optimized_sql") or state.get("generated_sql", "")
```

The optimized SQL is preferred. Falls back to the original generated SQL.

### Template Variables

| Variable | Source | Description |
|---|---|---|
| `{sql_to_explain}` | `optimized_sql` or `generated_sql` | The final SQL query to explain. |

### Design Rationale

| Instruction | Why |
|---|---|
| "helpful assistant that explains SQL queries in plain English" | Switches the model's persona from code generator to teacher. This framing produces more accessible explanations. |
| "step by step" | Encourages structured output that walks through the query clause by clause (SELECT, FROM, WHERE, GROUP BY, etc.) rather than giving a one-sentence summary. |
| "clear, non-technical language that anyone can understand" | The target audience is users who typed a natural language question — they may not know SQL. Technical jargon defeats the purpose. |
| "Be concise but thorough" | Balances two competing goals: don't be so brief that important clauses are skipped, but don't write a paragraph for `SELECT COUNT(*) FROM orders`. |
| Uses optimized SQL over original | The explanation should match what was actually executed. If the optimizer changed the query, the explanation should reflect that version. |

---

## Design Philosophy

### General Principles

1. **Role priming**: Every prompt begins with "You are a/an [specific role]". This consistently improves output quality compared to generic instructions.

2. **Explicit output format constraints**: Every prompt that produces parseable output includes "Return ONLY..." instructions. Without these, LLMs frequently add commentary, markdown formatting, or preambles that break downstream parsing.

3. **Defense in depth for safety**: The read-only constraint appears in the SQL generation prompt (Rule 1 + Rule 3), is enforced programmatically in `validate_sql`, and is enforced again in `execute_query()`. No single layer is trusted alone.

4. **Dynamic context injection**: Schema and conversation history are injected at runtime rather than hardcoded. This makes the system adaptable to schema changes and enables multi-turn conversations.

5. **Minimal prompts**: Each prompt does one thing. Intent classification is separate from SQL generation, which is separate from optimization and explanation. This makes each step independently testable and debuggable.

6. **Temperature zero**: All LLM calls use `temperature=0`. SQL generation and classification require precision, not creativity. The same question should produce the same query every time.

### Prompt Separation vs. Single Prompt

An alternative design would use a single mega-prompt that classifies intent, generates SQL, optimizes, and explains all in one call. The current multi-step approach was chosen because:

- **Debuggability**: When a query is wrong, the state dict shows exactly which step produced the error.
- **Cost control**: Out-of-scope requests exit after 1 LLM call instead of 4.
- **Specialization**: Each prompt can be tuned independently. The optimization prompt benefits from different instructions than the generation prompt.
- **Validation gating**: Programmatic validation between generation and optimization prevents optimizing (and explaining) a query that should never be executed.

The tradeoff is latency — the happy path makes 4 sequential LLM calls. For most interactive use cases with Gemini Flash, this remains under 3-5 seconds total.
