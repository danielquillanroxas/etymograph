import time
import aiosqlite

from .. import config


async def get_neighbors(db: aiosqlite.Connection, word_ids: list[int], relation_types: list[str] | None, languages: list[str] | None) -> list[dict]:
    """Get all edges connected to the given word IDs."""
    if not word_ids:
        return []

    placeholders = ",".join("?" for _ in word_ids)

    # Build optional filters
    filters = []
    params: list = list(word_ids) + list(word_ids)

    if relation_types:
        rt_ph = ",".join("?" for _ in relation_types)
        filters.append(f"AND r.relation_type IN ({rt_ph})")
        params.extend(relation_types)

    filter_sql = " ".join(filters)

    query = f"""
    SELECT r.source_word_id, r.target_word_id, r.relation_type, r.confidence, r.source_dataset,
           sw.term AS src_term, sw.lang AS src_lang,
           tw.term AS tgt_term, tw.lang AS tgt_lang
    FROM relations r
    JOIN words sw ON sw.id = r.source_word_id
    JOIN words tw ON tw.id = r.target_word_id
    WHERE (r.source_word_id IN ({placeholders}) OR r.target_word_id IN ({placeholders}))
    {filter_sql}
    LIMIT 500
    """

    rows = await db.execute_fetchall(query, params)

    results = []
    for row in rows:
        # Apply language filter on results
        if languages:
            if row["src_lang"] not in languages and row["tgt_lang"] not in languages:
                continue
        results.append(dict(row))

    return results


COMMON_PREFIXES = {"un", "re", "dis", "in", "im", "ir", "il", "non", "mis", "pre", "over", "under", "out", "anti", "de", "en", "em", "fore", "inter", "mid", "semi", "sub", "super", "trans", "co", "counter", "ex", "extra", "hyper", "infra", "macro", "mega", "micro", "mini", "mono", "multi", "neo", "poly", "post", "proto", "pseudo", "quasi", "ultra"}
COMMON_SUFFIXES = {"ed", "er", "ing", "ly", "ness", "ment", "tion", "sion", "ation", "ity", "ful", "less", "able", "ible", "ous", "ive", "al", "ial", "ical", "ish", "like", "ward", "wise", "dom", "ship", "ist", "ism", "ize", "ise", "fy", "en", "ling", "let"}


def is_affixed_form(root: str, candidate: str) -> bool:
    """Check if candidate is a trivial variant of root (affixed, compound, multi-word phrase)."""
    root_lower = root.lower().strip()
    cand_lower = candidate.lower().strip()
    if root_lower == cand_lower:
        return False

    # Multi-word phrases containing the root: "seem like", "look like", "would like"
    if " " in cand_lower and root_lower in cand_lower.split():
        return True

    # Hyphenated forms: "-like", "like-for-like"
    if "-" in cand_lower and root_lower in cand_lower.split("-"):
        return True

    # Check prefix: candidate starts with prefix + root
    for pfx in COMMON_PREFIXES:
        if cand_lower == pfx + root_lower or cand_lower == pfx + "-" + root_lower:
            return True

    # Check suffix: candidate is root + suffix
    for sfx in COMMON_SUFFIXES:
        if cand_lower == root_lower + sfx or cand_lower == root_lower.rstrip("e") + sfx:
            return True

    # Candidate contains the root as a substring (compound: motherfucker, waterfall, etc.)
    if len(cand_lower) > len(root_lower) and root_lower in cand_lower:
        return True

    return False


