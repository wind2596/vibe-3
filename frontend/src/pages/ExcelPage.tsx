import { SectionCard } from '../components/SectionCard';

export function ExcelPage() {
  return (
    <div className="page-stack">
      <SectionCard title="엑셀 업무 자동화" description="특정 컬럼 기준 분할 또는 병합 작업을 위한 구조">
        <div className="feature-grid">
          <div className="feature-panel">파일 업로드</div>
          <div className="feature-panel">기준 컬럼 선택</div>
          <div className="feature-panel">분할 / 병합 옵션</div>
          <div className="feature-panel">결과 다운로드</div>
        </div>
      </SectionCard>
    </div>
  );
}
