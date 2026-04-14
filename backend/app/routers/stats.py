from fastapi import APIRouter

from ..database import get_db
from ..models import DatasetStats

router = APIRouter()


@router.get("/stats", response_model=DatasetStats)
async def get_stats():
    db = await get_db()

    total_rel = await db.execute_fetchall("SELECT COUNT(*) FROM relations")
    total_words = await db.execute_fetchall("SELECT COUNT(*) FROM words")
    total_langs = await db.execute_fetchall("SELECT COUNT(DISTINCT lang) FROM words")

    datasets = await db.execute_fetchall("SELECT * FROM dataset_stats ORDER BY relations_count DESC")

    return DatasetStats(
        total_relations=total_rel[0][0],
        total_words=total_words[0][0],
        total_languages=total_langs[0][0],
        datasets=[dict(d) for d in datasets],
    )
