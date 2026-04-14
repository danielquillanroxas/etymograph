// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const graphStylesheet: any[] = [
  // ── Default node ──
  {
    selector: "node",
    style: {
      label: "data(label)",
      "background-color": "#c4a87c",
      color: "#3d2e1e",
      "text-valign": "bottom",
      "text-halign": "center",
      "text-margin-y": 10,
      width: 14, height: 14,
      "font-size": "12px",
      "font-weight": "400",
      "font-family": "Georgia, serif",
      "text-wrap": "wrap",
      "text-max-width": "120px",
      "border-width": 1.5,
      "border-color": "#a08b6e",
      "text-outline-width": 2,
      "text-outline-color": "#f5f0e8",
      "overlay-opacity": 0,
    },
  },

  // ── Searched word (what you typed): terracotta, medium ──
  { selector: "node.searched", style: {
    "background-color": "#c07040", "border-color": "#a05830", "border-width": 2,
    width: 20, height: 20, "font-size": "14px", "font-weight": "600", color: "#2c2420",
  }},

  // ── Root ancestor (oldest known source): dark brown, largest ──
  { selector: "node.root-ancestor", style: {
    "background-color": "#3d2e1e", "border-color": "#2a1f14", "border-width": 3,
    width: 28, height: 28, "font-size": "16px", "font-weight": "700", color: "#2c2420",
  }},

  // ── Target (connect mode): deep red ──
  { selector: "node.target", style: {
    "background-color": "#8b3a3a", "border-color": "#6b2a2a", "border-width": 3,
    width: 24, height: 24, "font-size": "14px", "font-weight": "700", color: "#2c2420",
  }},

  // ── Depth 1: warm terracotta ──
  { selector: "node.depth-1", style: {
    "background-color": "#c07040", "border-color": "#a05830",
    width: 16, height: 16, "font-size": "13px", color: "#2c2420",
  }},

  // ── Depth 2: muted sage ──
  { selector: "node.depth-2", style: {
    "background-color": "#7a9a6a", "border-color": "#5a7a4a",
    width: 12, height: 12, "font-size": "11px", color: "#3d4a30",
  }},

  // ── Depth 3+: pale lavender ──
  { selector: "node.depth-3", style: {
    "background-color": "#9a8ab0", "border-color": "#7a6a90",
    width: 10, height: 10, "font-size": "10px", color: "#5a4a6a",
  }},

  // ── Selected ──
  { selector: "node:selected", style: { "border-width": 3, "border-color": "#5c3d2e" } },

  // ── Default edge: very subtle ──
  {
    selector: "edge",
    style: {
      label: "data(label)",
      "curve-style": "bezier",
      "target-arrow-shape": "triangle",
      "line-color": "#d4c9b5",
      "target-arrow-color": "#d4c9b5",
      width: 0.8,
      "font-size": "8px",
      "font-family": "-apple-system, sans-serif",
      "text-rotation": "autorotate",
      "text-background-color": "#f5f0e8",
      "text-background-opacity": 0.9,
      "text-background-padding": "2px",
      color: "#b0a290",
      opacity: 0.35,
      "overlay-opacity": 0,
    },
  },

  // ── Cognate: steel blue, dashed ──
  { selector: "edge.edge-cognate", style: {
    "line-color": "#5a8aaa", "target-arrow-color": "#5a8aaa",
    width: 1.5, color: "#5a8aaa", opacity: 0.7, "line-style": "dashed", "font-size": "9px",
  }},

  // ── Borrowed: warm orange, solid ──
  { selector: "edge.edge-borrowed_from", style: {
    "line-color": "#c07040", "target-arrow-color": "#c07040",
    width: 2, color: "#c07040", opacity: 0.8, "font-size": "9px",
  }},

  // ── Derived: forest green, solid ──
  { selector: "edge.edge-derived_from", style: {
    "line-color": "#4a7a4a", "target-arrow-color": "#4a7a4a",
    width: 2, color: "#4a7a4a", opacity: 0.8, "font-size": "9px",
  }},

  // ── Inherited: deep purple, solid thick ──
  { selector: "edge.edge-inherited_from", style: {
    "line-color": "#7a5a9a", "target-arrow-color": "#7a5a9a",
    width: 2.5, color: "#7a5a9a", opacity: 0.85, "font-size": "9px",
  }},

  // ── Compound: amber, dotted ──
  { selector: "edge.edge-compound_of", style: {
    "line-color": "#b09040", "target-arrow-color": "#b09040",
    width: 1.5, color: "#b09040", opacity: 0.6, "line-style": "dotted", "font-size": "8px",
  }},

  // ── False friend: red, dashed, thick ──
  { selector: "edge.edge-false_friend", style: {
    "line-color": "#a04040", "target-arrow-color": "#a04040",
    width: 3, color: "#a04040", opacity: 0.9, "line-style": "dashed", "font-size": "9px",
  }},

  // ── Semantic shift: rose, dotted ──
  { selector: "edge.edge-semantic_shift", style: {
    "line-color": "#a06080", "target-arrow-color": "#a06080",
    width: 1.5, color: "#a06080", opacity: 0.6, "line-style": "dotted", "font-size": "8px",
  }},
];
