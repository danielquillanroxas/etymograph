from fastapi import APIRouter

from ..database import get_db
from ..models import WordDetail, GraphEdge

router = APIRouter()


@router.get("/word/{word_id}", response_model=WordDetail)
async def get_word(word_id: int):
    db = await get_db()

    # Get word info
    row = await db.execute_fetchall(
        "SELECT id, term, lang, lang_name, lang_family, gloss FROM words WHERE id = ?",
        (word_id,),
    )
    if not row:
        return WordDetail(id=word_id, term="?", lang="?")

    w = dict(row[0])

    # Get relations
    edges = await db.execute_fetchall(
        """
        SELECT r.source_word_id, r.target_word_id, r.relation_type, r.confidence, r.source_dataset,
               sw.term AS src_term, sw.lang AS src_lang,
               tw.term AS tgt_term, tw.lang AS tgt_lang
        FROM relations r
        JOIN words sw ON sw.id = r.source_word_id
        JOIN words tw ON tw.id = r.target_word_id
        WHERE r.source_word_id = ? OR r.target_word_id = ?
        LIMIT 100
        """,
        (word_id, word_id),
    )

    relations = [
        GraphEdge(
            source_id=e["source_word_id"],
            source_term=e["src_term"],
            source_lang=e["src_lang"],
            target_id=e["target_word_id"],
            target_term=e["tgt_term"],
            target_lang=e["tgt_lang"],
            relation_type=e["relation_type"],
            confidence=e["confidence"],
            source_dataset=e["source_dataset"],
        )
        for e in edges
    ]

    # Count cognates
    cog = await db.execute_fetchall(
        "SELECT COUNT(*) FROM relations WHERE (source_word_id = ? OR target_word_id = ?) AND relation_type = 'cognate'",
        (word_id, word_id),
    )
    cognate_count = cog[0][0] if cog else 0

    return WordDetail(
        id=w["id"],
        term=w["term"],
        lang=w["lang"],
        lang_name=w.get("lang_name"),
        lang_family=w.get("lang_family"),
        gloss=w.get("gloss"),
        relations=relations,
        cognate_count=cognate_count,
    )
