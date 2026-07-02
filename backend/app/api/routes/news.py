from datetime import date

from fastapi import APIRouter, HTTPException, Query

from app.schemas.news import NewsArticleItem, NewsJobItem, NewsListResponse, NewsSyncRequest, NewsSyncResponse, NewsSyncResult
from app.services.news_service import get_latest_news_job, list_news, sync_news_for_date

router = APIRouter()


@router.get("/news", response_model=NewsListResponse)
def get_news(
    published_date: date | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
) -> NewsListResponse:
    return NewsListResponse(articles=[NewsArticleItem(**item) for item in list_news(published_date, limit)])


@router.post("/news/sync", response_model=NewsSyncResponse)
def post_news_sync(payload: NewsSyncRequest) -> NewsSyncResponse:
    try:
        result = sync_news_for_date(payload.target_date)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Failed to collect policy news: {exc}") from exc
    articles = [NewsArticleItem(**item) for item in list_news(payload.target_date, 200)]
    return NewsSyncResponse(result=NewsSyncResult(**result), articles=articles)


@router.get("/news/sync/latest", response_model=NewsJobItem | None)
def get_latest_sync() -> NewsJobItem | None:
    job = get_latest_news_job()
    return NewsJobItem(**job) if job else None
