import { useState, useEffect, useRef } from "react";
import type { WordDetail } from "../types";
import { getWordDetail } from "../api/client";
import { fetchDictionary, type DictEntry } from "../api/dictionary";
import { langName } from "../utils/langNames";

interface Props {
  wordId: number | null;
  onClose: () => void;
  onTraceFromHere?: (wordId: number) => void;
}

export function WordDetailPanel({ wordId, onClose, onTraceFromHere }: Props) {
  const [detail, setDetail] = useState<WordDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [dictEntry, setDictEntry] = useState<DictEntry | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!wordId) { setDetail(null); setDictEntry(null); return; }
    let stale = false;
    setLoading(true);
    setDictEntry(null);
    getWordDetail(wordId).then((d) => {
      if (stale) return;
      setDetail(d);
      setLoading(false);
      fetchDictionary(d.term, d.lang).then((entry) => {
        if (!stale) setDictEntry(entry);
      });
    }).catch(() => {
      if (!stale) setLoading(false);
    });
    return () => { stale = true; };
  }, [wordId]);

  if (!wordId) return null;

  const phonetic = dictEntry?.phonetics.find((p) => p.text);
  const audioUrl = dictEntry?.phonetics.find((p) => p.audio)?.audio;

  return (
    <div className="detail-card">
      <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: "0.95rem", color: "#2c2420", fontFamily: "Georgia, serif" }}>{detail?.term || "..."}</div>
            <div style={{ fontSize: "0.7rem", color: "#5c3d2e" }}>
              {langName(detail?.lang || "")} {detail?.lang_family ? `/ ${detail.lang_family}` : ""}
              {phonetic?.text && <span style={{ marginLeft: 8, color: "#8a7b6a", fontFamily: "Georgia, serif" }}>{phonetic.text}</span>}
              {audioUrl && (
                <>
                  <audio ref={audioRef} src={audioUrl} />
                  <button
                    onClick={() => audioRef.current?.play()}
                    style={{
                      marginLeft: 4, background: "none", border: "none", color: "#5c3d2e",
                      cursor: "pointer", fontSize: "0.8rem", padding: "0 2px",
                    }}
                    title="Play pronunciation"
                  >
                    &#9654;
                  </button>
                </>
              )}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#8a7b6a", fontSize: "1.2rem", cursor: "pointer" }}>x</button>
        </div>
        {onTraceFromHere && wordId && (
          <button
            onClick={() => onTraceFromHere(wordId)}
            style={{
              marginTop: 8, width: "100%", padding: "7px 0", borderRadius: 4,
              border: "1px solid #5c3d2e", background: "transparent", color: "#5c3d2e",
              fontSize: "0.78rem", fontFamily: "-apple-system, sans-serif", cursor: "pointer",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#5c3d2e"; e.currentTarget.style.color = "#f5f0e8"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#5c3d2e"; }}
          >
            Trace from this word
          </button>
        )}
      </div>

      {loading && <div style={{ padding: 20, color: "#8a7b6a", textAlign: "center", fontSize: "0.85rem" }}>Loading...</div>}

      <div style={{ overflow: "auto", flex: 1 }}>
        {detail?.gloss && (
          <div style={{ padding: "12px 16px", fontSize: "0.82rem", color: "#5a4b3a", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
            {detail.gloss}
          </div>
        )}

        {/* Dictionary definitions */}
        {dictEntry && dictEntry.meanings.length > 0 && (
          <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(0,0,0,0.06)", animation: "fadeInUp 0.3s ease" }}>
            <div style={{ fontWeight: 600, fontSize: "0.7rem", color: "#8a7b6a", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
              Definitions
            </div>
            {dictEntry.meanings.slice(0, 2).map((m, mi) => (
              <div key={mi} style={{ marginBottom: mi < Math.min(dictEntry.meanings.length, 2) - 1 ? 10 : 0 }}>
                <div style={{ fontStyle: "italic", color: "#5c3d2e", fontSize: "0.78rem", fontFamily: "Georgia, serif", marginBottom: 4 }}>
                  {m.partOfSpeech}
                </div>
                {m.definitions.slice(0, 3).map((d, di) => (
                  <div key={di} style={{ marginBottom: 6, paddingLeft: 10 }}>
                    <div style={{ fontSize: "0.78rem", color: "#5a4b3a" }}>
                      <span style={{ color: "#b0a290", marginRight: 6 }}>{di + 1}.</span>
                      {d.definition}
                    </div>
                    {d.example && (
                      <div style={{
                        fontSize: "0.74rem", color: "#9a8b78", fontStyle: "italic",
                        marginTop: 2, paddingLeft: 8, borderLeft: "2px solid #e0d8c8",
                      }}>
                        "{d.example}"
                      </div>
                    )}
                  </div>
                ))}
                {m.definitions.length > 3 && (
                  <div style={{ fontSize: "0.68rem", color: "#b0a290", paddingLeft: 10 }}>+{m.definitions.length - 3} more</div>
                )}
              </div>
            ))}
            {dictEntry.meanings.length > 2 && (
              <div style={{ fontSize: "0.68rem", color: "#b0a290", marginTop: 4 }}>+{dictEntry.meanings.length - 2} more parts of speech</div>
            )}
          </div>
        )}

        {detail && detail.relations.length > 0 && (
          <div style={{ padding: "12px 16px" }}>
            <div style={{ fontWeight: 600, fontSize: "0.7rem", color: "#8a7b6a", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
              Connections ({detail.relations.length}) {detail.cognate_count > 0 && `/ ${detail.cognate_count} cognates`}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {detail.relations.slice(0, 30).map((r, i) => {
                const other = r.source_id === wordId
                  ? { term: r.target_term, lang: r.target_lang }
                  : { term: r.source_term, lang: r.source_lang };
                return (
                  <div key={i} style={{ display: "flex", gap: 8, alignItems: "baseline", fontSize: "0.78rem", padding: "3px 0", borderBottom: "1px solid rgba(0,0,0,0.03)" }}>
                    <span style={{ color: "#8a7b6a", minWidth: 80, flexShrink: 0, fontSize: "0.7rem" }}>{r.relation_type.replace(/_/g, " ")}</span>
                    <span style={{ color: "#5c3d2e" }}>{other.term}</span>
                    <span style={{ color: "#9a8b78", fontSize: "0.68rem" }}>({langName(other.lang)})</span>
                  </div>
                );
              })}
              {detail.relations.length > 30 && <div style={{ color: "#b0a290", fontSize: "0.72rem" }}>+{detail.relations.length - 30} more</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
