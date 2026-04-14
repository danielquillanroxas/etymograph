import gzip
import csv
from pathlib import Path
from typing import Iterator

from .base import BaseParser, UnifiedRecord
from ..normalize import normalize_relation, normalize_lang


class EtymologyDbParser(BaseParser):
    dataset_name = "etymology_db"

    def parse(self, raw_dir: Path) -> Iterator[UnifiedRecord]:
        # Try gzipped CSV first, then plain CSV
        fpath = raw_dir / "etymology_db.csv.gz"
        if not fpath.exists():
            fpath = raw_dir / "etymology_db.csv"
            if not fpath.exists():
                # Try parquet
                fpath = raw_dir / "etymology_db.parquet"
                if fpath.exists():
                    yield from self._parse_parquet(fpath)
                return

        opener = gzip.open if fpath.suffix == ".gz" else open
        with opener(fpath, "rt", encoding="utf-8", errors="replace") as f:
            reader = csv.DictReader(f)
            for row in reader:
                src_term = (row.get("term") or "").strip()
                src_lang = normalize_lang(row.get("lang") or "")
                tgt_term = (row.get("related_term") or "").strip()
                tgt_lang = normalize_lang(row.get("related_lang") or "")
                rel_raw = (row.get("reltype") or "").strip()

                if not src_term or not tgt_term or not src_lang or not tgt_lang:
                    continue

                yield UnifiedRecord(
                    source_term=src_term,
                    source_lang=src_lang,
                    target_term=tgt_term,
                    target_lang=tgt_lang,
                    relation_type=normalize_relation(rel_raw),
                    confidence=0.85,
                    source_dataset=self.dataset_name,
                )

    def _parse_parquet(self, fpath: Path) -> Iterator[UnifiedRecord]:
        try:
            import pandas as pd
            for chunk in pd.read_parquet(fpath, engine="pyarrow").itertuples():
                src_term = str(getattr(chunk, "term", "")).strip()
                src_lang = normalize_lang(str(getattr(chunk, "lang", "")))
                tgt_term = str(getattr(chunk, "related_term", "")).strip()
                tgt_lang = normalize_lang(str(getattr(chunk, "related_lang", "")))
                rel_raw = str(getattr(chunk, "reltype", "")).strip()

                if not src_term or not tgt_term or not src_lang or not tgt_lang:
                    continue

                yield UnifiedRecord(
                    source_term=src_term,
                    source_lang=src_lang,
                    target_term=tgt_term,
                    target_lang=tgt_lang,
                    relation_type=normalize_relation(rel_raw),
                    confidence=0.85,
                    source_dataset=self.dataset_name,
                )
        except ImportError:
            print("[etymology_db] pandas/pyarrow not installed, skipping parquet")
