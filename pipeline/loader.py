import sqlite3
from typing import Iterator

from .config import DB_PATH, BATCH_SIZE
from .parsers.base import UnifiedRecord

SCHEMA = """
CREATE TABLE IF NOT EXISTS words (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    term        TEXT NOT NULL,
    lang        TEXT NOT NULL,
    lang_name   TEXT,
    lang_family TEXT,
    gloss       TEXT,
    UNIQUE(term, lang)
);

CREATE TABLE IF NOT EXISTS relations (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    source_word_id  INTEGER NOT NULL REFERENCES words(id),
    target_word_id  INTEGER NOT NULL REFERENCES words(id),
    relation_type   TEXT NOT NULL,
    confidence      REAL DEFAULT 1.0,
    source_dataset  TEXT NOT NULL,
    concept         TEXT
);

CREATE TABLE IF NOT EXISTS dataset_stats (
    dataset_name    TEXT PRIMARY KEY,
    relations_count INTEGER NOT NULL DEFAULT 0,
    words_count     INTEGER NOT NULL DEFAULT 0,
    languages_count INTEGER NOT NULL DEFAULT 0,
    imported_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_words_term ON words(term COLLATE NOCASE);
CREATE INDEX IF NOT EXISTS idx_words_lang ON words(lang);
CREATE INDEX IF NOT EXISTS idx_relations_source ON relations(source_word_id);
CREATE INDEX IF NOT EXISTS idx_relations_target ON relations(target_word_id);
CREATE INDEX IF NOT EXISTS idx_relations_type ON relations(relation_type);
"""


class Loader:
    def __init__(self):
        DB_PATH.parent.mkdir(parents=True, exist_ok=True)
        self.conn = sqlite3.connect(str(DB_PATH))
        self.conn.execute("PRAGMA journal_mode=WAL")
        self.conn.execute("PRAGMA synchronous=NORMAL")
        self.conn.execute("PRAGMA cache_size=-200000")  # 200MB cache
        self.conn.executescript(SCHEMA)
        self.conn.commit()
        self._word_cache: dict[tuple[str, str], int] = {}

    def _get_or_create_word(self, term: str, lang: str, gloss: str | None = None) -> int:
        key = (term.lower(), lang)
        if key in self._word_cache:
            return self._word_cache[key]

        cur = self.conn.execute(
            "INSERT OR IGNORE INTO words (term, lang, gloss) VALUES (?, ?, ?)",
            (term, lang, gloss),
        )
        if cur.lastrowid and cur.lastrowid > 0:
            wid = cur.lastrowid
        else:
            row = self.conn.execute(
                "SELECT id FROM words WHERE term = ? AND lang = ?", (term, lang)
            ).fetchone()
            wid = row[0] if row else None
            if wid is None:
                return -1

        self._word_cache[key] = wid
        # Evict cache if too large (prevent memory issues)
        if len(self._word_cache) > 5_000_000:
            self._word_cache.clear()
        return wid

    def load(self, records: Iterator[UnifiedRecord], dataset_name: str) -> int:
        count = 0
        batch = []

        for rec in records:
            src_id = self._get_or_create_word(rec.source_term, rec.source_lang, rec.source_gloss)
            tgt_id = self._get_or_create_word(rec.target_term, rec.target_lang, rec.target_gloss)
            if src_id < 0 or tgt_id < 0:
                continue

            batch.append((src_id, tgt_id, rec.relation_type, rec.confidence, rec.source_dataset, rec.concept))
            count += 1

            if len(batch) >= BATCH_SIZE:
                self._flush(batch)
                batch.clear()
                if count % 500_000 == 0:
                    print(f"  [{dataset_name}] {count:,} relations loaded...")

        if batch:
            self._flush(batch)

        self.conn.commit()
        print(f"  [{dataset_name}] Done: {count:,} relations")
        return count

    def _flush(self, batch: list):
        self.conn.executemany(
            "INSERT OR IGNORE INTO relations (source_word_id, target_word_id, relation_type, confidence, source_dataset, concept) "
            "VALUES (?, ?, ?, ?, ?, ?)",
            batch,
        )
        self.conn.commit()

    def build_fts(self):
        print("[loader] Building FTS5 index...")
        self.conn.executescript("""
            DROP TABLE IF EXISTS words_fts;
            CREATE VIRTUAL TABLE words_fts USING fts5(
                term, lang, lang_name,
                content='words', content_rowid='id'
            );
            INSERT INTO words_fts(rowid, term, lang, lang_name)
                SELECT id, term, lang, lang_name FROM words;
        """)
        self.conn.commit()
        print("[loader] FTS5 index built")

    def update_stats(self):
        print("[loader] Updating dataset statistics...")
        self.conn.execute("""
            INSERT OR REPLACE INTO dataset_stats (dataset_name, relations_count, words_count, languages_count)
            SELECT
                source_dataset,
                COUNT(*),
                COUNT(DISTINCT source_word_id) + COUNT(DISTINCT target_word_id),
                0
            FROM relations GROUP BY source_dataset
        """)
        self.conn.commit()

    def close(self):
        self.conn.close()