async def trace_lineage(db: aiosqlite.Connection, word_id: int, max_depth: int = 10) -> dict:
    """Walk the derivation chain backward: child -> parent -> grandparent. No branching."""
    start = time.time()
    all_edges: list[dict] = []
    visited: set[int] = set()
    current_id = word_id

    for _ in range(max_depth):
        if current_id in visited:
            break
        visited.add(current_id)

        # Find what this word derived/inherited FROM (parent = target of derived_from edge)
        rows = await db.execute_fetchall(
            """
            SELECT r.source_word_id, r.target_word_id, r.relation_type, r.confidence, r.source_dataset,
                   sw.term AS src_term, sw.lang AS src_lang,
                   tw.term AS tgt_term, tw.lang AS tgt_lang
            FROM relations r
            JOIN words sw ON sw.id = r.source_word_id
            JOIN words tw ON tw.id = r.target_word_id
            WHERE r.source_word_id = ?
              AND r.relation_type IN ('derived_from', 'inherited_from')
            ORDER BY r.confidence DESC
            LIMIT 5
            """,
            (current_id,),
        )

        if not rows:
            break

        # Pick the best parent (highest confidence, prefer different language)
        best = None
        current_term = None
        current_lang = None

        # Get current word info
        cur_info = await db.execute_fetchall("SELECT term, lang FROM words WHERE id = ?", (current_id,))
        if cur_info:
            current_term = cur_info[0]["term"]
            current_lang = cur_info[0]["lang"]

        for row in rows:
            edge = dict(row)
            parent_term = edge["tgt_term"]
            parent_lang = edge["tgt_lang"]
            parent_id = edge["target_word_id"]

            # Skip self-references
            if parent_id == current_id:
                continue
            if parent_id in visited:
                continue
            # Skip affixed forms pointing back
            if current_term and is_affixed_form(current_term, parent_term) and parent_lang == current_lang:
                continue

            # Prefer different language (actual etymology step) over same language
            if best is None:
                best = edge
            elif parent_lang != current_lang and dict(best)["tgt_lang"] == current_lang:
                best = edge
                break

        if best is None:
            break

        all_edges.append(dict(best))
        current_id = best["target_word_id"]

    elapsed = int((time.time() - start) * 1000)
    return {
        "found": len(all_edges) > 0,
        "edges": all_edges,
        "node_count": len(visited),
        "search_time_ms": elapsed,
    }


async def trace_descendants(db: aiosqlite.Connection, word_id: int, max_depth: int = 6, max_edges: int = 200, hide_affixed: bool = True) -> dict:
    """BFS forward: find all words derived/inherited FROM this word (children, grandchildren...)."""
    start = time.time()

    # Get root word info for affix filtering
    root_term = ""
    root_lang = ""
    row = await db.execute_fetchall("SELECT term, lang FROM words WHERE id = ?", (word_id,))
    if row:
        root_term = row[0]["term"]
        root_lang = row[0]["lang"]

    visited: set[int] = {word_id}
    frontier = [word_id]
    all_edges: list[dict] = []

    for _ in range(max_depth):
        if not frontier or len(all_edges) >= max_edges:
            break

        placeholders = ",".join("?" for _ in frontier)
        # Find words whose source derived_from/inherited_from any word in frontier
        # i.e., target_word_id is in frontier → source_word_id is the child
        rows = await db.execute_fetchall(
            f"""
            SELECT r.source_word_id, r.target_word_id, r.relation_type, r.confidence, r.source_dataset,
                   sw.term AS src_term, sw.lang AS src_lang,
                   tw.term AS tgt_term, tw.lang AS tgt_lang
            FROM relations r
            JOIN words sw ON sw.id = r.source_word_id
            JOIN words tw ON tw.id = r.target_word_id
            WHERE r.target_word_id IN ({placeholders})
              AND r.relation_type IN ('derived_from', 'inherited_from')
            LIMIT 500
            """,
            frontier,
        )

        next_frontier = []
        for row in rows:
            edge = dict(row)
            child_id = edge["source_word_id"]
            child_term = edge["src_term"]
            child_lang = edge["src_lang"]

            if child_id in visited:
                continue

            # Skip affixed forms
            if hide_affixed and root_term and child_lang == root_lang and is_affixed_form(root_term, child_term):
                continue

            all_edges.append(edge)
            visited.add(child_id)
            next_frontier.append(child_id)

            if len(all_edges) >= max_edges:
                break

        frontier = next_frontier

    elapsed = int((time.time() - start) * 1000)
    return {
        "found": len(all_edges) > 0,
        "edges": all_edges,
        "node_count": len(visited),
        "search_time_ms": elapsed,
    }


