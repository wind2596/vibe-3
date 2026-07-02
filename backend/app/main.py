import asyncio
from contextlib import asynccontextmanager
from datetime import datetime, time, timedelta
from zoneinfo import ZoneInfo

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.health import router as health_router
from app.api.routes.excel import router as excel_router
from app.api.routes.members import router as members_router
from app.api.routes.news import router as news_router
from app.api.routes.schedules import router as schedules_router
from app.db.database import initialize_database
from app.services.news_service import sync_news_for_date


KST = ZoneInfo('Asia/Seoul')


def _seconds_until_next_news_sync(now: datetime | None = None) -> float:
    current = now or datetime.now(KST)
    next_run = datetime.combine(current.date(), time(hour=9), tzinfo=KST)
    if current >= next_run:
        next_run += timedelta(days=1)
    return max((next_run - current).total_seconds(), 0)


async def _daily_news_sync_loop() -> None:
    while True:
        await asyncio.sleep(_seconds_until_next_news_sync())
        target_date = datetime.now(KST).date() - timedelta(days=1)
        try:
            await asyncio.to_thread(sync_news_for_date, target_date)
        except Exception:
            # sync_news_for_date records failure details in job_runs.
            pass


@asynccontextmanager
async def lifespan(app: FastAPI):
    initialize_database()
    news_task = asyncio.create_task(_daily_news_sync_loop())
    try:
        yield
    finally:
        news_task.cancel()
        try:
            await news_task
        except asyncio.CancelledError:
            pass


app = FastAPI(
    title='Public Sector Admin Super App',
    version='0.1.0',
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=['http://127.0.0.1:5173', 'http://localhost:5173'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

app.include_router(health_router, prefix='/api', tags=['health'])
app.include_router(excel_router, prefix='/api', tags=['excel'])
app.include_router(members_router, prefix='/api', tags=['members'])
app.include_router(news_router, prefix='/api', tags=['news'])
app.include_router(schedules_router, prefix='/api', tags=['schedules'])


@app.get('/')
def root() -> dict[str, str]:
    return {'message': 'Public sector admin super app backend is running.'}
