import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from .database import get_db, close_db
from .routers import search, trace, connect, word, cognates, stats, compare

STATIC_DIR = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"


@asynccontextmanager
async def lifespan(app: FastAPI):
    print(f"[startup] CWD: {os.getcwd()}")
    print(f"[startup] STATIC_DIR: {STATIC_DIR} exists={STATIC_DIR.is_dir()}")
    await get_db()
    yield
    await close_db()


app = FastAPI(title="Etymograph", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(search.router, prefix="/api")
app.include_router(trace.router, prefix="/api")
app.include_router(connect.router, prefix="/api")
app.include_router(word.router, prefix="/api")
app.include_router(compare.router, prefix="/api")
app.include_router(cognates.router, prefix="/api")
app.include_router(stats.router, prefix="/api")


@app.get("/api/health")
async def health():
    return {"status": "ok"}


# Serve React build if it exists (production)
if STATIC_DIR.is_dir():
    assets_dir = STATIC_DIR / "assets"
    if assets_dir.is_dir():
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file = STATIC_DIR / full_path
        if file.is_file() and ".." not in full_path:
            return FileResponse(file)
        return FileResponse(STATIC_DIR / "index.html")
