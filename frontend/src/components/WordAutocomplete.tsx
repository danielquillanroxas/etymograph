import { useState, useRef, useEffect } from "react";
import { useWordSearch } from "../hooks/useWordSearch";
import type { WordSearchResult } from "../types";
import { langName } from "../utils/langNames";

interface Props {
  label: string;
  onSelect: (word: WordSearchResult) => void;
  selected: WordSearchResult | null;
  accentColor: string;
}

export function WordAutocomplete({ label, onSelect, selected, accentColor }: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const { results, loading } = useWordSearch(query);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={wrapperRef} style={{ position: "relative" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: "0.6rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: accentColor, minWidth: 40 }}>{label}</span>
        <input
          className="dark-input"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search word..."
          style={{ borderColor: selected ? accentColor : undefined }}
        />
        {selected && (
          <button onClick={() => { setQuery(""); onSelect(null as unknown as WordSearchResult); }}
            style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: "0.9rem", padding: "0 2px" }}>x</button>
        )}
        {loading && <span style={{ color: "#5c3d2e", fontSize: "0.7rem" }}>...</span>}
      </div>
      {selected && (
        <div style={{ fontSize: "0.68rem", color: "#555", marginTop: 2, paddingLeft: 48 }}>
          {langName(selected.lang)} {selected.gloss ? `- ${selected.gloss}` : ""}
        </div>
      )}
      {open && results.length > 0 && (
        <div className="autocomplete-dropdown">
          {results.map((r) => (
            <div key={`${r.id}-${r.lang}`} className="autocomplete-item"
              onClick={() => { onSelect(r); setQuery(`${r.term} (${r.lang})`); setOpen(false); }}>
              <div className="label">{r.term} <span style={{ color: "#5c3d2e", fontSize: "0.75rem" }}>({langName(r.lang)})</span></div>
              <div className="desc">{r.gloss || ""}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
