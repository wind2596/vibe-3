import type { ExcelInspectResponse, ExcelPreviewResponse } from '../types/excel';
import type { HealthResponse } from '../types/health';
import type { MemberFormState, MemberItem } from '../types/member';
import type { NewsJob, NewsListResponse, NewsSyncResponse } from '../types/news';
import type { ScheduleFormState, ScheduleItem } from '../types/schedule';

const backendUrlStorageKey = 'public-sector-admin.backendBaseUrl';

function normalizeBackendBaseUrl(value: string): string {
  return value.trim().replace(/\/+$/, '');
}

export function getBackendBaseUrl(): string {
  const storedValue = window.localStorage.getItem(backendUrlStorageKey);
  if (storedValue !== null) {
    return normalizeBackendBaseUrl(storedValue);
  }
  return normalizeBackendBaseUrl(import.meta.env.VITE_API_BASE_URL ?? '');
}

export function setBackendBaseUrl(value: string): string {
  const normalizedValue = normalizeBackendBaseUrl(value);
  window.localStorage.setItem(backendUrlStorageKey, normalizedValue);
  return normalizedValue;
}

function buildApiUrl(path: string, baseUrl = getBackendBaseUrl()): string {
  if (!baseUrl) {
    return path;
  }
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
}

async function requestJson<T>(path: string, init?: RequestInit, baseUrl?: string): Promise<T> {
  const response = await fetch(buildApiUrl(path, baseUrl), {
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

async function requestBinaryJson<T>(path: string, file: File): Promise<T> {
  const response = await fetch(buildApiUrl(path), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/octet-stream',
      'X-Filename': encodeURIComponent(file.name),
    },
    body: file,
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

export async function testBackendConnection(baseUrl: string): Promise<HealthResponse> {
  return requestJson<HealthResponse>('/api/health', undefined, normalizeBackendBaseUrl(baseUrl));
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

export async function getNews(params: { published_date?: string } = {}): Promise<NewsListResponse> {
  return requestJson<NewsListResponse>(`/api/news${toQuery(params)}`);
}

export async function syncNews(targetDate: string): Promise<NewsSyncResponse> {
  return requestJson<NewsSyncResponse>('/api/news/sync', {
    method: 'POST',
    body: JSON.stringify({ target_date: targetDate }),
  });
}

export async function getLatestNewsSync(): Promise<NewsJob | null> {
  return requestJson<NewsJob | null>('/api/news/sync/latest');
}

export async function inspectExcel(file: File, sheetName?: string): Promise<ExcelInspectResponse> {
  const url = new URL('/api/excel/inspect', 'http://local.invalid');
  if (sheetName) {
    url.searchParams.set('sheet_name', sheetName);
  }
  return requestBinaryJson<ExcelInspectResponse>(`${url.pathname}${url.search}`, file);
}

export async function previewExcel(
  file: File,
  options: { sheetName?: string; mode: 'split' | 'merge'; keyColumns: string[] },
): Promise<ExcelPreviewResponse> {
  const url = new URL('/api/excel/preview', 'http://local.invalid');
  if (options.sheetName) {
    url.searchParams.set('sheet_name', options.sheetName);
  }
  url.searchParams.set('mode', options.mode);
  url.searchParams.set('key_columns', options.keyColumns.join(','));
  return requestBinaryJson<ExcelPreviewResponse>(`${url.pathname}${url.search}`, file);
}

export async function downloadExcel(
  file: File,
  options: { sheetName?: string; mode: 'split' | 'merge'; keyColumns: string[] },
): Promise<Blob> {
  const url = new URL('/api/excel/transform', 'http://local.invalid');
  if (options.sheetName) {
    url.searchParams.set('sheet_name', options.sheetName);
  }
  url.searchParams.set('mode', options.mode);
  url.searchParams.set('key_columns', options.keyColumns.join(','));
  const response = await fetch(buildApiUrl(`${url.pathname}${url.search}`), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/octet-stream',
      'X-Filename': encodeURIComponent(file.name),
    },
    body: file,
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

  return await response.blob();
}
