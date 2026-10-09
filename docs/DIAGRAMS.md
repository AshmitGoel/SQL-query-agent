## 1. LangGraph Agent Workflow

```mermaid
flowchart TD
    A[👤 User Input] --> B[🛡️ Prompt Injection Check]
    B -->|Injection Detected| C[❌ Out of Scope Response]
    B -->|Clean| D[🧠 Detect Intent<br/>Gemini classifies intent]
    
    D -->|generate_sql| E[✅ Validate Scope]
    D -->|optimize_sql| E
    D -->|debug_sql| E
    D -->|explain_sql| E
    D -->|out_of_scope| C
    
    E -->|In Scope| F[📋 Retrieve Schema<br/>sqlite_master + PRAGMA table_info]
    E -->|Out of Scope| C
    
    F --> G[⚡ Generate SQL<br/>Gemini + Schema + Chat History]
    
    G --> H[🔍 Validate SQL]
    H -->|Check 1| H1[No DELETE/DROP/UPDATE/INSERT/ALTER/TRUNCATE]
    H -->|Check 2| H2[Table names exist in schema]
    H -->|Check 3| H3[sqlparse syntax check]
    
    H -->|Valid ✅| I[🔧 Optimize SQL<br/>Gemini improves query]
    H -->|Invalid ❌| J[⚠️ Return Validation Error]
    
    I --> K[📝 Generate Explanation<br/>Gemini explains in plain English]
    
    K --> L[🏗️ Build Response]
    L --> M[▶️ Execute SQL<br/>SELECT only]
    M --> N[📊 Return Response<br/>SQL + Explanation + Results]
    
    C --> O[🔚 END]
    J --> O
    N --> O

    style B fill:#ff6b6b,color:#fff
    style D fill:#4ecdc4,color:#fff
    style G fill:#45b7d1,color:#fff
    style H fill:#f9ca24,color:#333
    style I fill:#6c5ce7,color:#fff
    style K fill:#a29bfe,color:#fff
    style M fill:#00b894,color:#fff
```

## 2. Full System Architecture

```mermaid
flowchart LR
    subgraph Browser["🌐 Browser (User's Device)"]
        UI[React App<br/>Vite + Tailwind]
        LS[(localStorage<br/>Chat History)]
        UI <--> LS
    end

    subgraph Vercel["☁️ Vercel (Frontend Host)"]
        Static[Static Files<br/>HTML/JS/CSS]
    end

    subgraph Render["☁️ Render (Backend Host)"]
        subgraph FastAPI["FastAPI Server"]
            Routes[API Routes]
            subgraph LangGraph["LangGraph Workflow"]
                Intent[Detect Intent]
                Scope[Validate Scope]
                Schema[Retrieve Schema]
                GenSQL[Generate SQL]
                Validate[Validate SQL]
                Optimize[Optimize SQL]
                Explain[Generate Explanation]
                Build[Build Response]
            end
        end
        DB[(SQLite<br/>sample.db)]
    end

    Gemini[🤖 Google Gemini API]

    Browser -->|HTTPS| Vercel
    Vercel -->|Serves| Browser
    UI -->|POST /query<br/>+ chat_history| Routes
    Routes --> LangGraph
    LangGraph --> DB
    LangGraph -->|API Calls| Gemini
    Routes -->|JSON Response| UI

    style Browser fill:#e8f4f8,color:#333
    style Vercel fill:#f0f0f0,color:#333
    style Render fill:#f0f0f0,color:#333
    style Gemini fill:#4285f4,color:#fff
```

## 3. Data Flow — Single Request

```mermaid
sequenceDiagram
    actor User
    participant React as React Frontend
    participant LS as localStorage
    participant API as FastAPI
    participant LG as LangGraph
    participant Gemini as Google Gemini
    participant DB as SQLite

    User->>React: Types "Show employees from Engineering"
    React->>React: Add user message to UI
    React->>React: Show loading dots
    React->>LS: Read last 10 messages
    React->>API: POST /query {message, chat_history}
    
    API->>LG: process_query()
    
    Note over LG: Node 1: Detect Intent
    LG->>LG: Check prompt injection (regex)
    LG->>Gemini: Classify intent
    Gemini-->>LG: "generate_sql"
    
    Note over LG: Node 2: Validate Scope
    LG->>LG: In scope ✓
    
    Note over LG: Node 3: Retrieve Schema
    LG->>DB: SELECT from sqlite_master
    DB-->>LG: 6 tables with columns
    
    Note over LG: Node 4: Generate SQL
    LG->>Gemini: Schema + History + Question
    Gemini-->>LG: SELECT * FROM Employees...
    
    Note over LG: Node 5: Validate SQL
    LG->>LG: No destructive keywords ✓
    LG->>LG: Table names valid ✓
    
    Note over LG: Node 6: Optimize SQL
    LG->>Gemini: Improve this query
    Gemini-->>LG: Optimized SQL
    
    Note over LG: Node 7: Generate Explanation
    LG->>Gemini: Explain this query
    Gemini-->>LG: Plain English explanation
    
    Note over LG: Node 8: Build Response
    LG->>DB: Execute SELECT query
    DB-->>LG: Result rows
    
    LG-->>API: Complete state
    API-->>React: {sql, explanation, results}
    React->>React: Replace loading with response
    React->>LS: Save session to localStorage
    React->>User: Show SQL + Explanation + Table
```

## 4. Frontend Component Tree

```mermaid
flowchart TD
    App[App.tsx]
    
    App --> Header[Header.tsx<br/>Title, History, New Chat, Dark Mode]
    App --> Main[Main Content Area]
    App --> Sidebar[SessionsSidebar.tsx<br/>Chat History from localStorage]
    App --> SchemaP[SchemaPanel.tsx<br/>DB Schema Viewer]
    
    Main --> Welcome[WelcomeScreen.tsx<br/>4 Example Query Cards]
    Main --> Messages[ChatMessage.tsx × N<br/>Message Bubbles]
    Main --> Input[ChatInput.tsx<br/>Auto-growing Textarea]
    
    Messages --> SqlBlock[SqlBlock<br/>Syntax Highlighted SQL + Copy]
    Messages --> Markdown[MarkdownContent<br/>Formatted Explanation]
    Messages --> Table[ResultsTable.tsx<br/>Data Table + CSV Export]
    
    App -.->|useChat hook| State[Chat State<br/>messages, sessionId, isLoading]
    App -.->|useDarkMode hook| Theme[Theme State<br/>isDark, toggle]

    style App fill:#6366f1,color:#fff
    style State fill:#f59e0b,color:#333
    style Theme fill:#f59e0b,color:#333
```
