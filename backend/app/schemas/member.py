from pydantic import BaseModel, Field


class MemberBase(BaseModel):
    team_id: int | None = None
    name: str = Field(min_length=1, max_length=80)
    role: str = Field(default='member', min_length=1, max_length=40)


class MemberCreate(MemberBase):
    pass


class MemberUpdate(BaseModel):
    team_id: int | None = None
    name: str | None = Field(default=None, min_length=1, max_length=80)
    role: str | None = Field(default=None, min_length=1, max_length=40)


class MemberItem(MemberBase):
    id: int
    created_at: str
    updated_at: str | None = None
