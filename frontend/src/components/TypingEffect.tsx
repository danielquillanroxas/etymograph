import { useState, useEffect } from "react";

const WORDS = [
  "water", "madre", "salary", "Wasser", "lingua",
  "brother", "nacht", "coeur", "terra", "xin",
  "kawa", "sol", "gift", "tsunami", "ubuntu",
];

export function TypingEffect() {
  const [wordIdx, setWordIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const word = WORDS[wordIdx];
    const speed = deleting ? 50 : 120;

    if (!deleting && charIdx === word.length) {
      const t = setTimeout(() => setDeleting(true), 1800);
      return () => clearTimeout(t);
    }
    if (deleting && charIdx === 0) {
      setDeleting(false);
      setWordIdx((i) => (i + 1) % WORDS.length);
      return;
    }

    const t = setTimeout(() => {
      setCharIdx((c) => c + (deleting ? -1 : 1));
    }, speed);
    return () => clearTimeout(t);
  }, [charIdx, deleting, wordIdx]);

  const word = WORDS[wordIdx];
  const display = word.slice(0, charIdx);

  return (
    <span style={{
      color: "#5c3d2e",
      fontWeight: 400,
      fontSize: "3rem",
      fontFamily: "Georgia, 'Times New Roman', serif",
      fontStyle: "italic",
      letterSpacing: "0.02em",
    }}>
      {display}
      <span style={{ opacity: 0.4, animation: "blink 1s step-end infinite", fontStyle: "normal" }}>|</span>
      <style>{`@keyframes blink { 50% { opacity: 0; } }`}</style>
    </span>
  );
}
