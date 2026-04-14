const LANG_NAMES: Record<string, string> = {
  // Germanic
  eng: "English", deu: "German", nld: "Dutch", afr: "Afrikaans", fry: "Frisian",
  ltz: "Luxembourgish", yid: "Yiddish", sco: "Scots",
  swe: "Swedish", dan: "Danish", nor: "Norwegian", nob: "Norwegian Bokmal", nno: "Norwegian Nynorsk",
  isl: "Icelandic", fao: "Faroese", got: "Gothic",
  ang: "Old English", enm: "Middle English", frk: "Frankish",
  gmh: "Middle High German", goh: "Old High German", gml: "Middle Low German",
  non: "Old Norse", osx: "Old Saxon", odt: "Old Dutch", dum: "Middle Dutch",
  gsw: "Swiss German", nds: "Low German", pdc: "Pennsylvania Dutch",
  stq: "Saterland Frisian", ofs: "Old Frisian", wym: "Wymysorys",

  // Romance
  fra: "French", spa: "Spanish", ita: "Italian", por: "Portuguese",
  cat: "Catalan", glg: "Galician", oci: "Occitan", ast: "Asturian",
  ron: "Romanian", rup: "Aromanian", dlm: "Dalmatian",
  fro: "Old French", frm: "Middle French", xno: "Anglo-Norman",
  pro: "Old Provencal", osp: "Old Spanish",
  vec: "Venetian", scn: "Sicilian", nap: "Neapolitan", lij: "Ligurian",
  fur: "Friulian", roh: "Romansh", lad: "Ladino", wln: "Walloon",
  nrf: "Norman", hat: "Haitian Creole", pap: "Papiamento", mfe: "Mauritian Creole",
  arg: "Aragonese",

  // Celtic
  gle: "Irish", cym: "Welsh", bre: "Breton", gla: "Scottish Gaelic",
  cor: "Cornish", glv: "Manx",
  sga: "Old Irish", mga: "Middle Irish",

  // Slavic
  rus: "Russian", pol: "Polish", ces: "Czech", ukr: "Ukrainian",
  bul: "Bulgarian", hrv: "Croatian", srp: "Serbian", slv: "Slovenian",
  slk: "Slovak", mkd: "Macedonian", bel: "Belarusian", bos: "Bosnian",
  hbs: "Serbo-Croatian", dsb: "Lower Sorbian", hsb: "Upper Sorbian",
  orv: "Old East Slavic", chu: "Old Church Slavonic",

  // Baltic
  lit: "Lithuanian", lav: "Latvian",

  // Classical / Ancient
  lat: "Latin", grc: "Ancient Greek", ell: "Greek",
  san: "Sanskrit", psu: "Sauraseni Prakrit",
  xcl: "Classical Armenian", hye: "Armenian",
  arc: "Aramaic", syc: "Classical Syriac",
  egy: "Egyptian", cop: "Coptic",
  akk: "Akkadian", sux: "Sumerian",
  peo: "Old Persian", pal: "Middle Persian",

  // Indo-Iranian
  hin: "Hindi", urd: "Urdu", ben: "Bengali", pan: "Punjabi", guj: "Gujarati",
  mar: "Marathi", nep: "Nepali", sin: "Sinhala", fas: "Persian", kur: "Kurdish",
  kmr: "Northern Kurdish", ckb: "Central Kurdish", oss: "Ossetic",
  ori: "Odia", kan: "Kannada", tel: "Telugu", tam: "Tamil", mal: "Malayalam",
  asm: "Assamese", kas: "Kashmiri", kok: "Konkani", brx: "Bodo",
  mni: "Meitei", tgk: "Tajik", shn: "Shan",

  // Semitic
  ara: "Arabic", arb: "Standard Arabic", heb: "Hebrew", amh: "Amharic", mlt: "Maltese",

  // Turkic
  tur: "Turkish", aze: "Azerbaijani", uzb: "Uzbek", kaz: "Kazakh",
  kir: "Kyrgyz", tuk: "Turkmen", crh: "Crimean Tatar", ota: "Ottoman Turkish",

  // Uralic
  fin: "Finnish", hun: "Hungarian", est: "Estonian",
  vep: "Veps", vot: "Votic", krl: "Karelian", mhr: "Meadow Mari", smj: "Lule Sami",

  // East Asian
  zho: "Chinese", cmn: "Mandarin", yue: "Cantonese", hak: "Hakka", nan: "Min Nan",
  jpn: "Japanese", kor: "Korean",

  // Southeast Asian
  mya: "Burmese", bod: "Tibetan", tha: "Thai", vie: "Vietnamese",
  khm: "Khmer", okz: "Old Khmer", lao: "Lao",
  msa: "Malay", zsm: "Standard Malay", ind: "Indonesian",
  tgl: "Tagalog", ceb: "Cebuano",

  // Other
  sqi: "Albanian", eus: "Basque", kat: "Georgian",
  haw: "Hawaiian", mri: "Maori", smo: "Samoan", ton: "Tongan",
  swa: "Swahili", zul: "Zulu", xho: "Xhosa", hau: "Hausa", yor: "Yoruba",
  tsn: "Tswana", nso: "Northern Sotho",
  tpi: "Tok Pisin", nav: "Navajo", nci: "Classical Nahuatl",
  mon: "Mongolian",
  epo: "Esperanto", vol: "Volapuk", ido: "Ido",
  mul: "Multilingual",
};

export function langName(code: string): string {
  return LANG_NAMES[code] || code;
}