async def trace(db: aiosqlite.Connection, word_id: int, max_depth: int = 6, relation_types: list[str] | None = None, languages: list[str] | None = None, max_edges: int = 100, hide_affixed: bool = True) -> dict:
    """BFS outward from a word to build its etymology tree."""
    start = time.time()

    # Get the root word's term and lang for affix filtering
    root_term = ""
    root_lang = ""
    if hide_affixed:
        row = await db.execute_fetchall("SELECT term, lang FROM words WHERE id = ?", (word_id,))
        if row:
            root_term = row[0]["term"]
            root_lang = row[0]["lang"]

    visited: set[int] = {word_id}
    frontier = [word_id]
    all_edges: list[dict] = []

    for depth in range(max_depth):
        if not frontier:
            break
        if len(visited) > config.BFS_MAX_VISITED:
            break
        if len(all_edges) >= max_edges:
            break

        neighbors = await get_neighbors(db, frontier, relation_types, languages)
        next_frontier = []

        for edge in neighbors:
            src_id = edge["source_word_id"]
            tgt_id = edge["target_word_id"]

            # Find the "other" node
            other_id = tgt_id if src_id in visited else src_id

            # Skip affixed forms (unjudge, judgement, etc.)
            if hide_affixed and root_term and edge["relation_type"] == "derived_from":
                other_term = edge["tgt_term"] if other_id == tgt_id else edge["src_term"]
                other_lang = edge["tgt_lang"] if other_id == tgt_id else edge["src_lang"]
                if other_lang == root_lang and is_affixed_form(root_term, other_term):
                    continue

            all_edges.append(edge)

            if other_id not in visited:
                visited.add(other_id)
                next_frontier.append(other_id)

        frontier = next_frontier

    elapsed = int((time.time() - start) * 1000)
    return {
        "found": len(all_edges) > 0,
        "edges": all_edges,
        "node_count": len(visited),
        "search_time_ms": elapsed,
    }


async def connect(db: aiosqlite.Connection, source_id: int, target_id: int, max_depth: int = 8, relation_types: list[str] | None = None, languages: list[str] | None = None) -> dict:
    """Bidirectional BFS to find shortest path between two words."""
    start = time.time()

    if source_id == target_id:
        return {"found": True, "path": [], "hops": 0, "search_time_ms": 0}

    # parent maps: node_id -> (parent_id, edge_dict)
    fwd_parent: dict[int, tuple[int, dict] | None] = {source_id: None}
    bwd_parent: dict[int, tuple[int, dict] | None] = {target_id: None}

    fwd_frontier = [source_id]
    bwd_frontier = [target_id]

    meeting = None

    for depth in range(max_depth):
        if not fwd_frontier and not bwd_frontier:
            break
        if len(fwd_parent) + len(bwd_parent) > config.BFS_MAX_VISITED:
            break

        # Expand smaller frontier
        if len(fwd_frontier) <= len(bwd_frontier) and fwd_frontier:
            neighbors = await get_neighbors(db, fwd_frontier, relation_types, languages)
            next_frontier = []
            for edge in neighbors:
                src_id_e = edge["source_word_id"]
                tgt_id_e = edge["target_word_id"]
                # Determine the "other" node relative to frontier
                for node_in_frontier in [src_id_e, tgt_id_e]:
                    other = tgt_id_e if node_in_frontier == src_id_e else src_id_e
                    if node_in_frontier in fwd_parent and other not in fwd_parent:
                        fwd_parent[other] = (node_in_frontier, edge)
                        next_frontier.append(other)
                        if other in bwd_parent:
                            meeting = other
                            break
                if meeting:
                    break
            fwd_frontier = next_frontier
        elif bwd_frontier:
            neighbors = await get_neighbors(db, bwd_frontier, relation_types, languages)
            next_frontier = []
            for edge in neighbors:
                src_id_e = edge["source_word_id"]
                tgt_id_e = edge["target_word_id"]
                for node_in_frontier in [src_id_e, tgt_id_e]:
                    other = tgt_id_e if node_in_frontier == src_id_e else src_id_e
                    if node_in_frontier in bwd_parent and other not in bwd_parent:
                        bwd_parent[other] = (node_in_frontier, edge)
                        next_frontier.append(other)
                        if other in fwd_parent:
                            meeting = other
                            break
                if meeting:
                    break
            bwd_frontier = next_frontier

        if meeting:
            break

    elapsed = int((time.time() - start) * 1000)

    if not meeting:
        return {"found": False, "path": [], "hops": 0, "search_time_ms": elapsed}

    # Reconstruct path
    path_edges = []

    # Forward half: meeting -> source
    node = meeting
    fwd_edges = []
    while fwd_parent.get(node) is not None:
        parent_id, edge = fwd_parent[node]
        fwd_edges.append(edge)
        node = parent_id
    fwd_edges.reverse()
    path_edges.extend(fwd_edges)

    # Backward half: meeting -> target
    node = meeting
    while bwd_parent.get(node) is not None:
        parent_id, edge = bwd_parent[node]
        path_edges.append(edge)
        node = parent_id

    return {
        "found": True,
        "path": path_edges,
        "hops": len(path_edges),
        "search_time_ms": elapsed,
    }
