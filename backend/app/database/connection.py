import os
from pathlib import Path

import aiosqlite

from app.core.config import settings
from app.database.seed_data import seed_database


async def get_connection() -> aiosqlite.Connection:
    """Get an async SQLite database connection."""
    db_path = settings.DATABASE_PATH
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    conn = await aiosqlite.connect(db_path)
    conn.row_factory = aiosqlite.Row
    return conn


async def get_schema() -> str:
    """Get the database schema as a formatted string."""
    conn = await get_connection()
    try:
        # Get all table names
        cursor = await conn.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
        )
        tables = await cursor.fetchall()

        schema_parts = []
        for table_row in tables:
            table_name = table_row[0]
            schema_parts.append(f"Table: {table_name}")

            # Get column info
            cursor = await conn.execute(f"PRAGMA table_info({table_name})")
            columns = await cursor.fetchall()

            for col in columns:
                col_id, col_name, col_type, not_null, default_val, is_pk = col
                nullable = "NOT NULL" if not_null else "NULLABLE"
                pk = " PRIMARY KEY" if is_pk else ""
                default = f" DEFAULT {default_val}" if default_val is not None else ""
                schema_parts.append(
                    f"  - {col_name} ({col_type}) {nullable}{pk}{default}"
                )

            # Get foreign key info
            cursor = await conn.execute(f"PRAGMA foreign_key_list({table_name})")
            fkeys = await cursor.fetchall()

            for fk in fkeys:
                schema_parts.append(
                    f"  FK: {fk[3]} -> {fk[2]}({fk[4]})"
                )

            schema_parts.append("")  # blank line between tables

        return "\n".join(schema_parts)
    finally:
        await conn.close()


async def execute_query(sql: str) -> list[dict]:
    """Execute a SELECT query and return results as a list of dicts."""
    # Safety check: only allow SELECT queries
    stripped = sql.strip().upper()
    if not stripped.startswith("SELECT"):
        raise ValueError("Only SELECT queries are allowed.")

    conn = await get_connection()
    try:
        cursor = await conn.execute(sql)
        columns = [description[0] for description in cursor.description]
        rows = await cursor.fetchall()
        return [dict(zip(columns, row)) for row in rows]
    finally:
        await conn.close()


async def init_database():
    """Initialize the database: create tables and seed data if they don't exist."""
    db_path = settings.DATABASE_PATH
    os.makedirs(os.path.dirname(db_path) if os.path.dirname(db_path) else ".", exist_ok=True)

    # Create tables
    conn = await get_connection()
    try:
        schema_path = Path(__file__).parent / "schema.sql"
        schema_sql = schema_path.read_text()
        await conn.executescript(schema_sql)
        await conn.commit()

        # Check if data already exists
        cursor = await conn.execute("SELECT COUNT(*) FROM Departments")
        count = (await cursor.fetchone())[0]
    finally:
        await conn.close()

    # Seed data if tables are empty
    if count == 0:
        await seed_database(db_path)
