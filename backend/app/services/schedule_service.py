from datetime import datetime

from app.db.database import run_query, run_write
from app.services.member_service import get_member


def _to_schedule(row) -> dict:
    item = dict(row)
    item['all_day'] = bool(item['all_day'])
    return item


def _parse_window(value: str) -> datetime:
    return datetime.fromisoformat(value)


def _validate_window(start_at: str, end_at: str) -> None:
    if _parse_window(start_at) >= _parse_window(end_at):
        raise ValueError('Schedule end time must be after start time')


def get_schedule(schedule_id: int) -> dict | None:
    rows = run_query(
        '''
        SELECT
            s.id,
            s.user_id AS member_id,
            s.category,
            s.title,
            s.start_at,
            s.end_at,
            s.memo,
            s.all_day,
            s.created_at,
            s.updated_at,
            u.name AS member_name
        FROM schedules s
        LEFT JOIN users u ON u.id = s.user_id
        WHERE s.id = ?
        LIMIT 1
        ''',
        (schedule_id,),
    )
    return _to_schedule(rows[0]) if rows else None


def list_schedules(from_at: str | None = None, to_at: str | None = None, member_id: int | None = None) -> list[dict]:
    clauses = []
    params: list[object] = []

    if from_at and to_at:
        clauses.append('s.start_at < ? AND s.end_at > ?')
        params.extend([to_at, from_at])
    elif from_at:
        clauses.append('s.end_at >= ?')
        params.append(from_at)
    elif to_at:
        clauses.append('s.start_at <= ?')
        params.append(to_at)

    if member_id is not None:
        clauses.append('s.user_id = ?')
        params.append(member_id)

    where_clause = f"WHERE {' AND '.join(clauses)}" if clauses else ''

    rows = run_query(
        f'''
        SELECT
            s.id,
            s.user_id AS member_id,
            s.category,
            s.title,
            s.start_at,
            s.end_at,
            s.memo,
            s.all_day,
            s.created_at,
            s.updated_at,
            u.name AS member_name
        FROM schedules s
        LEFT JOIN users u ON u.id = s.user_id
        {where_clause}
        ORDER BY s.start_at ASC, s.id ASC
        ''',
        tuple(params),
    )
    return [_to_schedule(row) for row in rows]


def create_schedule(data: dict) -> dict:
    member_id = int(data['member_id'])
    if get_member(member_id) is None:
        raise ValueError('Member not found')

    start_at = data['start_at'].strip()
    end_at = data['end_at'].strip()
    _validate_window(start_at, end_at)

    new_id = run_write(
        '''
        INSERT INTO schedules (user_id, category, title, start_at, end_at, memo, all_day)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ''',
        (
            member_id,
            data['category'].strip(),
            data['title'].strip(),
            start_at,
            end_at,
            data.get('memo'),
            1 if data.get('all_day') else 0,
        ),
    )
    schedule = get_schedule(new_id)
    if schedule is None:
        raise ValueError('Schedule could not be created')
    return schedule


def update_schedule(schedule_id: int, data: dict) -> dict:
    current = get_schedule(schedule_id)
    if current is None:
        raise ValueError('Schedule not found')

    next_record = {
        'member_id': data.get('member_id', current['member_id']),
        'category': data.get('category', current['category']),
        'title': data.get('title', current['title']),
        'start_at': data.get('start_at', current['start_at']),
        'end_at': data.get('end_at', current['end_at']),
        'memo': data.get('memo', current['memo']),
        'all_day': data.get('all_day', current['all_day']),
    }

    member_id = int(next_record['member_id'])
    if get_member(member_id) is None:
        raise ValueError('Member not found')

    _validate_window(next_record['start_at'], next_record['end_at'])

    run_query(
        '''
        UPDATE schedules
        SET user_id = ?, category = ?, title = ?, start_at = ?, end_at = ?, memo = ?, all_day = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
        ''',
        (
            member_id,
            str(next_record['category']).strip(),
            str(next_record['title']).strip(),
            str(next_record['start_at']).strip(),
            str(next_record['end_at']).strip(),
            next_record['memo'],
            1 if next_record['all_day'] else 0,
            schedule_id,
        ),
    )
    updated = get_schedule(schedule_id)
    if updated is None:
        raise ValueError('Schedule not found')
    return updated


def delete_schedule(schedule_id: int) -> None:
    run_query('DELETE FROM schedules WHERE id = ?', (schedule_id,))
