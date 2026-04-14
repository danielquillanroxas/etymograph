import { useState, useCallback } from "react";
import type { TraceResponse } from "../types";
import { traceWord } from "../api/client";

export function useTrace() {
  const [result, setResult] = useState<TraceResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trace = useCallback(async (wordId: number, maxDepth = 2, relationTypes?: string[], languages?: string[], maxEdges = 50, hideAffixed = true, lineageMode?: string | null) => {
    setLoading(true); setError(null); setResult(null);
    try {
      setResult(await traceWord(wordId, maxDepth, relationTypes, languages, maxEdges, hideAffixed, lineageMode));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Trace failed");
    } finally { setLoading(false); }
  }, []);

  const clear = useCallback(() => { setResult(null); setError(null); }, []);
  return { result, loading, error, trace, clear };
}
