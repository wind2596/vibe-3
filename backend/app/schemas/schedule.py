from pydantic import BaseModel


class ScheduleItem(BaseModel):
    id: int
    user_id: int | None
    category: str
    title: str
    start_at: str
    end_at: str
    memo: str | None = None
