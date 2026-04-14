import { useState, useEffect, useRef } from "react";
import type { WordSearchResult } from "../types";
import { searchWords } from "../api/client";

export function useWordSearch(query: string, debounceMs = 300) {
  const [results, setResults] = useState<WordSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);
      try {
        const data = await searchWords(query);
        if (!controller.signal.aborted) setResults(data);
      } catch {
        if (!controller.signal.aborted) setResults([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  return { results, loading };
}
