import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { SectionCard } from '../components/SectionCard';
import {
  buildMonthGrid,
  endOfMonth,
  endOfWeek,
  formatLongRangeLabel,
  formatMonthDay,
  formatRangeLabel,
  formatScheduleDateTime,
  formatScheduleTimeRange,
  formatWeekday,
  isSameDate,
  overlapsDay,
  startOfMonth,
  startOfWeek,
  toDateTimeInputValue,
} from '../lib/calendar';
import {
  createMember,
  createSchedule,
  deleteMember,
  deleteSchedule,
  getMembers,
  getSchedules,
  updateMember,
  updateSchedule,
} from '../lib/api';
import type { MemberFormState, MemberItem } from '../types/member';
import type { ScheduleFormState, ScheduleItem } from '../types/schedule';

type ViewMode = 'week' | 'month';

const categoryOptions = ['휴가', '근무', '출장', '교육', '회의', '기타'];

const emptyMemberForm: MemberFormState = {
  team_id: '',
  name: '',
  role: 'member',
};

function createDefaultScheduleForm(anchorDate: Date): ScheduleFormState {
  const start = new Date(anchorDate);
  start.setHours(9, 0, 0, 0);
  const end = new Date(anchorDate);
  end.setHours(10, 0, 0, 0);
  return {
    member_id: '',
    category: '근무',
    title: '',
    start_at: toDateTimeInputValue(start),
    end_at: toDateTimeInputValue(end),
    memo: '',
    all_day: false,
  };
}

