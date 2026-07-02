from __future__ import annotations

from datetime import date
import json
import sqlite3

from app.db.database import get_connection, run_query, run_write
from app.services.news_crawler import CrawledArticle, crawl_policy_news_for_date


def _to_article(row) -> dict:
    return dict(row)


def _to_job(row) -> dict:
    return dict(row)


def list_news(published_date: date | None = None, limit: int = 50) -> list[dict]:
    params: list[object] = []
    where = ""
    if published_date is not None:
        where = "WHERE published_date = ?"
        params.append(published_date.isoformat())
    params.append(limit)
    rows = run_query(
        f"""
        SELECT id, source, source_article_id, title, subtitle, summary, content, ministry,
               published_date, url, thumbnail_url, collected_at, updated_at
        FROM news_articles
        {where}
        ORDER BY published_date DESC, id DESC
        LIMIT ?
        """,
        tuple(params),
    )
    return [_to_article(row) for row in rows]


def get_latest_news_job() -> dict | None:
    rows = run_query(
        """
        SELECT id, job_type, status, detail, created_at, updated_at
        FROM job_runs
        WHERE job_type = 'news_sync'
        ORDER BY created_at DESC, id DESC
        LIMIT 1
        """
    )
    return _to_job(rows[0]) if rows else None


def _record_job(status: str, detail: dict) -> None:
    run_write(
        """
        INSERT INTO job_runs (job_type, status, detail)
        VALUES ('news_sync', ?, ?)
        """,
        (status, json.dumps(detail, ensure_ascii=False)),
    )


def _upsert_article(connection: sqlite3.Connection, article: CrawledArticle) -> str:
    existing = connection.execute(
        """
        SELECT id
        FROM news_articles
        WHERE source = ? AND source_article_id = ?
        LIMIT 1
        """,
        (article.source, article.source_article_id),
    ).fetchone()

    params = (
        article.source,
        article.source_article_id,
        article.title,
        article.subtitle,
        article.summary,
        article.content,
        article.ministry,
        article.published_date,
        article.url,
        article.thumbnail_url,
    )

    if existing is None:
        connection.execute(
            """
            INSERT INTO news_articles (
                source, source_article_id, title, subtitle, summary, content, ministry,
                published_date, url, thumbnail_url
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            params,
        )
        return "inserted"

    connection.execute(
        """
        UPDATE news_articles
        SET title = ?, subtitle = ?, summary = ?, content = ?, ministry = ?,
            published_date = ?, url = ?, thumbnail_url = ?, updated_at = CURRENT_TIMESTAMP
        WHERE source = ? AND source_article_id = ?
        """,
        (
            article.title,
            article.subtitle,
            article.summary,
            article.content,
            article.ministry,
            article.published_date,
            article.url,
            article.thumbnail_url,
            article.source,
            article.source_article_id,
        ),
    )
    return "updated"


def sync_news_for_date(target_date: date) -> dict:
    detail = {
        "target_date": target_date.isoformat(),
        "inserted": 0,
        "updated": 0,
        "skipped": 0,
        "failed": 0,
        "total": 0,
        "message": "completed",
    }

    try:
        articles = crawl_policy_news_for_date(target_date)
        detail["total"] = len(articles)
        with get_connection() as connection:
            for article in articles:
                result = _upsert_article(connection, article)
                detail[result] += 1
            connection.commit()
        _record_job("success", detail)
        return detail
    except Exception as exc:
        detail["failed"] = 1
        detail["message"] = str(exc)
        _record_job("failed", detail)
        raise
