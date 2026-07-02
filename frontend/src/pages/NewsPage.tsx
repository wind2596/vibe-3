import { useEffect, useMemo, useState } from 'react';
import { SectionCard } from '../components/SectionCard';
import { StatusPill } from '../components/StatusPill';
import { getLatestNewsSync, getNews, syncNews } from '../lib/api';
import type { NewsArticle, NewsJob, NewsSyncResult } from '../types/news';

function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function yesterday() {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return formatDateInput(date);
}

function parseJobDetail(job: NewsJob | null): NewsSyncResult | null {
  if (!job?.detail) {
    return null;
  }
  try {
    return JSON.parse(job.detail) as NewsSyncResult;
  } catch {
    return null;
  }
}

function truncate(value: string | null, maxLength = 180) {
  if (!value) {
    return '본문 요약이 없습니다.';
  }
  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
}

export function NewsPage() {
  const [selectedDate, setSelectedDate] = useState(yesterday);
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [latestJob, setLatestJob] = useState<NewsJob | null>(null);
  const [lastResult, setLastResult] = useState<NewsSyncResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [collecting, setCollecting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const jobDetail = useMemo(() => parseJobDetail(latestJob), [latestJob]);
  const displayResult = lastResult ?? jobDetail;

  async function refreshNews(date: string) {
    setLoading(true);
    setError(null);
    try {
      const [newsResponse, jobResponse] = await Promise.all([
        getNews({ published_date: date }),
        getLatestNewsSync(),
      ]);
      setArticles(newsResponse.articles);
      setLatestJob(jobResponse);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '뉴스 데이터를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refreshNews(selectedDate);
  }, [selectedDate]);

  async function handleSync() {
    setCollecting(true);
    setError(null);
    setMessage(null);
    try {
      const response = await syncNews(selectedDate);
      setArticles(response.articles);
      setLastResult(response.result);
      setMessage(`${selectedDate} 정책뉴스 수집을 완료했습니다.`);
      const job = await getLatestNewsSync();
      setLatestJob(job);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '뉴스 수집에 실패했습니다.');
    } finally {
      setCollecting(false);
    }
  }

  return (
    <div className="page-stack news-page">
      <section className="hero news-hero">
        <div className="hero-copy">
          <span className="eyebrow">Policy News</span>
          <h1>대한민국 정책브리핑 기사 수집</h1>
          <p>매일 오전 9시에 전날 정책뉴스를 수집하고, 필요한 날짜는 수동으로 다시 수집합니다.</p>
        </div>
        <div className="hero-grid hero-grid--compact">
          <StatusPill label="선택 날짜" value={selectedDate} tone="neutral" />
          <StatusPill label="저장 기사" value={`${articles.length}건`} tone={articles.length > 0 ? 'success' : 'warning'} />
          <StatusPill label="수집 상태" value={latestJob?.status ?? '대기'} tone={latestJob?.status === 'failed' ? 'danger' : 'neutral'} />
        </div>
      </section>

      {error ? (
        <section className="alert alert--danger" role="alert">
          {error}
        </section>
      ) : null}
      {message ? (
        <section className="alert alert--success" role="status">
          {message}
        </section>
      ) : null}

      <div className="two-column news-grid">
        <SectionCard title="수집 실행" description="날짜를 선택하면 해당 날짜에 발행된 정책뉴스만 수집합니다.">
          <div className="form-stack">
            <label className="field">
              <span>수집 날짜</span>
              <input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
            </label>
            <div className="action-row">
              <button type="button" className="primary-button" onClick={() => void handleSync()} disabled={collecting}>
                {collecting ? '수집 중...' : '선택 날짜 수집'}
              </button>
              <button type="button" className="secondary-button" onClick={() => void refreshNews(selectedDate)} disabled={loading}>
                목록 새로고침
              </button>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="최근 수집 결과" description="자동 또는 수동 수집의 마지막 실행 이력입니다.">
          <div className="summary-grid news-summary-grid">
            <div className="summary-card">
              <span>대상 날짜</span>
              <strong>{displayResult?.target_date ?? '-'}</strong>
            </div>
            <div className="summary-card">
              <span>신규/갱신</span>
              <strong>
                {displayResult ? `${displayResult.inserted} / ${displayResult.updated}` : '-'}
              </strong>
            </div>
            <div className="summary-card">
              <span>총 수집</span>
              <strong>{displayResult?.total ?? 0}</strong>
            </div>
          </div>
          <div className="kv-list news-job-meta">
            <div>
              <span>상태</span>
              <strong>{latestJob?.status ?? '수집 이력 없음'}</strong>
            </div>
            <div>
              <span>실행 시각</span>
              <strong>{latestJob?.created_at ?? '-'}</strong>
            </div>
          </div>
        </SectionCard>
      </div>

      <SectionCard title="수집 기사 목록" description="출처: 대한민국 정책브리핑 www.korea.kr">
        {loading ? <div className="loading-bar">뉴스 목록을 불러오는 중...</div> : null}
        {articles.length === 0 && !loading ? (
          <div className="empty-state">선택한 날짜에 저장된 기사가 없습니다. 수집 버튼을 눌러 데이터를 가져오세요.</div>
        ) : (
          <div className="news-list">
            {articles.map((article) => (
              <article className="news-card" key={article.id}>
                {article.thumbnail_url ? <img src={article.thumbnail_url} alt="" /> : null}
                <div className="news-card__body">
                  <div className="news-card__meta">
                    <span>{article.published_date}</span>
                    <span>{article.ministry ?? '부처 미상'}</span>
                  </div>
                  <h2>{article.title}</h2>
                  {article.subtitle ? <p className="news-card__subtitle">{article.subtitle}</p> : null}
                  <p>{truncate(article.summary ?? article.content)}</p>
                  <a href={article.url} target="_blank" rel="noreferrer">
                    원문 보기
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
