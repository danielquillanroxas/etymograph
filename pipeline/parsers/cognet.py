from pathlib import Path
from typing import Iterator

from .base import BaseParser, UnifiedRecord
from ..normalize import normalize_lang


class CogNetParser(BaseParser):
    dataset_name = "cognet"

    def parse(self, raw_dir: Path) -> Iterator[UnifiedRecord]:
        fpath = raw_dir / "cognet.tsv"
        if not fpath.exists():
            return

        with open(fpath, encoding="utf-8", errors="replace") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#") or line.startswith("concept"):
                    continue
                parts = line.split("\t")
                if len(parts) < 5:
                    continue

                concept_id = parts[0].strip()
                lang1 = normalize_lang(parts[1].strip())
                word1 = parts[2].strip()
                lang2 = normalize_lang(parts[3].strip())
                word2 = parts[4].strip()

                if not word1 or not word2 or not lang1 or not lang2:
                    continue
                if lang1 == lang2 and word1 == word2:
                    continue

                yield UnifiedRecord(
                    source_term=word1,
                    source_lang=lang1,
                    target_term=word2,
                    target_lang=lang2,
                    relation_type="cognate",
                    confidence=0.94,
                    source_dataset=self.dataset_name,
                    concept=concept_id,
                )
