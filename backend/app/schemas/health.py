from pydantic import BaseModel


class APIStatus(BaseModel):
    available: bool
    version: str


class DatabaseStatus(BaseModel):
    connected: bool
    path: str
    tables: int


class HealthResponse(BaseModel):
    status: str
    service: str
    api: APIStatus
    database: DatabaseStatus
