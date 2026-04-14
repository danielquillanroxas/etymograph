import gzip
from pathlib import Path
from typing import Iterator

from .base import BaseParser, UnifiedRecord
from ..normalize import normalize_relation, normalize_lang


class EtymWnParser(BaseParser):
    dataset_name = "etymwn"

    def _parse_lang_word(self, token: str) -> tuple[str, str]:
        # Format: "lang: word" or "lang:word"
        if ": " in token:
            lang, word = token.split(": ", 1)
        elif ":" in token:
            lang, word = token.split(":", 1)
        else:
            return "", token
        return normalize_lang(lang.strip()), word.strip()

    def parse(self, raw_dir: Path) -> Iterator[UnifiedRecord]:
        fpath = raw_dir / "etymwn.tsv.gz"
        if not fpath.exists():
            fpath = raw_dir / "etymwn.tsv"
            if not fpath.exists():
                return

        opener = gzip.open if fpath.suffix == ".gz" else open
        with opener(fpath, "rt", encoding="utf-8", errors="replace") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                parts = line.split("\t")
                if len(parts) < 3:
                    continue

                src_lang, src_word = self._parse_lang_word(parts[0])
                rel_type = normalize_relation(parts[1])
                tgt_lang, tgt_word = self._parse_lang_word(parts[2])

                if not src_word or not tgt_word or not src_lang or not tgt_lang:
                    continue

                # Handle reversed relations
                if parts[1].strip() in ("rel:has_derived_form", "rel:etymological_origin_of"):
                    src_lang, src_word, tgt_lang, tgt_word = tgt_lang, tgt_word, src_lang, src_word

                yield UnifiedRecord(
                    source_term=src_word,
                    source_lang=src_lang,
                    target_term=tgt_word,
                    target_lang=tgt_lang,
                    relation_type=rel_type,
                    confidence=0.8,
                    source_dataset=self.dataset_name,
                )
