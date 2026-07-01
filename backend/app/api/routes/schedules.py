from fastapi import APIRouter

from app.schemas.schedule import ScheduleItem
from app.services.schedule_service import list_schedules

router = APIRouter()


@router.get("/schedules", response_model=list[ScheduleItem])
def get_schedules() -> list[ScheduleItem]:
    return [ScheduleItem(**item) for item in list_schedules()]
