import { useEffect, useState } from 'react';
import { SectionCard } from '../components/SectionCard';
import { StatusPill } from '../components/StatusPill';
import { getHealth } from '../lib/api';
import type { HealthResponse } from '../types/health';

const initialHealth: HealthResponse = {
  status: 'degraded',
  service: 'public-sector-super-app',
  api: {
    available: false,
    version: 'pending',
  },
  database: {
    connected: false,
    path: 'backend/data/app.db',
    tables: 0,
  },
};

export function DashboardPage() {
  const [health, setHealth] = useState<HealthResponse>(initialHealth);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    getHealth()
      .then((value) => {
        if (mounted) {
          setHealth(value);
          setError(null);
        }
      })
      .catch((reason: unknown) => {
        if (mounted) {
          setError(reason instanceof Error ? reason.message : 'Unknown error');
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="page-stack">
      <section className="hero">
        <div>
          <span className="eyebrow">Scaffold</span>
          <h1>공공직군 행정업무 슈퍼앱</h1>
          <p>
            일정 공유, 엑셀 자동화, 민원 대응, 뉴스 수집을 하나의 내부 도구로 묶기 위한
            초기 구조다.
          </p>
        </div>

        <div className="hero-grid">
          <StatusPill
            label="FE-BE"
            value={health.api.available ? '연결됨' : '대기 중'}
            tone={health.api.available ? 'success' : 'warning'}
          />
          <StatusPill
            label="BE-DB"
            value={health.database.connected ? '연결됨' : '대기 중'}
            tone={health.database.connected ? 'success' : 'warning'}
          />
          <StatusPill label="서비스" value={health.service} />
        </div>
      </section>

      {error ? <div className="alert">헬스체크 실패: {error}</div> : null}

      <div className="two-column">
        <SectionCard title="FE 페이지 구조" description="문서 기준으로 페이지를 먼저 나눈다.">
          <ul className="feature-list">
            <li>대시보드</li>
            <li>팀 스케줄</li>
            <li>엑셀 업무 자동화</li>
            <li>민원 대응 챗봇</li>
            <li>뉴스 수집</li>
          </ul>
        </SectionCard>

        <SectionCard title="연동 상태" description="현재는 헬스체크와 SQLite 초기화만 확인한다.">
          <div className="kv-list">
            <div>
              <span>API 상태</span>
              <strong>{health.api.available ? '정상' : '미연결'}</strong>
            </div>
            <div>
              <span>DB 테이블 수</span>
              <strong>{health.database.tables}</strong>
            </div>
            <div>
              <span>DB 경로</span>
              <strong>{health.database.path}</strong>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
