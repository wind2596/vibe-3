from app.db.database import run_query, run_write


def _to_member(row) -> dict:
    return dict(row)


def list_members() -> list[dict]:
    rows = run_query(
        '''
        SELECT id, team_id, name, role, created_at, updated_at
        FROM users
        ORDER BY name COLLATE NOCASE ASC, id ASC
        '''
    )
    return [_to_member(row) for row in rows]


def get_member(member_id: int) -> dict | None:
    rows = run_query(
        '''
        SELECT id, team_id, name, role, created_at, updated_at
        FROM users
        WHERE id = ?
        LIMIT 1
        ''',
        (member_id,),
    )
    return _to_member(rows[0]) if rows else None


def create_member(data: dict) -> dict:
    new_id = run_write(
        '''
        INSERT INTO users (team_id, name, role)
        VALUES (?, ?, ?)
        ''',
        (data.get('team_id'), data['name'].strip(), data.get('role', 'member').strip()),
    )
    member = get_member(new_id)
    if member is None:
        raise ValueError('Member could not be created')
    return member


def update_member(member_id: int, data: dict) -> dict:
    current = get_member(member_id)
    if current is None:
        raise ValueError('Member not found')

    next_team_id = data.get('team_id', current['team_id'])
    next_name = data.get('name', current['name'])
    next_role = data.get('role', current['role'])

    run_query(
        '''
        UPDATE users
        SET team_id = ?, name = ?, role = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
        ''',
        (next_team_id, next_name.strip(), next_role.strip(), member_id),
    )
    updated = get_member(member_id)
    if updated is None:
        raise ValueError('Member not found')
    return updated


def delete_member(member_id: int) -> None:
    run_query('DELETE FROM schedules WHERE user_id = ?', (member_id,))
    run_query('DELETE FROM users WHERE id = ?', (member_id,))
