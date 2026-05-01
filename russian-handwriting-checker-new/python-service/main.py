from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api.routes import upload, check, functions, auth, folders, groups
from src.core.database import engine, Base
from src.core.seed_functions import seed_default_functions
import src.models.folder  # noqa: F401 — register with Base.metadata
import src.models.group   # noqa: F401

app = FastAPI(
    title="Russian Handwriting Checker AI",
    version="2.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await seed_default_functions()

app.include_router(auth.router, prefix="/api")
app.include_router(upload.router, prefix="/api")
app.include_router(check.router, prefix="/api")
app.include_router(functions.router, prefix="/api")
app.include_router(folders.router, prefix="/api")
app.include_router(groups.router, prefix="/api")