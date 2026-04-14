import type { WordSearchResult, TraceResponse, ConnectResponse, WordDetail, DatasetStats } from "../types";

const API_BASE = (import.meta.env.VITE_API_URL || "") + "/api";

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const resp = await fetch(`${API_BASE}${url}`, init);
  if (!resp.ok) throw new Error(`API error ${resp.status}: ${await resp.text().catch(() => "")}`);
  return resp.json();
}

export function searchWords(q: string, lang?: string, limit = 15): Promise<WordSearchResult[]> {
  const params = new URLSearchParams({ q, limit: String(limit) });
  if (lang) params.set("lang", lang);
  return fetchJSON(`/search?${params}`);
}

export function traceWord(wordId: number, maxDepth = 2, relationTypes?: string[], languages?: string[], maxEdges = 50, hideAffixed = true, lineageMode?: string | null): Promise<TraceResponse> {
  return fetchJSON("/trace", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      word_id: wordId,
      max_depth: maxDepth,
      relation_types: relationTypes?.length ? relationTypes : undefined,
      languages: languages?.length ? languages : undefined,
      max_edges: maxEdges,
      hide_affixed: hideAffixed,
      lineage_mode: lineageMode || undefined,
    }),
  });
}

export function connectWords(sourceId: number, targetId: number, maxDepth = 8, relationTypes?: string[], languages?: string[]): Promise<ConnectResponse> {
  return fetchJSON("/connect", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      source_word_id: sourceId,
      target_word_id: targetId,
      max_depth: maxDepth,
      relation_types: relationTypes?.length ? relationTypes : undefined,
      languages: languages?.length ? languages : undefined,
    }),
  });
}

export function getWordDetail(id: number): Promise<WordDetail> {
  return fetchJSON(`/word/${id}`);
}

export function getStats(): Promise<DatasetStats> {
  return fetchJSON("/stats");
}

export interface CompareResult {
  word: { id: number; term: string; lang: string; gloss: string | null } | null;
  families: Record<string, { id: number; term: string; lang: string; gloss: string | null; relation_type: string }[]>;
}

export function compareWord(term: string, lang = "eng", limit = 30): Promise<CompareResult> {
  return fetchJSON(`/compare/${encodeURIComponent(term)}?lang=${lang}&limit=${limit}`);
}
