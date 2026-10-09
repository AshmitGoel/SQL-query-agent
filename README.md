# SQL Query AI Agent

An AI-powered natural language to SQL query assistant. Users ask questions in plain English, and the agent generates, explains, and executes SQL queries against a sample SQLite database. Built with a LangGraph agent workflow, Google Gemini LLM, a FastAPI backend, and a React + Vite frontend.

---

## Features

- **Natural Language to SQL** — Convert plain English questions into valid SQL queries.
- **Conversational Context** — Multi-turn sessions that remember previous questions for follow-ups.
- **Query Explanation** — Every generated SQL query includes a human-readable explanation.
- **Query Execution** — Execute generated SQL and view results in a formatted table.
- **Schema Awareness** — The agent introspects the database schema to produce accurate queries.
- **Scope Guarding** — Non-database questions are gracefully handled with a helpful message instead of hallucinated SQL.
- **SQL Validation & Optimization** — Generated queries are validated and optimized before execution.
- **Session History** — View and continue previous conversations.
- **Read-Only Safety** — Only SELECT queries are executed; destructive operations are blocked.
- **Dark/Light Mode** — Frontend supports theme toggling for comfortable use.

---

## Tech Stack

### Backend
| Component       | Technology                     |
|-----------------|--------------------------------|
| Framework       | FastAPI 0.115                  |
| AI Agent        | LangGraph 0.2 + LangChain     |
| LLM             | Google Gemini 3.8 Flash        |
| Database        | SQLite (via aiosqlite)         |
| Validation      | Pydantic 2.9                   |
| SQL Parsing     | sqlparse 0.5                   |
| Server          | Uvicorn                        |

### Frontend
| Component       | Technology                     |
|-----------------|--------------------------------|
| Framework       | React 18 + TypeScript          |
| Build Tool      | Vite 5                         |
| Styling         | Tailwind CSS                   |
| HTTP Client     | Axios                          |

### DevOps
| Component       | Technology                     |
|-----------------|--------------------------------|
| CI/CD           | GitHub Actions                 |
| Backend Deploy  | Render                         |
| Frontend Deploy | Vercel                         |
| Containerization| Docker                         |

---

## Project Structure

```
SQL-query-agent/
├── backend/                  # Python FastAPI backend
│   ├── app/
│   │   ├── agents/           # LangGraph agent workflow
│   │   ├── api/              # FastAPI route handlers
│   │   ├── core/             # Config, conversation manager
│   │   ├── database/         # SQLite connection & queries
│   │   └── models/           # Pydantic request/response schemas
│   ├── data/                 # SQLite database files (gitignored)
│   ├── requirements.txt
│   └── .env.example
├── frontend/                 # React + Vite frontend
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
├── ci-cd/
│   ├── docker/               # Dockerfiles
│   └── github-actions/       # CI/CD workflow YAML
├── docs/                     # Documentation
├── scripts/
│   ├── setup.sh              # One-command project setup
│   └── run_dev.sh            # Run both servers in dev
├── .gitignore
└── README.md
```

