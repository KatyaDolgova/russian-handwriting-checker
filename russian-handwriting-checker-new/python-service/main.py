from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api.routes import upload, check, functions
from src.core.database import engine, Base

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

app.include_router(upload.router, prefix="/api")
app.include_router(check.router, prefix="/api")
app.include_router(functions.router, prefix="/api")