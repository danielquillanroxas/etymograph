from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
RAW_DIR = PROJECT_ROOT / "data" / "raw"
DB_PATH = PROJECT_ROOT / "data" / "etymograph.db"

BATCH_SIZE = 50_000

# Dataset download URLs
DATASETS = {
    "falsefriends": {
        "url": "https://raw.githubusercontent.com/dhfbk/falsefriends/master/dataset/test_EN.txt",
        "filename": "falsefriends_en.txt",
    },
    "etymwn": {
        "url": "https://archive.org/download/etymwn-20130208/etymwn.tsv.gz",
        "filename": "etymwn.tsv.gz",
    },
    "etymdb_values": {
        "url": "https://raw.githubusercontent.com/clefourrier/EtymDB/master/EtymDB_2.1/etymdb_values.csv",
        "filename": "etymdb_values.csv",
    },
    "etymdb_links": {
        "url": "https://raw.githubusercontent.com/clefourrier/EtymDB/master/EtymDB_2.1/etymdb_links_info.csv",
        "filename": "etymdb_links_info.csv",
    },
    "cognet": {
        "url": "https://raw.githubusercontent.com/kbatsuren/CogNet/master/cognet-v2.0.tsv",
        "filename": "cognet.tsv",
    },
    # droher/etymology-db: Parquet hosted on OneDrive
    "etymology_db": {
        "url": "https://1drv.ms/u/s!AtpEocFNRNBWhAe7co0JFvac-OfA?e=wnJe4r",
        "filename": "etymology_db.csv.gz",
        # Fallback: use the GitHub repo directly
        "github_repo": "droher/etymology-db",
    },
}

# Relation type normalization mapping
RELATION_MAP = {
    # Etymological Wordnet
    "rel:etymologically_related": "cognate",
    "rel:etymology": "derived_from",
    "rel:is_derived_from": "derived_from",
    "rel:has_derived_form": "derived_from",  # reversed direction
    "rel:etymological_origin_of": "derived_from",  # reversed direction
    "rel:variant:orthography": "cognate",
    # Etymology Atlas + droher/etymology-db
    "other": "cognate",  # Etymology Atlas "other" = unspecified relation
    "inherited": "inherited_from",
    "borrowed": "borrowed_from",
    "derived": "derived_from",
    "cognate": "cognate",
    "learned_borrowing": "borrowed_from",
    "semi_learned_borrowing": "borrowed_from",
    "calque": "borrowed_from",
    "semantic_loan": "semantic_shift",
    "phono_semantic_matching": "borrowed_from",
    "transliteration": "borrowed_from",
    "back_formation": "derived_from",
    "abbreviation": "derived_from",
    "clipping": "derived_from",
    "blend": "compound_of",
    "compound": "compound_of",
    "affix": "derived_from",
    "prefix": "derived_from",
    "suffix": "derived_from",
    "infix": "derived_from",
    "circumfix": "derived_from",
    "confix": "derived_from",
    "univerbation": "compound_of",
    "surface_analysis": "compound_of",
    "doublet": "cognate",
    "onomatopoeia": "derived_from",
    "root": "derived_from",
    "mention": "cognate",
    "named_after": "derived_from",
    "piecewise_doublet": "cognate",
    "undefined": "derived_from",
    # EtymDB 2.1 (short codes in links file)
    "der": "derived_from",
    "inh": "inherited_from",
    "bor": "borrowed_from",
    "lbor": "borrowed_from",
    "slbor": "borrowed_from",
    "cal": "borrowed_from",
    "obor": "borrowed_from",
    "psm": "borrowed_from",
    "etymology": "derived_from",
    "derivation": "derived_from",
    "inheritance": "inherited_from",
    "borrowing": "borrowed_from",
    # CogNet: all are cognates
    # falsefriends
    "ff": "false_friend",
    "co": "cognate",
}

# ISO 639-1 to 639-3 common mappings
LANG_CODE_MAP = {
    "en": "eng", "fr": "fra", "de": "deu", "es": "spa", "it": "ita",
    "pt": "por", "ru": "rus", "ja": "jpn", "zh": "zho", "ko": "kor",
    "ar": "ara", "hi": "hin", "tr": "tur", "nl": "nld", "pl": "pol",
    "sv": "swe", "da": "dan", "no": "nor", "fi": "fin", "el": "ell",
    "he": "heb", "la": "lat", "grc": "grc", "sa": "san", "fa": "fas",
    "uk": "ukr", "cs": "ces", "ro": "ron", "hu": "hun", "bg": "bul",
    "hr": "hrv", "sr": "srp", "sk": "slk", "sl": "slv", "lt": "lit",
    "lv": "lav", "et": "est", "ga": "gle", "cy": "cym", "eu": "eus",
    "ca": "cat", "gl": "glg", "sq": "sqi", "mk": "mkd", "bs": "bos",
    "is": "isl", "mt": "mlt", "vi": "vie", "th": "tha", "id": "ind",
    "ms": "msa", "tl": "tgl", "sw": "swa", "zu": "zul", "af": "afr",
    "am": "amh", "bn": "ben", "ta": "tam", "te": "tel", "ml": "mal",
    "kn": "kan", "gu": "guj", "mr": "mar", "pa": "pan", "ur": "urd",
    "ne": "nep", "si": "sin", "my": "mya", "km": "khm", "lo": "lao",
    "ka": "kat", "hy": "hye", "az": "aze", "uz": "uzb", "kk": "kaz",
    "ky": "kir", "tg": "tgk", "mn": "mon", "bo": "bod",
    "ang": "ang", "enm": "enm", "fro": "fro", "gmh": "gmh",
    "goh": "goh", "non": "non", "osp": "osp", "pro": "pro",
    "VL.": "lat", "LL.": "lat", "ML.": "lat",
}
