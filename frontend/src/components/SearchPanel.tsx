import { useState } from "react";
import { WordAutocomplete } from "./WordAutocomplete";
import type { WordSearchResult } from "../types";

export type SearchMode = "trace" | "connect";

const RELATION_TYPES = [
  { key: "cognate", label: "Cognate", color: "#6b8fa3" },
  { key: "derived_from", label: "Derived", color: "#5a8a5a" },
  { key: "borrowed_from", label: "Borrowed", color: "#c07040" },
  { key: "inherited_from", label: "Inherited", color: "#8a6baa" },
  { key: "compound_of", label: "Compound", color: "#b09040" },
  { key: "false_friend", label: "False friend", color: "#a04040" },
];

const LANG_PRESETS: Record<string, string[]> = {
  Germanic: ["eng", "deu", "nld", "swe", "dan", "nor", "isl", "afr", "ang", "enm", "gmh", "goh", "non"],
  Romance: ["fra", "spa", "ita", "por", "ron", "cat", "glg", "oci", "fro", "pro", "lat"],
  Slavic: ["rus", "pol", "ces", "ukr", "bul", "hrv", "srp", "slv", "slk", "mkd"],
  "Indo-European": ["eng", "deu", "fra", "spa", "ita", "por", "rus", "pol", "hin", "fas", "ell", "lat", "grc", "san", "nld", "swe", "nor", "dan", "ces", "ukr", "ron", "bul", "hrv", "lit", "lav"],
};

interface Props {
  mode: SearchMode;
  onModeChange: (m: SearchMode) => void;
  onTrace: (wordId: number, maxDepth: number, relationTypes: string[], languages: string[], maxEdges: number) => void;
  onConnect: (sourceId: number, targetId: number, maxDepth: number, relationTypes: string[], languages: string[]) => void;
  onClear: () => void;
  loading: boolean;
}

