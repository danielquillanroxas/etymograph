from fastapi import APIRouter, Query

from ..database import get_db

router = APIRouter()


@router.get("/compare/{term}")
async def compare_word(term: str, lang: str = Query("eng"), limit: int = Query(30)):
    """Get cognates of a word grouped by language family."""
    db = await get_db()

    # Find the word
    rows = await db.execute_fetchall(
        "SELECT id, term, lang, gloss FROM words WHERE term = ? AND lang = ? LIMIT 1",
        (term, lang),
    )
    if not rows:
        # Try case-insensitive
        rows = await db.execute_fetchall(
            "SELECT id, term, lang, gloss FROM words WHERE term LIKE ? AND lang = ? LIMIT 1",
            (term, lang),
        )
    if not rows:
        return {"word": None, "families": {}}

    word = dict(rows[0])
    word_id = word["id"]

    # Get all cognates
    cognates = await db.execute_fetchall(
        """
        SELECT DISTINCT
            CASE WHEN r.source_word_id = ? THEN tw.id ELSE sw.id END AS cog_id,
            CASE WHEN r.source_word_id = ? THEN tw.term ELSE sw.term END AS cog_term,
            CASE WHEN r.source_word_id = ? THEN tw.lang ELSE sw.lang END AS cog_lang,
            CASE WHEN r.source_word_id = ? THEN tw.gloss ELSE sw.gloss END AS cog_gloss,
            r.relation_type,
            r.confidence
        FROM relations r
        JOIN words sw ON sw.id = r.source_word_id
        JOIN words tw ON tw.id = r.target_word_id
        WHERE (r.source_word_id = ? OR r.target_word_id = ?)
        ORDER BY r.confidence DESC
        LIMIT ?
        """,
        (word_id, word_id, word_id, word_id, word_id, word_id, limit * 10),
    )

    # Group by language family using simple prefix mapping
    FAMILY_MAP = {
        "Germanic": {"eng", "deu", "nld", "swe", "dan", "nor", "isl", "afr", "ang", "enm", "gmh", "goh", "non", "got", "nob", "nno", "fry", "ltz", "yid"},
        "Romance": {"fra", "spa", "ita", "por", "ron", "cat", "glg", "oci", "lat", "fro", "pro", "ast", "arg"},
        "Slavic": {"rus", "pol", "ces", "ukr", "bul", "hrv", "srp", "slv", "slk", "mkd", "bel", "bos"},
        "Celtic": {"gle", "cym", "bre", "gla", "cor", "glv"},
        "Indo-Iranian": {"hin", "urd", "fas", "san", "ben", "pan", "guj", "mar", "nep", "sin", "kur"},
        "Hellenic": {"ell", "grc"},
        "Baltic": {"lit", "lav", "ltg"},
        "Turkic": {"tur", "aze", "uzb", "kaz", "kir", "tuk", "tat"},
        "Uralic": {"fin", "hun", "est"},
        "Sino-Tibetan": {"zho", "cmn", "yue", "mya", "bod"},
        "Japonic": {"jpn"},
        "Koreanic": {"kor"},
        "Austronesian": {"msa", "ind", "tgl", "haw", "mri", "smo", "ton"},
        "Semitic": {"ara", "heb", "amh", "mlt"},
    }

    # Reverse map: lang -> family
    lang_to_family: dict[str, str] = {}
    for family, langs in FAMILY_MAP.items():
        for l in langs:
            lang_to_family[l] = family

    families: dict[str, list[dict]] = {}
    seen: set[str] = set()

    for row in cognates:
        cog_lang = row["cog_lang"]
        cog_term = row["cog_term"]
        key = f"{cog_term}:{cog_lang}"
        if key in seen:
            continue
        if cog_lang == lang and cog_term == term:
            continue
        seen.add(key)

        family = lang_to_family.get(cog_lang, "Other")
        if family not in families:
            families[family] = []
        if len(families[family]) < limit:
            families[family].append({
                "id": row["cog_id"],
                "term": cog_term,
                "lang": cog_lang,
                "gloss": row["cog_gloss"],
                "relation_type": row["relation_type"],
            })

    # Sort families by count
    sorted_families = dict(sorted(families.items(), key=lambda x: -len(x[1])))

    return {"word": word, "families": sorted_families}
