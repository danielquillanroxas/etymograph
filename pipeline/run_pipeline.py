#!/usr/bin/env python3
"""
Etymograph Data Pipeline
Downloads, parses, normalizes, and loads 6 etymology datasets into a unified SQLite database.
Run this once before starting the backend server.
"""
import time
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from pipeline.config import RAW_DIR, DB_PATH
from pipeline.download import download_all, download_etymology_atlas
from pipeline.loader import Loader
from pipeline.parsers.falsefriends import FalseFriendsParser
from pipeline.parsers.etymwn import EtymWnParser
from pipeline.parsers.etymdb21 import EtymDB21Parser
from pipeline.parsers.cognet import CogNetParser
from pipeline.parsers.etymology_db import EtymologyDbParser
from pipeline.parsers.etymology_atlas import EtymologyAtlasParser


def main():
    start = time.time()
    print("=" * 60)
    print("ETYMOGRAPH DATA PIPELINE")
    print("=" * 60)

    # Step 1: Download
    print("\n[1/4] Downloading datasets...")
    download_all()
    download_etymology_atlas()

    # Step 2: Delete old DB if exists
    if DB_PATH.exists():
        print(f"\n[cleanup] Removing old database: {DB_PATH}")
        DB_PATH.unlink()

    # Step 3: Parse and load each dataset
    print("\n[2/4] Parsing and loading datasets...")
    loader = Loader()

    parsers = [
        FalseFriendsParser(),
        EtymWnParser(),
        EtymDB21Parser(),
        CogNetParser(),
        EtymologyDbParser(),
        EtymologyAtlasParser(),
    ]

    total_relations = 0
    for parser in parsers:
        name = parser.dataset_name
        print(f"\n--- {name} ---")
        try:
            records = parser.parse(RAW_DIR)
            count = loader.load(records, name)
            total_relations += count
        except Exception as e:
            print(f"  ERROR parsing {name}: {e}")
            import traceback
            traceback.print_exc()

    # Step 4: Build indices and FTS
    print("\n[3/4] Building search index...")
    loader.build_fts()
    loader.update_stats()

    # Print summary
    print("\n[4/4] Summary")
    print("-" * 40)
    cur = loader.conn.execute("SELECT COUNT(*) FROM words")
    word_count = cur.fetchone()[0]
    cur = loader.conn.execute("SELECT COUNT(*) FROM relations")
    rel_count = cur.fetchone()[0]
    cur = loader.conn.execute("SELECT COUNT(DISTINCT lang) FROM words")
    lang_count = cur.fetchone()[0]

    elapsed = time.time() - start
    db_size = DB_PATH.stat().st_size / 1024 / 1024

    print(f"  Words:      {word_count:,}")
    print(f"  Relations:  {rel_count:,}")
    print(f"  Languages:  {lang_count:,}")
    print(f"  DB size:    {db_size:.1f} MB")
    print(f"  Time:       {elapsed:.1f}s")
    print(f"  Location:   {DB_PATH}")

    # Per-dataset stats
    print("\n  Per dataset:")
    for row in loader.conn.execute("SELECT * FROM dataset_stats ORDER BY relations_count DESC"):
        print(f"    {row[0]:20s} {row[1]:>10,} relations")

    loader.close()
    print("\nDone!")


if __name__ == "__main__":
    main()
