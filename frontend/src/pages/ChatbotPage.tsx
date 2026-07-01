import { SectionCard } from '../components/SectionCard';

export function ChatbotPage() {
  return (
    <div className="page-stack">
      <SectionCard title="민원 대응 챗봇" description="민원 매뉴얼 업로드 후 응대 스크립트를 생성하는 구조">
        <div className="feature-grid">
          <div className="feature-panel">매뉴얼 업로드</div>
          <div className="feature-panel">질문 입력</div>
          <div className="feature-panel">답변 초안</div>
          <div className="feature-panel">근거 문단</div>
        </div>
      </SectionCard>
    </div>
  );
}
