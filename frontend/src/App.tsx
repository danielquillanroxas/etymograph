import { useState, useCallback, useRef, useEffect } from "react";
import { GraphCanvas } from "./components/GraphCanvas";
import { LineageView } from "./components/LineageView";
import { WordDetailPanel } from "./components/WordDetailPanel";
import { CompareView } from "./components/CompareView";
import { TypingEffect } from "./components/TypingEffect";
import { useTrace } from "./hooks/useTrace";
import { useConnect } from "./hooks/useConnect";
import { searchWords, compareWord } from "./api/client";
import type { CompareResult } from "./api/client";
import type { GraphEdge, WordSearchResult } from "./types";
import { langName } from "./utils/langNames";
import "./App.css";

type Mode = "trace" | "connect" | "compare";

const SEARCH_LANGS = [
  { code: "", label: "Any language" },
  { code: "eng", label: "English" },
  { code: "deu", label: "German" },
  { code: "fra", label: "French" },
  { code: "spa", label: "Spanish" },
  { code: "ita", label: "Italian" },
  { code: "por", label: "Portuguese" },
  { code: "lat", label: "Latin" },
  { code: "grc", label: "Ancient Greek" },
  { code: "rus", label: "Russian" },
  { code: "pol", label: "Polish" },
  { code: "nld", label: "Dutch" },
  { code: "swe", label: "Swedish" },
  { code: "ara", label: "Arabic" },
  { code: "hin", label: "Hindi" },
  { code: "jpn", label: "Japanese" },
  { code: "zho", label: "Chinese" },
  { code: "kor", label: "Korean" },
  { code: "tur", label: "Turkish" },
  { code: "fin", label: "Finnish" },
  { code: "hun", label: "Hungarian" },
  { code: "san", label: "Sanskrit" },
];

function LangSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      title="Filter search results to a specific language"
      style={{
        padding: "8px 4px",
        border: "1px solid #d4c9b5",
        borderRadius: 4,
        background: "#fffcf5",
        color: value ? "#5c3d2e" : "#9a8b78",
        fontSize: "0.78rem",
        fontFamily: "-apple-system, sans-serif",
        outline: "none",
        cursor: "pointer",
        maxWidth: 110,
        flexShrink: 0,
      }}
    >
      {SEARCH_LANGS.map((l) => (
        <option key={l.code} value={l.code}>{l.label}</option>
      ))}
    </select>
  );
}

const RELATION_TYPES = [
  { key: "cognate", label: "Cognate", color: "#5a8aaa" },
  { key: "derived_from", label: "Derived", color: "#4a7a4a" },
  { key: "borrowed_from", label: "Borrowed", color: "#c07040" },
  { key: "inherited_from", label: "Inherited", color: "#7a5a9a" },
  { key: "compound_of", label: "Compound", color: "#b09040" },
  { key: "false_friend", label: "False friend", color: "#a04040" },
];

const LANG_PRESETS: Record<string, string[]> = {
  Germanic: ["eng", "deu", "nld", "swe", "dan", "nor", "isl", "afr", "ang", "enm", "gmh", "goh", "non"],
  Romance: ["fra", "spa", "ita", "por", "ron", "cat", "glg", "lat", "fro"],
  Slavic: ["rus", "pol", "ces", "ukr", "bul", "hrv", "srp", "slv", "slk"],
};

