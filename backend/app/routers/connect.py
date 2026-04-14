from fastapi import APIRouter

from ..database import get_db
from ..models import ConnectRequest, ConnectResponse, GraphEdge
from ..services.graph_search import connect

router = APIRouter()


@router.post("/connect", response_model=ConnectResponse)
async def connect_words(req: ConnectRequest):
    db = await get_db()
    result = await connect(
        db, req.source_word_id, req.target_word_id,
        req.max_depth, req.relation_types, req.languages,
    )

    path = [
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
        for e in result["path"]
    ]

    return ConnectResponse(
        found=result["found"],
        path=path,
        hops=result["hops"],
        search_time_ms=result["search_time_ms"],
    )
