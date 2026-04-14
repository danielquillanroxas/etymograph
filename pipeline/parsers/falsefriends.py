from pathlib import Path
from typing import Iterator

from .base import BaseParser, UnifiedRecord
from ..normalize import normalize_relation


class FalseFriendsParser(BaseParser):
    dataset_name = "falsefriends"

    def parse(self, raw_dir: Path) -> Iterator[UnifiedRecord]:
        for fname in raw_dir.glob("falsefriends*"):
            # Determine language pair from filename
            lang2 = "eng"
            if "_EN" in fname.name.upper():
                lang2 = "eng"
            elif "_FR" in fname.name.upper():
                lang2 = "fra"

            with open(fname, encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if not line or line.startswith("#"):
                        continue
                    parts = line.split("\t")
                    if len(parts) < 3:
                        continue
                    label, word1, word2 = parts[0].strip(), parts[1].strip(), parts[2].strip()
                    if not word1 or not word2:
                        continue
                    yield UnifiedRecord(
                        source_term=word1,
                        source_lang="ita",
                        target_term=word2,
                        target_lang=lang2,
                        relation_type=normalize_relation(label),
                        confidence=1.0,
                        source_dataset=self.dataset_name,
                    )
