from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime
from html import unescape
import re
from urllib.parse import parse_qs, urljoin, urlparse

from bs4 import BeautifulSoup
import requests


BASE_URL = "https://www.korea.kr"
LIST_URL = f"{BASE_URL}/news/policyNewsList.do"
DETAIL_PATH = "/news/policyNewsView.do"
SOURCE_NAME = "대한민국 정책브리핑"
MAX_PAGES = 20
REQUEST_TIMEOUT = 15

_DATE_DOT_PATTERN = re.compile(r"\d{4}\.\d{2}\.\d{2}")
_SPACE_PATTERN = re.compile(r"\s+")


@dataclass(slots=True)
class CrawledArticle:
    source: str
    source_article_id: str
    title: str
    subtitle: str | None
    summary: str | None
    content: str | None
    ministry: str | None
    published_date: str
    url: str
    thumbnail_url: str | None


def _clean_text(value: str | None) -> str:
    if not value:
        return ""
    return _SPACE_PATTERN.sub(" ", unescape(value)).strip()


def _date_to_site_value(value: date) -> str:
    return value.strftime("%Y-%m-%d")


def _site_date_to_iso(value: str) -> str:
    return datetime.strptime(value, "%Y.%m.%d").date().isoformat()


def _extract_news_id(url: str) -> str | None:
    parsed = urlparse(url)
    news_id = parse_qs(parsed.query).get("newsId", [None])[0]
    return news_id.strip() if news_id else None


def _extract_date_from_text(text: str) -> str | None:
    match = _DATE_DOT_PATTERN.search(text)
    if not match:
        return None
    return _site_date_to_iso(match.group(0))


def _build_session() -> requests.Session:
    session = requests.Session()
    session.headers.update(
        {
            "User-Agent": "Mozilla/5.0 (compatible; PublicSectorAdminSuperApp/0.1; +https://www.korea.kr)",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.7",
        }
    )
    return session


def _parse_list_item(anchor) -> CrawledArticle | None:
    href = anchor.get("href")
    if not href:
        return None

    url = urljoin(BASE_URL, href)
    news_id = _extract_news_id(url)
    if not news_id:
        return None

    text_area = anchor.select_one(".text") or anchor
    source_values = [_clean_text(node.get_text(" ", strip=True)) for node in text_area.select(".source span")]
    published_date = None
    ministry = None
    for value in source_values:
        if _DATE_DOT_PATTERN.fullmatch(value):
            published_date = _site_date_to_iso(value)
        elif value:
            ministry = value

    image = anchor.select_one("img")
    title = _clean_text((text_area.select_one("strong") or anchor).get_text(" ", strip=True))
    if not title:
        return None

    return CrawledArticle(
        source=SOURCE_NAME,
        source_article_id=news_id,
        title=title,
        subtitle=_clean_text(text_area.select_one(".stitle").get_text(" ", strip=True)) if text_area.select_one(".stitle") else None,
        summary=_clean_text(text_area.select_one(".lead").get_text(" ", strip=True)) if text_area.select_one(".lead") else None,
        content=None,
        ministry=ministry,
        published_date=published_date or "",
        url=url,
        thumbnail_url=urljoin(BASE_URL, image.get("src")) if image and image.get("src") else None,
    )


def _extract_detail_content(article_body) -> str | None:
    if article_body is None:
        return None

    stop_keywords = ("문의:", "저작권정책", "자료출처=", "이전기사")
    paragraphs: list[str] = []
    for node in article_body.find_all(["p", "div"], recursive=True):
        if node.find(["script", "style", "button", "form"]):
            continue
        text = _clean_text(node.get_text(" ", strip=True))
        if not text or len(text) < 20:
            continue
        if any(keyword in text for keyword in stop_keywords):
            break
        if text not in paragraphs:
            paragraphs.append(text)

    if not paragraphs:
        heading = article_body.find("h1")
        text = _clean_text(article_body.get_text(" ", strip=True))
        if heading:
            text = text.replace(_clean_text(heading.get_text(" ", strip=True)), "", 1).strip()
        return text or None

    return "\n\n".join(paragraphs)


def _parse_detail(html: str, fallback: CrawledArticle) -> CrawledArticle:
    soup = BeautifulSoup(html, "html.parser")
    article_body = soup.select_one("main.sub.view") or soup.select_one("#main") or soup
    content_body = article_body.select_one(".view_cont") or article_body.select_one(".article_body") or article_body
    title_node = article_body.select_one("h1") or soup.select_one("h1")
    title = _clean_text(title_node.get_text(" ", strip=True)) if title_node else fallback.title

    subtitle_nodes = article_body.select("h2")
    subtitle_values = [_clean_text(node.get_text(" ", strip=True)) for node in subtitle_nodes]
    subtitle_values = [value for value in subtitle_values if value and value not in ("사이트 이동경로", "콘텐츠 영역")]
    subtitle = " ".join(subtitle_values[:2]) or fallback.subtitle

    article_text = _clean_text(article_body.get_text(" ", strip=True))
    published_date = _extract_date_from_text(article_text) or fallback.published_date

    ministry = fallback.ministry
    if published_date:
        date_dot = published_date.replace("-", ".")
        date_node = article_body.find(string=re.compile(re.escape(date_dot)))
        if date_node:
            parent_text = _clean_text(date_node.parent.get_text(" ", strip=True)) if date_node.parent else ""
            candidates = [value for value in parent_text.split() if value and value != date_dot]
            ministry = candidates[0] if candidates else ministry

    return CrawledArticle(
        source=fallback.source,
        source_article_id=fallback.source_article_id,
        title=title,
        subtitle=subtitle,
        summary=fallback.summary,
        content=_extract_detail_content(content_body) or fallback.summary,
        ministry=ministry,
        published_date=published_date,
        url=fallback.url,
        thumbnail_url=fallback.thumbnail_url,
    )


def crawl_policy_news_for_date(target_date: date) -> list[CrawledArticle]:
    session = _build_session()
    collected: dict[str, CrawledArticle] = {}
    requested_date = target_date.isoformat()

    for page_index in range(1, MAX_PAGES + 1):
        response = session.get(
            LIST_URL,
            params={
                "pageIndex": str(page_index),
                "period": "direct",
                "startDate": _date_to_site_value(target_date),
                "endDate": _date_to_site_value(target_date),
            },
            timeout=REQUEST_TIMEOUT,
        )
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")
        anchors = [
            anchor
            for anchor in soup.find_all("a")
            if anchor.get("href")
            and "policyNewsView.do" in anchor.get("href")
            and "newsId=" in anchor.get("href")
            and "pWise" not in anchor.get("href")
        ]
        page_items = [item for item in (_parse_list_item(anchor) for anchor in anchors) if item is not None]

        if not page_items:
            break

        matched_on_page = 0
        for item in page_items:
            if item.published_date and item.published_date != requested_date:
                continue

            detail_response = session.get(item.url, timeout=REQUEST_TIMEOUT)
            detail_response.raise_for_status()
            detail = _parse_detail(detail_response.text, item)
            if detail.published_date != requested_date:
                continue

            collected[detail.source_article_id] = detail
            matched_on_page += 1

        if matched_on_page == 0:
            break

    return list(collected.values())
