import type { CompareResult } from "../api/client";
import { langName } from "../utils/langNames";

const FAMILY_COLORS: Record<string, string> = {
  Germanic: "#5a7a5a",
  Romance: "#7a5a5a",
  Slavic: "#5a5a7a",
  Celtic: "#6a7a5a",
  "Indo-Iranian": "#7a6a5a",
  Hellenic: "#5a6a7a",
  Baltic: "#6a5a7a",
  Turkic: "#7a7a5a",
  Uralic: "#5a7a6a",
  "Sino-Tibetan": "#7a5a6a",
  Japonic: "#6a5a6a",
  Koreanic: "#5a6a6a",
  Austronesian: "#6a7a6a",
  Semitic: "#7a6a6a",
  Other: "#8a7b6a",
};

interface Props {
  data: CompareResult;
  onWordClick: (id: number) => void;
}

export function CompareView({ data, onWordClick }: Props) {
  if (!data.word) return null;

  const families = Object.entries(data.families);

  return (
    <div style={{ width: "100%", height: "100%", overflow: "auto", padding: "24px 32px" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ fontFamily: "Georgia, serif", fontSize: "2rem", fontStyle: "italic", color: "#5c3d2e" }}>
          {data.word.term}
        </div>
        <div style={{ fontSize: "0.82rem", color: "#9a8b78", fontFamily: "-apple-system, sans-serif", marginTop: 4 }}>
          ({langName(data.word.lang)}) {data.word.gloss && ` \u2014 ${data.word.gloss}`}
        </div>
        <div style={{ fontSize: "0.72rem", color: "#b0a290", marginTop: 2, fontFamily: "-apple-system, sans-serif" }}>
          Cognates across {families.length} language {families.length === 1 ? "family" : "families"}
        </div>
      </div>

      {/* Columns */}
      <div style={{
        display: "grid",
        gridTemplateColumns: `repeat(${Math.min(families.length, 4)}, 1fr)`,
        gap: 16,
        maxWidth: 1200,
        margin: "0 auto",
      }}>
        {families.map(([family, words]) => (
          <div key={family} style={{
            background: "#fffcf5",
            border: "1px solid #e0d8c8",
            borderRadius: 8,
            overflow: "hidden",
          }}>
            {/* Family header */}
            <div style={{
              padding: "10px 14px",
              borderBottom: "1px solid #e0d8c8",
              background: "#f8f4ec",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}>
              <span style={{
                width: 10, height: 10, borderRadius: "50%",
                background: FAMILY_COLORS[family] || "#8a7b6a",
                flexShrink: 0,
              }} />
              <span style={{
                fontFamily: "-apple-system, sans-serif",
                fontSize: "0.78rem",
                fontWeight: 600,
                color: "#5c3d2e",
              }}>
                {family}
              </span>
              <span style={{
                marginLeft: "auto",
                fontSize: "0.68rem",
                color: "#b0a290",
                fontFamily: "-apple-system, sans-serif",
              }}>
                {words.length}
              </span>
            </div>

            {/* Words list */}
            <div style={{ padding: "6px 0" }}>
              {words.map((w, i) => (
                <div
                  key={`${w.id}-${i}`}
                  onClick={() => onWordClick(w.id)}
                  style={{
                    padding: "7px 14px",
                    cursor: "pointer",
                    transition: "background 0.1s",
                    display: "flex",
                    alignItems: "baseline",
                    gap: 8,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f0ebe0")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <span style={{ fontFamily: "Georgia, serif", fontSize: "0.95rem", color: "#2c2420" }}>
                    {w.term}
                  </span>
                  <span style={{ fontSize: "0.7rem", color: "#9a8b78", fontFamily: "-apple-system, sans-serif" }}>
                    {langName(w.lang)}
                  </span>
                  {w.gloss && (
                    <span style={{ fontSize: "0.68rem", color: "#b0a290", fontFamily: "-apple-system, sans-serif", fontStyle: "italic" }}>
                      {w.gloss}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