export function SearchPanel({ mode, onModeChange, onTrace, onConnect, onClear, loading }: Props) {
  const [traceWord, setTraceWord] = useState<WordSearchResult | null>(null);
  const [source, setSource] = useState<WordSearchResult | null>(null);
  const [target, setTarget] = useState<WordSearchResult | null>(null);
  const [maxDepth, setMaxDepth] = useState(3);
  const [maxEdges, setMaxEdges] = useState(100);
  const [showFilters, setShowFilters] = useState(false);
  const [activeRelTypes, setActiveRelTypes] = useState<Set<string>>(new Set(RELATION_TYPES.map((r) => r.key)));
  const [langPreset, setLangPreset] = useState<string>("All");
  const [customLangs, setCustomLangs] = useState("");

  function getLanguages(): string[] {
    if (langPreset !== "All" && langPreset in LANG_PRESETS) return LANG_PRESETS[langPreset];
    if (customLangs.trim()) return customLangs.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
    return [];
  }

  function getRelTypes(): string[] {
    if (activeRelTypes.size === RELATION_TYPES.length) return []; // all = no filter
    return Array.from(activeRelTypes);
  }

  function toggleRel(key: string) {
    setActiveRelTypes((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  function handleClear() {
    setTraceWord(null);
    setSource(null);
    setTarget(null);
    onClear();
  }

  return (
    <div className="search-card">
      <div className="brand">
        <div>
          <h1>Etymograph</h1>
          <div className="subtitle">Etymology knowledge graph</div>
        </div>
        <button className="btn-ghost" onClick={handleClear} title="Clear everything and start over" style={{ fontSize: "0.68rem" }}>Clear</button>
      </div>

      {/* Mode toggle */}
      <div style={{ display: "flex", gap: 2, marginBottom: 12, background: "rgba(0,0,0,0.03)", borderRadius: 8, padding: 3 }}>
        {(["trace", "connect"] as const).map((m) => (
          <button key={m} onClick={() => { onModeChange(m); handleClear(); }}
            style={{ flex: 1, padding: "6px 0", borderRadius: 6, border: "none", background: mode === m ? "rgba(92,61,46,0.15)" : "transparent", color: mode === m ? "#5c3d2e" : "#555", fontSize: "0.78rem", fontWeight: mode === m ? 600 : 400, cursor: "pointer" }}>
            {m === "trace" ? "Trace" : "Connect"}
          </button>
        ))}
      </div>

      {/* Trace mode */}
      {mode === "trace" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <WordAutocomplete label="WORD" onSelect={setTraceWord} selected={traceWord} accentColor="#5c3d2e" />
          <button className="btn-primary" onClick={() => traceWord && onTrace(traceWord.id, maxDepth, getRelTypes(), getLanguages(), maxEdges)}
            disabled={!traceWord || loading} style={{ width: "100%" }}>
            {loading ? "Tracing..." : "Trace Etymology"}
          </button>
        </div>
      )}

      {/* Connect mode */}
      {mode === "connect" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <WordAutocomplete label="FROM" onSelect={setSource} selected={source} accentColor="#5c3d2e" />
          <WordAutocomplete label="TO" onSelect={setTarget} selected={target} accentColor="#f472b6" />
          <button className="btn-primary" onClick={() => source && target && onConnect(source.id, target.id, maxDepth, getRelTypes(), getLanguages())}
            disabled={!source || !target || loading} style={{ width: "100%" }}>
            {loading ? "Searching..." : "Find Connection"}
          </button>
        </div>
      )}

      {/* Filters toggle */}
      <div style={{ marginTop: 8 }}>
        <button onClick={() => setShowFilters(!showFilters)} style={{ background: "none", border: "none", color: "#8a7b6a", fontSize: "0.72rem", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ transform: showFilters ? "rotate(90deg)" : "", transition: "transform 0.2s", display: "inline-block" }}>&rsaquo;</span>
          Filters
          <span style={{ color: "#5c3d2e" }}>
            ({activeRelTypes.size}/{RELATION_TYPES.length} types, {langPreset}, max {maxEdges})
          </span>
        </button>

        {showFilters && (
          <div style={{ marginTop: 8, padding: 10, background: "rgba(0,0,0,0.02)", borderRadius: 8, border: "1px solid rgba(0,0,0,0.06)" }}>
            {/* Depth */}
            <div style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <div style={{ fontSize: "0.68rem", color: "#8a7b6a", textTransform: "uppercase" }} title="How many relationship steps to explore. Lower = cleaner graph.">Depth (?)</div>
                <div style={{ fontSize: "0.72rem", color: "#5c3d2e", fontWeight: 600 }}>{maxDepth}</div>
              </div>
              <div style={{ display: "flex", gap: 3 }}>
                {[2, 3, 4, 6, 8].map((d) => (
                  <button key={d} onClick={() => setMaxDepth(d)} style={{ flex: 1, padding: "3px 0", borderRadius: 5, border: `1px solid ${maxDepth === d ? "#5c3d2e" : "#d4c9b5"}`, background: maxDepth === d ? "rgba(92,61,46,0.1)" : "transparent", color: maxDepth === d ? "#5c3d2e" : "#555", fontSize: "0.72rem", cursor: "pointer" }}>{d}</button>
                ))}
              </div>
            </div>

            {/* Max edges */}
            <div style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <div style={{ fontSize: "0.68rem", color: "#8a7b6a", textTransform: "uppercase" }} title="Maximum number of relations to show. Prevents graph explosion.">Max results (?)</div>
                <div style={{ fontSize: "0.72rem", color: "#5c3d2e", fontWeight: 600 }}>{maxEdges}</div>
              </div>
              <div style={{ display: "flex", gap: 3 }}>
                {[50, 100, 200, 500].map((n) => (
                  <button key={n} onClick={() => setMaxEdges(n)} style={{ flex: 1, padding: "3px 0", borderRadius: 5, border: `1px solid ${maxEdges === n ? "#5c3d2e" : "#d4c9b5"}`, background: maxEdges === n ? "rgba(92,61,46,0.1)" : "transparent", color: maxEdges === n ? "#5c3d2e" : "#555", fontSize: "0.72rem", cursor: "pointer" }}>{n}</button>
                ))}
              </div>
            </div>

            {/* Relation types */}
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: "0.68rem", color: "#8a7b6a", textTransform: "uppercase", marginBottom: 4 }} title="Which types of etymological relationships to include">Relation types</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {RELATION_TYPES.map((r) => (
                  <label key={r.key} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.72rem", color: activeRelTypes.has(r.key) ? "#ccc" : "#444", cursor: "pointer", userSelect: "none" }}>
                    <input type="checkbox" checked={activeRelTypes.has(r.key)} onChange={() => toggleRel(r.key)} style={{ accentColor: r.color, width: 12, height: 12 }} />
                    <span className="dot" style={{ width: 6, height: 6, borderRadius: "50%", background: r.color, display: "inline-block" }} />
                    {r.label}
                  </label>
                ))}
              </div>
            </div>

            {/* Language filter */}
            <div>
              <div style={{ fontSize: "0.68rem", color: "#8a7b6a", textTransform: "uppercase", marginBottom: 4 }} title="Filter to specific language families or codes">Languages</div>
              <div style={{ display: "flex", gap: 3, marginBottom: 6 }}>
                {["All", ...Object.keys(LANG_PRESETS)].map((p) => (
                  <button key={p} onClick={() => { setLangPreset(p); setCustomLangs(""); }}
                    style={{ padding: "3px 8px", borderRadius: 5, border: `1px solid ${langPreset === p ? "#5c3d2e" : "#d4c9b5"}`, background: langPreset === p ? "rgba(92,61,46,0.1)" : "transparent", color: langPreset === p ? "#5c3d2e" : "#555", fontSize: "0.68rem", cursor: "pointer" }}>{p}</button>
                ))}
              </div>
              <input className="dark-input" placeholder="Or type ISO codes: eng,deu,fra..." value={customLangs}
                onChange={(e) => { setCustomLangs(e.target.value); setLangPreset("All"); }}
                style={{ fontSize: "0.75rem", padding: "6px 10px" }} />
            </div>
          </div>
        )}
      </div>

      {/* Edge legend */}
      <div style={{ marginTop: 8, borderTop: "1px solid rgba(0,0,0,0.06)", paddingTop: 6 }}>
        <div className="edge-legend">
          {RELATION_TYPES.filter((r) => activeRelTypes.has(r.key)).map((r) => (
            <span key={r.key}><span className="dot" style={{ background: r.color }} /> {r.label}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
