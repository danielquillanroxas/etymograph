from pathlib import Path
from typing import Iterator

from .base import BaseParser, UnifiedRecord
from ..normalize import normalize_relation, normalize_lang


class EtymologyAtlasParser(BaseParser):
    dataset_name = "etymology_atlas"

    def parse(self, raw_dir: Path) -> Iterator[UnifiedRecord]:
        try:
            import pandas as pd
        except ImportError:
            print("[etymology_atlas] pandas not installed, skipping")
            return

        fpath = raw_dir / "etymologies.parquet"
        if not fpath.exists():
            print("[etymology_atlas] etymologies.parquet not found")
            return

        print(f"[etymology_atlas] Reading {fpath}")
        # Schema: term1, lang1, lang1_name, lang1_family, term2, lang2, lang2_name, lang2_family, relationship_type, confidence, concept, sources
        df = pd.read_parquet(fpath, engine="pyarrow")
        print(f"[etymology_atlas] {len(df):,} rows")

        for row in df.itertuples(index=False):
            term1 = str(getattr(row, "term1", "")).strip()
            lang1 = normalize_lang(str(getattr(row, "lang1", "")))
            term2 = str(getattr(row, "term2", "")).strip()
            lang2 = normalize_lang(str(getattr(row, "lang2", "")))
            rel = str(getattr(row, "relationship_type", "cognate")).strip().lower()
            conf = float(getattr(row, "confidence", 0.8))
            concept = str(getattr(row, "concept", "")) or None

            if not term1 or not term2 or not lang1 or not lang2:
                continue
            if lang1 == lang2 and term1 == term2:
                continue

            yield UnifiedRecord(
                source_term=term1,
                source_lang=lang1,
                target_term=term2,
                target_lang=lang2,
                relation_type=normalize_relation(rel) if rel else "cognate",
                confidence=conf,
                source_dataset=self.dataset_name,
                concept=concept,
            )
