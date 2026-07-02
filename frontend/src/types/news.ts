export type NewsArticle = {
  id: number;
  source: string;
  source_article_id: string;
  title: string;
  subtitle: string | null;
  summary: string | null;
  content: string | null;
  ministry: string | null;
  published_date: string;
  url: string;
  thumbnail_url: string | null;
  collected_at: string;
  updated_at: string | null;
};

export type NewsListResponse = {
  articles: NewsArticle[];
};

export type NewsSyncResult = {
  target_date: string;
  inserted: number;
  updated: number;
  skipped: number;
  failed: number;
  total: number;
  message: string;
};

export type NewsSyncResponse = {
  result: NewsSyncResult;
  articles: NewsArticle[];
};

export type NewsJob = {
  id: number;
  job_type: string;
  status: string;
  detail: string | null;
  created_at: string;
  updated_at: string | null;
};
