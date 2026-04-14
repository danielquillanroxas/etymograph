from fastapi import APIRouter, Query

from ..database import get_db
from ..models import GraphEdge

router = APIRouter()


@router.get("/cognates/{term}", response_model=list[GraphEdge])
async def get_cognates(term: str, lang: str | None = Query(None), limit: int = Query(50, ge=1, le=200)):
    db = await get_db()

    if lang:
        word_rows = await db.execute_fetchall(
            "SELECT id FROM words WHERE term = ? AND lang = ?", (term, lang)
        )
    else:
        word_rows = await db.execute_fetchall(
            "SELECT id FROM words WHERE term = ? LIMIT 10", (term,)
        )

    if not word_rows:
        return []

    word_ids = [r["id"] for r in word_rows]
    placeholders = ",".join("?" for _ in word_ids)

    rows = await db.execute_fetchall(
        f"""
        SELECT r.source_word_id, r.target_word_id, r.relation_type, r.confidence, r.source_dataset,
               sw.term AS src_term, sw.lang AS src_lang,
               tw.term AS tgt_term, tw.lang AS tgt_lang
        FROM relations r
        JOIN words sw ON sw.id = r.source_word_id
        JOIN words tw ON tw.id = r.target_word_id
        WHERE (r.source_word_id IN ({placeholders}) OR r.target_word_id IN ({placeholders}))
          AND r.relation_type = 'cognate'
        LIMIT ?
        """,
        word_ids + word_ids + [limit],
    )

    return [
        GraphEdge(
            source_id=r["source_word_id"], source_term=r["src_term"], source_lang=r["src_lang"],
            target_id=r["target_word_id"], target_term=r["tgt_term"], target_lang=r["tgt_lang"],
            relation_type=r["relation_type"], confidence=r["confidence"], source_dataset=r["source_dataset"],
        )
        for r in rows
    ]
