import { useState, useCallback } from "react";
import type { ConnectResponse } from "../types";
import { connectWords } from "../api/client";

export function useConnect() {
  const [result, setResult] = useState<ConnectResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(async (sourceId: number, targetId: number, maxDepth = 8, relationTypes?: string[], languages?: string[]) => {
    setLoading(true); setError(null); setResult(null);
    try {
      setResult(await connectWords(sourceId, targetId, maxDepth, relationTypes, languages));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Connect failed");
    } finally { setLoading(false); }
  }, []);

  const clear = useCallback(() => { setResult(null); setError(null); }, []);
  return { result, loading, error, connect, clear };
}
