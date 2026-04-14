from fastapi import APIRouter

from ..database import get_db
from ..models import TraceRequest, TraceResponse, GraphEdge
from ..services.graph_search import trace, trace_lineage, trace_descendants

router = APIRouter()


@router.post("/trace", response_model=TraceResponse)
async def trace_word(req: TraceRequest):
    db = await get_db()

    # Resolve lineage mode (new field takes precedence over legacy flag)
    mode = req.lineage_mode
    if not mode and req.lineage_only:
        mode = "ancestors"

    if mode == "ancestors":
        result = await trace_lineage(db, req.word_id, req.max_depth)
    elif mode == "descendants":
        result = await trace_descendants(db, req.word_id, req.max_depth, req.max_edges, req.hide_affixed)
    else:
        result = await trace(db, req.word_id, req.max_depth, req.relation_types, getattr(req, 'languages', None), req.max_edges, req.hide_affixed)

    edges = [
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
        for e in result["edges"]
    ]

    return TraceResponse(
        found=result["found"],
        edges=edges,
        node_count=result["node_count"],
        search_time_ms=result["search_time_ms"],
    )
