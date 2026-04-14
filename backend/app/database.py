import aiosqlite
from pathlib import Path

from . import config

_db: aiosqlite.Connection | None = None


async def get_db() -> aiosqlite.Connection:
    global _db
    if _db is None:
        db_path = Path(__file__).resolve().parent.parent.parent / "data" / "etymograph.db"
        if not db_path.exists():
            raise FileNotFoundError(
                f"Database not found at {db_path}. Run the pipeline first: python pipeline/run_pipeline.py"
            )
        _db = await aiosqlite.connect(str(db_path))
        _db.row_factory = aiosqlite.Row
        await _db.execute("PRAGMA query_only=ON")
    return _db


async def close_db():
    global _db
    if _db:
        await _db.close()
        _db = None
