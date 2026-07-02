from datetime import date

from pydantic import BaseModel, Field


class NewsArticleItem(BaseModel):
    id: int
    source: str
    source_article_id: str
    title: str
    subtitle: str | None = None
    summary: str | None = None
    content: str | None = None
    ministry: str | None = None
    published_date: str
    url: str
    thumbnail_url: str | None = None
    collected_at: str
    updated_at: str | None = None


class NewsSyncRequest(BaseModel):
    target_date: date


class NewsSyncResult(BaseModel):
    target_date: str
    inserted: int = 0
    updated: int = 0
    skipped: int = 0
    failed: int = 0
    total: int = 0
    message: str = "completed"


class NewsJobItem(BaseModel):
    id: int
    job_type: str
    status: str
    detail: str | None = None
    created_at: str
    updated_at: str | None = None


class NewsListResponse(BaseModel):
    articles: list[NewsArticleItem]


class NewsSyncResponse(BaseModel):
    result: NewsSyncResult
    articles: list[NewsArticleItem] = Field(default_factory=list)
