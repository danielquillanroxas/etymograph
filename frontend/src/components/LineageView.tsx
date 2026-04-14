import { useMemo } from "react";
import type { GraphEdge } from "../types";
import { langName } from "../utils/langNames";

interface Props {
  edges: GraphEdge[];
  sourceId: number;
  onWordClick: (id: number) => void;
}

const REL_COLORS: Record<string, string> = {
  derived_from: "#5a8a5a",
  inherited_from: "#8a6baa",
  borrowed_from: "#c07040",
  cognate: "#6b8fa3",
  compound_of: "#b09040",
  false_friend: "#a04040",
  semantic_shift: "#a06080",
};

export function LineageView({ edges, sourceId, onWordClick }: Props) {
  // Build a tree structure: for each node, find its parent (what it derived/inherited FROM)
  const { chain, branches } = useMemo(() => {
    // Collect all unique words
    const words = new Map<number, { term: string; lang: string }>();
    const childToParent = new Map<number, { parentId: number; rel: string }>();

    for (const e of edges) {
      words.set(e.source_id, { term: e.source_term, lang: e.source_lang });
      words.set(e.target_id, { term: e.target_term, lang: e.target_lang });

      // derived_from / inherited_from: source derived FROM target
      // So target is the parent (older word)
      if (e.relation_type === "derived_from" || e.relation_type === "inherited_from") {
        childToParent.set(e.source_id, { parentId: e.target_id, rel: e.relation_type });
      }
    }

    // Build the main ancestry chain: start from sourceId, walk up to oldest ancestor
    const chain: { id: number; term: string; lang: string; rel: string }[] = [];
    let current = sourceId;
    const visited = new Set<number>();

    while (current && !visited.has(current)) {
      visited.add(current);
      const w = words.get(current);
      if (!w) break;

      const parentInfo = childToParent.get(current);
      chain.push({
        id: current,
        term: w.term,
        lang: w.lang,
        rel: parentInfo?.rel || "",
      });
      if (!parentInfo) break;
      current = parentInfo.parentId;
    }

    // Collect branches: words that derive FROM any node in the chain (but aren't in the chain)
    const chainIds = new Set(chain.map((c) => c.id));
    const branches = new Map<number, { id: number; term: string; lang: string; rel: string }[]>();

    const seenBranch = new Set<string>();
    for (const e of edges) {
      // target is in chain, source derives from it, source is NOT in chain
      if (chainIds.has(e.target_id) && !chainIds.has(e.source_id)) {
        const key = `${e.target_id}-${e.source_id}`;
        if (seenBranch.has(key)) continue;
        seenBranch.add(key);
        const w = words.get(e.source_id);
        if (!w) continue;
        if (!branches.has(e.target_id)) branches.set(e.target_id, []);
        branches.get(e.target_id)!.push({
          id: e.source_id,
          term: w.term,
          lang: w.lang,
          rel: e.relation_type,
        });
      }
    }

    return { chain, branches };
  }, [edges, sourceId]);

  if (chain.length === 0) return null;

  return (
    <div style={{ width: "100%", height: "100%", overflow: "auto", display: "flex", justifyContent: "center", padding: "40px 20px" }}>
      <div style={{ maxWidth: 600, width: "100%" }}>
        {/* Title */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontFamily: "Georgia, serif", fontSize: "0.82rem", color: "#9a8b78", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Etymology of
          </div>
          <div style={{ fontFamily: "Georgia, serif", fontSize: "2.2rem", fontStyle: "italic", color: "#5c3d2e", marginTop: 4 }}>
            {chain[0].term}
          </div>
          <div style={{ fontSize: "0.82rem", color: "#9a8b78", fontFamily: "-apple-system, sans-serif" }}>
            {langName(chain[0].lang)}
          </div>
        </div>

        {/* Timeline */}
        <div style={{ position: "relative", paddingLeft: 32 }}>
          {/* Vertical line */}
          <div style={{
            position: "absolute", left: 11, top: 0, bottom: 0, width: 2,
            background: "linear-gradient(to bottom, #5c3d2e, #d4c9b5)",
          }} />

          {chain.map((node, i) => {
            const isFirst = i === 0;
            const isLast = i === chain.length - 1;
            const nodeBranches = branches.get(node.id) || [];

            return (
              <div key={node.id} style={{ position: "relative", marginBottom: i < chain.length - 1 ? 0 : 0 }}>
                {/* Node dot */}
                <div style={{
                  position: "absolute", left: -26, top: 4,
                  width: isFirst ? 16 : 10, height: isFirst ? 16 : 10,
                  borderRadius: "50%",
                  background: isFirst ? "#5c3d2e" : "#a08b6e",
                  border: isFirst ? "3px solid #3d2e1e" : "2px solid #c4b8a4",
                  marginLeft: isFirst ? -3 : 0,
                }} />

                {/* Word card */}
                <div
                  onClick={() => onWordClick(node.id)}
                  style={{
                    padding: "12px 16px",
                    marginBottom: 8,
                    background: isFirst ? "#fffcf5" : "transparent",
                    border: isFirst ? "1px solid #d4c9b5" : "1px solid transparent",
                    borderRadius: 6,
                    cursor: "pointer",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => { if (!isFirst) e.currentTarget.style.background = "#f0ebe0"; }}
                  onMouseLeave={(e) => { if (!isFirst) e.currentTarget.style.background = "transparent"; }}
                >
                  <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                    <span style={{ fontFamily: "Georgia, serif", fontSize: isFirst ? "1.3rem" : "1.1rem", color: "#2c2420", fontWeight: isFirst ? 600 : 400 }}>
                      {node.term}
                    </span>
                    <span style={{ fontSize: "0.78rem", color: "#5c3d2e", fontFamily: "-apple-system, sans-serif" }}>
                      {langName(node.lang)}
                    </span>
                  </div>

                  {/* Relation arrow to next */}
                  {i < chain.length - 1 && (
                    <div style={{ fontSize: "0.7rem", color: REL_COLORS[chain[i + 1]?.rel] || "#9a8b78", marginTop: 4, fontFamily: "-apple-system, sans-serif" }}>
                      &darr; {(node.rel || chain[i]?.rel || "").replace(/_/g, " ")}
                    </div>
                  )}
                  {isLast && chain.length > 1 && (
                    <div style={{ fontSize: "0.7rem", color: "#9a8b78", marginTop: 4, fontStyle: "italic", fontFamily: "-apple-system, sans-serif" }}>
                      oldest known ancestor
                    </div>
                  )}
                </div>

                {/* Branches (other words derived from this ancestor) */}
                {nodeBranches.length > 0 && (
                  <div style={{ marginLeft: 20, marginBottom: 12, paddingLeft: 16, borderLeft: "1px dashed #d4c9b5" }}>
                    <div style={{ fontSize: "0.68rem", color: "#9a8b78", marginBottom: 4, fontFamily: "-apple-system, sans-serif" }}>
                      also from this root:
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {nodeBranches.slice(0, 12).map((b) => (
                        <span
                          key={b.id}
                          onClick={(e) => { e.stopPropagation(); onWordClick(b.id); }}
                          style={{
                            padding: "3px 10px", borderRadius: 4,
                            background: "#f0ebe0", border: "1px solid #e0d8c8",
                            fontFamily: "Georgia, serif", fontSize: "0.85rem", color: "#2c2420",
                            cursor: "pointer", transition: "background 0.1s",
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = "#e0d8c8"}
                          onMouseLeave={(e) => e.currentTarget.style.background = "#f0ebe0"}
                        >
                          {b.term} <span style={{ fontSize: "0.68rem", color: "#9a8b78" }}>({langName(b.lang)})</span>
                        </span>
                      ))}
                      {nodeBranches.length > 12 && (
                        <span style={{ fontSize: "0.72rem", color: "#b0a290", padding: "3px 6px" }}>
                          +{nodeBranches.length - 12} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
