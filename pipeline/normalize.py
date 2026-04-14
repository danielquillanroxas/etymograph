from .config import RELATION_MAP, LANG_CODE_MAP


def normalize_relation(raw: str) -> str:
    raw = raw.strip().lower()
    return RELATION_MAP.get(raw, "derived_from")


def normalize_lang(code: str) -> str:
    code = code.strip().lower()
    if len(code) == 3:
        return code
    return LANG_CODE_MAP.get(code, code)
