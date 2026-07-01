from fastapi import APIRouter, HTTPException, Query, Response, status

from app.schemas.schedule import ScheduleCreate, ScheduleItem, ScheduleUpdate
from app.services.schedule_service import create_schedule, delete_schedule, list_schedules, update_schedule

router = APIRouter()


@router.get('/schedules', response_model=list[ScheduleItem])
def get_schedules(
    from_at: str | None = Query(default=None),
    to_at: str | None = Query(default=None),
    member_id: int | None = Query(default=None, gt=0),
) -> list[ScheduleItem]:
    return [ScheduleItem(**item) for item in list_schedules(from_at=from_at, to_at=to_at, member_id=member_id)]


@router.post('/schedules', response_model=ScheduleItem, status_code=status.HTTP_201_CREATED)
def post_schedule(payload: ScheduleCreate) -> ScheduleItem:
    try:
        schedule = create_schedule(payload.model_dump())
    except ValueError as exc:
        message = str(exc)
        code = status.HTTP_404_NOT_FOUND if 'not found' in message.lower() else status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code=code, detail=message) from exc
    return ScheduleItem(**schedule)


@router.put('/schedules/{schedule_id}', response_model=ScheduleItem)
def put_schedule(schedule_id: int, payload: ScheduleUpdate) -> ScheduleItem:
    try:
        schedule = update_schedule(schedule_id, payload.model_dump(exclude_unset=True))
    except ValueError as exc:
        message = str(exc)
        code = status.HTTP_404_NOT_FOUND if 'not found' in message.lower() else status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code=code, detail=message) from exc
    return ScheduleItem(**schedule)


@router.delete('/schedules/{schedule_id}', status_code=status.HTTP_204_NO_CONTENT)
def remove_schedule(schedule_id: int) -> Response:
    delete_schedule(schedule_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
