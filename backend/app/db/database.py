from pathlib import Path
import sqlite3
from typing import Any

from app.core.config import settings


TABLES = {
    "teams": """
        CREATE TABLE IF NOT EXISTS teams (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
    """,
    "users": """
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            team_id INTEGER,
            name TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'member',
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (team_id) REFERENCES teams(id)
        )
    """,
    "schedules": """
        CREATE TABLE IF NOT EXISTS schedules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            category TEXT NOT NULL,
            title TEXT NOT NULL,
            start_at TEXT NOT NULL,
            end_at TEXT NOT NULL,
            memo TEXT,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """,
    "job_runs": """
        CREATE TABLE IF NOT EXISTS job_runs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            job_type TEXT NOT NULL,
            status TEXT NOT NULL,
            detail TEXT,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
    """,
}


def get_db_path() -> Path:
    return settings.db_path


def get_connection() -> sqlite3.Connection:
    connection = sqlite3.connect(get_db_path())
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return connection


def initialize_database() -> None:
    get_db_path().parent.mkdir(parents=True, exist_ok=True)
    with get_connection() as connection:
        for statement in TABLES.values():
            connection.execute(statement)
        connection.commit()


def fetch_table_count() -> int:
    with get_connection() as connection:
        cursor = connection.execute(
            "SELECT COUNT(*) AS count FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'"
        )
        row = cursor.fetchone()
        return int(row["count"]) if row is not None else 0


def is_database_connected() -> bool:
    try:
        with get_connection() as connection:
            connection.execute("SELECT 1")
        return True
    except sqlite3.Error:
        return False


def run_query(query: str, params: tuple[Any, ...] = ()) -> list[sqlite3.Row]:
    with get_connection() as connection:
        cursor = connection.execute(query, params)
        rows = cursor.fetchall()
        connection.commit()
        return rows
