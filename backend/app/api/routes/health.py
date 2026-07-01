from fastapi import APIRouter

from app.core.config import settings
from app.db.database import fetch_table_count, get_db_path, is_database_connected
from app.schemas.health import APIStatus, DatabaseStatus, HealthResponse

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    database_connected = is_database_connected()
    return HealthResponse(
        status="ok" if database_connected else "degraded",
        service=settings.app_name,
        api=APIStatus(available=True, version=settings.app_version),
        database=DatabaseStatus(
            connected=database_connected,
            path=str(get_db_path()),
            tables=fetch_table_count() if database_connected else 0,
        ),
    )
