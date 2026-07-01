from pydantic import BaseModel, Field


class ScheduleBase(BaseModel):
    member_id: int = Field(gt=0)
    category: str = Field(min_length=1, max_length=40)
    title: str = Field(min_length=1, max_length=120)
    start_at: str = Field(min_length=1, max_length=32)
    end_at: str = Field(min_length=1, max_length=32)
    memo: str | None = Field(default=None, max_length=500)
    all_day: bool = False


class ScheduleCreate(ScheduleBase):
    pass


class ScheduleUpdate(BaseModel):
    member_id: int | None = Field(default=None, gt=0)
    category: str | None = Field(default=None, min_length=1, max_length=40)
    title: str | None = Field(default=None, min_length=1, max_length=120)
    start_at: str | None = Field(default=None, min_length=1, max_length=32)
    end_at: str | None = Field(default=None, min_length=1, max_length=32)
    memo: str | None = Field(default=None, max_length=500)
    all_day: bool | None = None


class ScheduleItem(ScheduleBase):
    id: int
    member_name: str | None = None
    created_at: str
    updated_at: str | None = None
