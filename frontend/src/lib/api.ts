import type { HealthResponse } from '../types/health';
import type { MemberFormState, MemberItem } from '../types/member';
import type { ScheduleFormState, ScheduleItem } from '../types/schedule';

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    let detail = response.statusText;
    try {
      const payload = await response.json();
      detail = typeof payload?.detail === 'string' ? payload.detail : JSON.stringify(payload);
    } catch {
      // ignore parse failure
    }
    throw new Error(detail || `Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

function toQuery(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      search.set(key, String(value));
    }
  }
  const query = search.toString();
  return query ? `?${query}` : '';
}

export async function getHealth(): Promise<HealthResponse> {
  return requestJson<HealthResponse>('/api/health');
}

export async function getMembers(): Promise<MemberItem[]> {
  return requestJson<MemberItem[]>('/api/members');
}

export async function createMember(payload: MemberFormState): Promise<MemberItem> {
  return requestJson<MemberItem>('/api/members', {
    method: 'POST',
    body: JSON.stringify({
      team_id: payload.team_id ? Number(payload.team_id) : null,
      name: payload.name,
      role: payload.role,
    }),
  });
}

export async function updateMember(memberId: number, payload: MemberFormState): Promise<MemberItem> {
  return requestJson<MemberItem>(`/api/members/${memberId}`, {
    method: 'PUT',
    body: JSON.stringify({
      team_id: payload.team_id ? Number(payload.team_id) : null,
      name: payload.name,
      role: payload.role,
    }),
  });
}

export async function deleteMember(memberId: number): Promise<void> {
  await requestJson<void>(`/api/members/${memberId}`, { method: 'DELETE' });
}

export async function getSchedules(params: {
  from_at: string;
  to_at: string;
  member_id?: number;
}): Promise<ScheduleItem[]> {
  return requestJson<ScheduleItem[]>(`/api/schedules${toQuery(params)}`);
}

export async function createSchedule(payload: ScheduleFormState): Promise<ScheduleItem> {
  return requestJson<ScheduleItem>('/api/schedules', {
    method: 'POST',
    body: JSON.stringify({
      member_id: Number(payload.member_id),
      category: payload.category,
      title: payload.title,
      start_at: payload.start_at,
      end_at: payload.end_at,
      memo: payload.memo || null,
      all_day: payload.all_day,
    }),
  });
}

export async function updateSchedule(scheduleId: number, payload: ScheduleFormState): Promise<ScheduleItem> {
  return requestJson<ScheduleItem>(`/api/schedules/${scheduleId}`, {
    method: 'PUT',
    body: JSON.stringify({
      member_id: Number(payload.member_id),
      category: payload.category,
      title: payload.title,
      start_at: payload.start_at,
      end_at: payload.end_at,
      memo: payload.memo || null,
      all_day: payload.all_day,
    }),
  });
}

export async function deleteSchedule(scheduleId: number): Promise<void> {
  await requestJson<void>(`/api/schedules/${scheduleId}`, { method: 'DELETE' });
}
