from pathlib import Path
from typing import Iterator

from .base import BaseParser, UnifiedRecord
from ..normalize import normalize_relation, normalize_lang


class EtymDB21Parser(BaseParser):
    dataset_name = "etymdb21"

    def parse(self, raw_dir: Path) -> Iterator[UnifiedRecord]:
        values_path = raw_dir / "etymdb_values.csv"
        links_path = raw_dir / "etymdb_links_info.csv"
        if not values_path.exists() or not links_path.exists():
            print(f"[etymdb21] Missing files: values={values_path.exists()} links={links_path.exists()}")
            return

        # Load word index: ix -> (lang, lexeme, gloss)
        # Format: word_ix TAB lang TAB ? TAB lexeme TAB gloss (no header, tab-separated)
        words: dict[str, tuple[str, str, str]] = {}
        with open(values_path, encoding="utf-8", errors="replace") as f:
            for line in f:
                parts = line.strip().split("\t")
                if len(parts) < 4:
                    continue
                ix = parts[0].strip()
                lang = normalize_lang(parts[1].strip())
                lexeme = parts[3].strip() if len(parts) > 3 else ""
                gloss = parts[4].strip() if len(parts) > 4 else ""
                if ix and lang and lexeme:
                    words[ix] = (lang, lexeme, gloss)

        print(f"[etymdb21] Loaded {len(words):,} words from values file")

        # Parse links: rel_type TAB child_ix TAB parent_ix (no header, tab-separated)
        count = 0
        with open(links_path, encoding="utf-8", errors="replace") as f:
            for line in f:
                parts = line.strip().split("\t")
                if len(parts) < 3:
                    continue
                rel_raw = parts[0].strip()
                child_ix = parts[1].strip()
                parent_ix = parts[2].strip()

                if child_ix not in words or parent_ix not in words:
                    continue

                child_lang, child_word, child_gloss = words[child_ix]
                parent_lang, parent_word, parent_gloss = words[parent_ix]

                if not child_word or not parent_word:
                    continue

                count += 1
                yield UnifiedRecord(
                    source_term=child_word,
                    source_lang=child_lang,
                    target_term=parent_word,
                    target_lang=parent_lang,
                    relation_type=normalize_relation(rel_raw),
                    confidence=0.9,
                    source_dataset=self.dataset_name,
                    source_gloss=child_gloss or None,
                    target_gloss=parent_gloss or None,
                )

        print(f"[etymdb21] Parsed {count:,} links")
