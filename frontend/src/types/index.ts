export interface WordSearchResult {
  id: number;
  term: string;
  lang: string;
  lang_name: string | null;
  gloss: string | null;
}

export interface GraphEdge {
  source_id: number;
  source_term: string;
  source_lang: string;
  target_id: number;
  target_term: string;
  target_lang: string;
  relation_type: string;
  confidence: number;
  source_dataset: string;
}

export interface TraceResponse {
  found: boolean;
  edges: GraphEdge[];
  node_count: number;
  search_time_ms: number;
}

export interface ConnectResponse {
  found: boolean;
  path: GraphEdge[];
  hops: number;
  search_time_ms: number;
}

export interface WordDetail {
  id: number;
  term: string;
  lang: string;
  lang_name: string | null;
  lang_family: string | null;
  gloss: string | null;
  relations: GraphEdge[];
  cognate_count: number;
}

export interface DatasetStats {
  total_relations: number;
  total_words: number;
  total_languages: number;
  datasets: { dataset_name: string; relations_count: number }[];
}
