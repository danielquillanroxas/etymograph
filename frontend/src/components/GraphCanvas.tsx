import { useEffect, useRef, useCallback } from "react";
import cytoscape from "cytoscape";
import type { GraphEdge } from "../types";
import { graphStylesheet } from "../styles/graph";
import { langName } from "../utils/langNames";

interface Props {
  edges: GraphEdge[];
  sourceId: number | null;
  targetId: number | null;
  lineageMode?: boolean;
  onNodeClick: (id: number, term: string, lang: string) => void;
}

export function GraphCanvas({ edges, sourceId, targetId, lineageMode, onNodeClick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);

  const buildElements = useCallback(() => {
    // Collect all words and edges
    const wordInfo = new Map<number, { term: string; lang: string }>();
    const adjacency = new Map<number, Set<number>>();
    const cyEdges: { id: string; source: string; target: string; label: string; classes: string }[] = [];

    for (const e of edges) {
      wordInfo.set(e.source_id, { term: e.source_term, lang: e.source_lang });
      wordInfo.set(e.target_id, { term: e.target_term, lang: e.target_lang });

      if (!adjacency.has(e.source_id)) adjacency.set(e.source_id, new Set());
      if (!adjacency.has(e.target_id)) adjacency.set(e.target_id, new Set());
      adjacency.get(e.source_id)!.add(e.target_id);
      adjacency.get(e.target_id)!.add(e.source_id);

      const edgeId = `${e.source_id}-${e.relation_type}-${e.target_id}`;
      if (!cyEdges.find((x) => x.id === edgeId)) {
        cyEdges.push({
          id: edgeId,
          source: String(e.source_id),
          target: String(e.target_id),
          label: e.relation_type.replace(/_/g, " "),
          classes: `edge-${e.relation_type}`,
        });
      }
    }

    // BFS to compute depth from source
    const depths = new Map<number, number>();
    if (sourceId && wordInfo.has(sourceId)) {
      const queue = [sourceId];
      depths.set(sourceId, 0);
      while (queue.length > 0) {
        const current = queue.shift()!;
        const d = depths.get(current)!;
        for (const neighbor of adjacency.get(current) || []) {
          if (!depths.has(neighbor)) {
            depths.set(neighbor, d + 1);
            queue.push(neighbor);
          }
        }
      }
    }

    // Find the deepest node (oldest ancestor)
    let maxDepth = 0;
    let deepestId: number | null = null;
    for (const [id, d] of depths) {
      if (d > maxDepth) { maxDepth = d; deepestId = id; }
    }

    // Build nodes with depth-based classes
    const nodes = Array.from(wordInfo.entries()).map(([id, w]) => {
      const depth = depths.get(id) ?? 99;
      let cls = "";
      if (id === deepestId && maxDepth > 0) cls = "root-ancestor"; // oldest ancestor = biggest, darkest
      else if (id === sourceId) cls = "searched"; // the word you typed
      else if (id === targetId) cls = "target";
      else if (depth === 1) cls = "depth-1";
      else if (depth === 2) cls = "depth-2";
      else cls = "depth-3";

      return {
        data: { id: String(id), label: `${w.term}\n(${langName(w.lang)})`, depth },
        classes: cls,
      };
    });

    return {
      nodes,
      edges: cyEdges.map((e) => ({
        data: { id: e.id, source: e.source, target: e.target, label: e.label },
        classes: e.classes,
      })),
    };
  }, [edges, sourceId, targetId]);

  useEffect(() => {
    if (!containerRef.current) return;
    const elements = buildElements();
    if (elements.nodes.length === 0) {
      cyRef.current?.destroy();
      cyRef.current = null;
      return;
    }

    cyRef.current?.destroy();

    // Connect mode: tree. Trace mode: force-directed but with good spacing
    const layout = targetId
      ? {
          name: "breadthfirst",
          directed: true,
          roots: sourceId ? [`#${sourceId}`] : undefined,
          spacingFactor: 1.8,
          animate: true,
          animationDuration: 600,
          nodeDimensionsIncludeLabels: true,
          padding: 60,
        }
      : {
          name: "cose",
          animate: true,
          animationDuration: 800,
          nodeDimensionsIncludeLabels: true,
          nodeRepulsion: () => 12000,
          idealEdgeLength: () => 140,
          gravity: 0.25,
          numIter: 1500,
          padding: 60,
        };

    const cy = cytoscape({
      container: containerRef.current,
      elements: [...elements.nodes, ...elements.edges],
      style: graphStylesheet,
      layout: layout as unknown as cytoscape.LayoutOptions,
      minZoom: 0.15,
      maxZoom: 3,
      wheelSensitivity: 0.3,
    });

    // Animate nodes fading in
    cy.nodes().style("opacity", 0);
    cy.edges().style("opacity", 0);
    cy.nodes().animate({ style: { opacity: 1 } }, { duration: 400, easing: "ease-in-out-quad" });
    setTimeout(() => {
      cy.edges().animate({ style: { opacity: 1 } }, { duration: 300, easing: "ease-in-out-quad" });
    }, 200);

    cy.on("tap", "node", (e) => {
      const n = e.target;
      const label = (n.data("label") || "").split("\n")[0];
      const lang = (n.data("label") || "").match(/\((\w+)\)/)?.[1] || "";
      onNodeClick(Number(n.id()), label, lang);
    });

    // Fit to viewport with padding
    cy.on("layoutstop", () => {
      cy.fit(undefined, 40);
    });

    cyRef.current = cy;
    return () => { cy.destroy(); cyRef.current = null; };
  }, [buildElements, onNodeClick, sourceId, targetId, lineageMode]);

  return <div ref={containerRef} style={{ width: "100%", height: "100%", background: "#f5f0e8" }} />;
}
