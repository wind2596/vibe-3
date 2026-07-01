from pathlib import Path
import sqlite3
from typing import Any

from app.core.config import settings


TABLE_STATEMENTS = {
    'teams': '''
        CREATE TABLE IF NOT EXISTS teams (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
    ''',
    'users': '''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            team_id INTEGER,
            name TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'member',
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (team_id) REFERENCES teams(id)
        )
    ''',
    'schedules': '''
        CREATE TABLE IF NOT EXISTS schedules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            category TEXT NOT NULL,
            title TEXT NOT NULL,
            start_at TEXT NOT NULL,
            end_at TEXT NOT NULL,
            memo TEXT,
            all_day INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    ''',
    'job_runs': '''
        CREATE TABLE IF NOT EXISTS job_runs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            job_type TEXT NOT NULL,
            status TEXT NOT NULL,
            detail TEXT,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
    ''',
}

COLUMN_MIGRATIONS = {
    'teams': {
        'updated_at': 'TEXT DEFAULT CURRENT_TIMESTAMP',
    },
    'users': {
        'updated_at': 'TEXT DEFAULT CURRENT_TIMESTAMP',
    },
    'schedules': {
        'all_day': 'INTEGER NOT NULL DEFAULT 0',
        'updated_at': 'TEXT DEFAULT CURRENT_TIMESTAMP',
    },
    'job_runs': {
        'updated_at': 'TEXT DEFAULT CURRENT_TIMESTAMP',
    },
}

INDEX_STATEMENTS = [
    'CREATE INDEX IF NOT EXISTS idx_users_name ON users(name)',
    'CREATE INDEX IF NOT EXISTS idx_schedules_user_id_start_at ON schedules(user_id, start_at)',
    'CREATE INDEX IF NOT EXISTS idx_schedules_start_at ON schedules(start_at)',
    'CREATE INDEX IF NOT EXISTS idx_schedules_end_at ON schedules(end_at)',
]


def get_db_path() -> Path:
    return settings.db_path


def get_connection() -> sqlite3.Connection:
    connection = sqlite3.connect(get_db_path())
    connection.row_factory = sqlite3.Row
    connection.execute('PRAGMA foreign_keys = ON')
    return connection


def _existing_columns(connection: sqlite3.Connection, table: str) -> set[str]:
    cursor = connection.execute(f'PRAGMA table_info({table})')
    return {str(row['name']) for row in cursor.fetchall()}


def _ensure_column(connection: sqlite3.Connection, table: str, column: str, definition: str) -> None:
    if column not in _existing_columns(connection, table):
        connection.execute(f'ALTER TABLE {table} ADD COLUMN {column} {definition}')


def initialize_database() -> None:
    get_db_path().parent.mkdir(parents=True, exist_ok=True)
    with get_connection() as connection:
        for statement in TABLE_STATEMENTS.values():
            connection.execute(statement)

        for table, columns in COLUMN_MIGRATIONS.items():
            for column, definition in columns.items():
                _ensure_column(connection, table, column, definition)

        for statement in INDEX_STATEMENTS:
            connection.execute(statement)

        connection.commit()


def fetch_table_count() -> int:
    with get_connection() as connection:
        cursor = connection.execute(
            "SELECT COUNT(*) AS count FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'"
        )
        row = cursor.fetchone()
        return int(row['count']) if row is not None else 0


def is_database_connected() -> bool:
    try:
        with get_connection() as connection:
            connection.execute('SELECT 1')
        return True
    except sqlite3.Error:
        return False


def run_query(query: str, params: tuple[Any, ...] = ()) -> list[sqlite3.Row]:
    with get_connection() as connection:
        cursor = connection.execute(query, params)
        rows = cursor.fetchall()
        connection.commit()
        return rows


def run_write(query: str, params: tuple[Any, ...] = ()) -> int:
    with get_connection() as connection:
        cursor = connection.execute(query, params)
        connection.commit()
        return int(cursor.lastrowid)
