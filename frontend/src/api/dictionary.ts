const LANG_MAP: Record<string, string> = {
  eng: "en",
  spa: "es",
  fra: "fr",
  deu: "de",
  ita: "it",
  por: "pt-BR",
  rus: "ru",
  hin: "hi",
  jpn: "ja",
  kor: "ko",
  ara: "ar",
  tur: "tr",
};

export interface DictPhonetic {
  text?: string;
  audio?: string;
}

export interface DictDefinition {
  definition: string;
  example?: string;
  synonyms?: string[];
}

export interface DictMeaning {
  partOfSpeech: string;
  definitions: DictDefinition[];
}

export interface DictEntry {
  word: string;
  phonetics: DictPhonetic[];
  meanings: DictMeaning[];
}

export async function fetchDictionary(
  term: string,
  langIso3: string,
): Promise<DictEntry | null> {
  try {
    const dictLang = LANG_MAP[langIso3];
    if (!dictLang) return null;

    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/${dictLang}/${encodeURIComponent(term)}`,
    );
    if (!res.ok) return null;

    const data = await res.json();
    return (data as DictEntry[])[0] ?? null;
  } catch {
    return null;
  }
}
