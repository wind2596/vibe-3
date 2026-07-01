from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.health import router as health_router
from app.api.routes.members import router as members_router
from app.api.routes.schedules import router as schedules_router
from app.db.database import initialize_database


@asynccontextmanager
async def lifespan(app: FastAPI):
    initialize_database()
    yield


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
app.include_router(members_router, prefix='/api', tags=['members'])
app.include_router(schedules_router, prefix='/api', tags=['schedules'])


@app.get('/')
def root() -> dict[str, str]:
    return {'message': 'Public sector admin super app backend is running.'}