export function SchedulePage() {
  const [members, setMembers] = useState<MemberItem[]>([]);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [anchorDate, setAnchorDate] = useState(() => new Date());
  const [memberForm, setMemberForm] = useState<MemberFormState>(emptyMemberForm);
  const [scheduleForm, setScheduleForm] = useState<ScheduleFormState>(() => createDefaultScheduleForm(new Date()));
  const [editingMemberId, setEditingMemberId] = useState<number | null>(null);
  const [editingScheduleId, setEditingScheduleId] = useState<number | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<number | 'all'>('all');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const range = useMemo(() => {
    if (viewMode === 'week') {
      return { start: startOfWeek(anchorDate), end: endOfWeek(anchorDate) };
    }
    return { start: startOfMonth(anchorDate), end: endOfMonth(anchorDate) };
  }, [anchorDate, viewMode]);

  const monthGrid = useMemo(() => buildMonthGrid(anchorDate), [anchorDate]);
  const sortedSchedules = useMemo(
    () => [...schedules].sort((left, right) => left.start_at.localeCompare(right.start_at) || left.id - right.id),
    [schedules],
  );
  const rangeLabel = viewMode === 'week' ? formatRangeLabel(range.start, range.end) : formatLongRangeLabel(range.start, range.end);

  async function refreshData() {
    setLoading(true);
    setError(null);
    try {
      const [memberData, scheduleData] = await Promise.all([
        getMembers(),
        getSchedules({
          from_at: toDateTimeInputValue(range.start),
          to_at: toDateTimeInputValue(range.end),
          ...(selectedMemberId === 'all' ? {} : { member_id: selectedMemberId }),
        }),
      ]);
      setMembers(memberData);
      setSchedules(scheduleData);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '데이터를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refreshData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range.start.getTime(), range.end.getTime(), selectedMemberId]);

  useEffect(() => {
    if (members.length > 0 && !scheduleForm.member_id) {
      setScheduleForm((current) => ({ ...current, member_id: String(members[0].id) }));
    }
  }, [members, scheduleForm.member_id]);

  useEffect(() => {
    if (editingScheduleId === null) {
      setScheduleForm((current) => ({
        ...current,
        start_at: toDateTimeInputValue(range.start),
        end_at: toDateTimeInputValue(range.start),
      }));
    }
  }, [editingScheduleId, range.start]);

  function resetMemberForm() {
    setEditingMemberId(null);
    setMemberForm(emptyMemberForm);
  }

  function resetScheduleForm() {
    setEditingScheduleId(null);
    setScheduleForm(createDefaultScheduleForm(anchorDate));
  }

  function applyMemberToForm(member: MemberItem) {
    setEditingMemberId(member.id);
    setMemberForm({
      team_id: member.team_id === null ? '' : String(member.team_id),
      name: member.name,
      role: member.role,
    });
  }

  function applyScheduleToForm(schedule: ScheduleItem) {
    setEditingScheduleId(schedule.id);
    setScheduleForm({
      member_id: String(schedule.member_id),
      category: schedule.category,
      title: schedule.title,
      start_at: toDateTimeInputValue(new Date(schedule.start_at)),
      end_at: toDateTimeInputValue(new Date(schedule.end_at)),
      memo: schedule.memo ?? '',
      all_day: schedule.all_day,
    });
  }

  async function submitMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (editingMemberId === null) {
        await createMember(memberForm);
        setMessage('팀원을 등록했습니다.');
      } else {
        await updateMember(editingMemberId, memberForm);
        setMessage('팀원 정보를 수정했습니다.');
      }
      resetMemberForm();
      await refreshData();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '팀원 저장에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  async function submitSchedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (editingScheduleId === null) {
        await createSchedule(scheduleForm);
        setMessage('일정을 등록했습니다.');
      } else {
        await updateSchedule(editingScheduleId, scheduleForm);
        setMessage('일정을 수정했습니다.');
      }
      resetScheduleForm();
      await refreshData();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '일정 저장에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteMember(memberId: number) {
    if (!window.confirm('이 팀원을 삭제할까요? 연결된 일정도 함께 삭제됩니다.')) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await deleteMember(memberId);
      if (editingMemberId === memberId) {
        resetMemberForm();
      }
      await refreshData();
      setMessage('팀원을 삭제했습니다.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '팀원 삭제에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteSchedule(scheduleId: number) {
    if (!window.confirm('이 일정을 삭제할까요?')) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await deleteSchedule(scheduleId);
      if (editingScheduleId === scheduleId) {
        resetScheduleForm();
      }
      await refreshData();
      setMessage('일정을 삭제했습니다.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '일정 삭제에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  function movePrevious() {
    setAnchorDate((current) => {
      const next = new Date(current);
      if (viewMode === 'month') {
        next.setMonth(next.getMonth() - 1);
      } else {
        next.setDate(next.getDate() - 7);
      }
      return next;
    });
  }

  function moveNext() {
    setAnchorDate((current) => {
      const next = new Date(current);
      if (viewMode === 'month') {
        next.setMonth(next.getMonth() + 1);
      } else {
        next.setDate(next.getDate() + 7);
      }
      return next;
    });
  }

  function goToday() {
    setAnchorDate(new Date());
  }

  const selectedMemberName =
    selectedMemberId === 'all'
      ? '전체 팀원'
      : members.find((member) => member.id === selectedMemberId)?.name ?? '선택한 팀원';

  const calendarItemsForDay = (day: Date) =>
    sortedSchedules.filter((schedule) => overlapsDay(schedule.start_at, schedule.end_at, day));

  return (
    <div className="page-stack schedule-page">
      <section className="hero schedule-hero">
        <div className="hero-copy">
          <span className="eyebrow">Schedule</span>
          <h1>팀원 일정 관리</h1>
          <p>팀원 등록, 일정 등록, 주간 표, 월간 캘린더를 한 화면에서 운영합니다.</p>
        </div>
        <div className="hero-grid hero-grid--compact">
          <div className="status-pill">
            <span>팀원 수</span>
            <strong>{members.length}명</strong>
          </div>
          <div className="status-pill">
            <span>표시 일정</span>
            <strong>{schedules.length}건</strong>
          </div>
          <div className="status-pill">
            <span>보기 방식</span>
            <strong>{viewMode === 'week' ? '주간 표' : '월간 캘린더'}</strong>
          </div>
        </div>
      </section>

      <div className="two-column schedule-edit-grid">
        <SectionCard title="팀원 관리" description="팀원을 직접 등록하고 수정하거나 삭제합니다.">
          <form className="form-stack" onSubmit={submitMember}>
            <label className="field">
              <span>이름</span>
              <input
                value={memberForm.name}
                onChange={(event) => setMemberForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="예: 김민지"
              />
            </label>
            <div className="field-grid">
              <label className="field">
                <span>역할</span>
                <input
                  value={memberForm.role}
                  onChange={(event) => setMemberForm((current) => ({ ...current, role: event.target.value }))}
                  placeholder="member"
                />
              </label>
              <label className="field">
                <span>팀 ID</span>
                <input
                  value={memberForm.team_id}
                  onChange={(event) => setMemberForm((current) => ({ ...current, team_id: event.target.value }))}
                  placeholder="선택 입력"
                />
              </label>
            </div>
            <div className="action-row">
              <button type="submit" className="primary-button" disabled={loading}>
                {editingMemberId === null ? '팀원 등록' : '팀원 수정'}
              </button>
              {editingMemberId !== null ? (
                <button type="button" className="secondary-button" onClick={resetMemberForm}>
                  취소
                </button>
              ) : null}
            </div>
          </form>

          <div className="list-stack">
            {members.length === 0 ? (
              <div className="empty-state">등록된 팀원이 없습니다.</div>
            ) : (
              members.map((member) => (
                <article className="data-row" key={member.id}>
                  <div>
                    <strong>{member.name}</strong>
                    <p>
                      {member.role}
                      {member.team_id !== null ? ` · 팀 ${member.team_id}` : ''}
                    </p>
                  </div>
                  <div className="action-row action-row--compact">
                    <button type="button" className="secondary-button" onClick={() => applyMemberToForm(member)}>
                      수정
                    </button>
                    <button type="button" className="danger-button" onClick={() => handleDeleteMember(member.id)}>
                      삭제
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </SectionCard>

        <SectionCard title="일정 등록" description="주간/월간 뷰에서 동일한 일정 데이터를 사용합니다.">
          <form className="form-stack" onSubmit={submitSchedule}>
            <div className="field-grid">
              <label className="field">
                <span>팀원</span>
                <select
                  value={scheduleForm.member_id}
                  onChange={(event) => setScheduleForm((current) => ({ ...current, member_id: event.target.value }))}
                >
                  <option value="">팀원을 먼저 선택하세요</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>구분</span>
                <select
                  value={scheduleForm.category}
                  onChange={(event) => setScheduleForm((current) => ({ ...current, category: event.target.value }))}
                >
                  {categoryOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="field">
              <span>제목</span>
              <input
                value={scheduleForm.title}
                onChange={(event) => setScheduleForm((current) => ({ ...current, title: event.target.value }))}
                placeholder="예: 복무 처리"
              />
            </label>

            <div className="field-grid">
              <label className="field">
                <span>시작</span>
                <input
                  type="datetime-local"
                  value={scheduleForm.start_at}
                  onChange={(event) => setScheduleForm((current) => ({ ...current, start_at: event.target.value }))}
                />
              </label>
              <label className="field">
                <span>종료</span>
                <input
                  type="datetime-local"
                  value={scheduleForm.end_at}
                  onChange={(event) => setScheduleForm((current) => ({ ...current, end_at: event.target.value }))}
                />
              </label>
            </div>

            <label className="field field--inline">
              <input
                type="checkbox"
                checked={scheduleForm.all_day}
                onChange={(event) => setScheduleForm((current) => ({ ...current, all_day: event.target.checked }))}
              />
              <span>종일 일정</span>
            </label>

            <label className="field">
              <span>메모</span>
              <textarea
                rows={4}
                value={scheduleForm.memo}
                onChange={(event) => setScheduleForm((current) => ({ ...current, memo: event.target.value }))}
                placeholder="세부 내용 또는 참고 사항"
              />
            </label>

            <div className="action-row">
              <button type="submit" className="primary-button" disabled={loading}>
                {editingScheduleId === null ? '일정 등록' : '일정 수정'}
              </button>
              {editingScheduleId !== null ? (
                <button type="button" className="secondary-button" onClick={resetScheduleForm}>
                  취소
                </button>
              ) : null}
            </div>
          </form>
        </SectionCard>
      </div>

      <SectionCard
        title={viewMode === 'week' ? '주간 뷰' : '월간 뷰'}
        description="같은 일정 데이터를 주간 표와 월간 캘린더로 나누어 보여줍니다."
      >
        <div className="toolbar">
          <div className="toolbar-group">
            <button type="button" className={viewMode === 'week' ? 'view-button active' : 'view-button'} onClick={() => setViewMode('week')}>
              주간
            </button>
            <button type="button" className={viewMode === 'month' ? 'view-button active' : 'view-button'} onClick={() => setViewMode('month')}>
              월간
            </button>
          </div>
          <div className="toolbar-group">
            <button type="button" className="secondary-button" onClick={movePrevious}>
              이전
            </button>
            <button type="button" className="secondary-button" onClick={goToday}>
              오늘
            </button>
            <button type="button" className="secondary-button" onClick={moveNext}>
              다음
            </button>
          </div>
          <div className="toolbar-group toolbar-group--stack">
            <strong>{rangeLabel}</strong>
            <span>{selectedMemberName}</span>
          </div>
        </div>

        <div className="toolbar toolbar--filters">
          <label className="field field--compact">
            <span>팀원 필터</span>
            <select value={String(selectedMemberId)} onChange={(event) => setSelectedMemberId(event.target.value === 'all' ? 'all' : Number(event.target.value))}>
              <option value="all">전체 팀원</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {viewMode === 'week' ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>일자</th>
                  <th>시간</th>
                  <th>팀원</th>
                  <th>구분</th>
                  <th>제목</th>
                  <th>메모</th>
                  <th>작업</th>
                </tr>
              </thead>
              <tbody>
                {sortedSchedules.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="empty-cell">
                      선택한 기간에 일정이 없습니다.
                    </td>
                  </tr>
                ) : (
                  sortedSchedules.map((schedule) => (
                    <tr key={schedule.id}>
                      <td>{formatScheduleDateTime(schedule.start_at)}</td>
                      <td>{schedule.all_day ? '종일' : formatScheduleTimeRange(schedule.start_at, schedule.end_at)}</td>
                      <td>{schedule.member_name ?? `#${schedule.member_id}`}</td>
                      <td>{schedule.category}</td>
                      <td>{schedule.title}</td>
                      <td>{schedule.memo ?? '-'}</td>
                      <td>
                        <div className="action-row action-row--compact">
                          <button type="button" className="secondary-button" onClick={() => applyScheduleToForm(schedule)}>
                            수정
                          </button>
                          <button type="button" className="danger-button" onClick={() => handleDeleteSchedule(schedule.id)}>
                            삭제
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="calendar-grid">
            <div className="calendar-head">
              {['월', '화', '수', '목', '금', '토', '일'].map((label) => (
                <div key={label}>{label}</div>
              ))}
            </div>
            {monthGrid.map((week, weekIndex) => (
              <div className="calendar-week" key={`${weekIndex}-${rangeLabel}`}>
                {week.map((day) => {
                  const daySchedules = calendarItemsForDay(day);
                  const outsideMonth = day.getMonth() !== anchorDate.getMonth();
                  return (
                    <div className={outsideMonth ? 'calendar-cell calendar-cell--muted' : 'calendar-cell'} key={formatMonthDay(day)}>
                      <div className="calendar-cell__header">
                        <span className="calendar-cell__day">{day.getDate()}</span>
                        <span className="calendar-cell__weekday">{formatWeekday(day)}</span>
                        {isSameDate(day, new Date()) ? <span className="calendar-cell__today">오늘</span> : null}
                      </div>
                      <div className="calendar-cell__items">
                        {daySchedules.slice(0, 3).map((schedule) => (
                          <button
                            type="button"
                            className={`event-chip${schedule.all_day ? ' event-chip--all-day' : ''}`}
                            key={`${day.toISOString()}-${schedule.id}`}
                            onClick={() => applyScheduleToForm(schedule)}
                          >
                            <strong>{schedule.category}</strong>
                            <span>{schedule.title}</span>
                            <small>{schedule.member_name ?? `#${schedule.member_id}`}</small>
                          </button>
                        ))}
                        {daySchedules.length > 3 ? <div className="calendar-cell__more">+{daySchedules.length - 3}건 더보기</div> : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {message ? <div className="alert alert--success">{message}</div> : null}
      {error ? <div className="alert">{error}</div> : null}
      {loading ? <div className="loading-bar">저장 중...</div> : null}
    </div>
  );
}
