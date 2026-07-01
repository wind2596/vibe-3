import { SectionCard } from '../components/SectionCard';

export function NewsPage() {
  return (
    <div className="page-stack">
      <SectionCard title="뉴스 기사 수집" description="공공행정 관련 뉴스를 아침마다 수집하는 구조">
        <div className="feature-grid">
          <div className="feature-panel">키워드 설정</div>
          <div className="feature-panel">자동 수집</div>
          <div className="feature-panel">중복 제거</div>
          <div className="feature-panel">요약 목록</div>
        </div>
      </SectionCard>
    </div>
  );
}
