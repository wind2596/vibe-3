import { SectionCard } from '../components/SectionCard';

export function SchedulePage() {
  return (
    <div className="page-stack">
      <SectionCard
        title="팀원 스케줄 관리"
        description="휴가, 근무, 출장 일정을 공유하는 캘린더 화면 구조"
      >
        <div className="feature-grid">
          <div className="feature-panel">캘린더 영역</div>
          <div className="feature-panel">일정 등록 폼</div>
          <div className="feature-panel">팀원 필터</div>
          <div className="feature-panel">충돌 확인</div>
        </div>
      </SectionCard>
    </div>
  );
}
