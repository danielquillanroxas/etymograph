from fastapi import APIRouter, Query

from ..database import get_db
from ..models import WordSearchResult

router = APIRouter()


@router.get("/search", response_model=list[WordSearchResult])
async def search_words(
    q: str = Query(..., min_length=1),
    lang: str | None = Query(None),
    limit: int = Query(15, ge=1, le=50),
):
    db = await get_db()

    if lang:
        rows = await db.execute_fetchall(
            "SELECT id, term, lang, lang_name, gloss FROM words "
            "WHERE term LIKE ? AND lang = ? ORDER BY length(term) LIMIT ?",
            (f"{q}%", lang, limit),
        )
    else:
        # Try FTS first, fall back to LIKE
        try:
            rows = await db.execute_fetchall(
                "SELECT w.id, w.term, w.lang, w.lang_name, w.gloss "
                "FROM words_fts fts JOIN words w ON w.id = fts.rowid "
                "WHERE fts.term MATCH ? ORDER BY rank LIMIT ?",
                (f"{q}*", limit),
            )
        except Exception:
            rows = await db.execute_fetchall(
                "SELECT id, term, lang, lang_name, gloss FROM words "
                "WHERE term LIKE ? ORDER BY length(term) LIMIT ?",
                (f"{q}%", limit),
            )

    return [WordSearchResult(**dict(r)) for r in rows]
