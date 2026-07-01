from app.db.database import run_query


def list_schedules() -> list[dict]:
    rows = run_query(
        """
        SELECT id, user_id, category, title, start_at, end_at, memo
        FROM schedules
        ORDER BY start_at ASC, id ASC
        """
    )
    return [dict(row) for row in rows]
