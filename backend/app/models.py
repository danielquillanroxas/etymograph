from pydantic import BaseModel


class WordSearchResult(BaseModel):
    id: int
    term: str
    lang: str
    lang_name: str | None = None
    gloss: str | None = None


class GraphEdge(BaseModel):
    source_id: int
    source_term: str
    source_lang: str
    target_id: int
    target_term: str
    target_lang: str
    relation_type: str
    confidence: float
    source_dataset: str


class TraceRequest(BaseModel):
    word_id: int
    max_depth: int = 3
    relation_types: list[str] | None = None
    languages: list[str] | None = None
    max_edges: int = 100
    hide_affixed: bool = True
    lineage_only: bool = False  # deprecated, kept for compat
    lineage_mode: str | None = None  # "ancestors" | "descendants" | None


class TraceResponse(BaseModel):
    found: bool
    edges: list[GraphEdge] = []
    node_count: int = 0
    search_time_ms: int = 0


class ConnectRequest(BaseModel):
    source_word_id: int
    target_word_id: int
    max_depth: int = 8
    relation_types: list[str] | None = None
    languages: list[str] | None = None


class ConnectResponse(BaseModel):
    found: bool
    path: list[GraphEdge] = []
    hops: int = 0
    search_time_ms: int = 0


class WordDetail(BaseModel):
    id: int
    term: str
    lang: str
    lang_name: str | None = None
    lang_family: str | None = None
    gloss: str | None = None
    relations: list[GraphEdge] = []
    cognate_count: int = 0


class DatasetStats(BaseModel):
    total_relations: int
    total_words: int
    total_languages: int
    datasets: list[dict] = []