---

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- A [Google Gemini API key](https://aistudio.google.com/app/apikey)

### Automated Setup

```bash
# Clone the repository
git clone https://github.com/<your-org>/SQL-query-agent.git
cd SQL-query-agent

# Run the setup script (creates venv, installs deps, seeds DB)
./scripts/setup.sh

# Edit backend/.env and add your Gemini API key
nano backend/.env

# Start both servers
./scripts/run_dev.sh
```

### Manual Setup

#### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

cp .env.example .env
# Edit .env and add your GEMINI_API_KEY

# Create data directory and run the app (DB auto-initializes on startup)
mkdir -p data
uvicorn app.main:app --reload --port 8000
```

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

The backend will be available at **http://localhost:8000** and the frontend at **http://localhost:5173**.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable         | Description                         | Default              |
|------------------|-------------------------------------|----------------------|
| `GEMINI_API_KEY` | Google Gemini API key (required)    | —                    |
| `DATABASE_PATH`  | Path to the SQLite database file    | `./data/sample.db`   |
| `MODEL_NAME`     | Gemini model to use                 | `gemini-3.8-flash`   |

### Frontend

| Variable           | Description                  | Default                  |
|--------------------|------------------------------|--------------------------|
| `VITE_API_BASE_URL`| Backend API URL              | `http://localhost:8000`  |

---

## API Endpoints

### `GET /`
Root endpoint. Returns a welcome message.

**Response:**
```json
{ "message": "SQL Query AI Agent API" }
```

### `GET /health`
Health check.

**Response:**
```json
{ "status": "healthy", "version": "0.1.0" }
```

### `POST /query`
Process a natural language question and generate SQL.

**Request:**
```json
{
  "message": "Show me all customers from New York",
  "session_id": "optional-uuid"
}
```

**Response:**
```json
{
  "sql": "SELECT * FROM customers WHERE city = 'New York';",
  "explanation": "This query retrieves all rows from the customers table where the city column equals 'New York'.",
  "message": "Here are the customers from New York.",
  "is_sql": true,
  "results": [{"id": 1, "name": "Alice", "city": "New York"}],
  "error": null,
  "session_id": "uuid-string"
}
```

### `POST /query/execute`
Execute a raw SQL query against the database.

**Request:**
```json
{
  "message": "SELECT COUNT(*) FROM orders;",
  "session_id": "optional-uuid"
}
```

**Response:**
```json
{
  "session_id": "uuid-string",
  "results": [{"COUNT(*)": 42}],
  "error": null
}
```

### `GET /sessions/{session_id}/history`
Retrieve conversation history for a given session.

**Response:**
```json
{
  "session_id": "uuid-string",
  "history": []
}
```

### `GET /schema`
Return the database schema information.

**Response:**
```json
{
  "schema": "CREATE TABLE customers (...); CREATE TABLE orders (...);"
}
```

---

## Architecture Overview

```
┌────────────────────┐        HTTP/JSON        ┌────────────────────────┐
│                    │ ◄─────────────────────► │                        │
│   React Frontend   │                         │   FastAPI Backend       │
│   (Vite + TS)      │                         │                        │
└────────────────────┘                         └────────┬───────────────┘
                                                        │
                                                        ▼
                                               ┌────────────────────┐
                                               │  LangGraph Agent    │
                                               │  Workflow            │
                                               │                     │
                                               │  ┌───────────────┐  │
                                               │  │ Scope Guard   │  │
                                               │  └──────┬────────┘  │
                                               │         ▼           │
                                               │  ┌───────────────┐  │
                                               │  │ SQL Generator │  │
                                               │  │ (Gemini LLM)  │  │
                                               │  └──────┬────────┘  │
                                               │         ▼           │
                                               │  ┌───────────────┐  │
                                               │  │ SQL Validator  │  │
                                               │  │ & Optimizer    │  │
                                               │  └──────┬────────┘  │
                                               │         ▼           │
                                               │  ┌───────────────┐  │
                                               │  │ Query Executor │  │
                                               │  └───────────────┘  │
                                               └────────┬───────────┘
                                                        │
                                                        ▼
                                               ┌────────────────────┐
                                               │   SQLite Database   │
                                               │   (sample.db)       │
                                               └────────────────────┘
```

**Flow:**
1. User types a natural language question in the React frontend.
2. The frontend sends a POST request to `/query` on the FastAPI backend.
3. The LangGraph agent workflow processes the request through a multi-step pipeline:
   - **Scope Guard** — Determines if the question is database-related.
   - **SQL Generator** — Uses Gemini to generate SQL from the question + schema context.
   - **SQL Validator & Optimizer** — Validates syntax and optimizes the query.
   - **Query Executor** — Runs the SQL against SQLite and returns results.
4. The backend returns the generated SQL, explanation, and query results.
5. The frontend displays the answer in a conversational chat interface.

---

## Deployment

### Backend — Render

1. Connect your GitHub repo to [Render](https://render.com).
2. Create a new **Web Service** pointing to the `backend/` directory.
3. Set the build command: `pip install -r requirements.txt`
4. Set the start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables: `GEMINI_API_KEY`, `DATABASE_PATH`.

### Frontend — Vercel

1. Connect your GitHub repo to [Vercel](https://vercel.com).
2. Set the root directory to `frontend/`.
3. Framework preset: **Vite**.
4. Add environment variable: `VITE_API_BASE_URL` pointing to your Render backend URL.

### Docker

Dockerfiles are provided in `ci-cd/docker/` for containerized deployment of both services.

---

## Assumptions

- The application uses a **pre-seeded SQLite database** as the data source (no external database required).
- Only **SELECT** queries are permitted; all write operations are blocked for safety.
- The LLM (Gemini 2.0 Flash) is accessed via API key — no local model hosting required.
- Conversation history is stored **in-memory** per session (not persisted across server restarts).
- The frontend and backend are deployed as **separate services** communicating over HTTP.
- CORS is configured to allow all origins in development; this should be restricted in production.
- The sample database schema is auto-detected by the agent at query time.

---

## License

This project is licensed under the [MIT License](LICENSE).