export default function App() {
  const [mode, setMode] = useState<Mode>("trace");
  const { result: traceResult, loading: traceLoading, error: traceError, trace, clear: clearTrace } = useTrace();
  const { result: connectResult, loading: connectLoading, error: connectError, connect, clear: clearConnect } = useConnect();

  // Search state
  const [query1, setQuery1] = useState("");
  const [query2, setQuery2] = useState("");
  const [results1, setResults1] = useState<WordSearchResult[]>([]);
  const [results2, setResults2] = useState<WordSearchResult[]>([]);
  const [selected1, setSelected1] = useState<WordSearchResult | null>(null);
  const [selected2, setSelected2] = useState<WordSearchResult | null>(null);
  const [showDrop1, setShowDrop1] = useState(false);
  const [showDrop2, setShowDrop2] = useState(false);
  const [searchLang1, setSearchLang1] = useState("");
  const [searchLang2, setSearchLang2] = useState("");
  const [selectedWord, setSelectedWord] = useState<number | null>(null);
  const [sourceId, setSourceId] = useState<number | null>(null);
  const [targetId, setTargetId] = useState<number | null>(null);

  // Compare state
  const [compareData, setCompareData] = useState<CompareResult | null>(null);
  const [compareLoading, setCompareLoading] = useState(false);

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [maxDepth, setMaxDepth] = useState(2);
  const [maxEdges, setMaxEdges] = useState(50);
  const [hideAffixed, setHideAffixed] = useState(true);
  const [lineageMode, setLineageMode] = useState<"ancestors" | "descendants" | null>(null);
  const [activeRels, setActiveRels] = useState<Set<string>>(new Set(RELATION_TYPES.map((r) => r.key)));
  const [langPreset, setLangPreset] = useState("All");

  const filterRef = useRef<HTMLDivElement>(null);

  // Close filter panel on outside click
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setShowFilters(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  // Debounced search
  useEffect(() => {
    if (query1.length < 2) { setResults1([]); return; }
    const t = setTimeout(() => searchWords(query1, searchLang1 || undefined).then(setResults1).catch(() => {}), 250);
    return () => clearTimeout(t);
  }, [query1, searchLang1]);

  useEffect(() => {
    if (query2.length < 2) { setResults2([]); return; }
    const t = setTimeout(() => searchWords(query2, searchLang2 || undefined).then(setResults2).catch(() => {}), 250);
    return () => clearTimeout(t);
  }, [query2]);

  function getLangs(): string[] {
    if (langPreset !== "All" && langPreset in LANG_PRESETS) return LANG_PRESETS[langPreset];
    return [];
  }
  function getRelsFor(lm: "ancestors" | "descendants" | null): string[] {
    if (lm) return ["derived_from", "inherited_from"];
    return activeRels.size === RELATION_TYPES.length ? [] : Array.from(activeRels);
  }

  // Fire a trace with a given lineage mode
  const fireTrace = useCallback((wordId: number, lm: "ancestors" | "descendants" | null) => {
    setSourceId(wordId);
    setTargetId(null);
    setSelectedWord(null);
    setCompareData(null);
    clearConnect();
    trace(wordId, maxDepth, getRelsFor(lm), getLangs(), maxEdges, hideAffixed, lm);
  }, [maxDepth, maxEdges, activeRels, langPreset, hideAffixed, trace, clearConnect]);

  const handleGo = useCallback(() => {
    if (mode === "trace" && selected1) {
      fireTrace(selected1.id, lineageMode);
    } else if (mode === "connect" && selected1 && selected2) {
      setSourceId(selected1.id);
      setTargetId(selected2.id);
      setSelectedWord(null);
      setCompareData(null);
      clearTrace();
      connect(selected1.id, selected2.id, maxDepth, getRelsFor(null), getLangs());
    } else if (mode === "compare" && selected1) {
      setCompareData(null);
      setSelectedWord(null);
      clearTrace();
      clearConnect();
      setCompareLoading(true);
      compareWord(selected1.term, selected1.lang, 30).then(setCompareData).finally(() => setCompareLoading(false));
    }
  }, [mode, selected1, selected2, maxDepth, maxEdges, activeRels, langPreset, hideAffixed, lineageMode, fireTrace, connect, clearTrace, clearConnect]);

  // Toggle lineage mode and auto re-query if we already have results
  const toggleLineage = useCallback((target: "ancestors" | "descendants") => {
    const next = lineageMode === target ? null : target;
    setLineageMode(next);
    // Re-fire trace if we have a selected word and results are showing
    if (sourceId && selected1) {
      fireTrace(selected1.id, next);
    }
  }, [lineageMode, sourceId, selected1, fireTrace]);

  const handleClear = useCallback(() => {
    setQuery1(""); setQuery2("");
    setSelected1(null); setSelected2(null);
    setResults1([]); setResults2([]);
    setSearchLang1(""); setSearchLang2("");
    setCompareData(null);
    setSelectedWord(null); setSourceId(null); setTargetId(null);
    setLineageMode(null);
    clearTrace(); clearConnect();
  }, [clearTrace, clearConnect]);

  const loading = traceLoading || connectLoading || compareLoading;
  const error = traceError || connectError;

  let edges: GraphEdge[] = [];
  let hasGraph = false;
  if (mode === "trace" && traceResult?.found) { edges = traceResult.edges; hasGraph = true; }
  else if (mode === "connect" && connectResult?.found) { edges = connectResult.path; hasGraph = true; }

  return (
    <div className="app-root">
      {/* ── Top bar ── */}
      <div className="top-bar">
        <div className="brand">Etymograph</div>

        <div className="mode-toggle">
          <button className={mode === "trace" ? "active" : ""} onClick={() => { setMode("trace"); handleClear(); }}>Trace</button>
          <button className={mode === "connect" ? "active" : ""} onClick={() => { setMode("connect"); handleClear(); }}>Connect</button>
          <button className={mode === "compare" ? "active" : ""} onClick={() => { setMode("compare"); handleClear(); }}>Compare</button>
        </div>

        <div className="search-group">
          {/* Input 1 */}
          <LangSelect value={searchLang1} onChange={setSearchLang1} />
          <div className="search-input">
            <input
              value={query1}
              onChange={(e) => {
                setQuery1(e.target.value);
                setSelected1(null);
                setShowDrop1(true);
                // Clear stale graph so user sees immediate feedback
                if (traceResult) clearTrace();
                if (connectResult) clearConnect();
                setCompareData(null);
              }}
              onFocus={() => { if (results1.length > 0) setShowDrop1(true); }}
              onBlur={() => { setTimeout(() => setShowDrop1(false), 200); }}
              placeholder={mode === "compare" ? "Type a word to compare..." : mode === "trace" ? "Type a word..." : "From word..."}
            />
            {showDrop1 && results1.length > 0 && (
              <div className="autocomplete-dropdown">
                {results1.map((r) => (
                  <div key={r.id} className="autocomplete-item" onClick={() => {
                    setSelected1(r);
                    setQuery1(`${r.term} (${r.lang})`);
                    setShowDrop1(false);
                  }}>
                    <div className="label">{r.term} <span style={{ color: "#5c3d2e", fontSize: "0.78rem" }}>({langName(r.lang)})</span></div>
                    {r.gloss && <div className="desc">{r.gloss}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Input 2 (connect mode only) */}
          {mode === "connect" && (
            <>
              <span style={{ color: "#b0a290", fontSize: "0.8rem" }}>&rarr;</span>
              <LangSelect value={searchLang2} onChange={setSearchLang2} />
              <div className="search-input">
                <input
                  value={query2}
                  onChange={(e) => {
                    setQuery2(e.target.value);
                    setSelected2(null);
                    setShowDrop2(true);
                    if (connectResult) clearConnect();
                  }}
                  onFocus={() => { if (results2.length > 0) setShowDrop2(true); }}
                  onBlur={() => { setTimeout(() => setShowDrop2(false), 200); }}
                  placeholder="To word..."
                />
                {showDrop2 && results2.length > 0 && (
                  <div className="autocomplete-dropdown">
                    {results2.map((r) => (
                      <div key={r.id} className="autocomplete-item" onClick={() => {
                        setSelected2(r);
                        setQuery2(`${r.term} (${r.lang})`);
                        setShowDrop2(false);
                      }}>
                        <div className="label">{r.term} <span style={{ color: "#5c3d2e", fontSize: "0.78rem" }}>({langName(r.lang)})</span></div>
                        {r.gloss && <div className="desc">{r.gloss}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          <button className="go-btn" onClick={handleGo}
            disabled={loading || !selected1 || (mode === "connect" && !selected2)}>
            {loading ? "..." : mode === "trace" ? "Trace" : mode === "compare" ? "Compare" : "Connect"}
          </button>

          {/* Lineage mode buttons */}
          {mode === "trace" && (
            <>
              <button
                className="filter-btn"
                onClick={() => toggleLineage("ancestors")}
                title="Show clean ancestry chain: this word → its parent → grandparent → oldest root"
                style={{
                  background: lineageMode === "ancestors" ? "#5c3d2e" : undefined,
                  color: lineageMode === "ancestors" ? "#f5f0e8" : undefined,
                  borderColor: lineageMode === "ancestors" ? "#5c3d2e" : undefined,
                }}
              >
                Ancestors
              </button>
              <button
                className="filter-btn"
                onClick={() => toggleLineage("descendants")}
                title="Show words derived from this word (children, grandchildren...)"
                style={{
                  background: lineageMode === "descendants" ? "#5c3d2e" : undefined,
                  color: lineageMode === "descendants" ? "#f5f0e8" : undefined,
                  borderColor: lineageMode === "descendants" ? "#5c3d2e" : undefined,
                }}
              >
                Descendants
              </button>
            </>
          )}

          {/* Filter toggle */}
          <div style={{ position: "relative" }} ref={filterRef}>
            <button className="filter-btn" onClick={() => setShowFilters(!showFilters)}>
              Filters
            </button>
            {showFilters && (
              <div className="filter-panel">
                {/* Depth */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: "0.7rem", color: "#8a7b6a", textTransform: "uppercase", marginBottom: 4 }}>Depth</div>
                  <div style={{ display: "flex", gap: 4 }}>
                    {[2, 3, 4, 6].map((d) => (
                      <button key={d} onClick={() => setMaxDepth(d)} style={{
                        padding: "4px 12px", borderRadius: 4, border: `1px solid ${maxDepth === d ? "#5c3d2e" : "#d4c9b5"}`,
                        background: maxDepth === d ? "#5c3d2e" : "transparent", color: maxDepth === d ? "#f5f0e8" : "#8a7b6a",
                        fontSize: "0.75rem", cursor: "pointer",
                      }}>{d}</button>
                    ))}
                  </div>
                </div>
                {/* Max results */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: "0.7rem", color: "#8a7b6a", textTransform: "uppercase", marginBottom: 4 }}>Max results</div>
                  <div style={{ display: "flex", gap: 4 }}>
                    {[50, 100, 200].map((n) => (
                      <button key={n} onClick={() => setMaxEdges(n)} style={{
                        padding: "4px 12px", borderRadius: 4, border: `1px solid ${maxEdges === n ? "#5c3d2e" : "#d4c9b5"}`,
                        background: maxEdges === n ? "#5c3d2e" : "transparent", color: maxEdges === n ? "#f5f0e8" : "#8a7b6a",
                        fontSize: "0.75rem", cursor: "pointer",
                      }}>{n}</button>
                    ))}
                  </div>
                </div>
                {/* Relation types */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: "0.7rem", color: "#8a7b6a", textTransform: "uppercase", marginBottom: 4 }}>Relations</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {RELATION_TYPES.map((r) => (
                      <label key={r.key} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.75rem", color: activeRels.has(r.key) ? "#2c2420" : "#b0a290", cursor: "pointer" }}>
                        <input type="checkbox" checked={activeRels.has(r.key)} onChange={() => {
                          setActiveRels((p) => { const n = new Set(p); if (n.has(r.key)) n.delete(r.key); else n.add(r.key); return n; });
                        }} style={{ accentColor: r.color }} />
                        <span style={{ width: 7, height: 7, borderRadius: "50%", background: r.color, display: "inline-block" }} />
                        {r.label}
                      </label>
                    ))}
                  </div>
                </div>
                {/* Hide affixed */}
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.75rem", color: "#2c2420", cursor: "pointer" }}
                    title="Hide derived forms that are just the root word with common prefixes (un-, re-, dis-) or suffixes (-ment, -tion, -ly, -ed) attached">
                    <input type="checkbox" checked={hideAffixed} onChange={() => setHideAffixed(!hideAffixed)} style={{ accentColor: "#5c3d2e" }} />
                    Hide affixed forms (un-, re-, -ment, -tion, -ly...)
                  </label>
                </div>

                {/* Languages */}
                <div>
                  <div style={{ fontSize: "0.7rem", color: "#8a7b6a", textTransform: "uppercase", marginBottom: 4 }}>Languages</div>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {["All", ...Object.keys(LANG_PRESETS)].map((p) => (
                      <button key={p} onClick={() => setLangPreset(p)} style={{
                        padding: "3px 10px", borderRadius: 4, border: `1px solid ${langPreset === p ? "#5c3d2e" : "#d4c9b5"}`,
                        background: langPreset === p ? "#5c3d2e" : "transparent", color: langPreset === p ? "#f5f0e8" : "#8a7b6a",
                        fontSize: "0.7rem", cursor: "pointer",
                      }}>{p}</button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {hasGraph && <button className="clear-btn" onClick={handleClear}>Clear</button>}
        </div>
      </div>

      {/* ── Graph area ── */}
      <div className="graph-area">
        {compareData ? (
          <CompareView data={compareData} onWordClick={(id) => setSelectedWord(id)} />
        ) : hasGraph && lineageMode && sourceId ? (
          /* Split view: timeline on the left, graph on the right */
          <div className="split-view">
            <div className="split-timeline">
              <LineageView edges={edges} sourceId={sourceId} onWordClick={(id) => setSelectedWord(id)} />
            </div>
            <div className="split-graph">
              <GraphCanvas edges={edges} sourceId={sourceId} targetId={targetId} onNodeClick={(id) => setSelectedWord(id)} />
            </div>
          </div>
        ) : hasGraph ? (
          <GraphCanvas edges={edges} sourceId={sourceId} targetId={targetId} onNodeClick={(id) => setSelectedWord(id)} />
        ) : (
          <>
            {loading && (
              <div className="loading-overlay">
                <div className="loading-spinner" />
                <div className="loading-text">
                  {mode === "compare" ? "Comparing across language families..." : mode === "trace" ? "Tracing etymology..." : "Finding connection..."}
                </div>
                <div className="loading-subtext">22M+ relations across 5,500 languages</div>
              </div>
            )}
            {!loading && (
              <div className="empty-state">
                <TypingEffect />
                <div className="title">
                  {mode === "compare"
                    ? "See how the same word appears across language families"
                    : mode === "trace"
                    ? "Trace any word's origins across languages"
                    : "Find how two words are etymologically connected"}
                </div>
                <div className="hint">
                  {mode === "compare"
                    ? 'Try "water", "mother", or "star"'
                    : mode === "trace"
                    ? "Type a word above and hit Trace"
                    : "Search two words and hit Connect"}
                </div>
              </div>
            )}
          </>
        )}

        {selectedWord && (
          <div className="detail-overlay">
            <WordDetailPanel
              wordId={selectedWord}
              onClose={() => setSelectedWord(null)}
              onTraceFromHere={(id) => {
                setSourceId(id);
                setTargetId(null);
                setSelectedWord(null);
                setCompareData(null);
                clearConnect();
                trace(id, maxDepth, getRelsFor(lineageMode), getLangs(), maxEdges, hideAffixed, lineageMode);
              }}
            />
          </div>
        )}
      </div>

      {/* ── Bottom info bar ── */}
      <div className="info-bar">
        {error && <><span className="pill err">Error</span> {error}</>}
        {compareData && (
          <>
            <span className="pill ok">{Object.keys(compareData.families).length} families</span>
            <span className="pill ok">{Object.values(compareData.families).flat().length} cognates</span>
          </>
        )}
        {traceResult?.found && (
          <>
            <span className="pill ok">{traceResult.node_count} words</span>
            <span className="pill ok">{traceResult.edges.length} relations</span>
            <span>{traceResult.search_time_ms}ms</span>
          </>
        )}
        {connectResult?.found && (
          <>
            <span className="pill ok">{connectResult.hops} hops</span>
            <span>{connectResult.search_time_ms}ms</span>
          </>
        )}
        {connectResult && !connectResult.found && !error && (
          <span className="pill warn">No connection found. Try increasing depth.</span>
        )}
        {!error && !hasGraph && !loading && (
          <span style={{ fontStyle: "italic" }}>22.7M etymological relations from 5 datasets, 5,529 languages</span>
        )}
        <div style={{ marginLeft: "auto", display: "flex", gap: 16 }}>
          <div className="edge-legend">
            <span><span className="dot" style={{ background: "#3d2e1e" }} />oldest ancestor</span>
            <span><span className="dot" style={{ background: "#c07040" }} />searched</span>
            <span><span className="dot" style={{ background: "#7a9a6a" }} />depth 2</span>
            <span><span className="dot" style={{ background: "#9a8ab0" }} />depth 3+</span>
          </div>
          <div className="edge-legend">
            {RELATION_TYPES.filter((r) => activeRels.has(r.key)).map((r) => (
              <span key={r.key}><span className="dot" style={{ background: r.color }} />{r.label}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
