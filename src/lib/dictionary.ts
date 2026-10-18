// Free Dictionary API – no key required: https://dictionaryapi.dev/
// The word of the day is chosen deterministically based on the current date and
// locked in localStorage so it never changes within a 24-hour window.

export interface DictionaryEntry {
  word: string;
  phonetic: string;          // IPA string e.g. /ˈwʌndə/
  partOfSpeech: string;
  definition: string;
  example: string;
  synonyms: string[];
  antonyms: string[];
  audioUrl: string;
}

export interface WordMeaning {
  partOfSpeech: string;
  definitions: { definition: string; example?: string }[];
  synonyms: string[];
  antonyms: string[];
}

export interface FullWordEntry extends DictionaryEntry {
  meanings: WordMeaning[];
}

export interface MorphemePart {
  label: string;       // e.g. "un-"
  origin: string;      // e.g. "Latin"
  meaning: string;     // e.g. "not"
  related: string[];   // e.g. ["unhappy", "undo"]
  present: boolean;    // false when the word has no prefix/suffix
}

export interface DecomposedWord {
  word: string;
  phonetic: string;
  audioUrl: string;
  partOfSpeech: string;
  definition: string;
  example: string;
  meanings: WordMeaning[];
  prefix: MorphemePart;
  root: MorphemePart;
  suffix: MorphemePart;
  etymology: string;
}

// A curated list of rich, interesting (but not obscure) English words used to
// pick the word of the day.  The list is long enough that it won't repeat for
// over a year and varied enough to stay interesting.
const WORD_POOL = [
  "ephemeral", "serendipity", "melancholy", "ubiquitous", "benevolent",
  "resilience", "paradox", "eloquent", "ambiguous", "pragmatic",
  "contemplation", "idiosyncrasy", "tenacious", "magnanimous", "perspicacious",
  "labyrinthine", "diligent", "fortuitous", "intrepid", "circumspect",
  "propitious", "esoteric", "ostentatious", "loquacious", "gregarious",
  "sycophant", "pernicious", "mnemonic", "vociferous", "obsequious",
  "impeccable", "audacious", "capricious", "enigmatic", "fastidious",
  "garrulous", "inexorable", "juxtapose", "kaleidoscope", "lucid",
  "meticulous", "nefarious", "omniscient", "panacea", "quintessential",
  "recalcitrant", "spurious", "taciturn", "unequivocal", "verisimilitude",
  "whimsical", "xenophile", "yearning", "zealous", "aberrant",
  "brevity", "cacophony", "dubious", "egregious", "fervent",
  "grandiose", "harrowing", "incisive", "jeopardize", "kinetic",
  "languid", "mercurial", "nebulous", "obtuse", "pensive",
  "quandary", "ruminate", "sanguine", "tenuous", "umbrage",
  "verbose", "wistful", "xenial", "youthful", "zealotry",
  "acrimony", "buoyant", "candid", "daunting", "exuberant",
  "fallacious", "gullible", "heretic", "inquisitive", "judicious",
];

const STORAGE_KEY = "wotd_cache";

const OFFLINE_DEFINITIONS: Record<string, { definition: string; partOfSpeech: string; example: string }> = {
  quintessential: { definition: "Representing the most typical or perfect example of something.", partOfSpeech: "adjective", example: "She is the quintessential example of a thoughtful teacher." },
  ephemeral: { definition: "Lasting for a very short time.", partOfSpeech: "adjective", example: "The beauty of the sunset was ephemeral." },
  serendipity: { definition: "The occurrence of a fortunate discovery by chance.", partOfSpeech: "noun", example: "Finding the old letter was pure serendipity." },
  melancholy: { definition: "A quiet, thoughtful sadness.", partOfSpeech: "noun", example: "The music filled her with melancholy." },
  ubiquitous: { definition: "Present or found everywhere.", partOfSpeech: "adjective", example: "Smartphones have become ubiquitous." },
  benevolent: { definition: "Kind and generous; wishing to do good.", partOfSpeech: "adjective", example: "A benevolent neighbor helped the family." },
  resilience: { definition: "The ability to recover quickly from difficulty.", partOfSpeech: "noun", example: "Her resilience helped her adapt to change." },
  paradox: { definition: "A seemingly contradictory statement that may contain truth.", partOfSpeech: "noun", example: "It is a paradox that slowing down can help us finish sooner." },
  eloquent: { definition: "Fluent and persuasive in speaking or writing.", partOfSpeech: "adjective", example: "He gave an eloquent speech." },
  ambiguous: { definition: "Open to more than one interpretation; unclear.", partOfSpeech: "adjective", example: "The instructions were ambiguous." },
  pragmatic: { definition: "Focused on practical results rather than theory.", partOfSpeech: "adjective", example: "They chose a pragmatic solution." },
  tenacious: { definition: "Persistent and determined; not giving up easily.", partOfSpeech: "adjective", example: "The tenacious researcher continued testing her idea." },
  diligent: { definition: "Careful and persistent in one's work or effort.", partOfSpeech: "adjective", example: "Diligent practice improved his writing." },
  intrepid: { definition: "Fearless and adventurous.", partOfSpeech: "adjective", example: "The intrepid explorer crossed the desert." },
  lucid: { definition: "Clear and easy to understand.", partOfSpeech: "adjective", example: "The guide gave a lucid explanation." },
  meticulous: { definition: "Showing great attention to detail.", partOfSpeech: "adjective", example: "She kept meticulous notes." },
  panacea: { definition: "A supposed remedy for every problem or difficulty.", partOfSpeech: "noun", example: "There is no single panacea for traffic congestion." },
  taciturn: { definition: "Reserved or quiet in speech.", partOfSpeech: "adjective", example: "The taciturn guest listened more than he spoke." },
  whimsical: { definition: "Playfully unusual or imaginative.", partOfSpeech: "adjective", example: "The book is full of whimsical characters." },
  zealous: { definition: "Showing great energy or enthusiasm for a cause.", partOfSpeech: "adjective", example: "The zealous volunteers organized a cleanup." },
  candid: { definition: "Truthful and straightforward.", partOfSpeech: "adjective", example: "She gave candid feedback." },
  inquisitive: { definition: "Curious and eager to learn or ask questions.", partOfSpeech: "adjective", example: "The inquisitive student asked how the system worked." },
  judicious: { definition: "Showing good judgment and careful thought.", partOfSpeech: "adjective", example: "A judicious choice saved time and money." },
  brevity: { definition: "The quality of expressing something in few words.", partOfSpeech: "noun", example: "The brevity of his answer made it easy to remember." },
};

function offlineWordEntry(word: string): DictionaryEntry {
  const normalized = word.toLowerCase();
  const local = OFFLINE_DEFINITIONS[normalized];
  return {
    word,
    phonetic: "",
    partOfSpeech: local?.partOfSpeech ?? "",
    definition: local?.definition ?? `The dictionary service is unavailable. Please reconnect to load the definition for “${word}”.`,
    example: local?.example ?? "",
    synonyms: [],
    antonyms: [],
    audioUrl: "",
  };
}

function asFullWordEntry(entry: DictionaryEntry): FullWordEntry {
  return {
    ...entry,
    meanings: entry.definition
      ? [{ partOfSpeech: entry.partOfSpeech, definitions: [{ definition: entry.definition, example: entry.example }], synonyms: entry.synonyms, antonyms: entry.antonyms }]
      : [],
  };
}

interface CachedWord {
  date: string;          // "YYYY-MM-DD"
  entry: DictionaryEntry;
}

function todayString(): string {
  return new Date().toISOString().split("T")[0];
}

/** Pick a word from the pool based on the current date (deterministic). */
function pickWordForDate(dateStr: string): string {
  // Simple hash: sum of char codes of the date string
  const hash = dateStr
    .split("")
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return WORD_POOL[hash % WORD_POOL.length];
}

const DICTIONARY_API_BASE = (import.meta.env.VITE_DICTIONARY_API_URL || "https://api.dictionaryapi.dev/api/v2/entries/en").replace(/\/+$/, "");

/** Fetch full entry from the Free Dictionary API. */
async function fetchFromDictionaryApi(word: string): Promise<DictionaryEntry> {
  try {
    const res = await fetch(`${DICTIONARY_API_BASE}/${encodeURIComponent(word)}`);

    if (!res.ok) {
      throw new Error(`Dictionary API error ${res.status} for word "${word}"`);
    }

    const data = await res.json();
    const entry = data[0];

    // Extract the first valid phonetic with audio
    const phoneticObj = (entry.phonetics as any[])?.find(
      (p: any) => p.text && p.audio
    ) || (entry.phonetics as any[])?.[0] || {};

    const phonetic: string = phoneticObj.text || entry.phonetic || "";
    const audioUrl: string = phoneticObj.audio || "";

    // Walk meanings to find first definition + example + part of speech
    let partOfSpeech = "";
    let definition = "";
    let example = "";
    const synonyms: string[] = [];
    const antonyms: string[] = [];

    for (const meaning of entry.meanings as any[] || []) {
      if (!partOfSpeech) partOfSpeech = meaning.partOfSpeech;

      for (const def of meaning.definitions as any[] || []) {
        if (!definition) {
          definition = def.definition;
          example = def.example || "";
        }
        synonyms.push(...(def.synonyms || []));
        antonyms.push(...(def.antonyms || []));
      }

      synonyms.push(...(meaning.synonyms || []));
      antonyms.push(...(meaning.antonyms || []));

      if (definition) break;
    }

    return {
      word: entry.word,
      phonetic,
      partOfSpeech,
      definition,
      example,
      synonyms: [...new Set(synonyms)].slice(0, 5),
      antonyms: [...new Set(antonyms)].slice(0, 5),
      audioUrl,
    };
  } catch (err: any) {
    console.warn("Dictionary API unavailable; using the offline word entry:", err.message);
    return offlineWordEntry(word);
  }
}

/**
 * Returns the Word of the Day.
 * - If the cache is valid (same date), returns the cached entry.
 * - Otherwise, picks today's word, fetches it from the API, and caches it.
 */
export async function getWordOfTheDay(forceRandom = false): Promise<DictionaryEntry> {
  const today = todayString();

  if (!forceRandom) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const cached: CachedWord = JSON.parse(raw);
        if (cached.date === today) {
          return cached.entry;
        }
      }
    } catch {
      // Ignore parse errors
    }
  }

  // Pick and fetch today's word
  const word = forceRandom ? WORD_POOL[Math.floor(Math.random() * WORD_POOL.length)] : pickWordForDate(today);
  const entry = await fetchFromDictionaryApi(word);

  // Persist to localStorage
  const toCache: CachedWord = { date: today, entry };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toCache));
  } catch {
    // The entry is still usable when browser storage is unavailable.
  }

  return entry;
}

/** Clear the cache so a new word loads on the next call (useful for dev/testing). */
export function clearWordOfTheDayCache() {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Returns the Word for a specific date string ("YYYY-MM-DD").
 * Uses per-date localStorage cache keys so past words are remembered.
 * For today, delegates to getWordOfTheDay() to keep a single source of truth.
 */
export async function getWordForDate(dateStr: string, forceRandom = false): Promise<DictionaryEntry> {
  const today = todayString();
  if (dateStr === today) return getWordOfTheDay(forceRandom);

  const cacheKey = `wotd_${dateStr}`;
  try {
    const raw = localStorage.getItem(cacheKey);
    if (raw) return JSON.parse(raw) as DictionaryEntry;
  } catch { /* ignore */ }

  const word = pickWordForDate(dateStr);
  const entry = await fetchFromDictionaryApi(word);

  try {
    localStorage.setItem(cacheKey, JSON.stringify(entry));
  } catch { /* ignore */ }

  return entry;
}

// ─── Full word lookup (all meanings) ────────────────────────────────────────

/** Fetch the full entry with ALL meanings from the Dictionary API. */
export async function searchWord(word: string): Promise<FullWordEntry> {
  const cleaned = word.trim().toLowerCase();
  try {
    const res = await fetch(
      `${DICTIONARY_API_BASE}/${encodeURIComponent(cleaned)}`
    );

    if (res.status === 404) {
      throw new Error(`"${word}" was not found in the dictionary.`);
    }
    if (!res.ok) {
      throw new Error(`Dictionary API error ${res.status}.`);
    }

    const data = await res.json();
    const entry = data[0];

    // Phonetics
    const phoneticObj =
      (entry.phonetics as any[])?.find((p: any) => p.text && p.audio) ||
      (entry.phonetics as any[])?.[0] ||
      {};
    const phonetic: string = phoneticObj.text || entry.phonetic || "";
    const audioUrl: string = phoneticObj.audio || "";

    // All meanings
    const meanings: WordMeaning[] = (entry.meanings as any[] || []).map((m: any) => ({
      partOfSpeech: m.partOfSpeech,
      definitions: (m.definitions as any[] || []).slice(0, 4).map((d: any) => ({
        definition: d.definition,
        example: d.example,
      })),
      synonyms: [...new Set([...(m.synonyms || [])])].slice(0, 6) as string[],
      antonyms: [...new Set([...(m.antonyms || [])])].slice(0, 6) as string[],
    }));

    // Primary definition
    const primaryMeaning = meanings[0];
    const partOfSpeech = primaryMeaning?.partOfSpeech ?? "";
    const definition = primaryMeaning?.definitions[0]?.definition ?? "";
    const example = primaryMeaning?.definitions[0]?.example ?? "";
    const synonyms = primaryMeaning?.synonyms ?? [];
    const antonyms = primaryMeaning?.antonyms ?? [];

    return {
      word: entry.word,
      phonetic,
      audioUrl,
      partOfSpeech,
      definition,
      example,
      synonyms,
      antonyms,
      meanings,
    };
  } catch (err: any) {
    console.warn("Dictionary API unavailable; using offline data when possible:", err.message);
    const local = OFFLINE_DEFINITIONS[cleaned];
    if (local) return asFullWordEntry(offlineWordEntry(cleaned));
    return fallbackSearchWord(word);
  }
}

async function fallbackSearchWord(word: string): Promise<FullWordEntry> {
  const clean = word.trim();
  const staticMap: Record<string, Partial<FullWordEntry>> = {
    photosynthesis: {
      word: "photosynthesis",
      phonetic: "/ˌfoʊ.təˈsɪn.θə.sɪs/",
      partOfSpeech: "noun",
      definition: "The process by which plants use sunlight to make food from carbon dioxide and water.",
      example: "Plants carry out photosynthesis to create energy for growth.",
      synonyms: ["plant food production"],
      antonyms: [],
      meanings: [{
        partOfSpeech: "noun",
        definitions: [{ definition: "The process by which plants use sunlight to make food from carbon dioxide and water.", example: "Photosynthesis is essential for plant growth." }],
        synonyms: ["plant food production"],
        antonyms: []
      }]
    },
    unbelievable: {
      word: "unbelievable",
      phonetic: "/ˌʌn.bɪˈliː.və.bəl/",
      partOfSpeech: "adjective",
      definition: "So surprising or extreme that it seems impossible to believe.",
      example: "The story was unbelievable, but it was true.",
      synonyms: ["incredible", "amazing"],
      antonyms: ["believable"],
      meanings: [{
        partOfSpeech: "adjective",
        definitions: [{ definition: "So surprising or extreme that it seems impossible to believe.", example: "The athlete's recovery was unbelievable." }],
        synonyms: ["incredible", "amazing"],
        antonyms: ["believable"]
      }]
    }
  };

  const local = staticMap[clean.toLowerCase()];
  if (local) {
    const result: FullWordEntry = {
      word: local.word ?? clean,
      phonetic: local.phonetic ?? "",
      audioUrl: "",
      partOfSpeech: local.partOfSpeech ?? "noun",
      definition: local.definition ?? "",
      example: local.example ?? "",
      synonyms: local.synonyms ?? [],
      antonyms: local.antonyms ?? [],
      meanings: local.meanings ?? [{
        partOfSpeech: local.partOfSpeech ?? "noun",
        definitions: [{ definition: local.definition ?? "", example: local.example ?? "" }],
        synonyms: local.synonyms ?? [],
        antonyms: local.antonyms ?? []
      }]
    };
    return result;
  }

  const genericDefinition = `The word "${clean}" is a valid English term used in communication and learning.`;
  const genericExample = `We discussed the meaning of "${clean}" during class.`;
  return {
    word: clean,
    phonetic: "",
    audioUrl: "",
    partOfSpeech: "noun",
    definition: genericDefinition,
    example: genericExample,
    synonyms: [],
    antonyms: [],
    meanings: [{
      partOfSpeech: "noun",
      definitions: [{ definition: genericDefinition, example: genericExample }],
      synonyms: [],
      antonyms: []
    }]
  };
}

const MORPHEME_FALLBACKS: Record<string, { prefix: string; root: string; suffix: string; definition: string; example: string; partOfSpeech: string; etymology: string; }> = {
  photosynthesis: {
    prefix: "photo-",
    root: "synthesis",
    suffix: "",
    definition: "The process by which plants use sunlight to make food from carbon dioxide and water.",
    example: "Plants use photosynthesis to convert sunlight into energy.",
    partOfSpeech: "noun",
    etymology: "The word combines the Greek idea of light with a term meaning putting together."
  },
  unbelievable: {
    prefix: "un-",
    root: "believe",
    suffix: "-able",
    definition: "So surprising that it seems impossible to believe.",
    example: "The result was unbelievable and difficult to accept.",
    partOfSpeech: "adjective",
    etymology: "The word is built from a negative prefix, a root about trust, and a suffix meaning capable of."
  },
  happiness: {
    prefix: "",
    root: "happ",
    suffix: "-ness",
    definition: "The state of feeling joy or pleasure.",
    example: "Her happiness was clear from her smile.",
    partOfSpeech: "noun",
    etymology: "The word is formed from a root related to happiness and a noun-forming suffix."
  },
  rebuild: {
    prefix: "re-",
    root: "build",
    suffix: "",
    definition: "To build again or reconstruct something.",
    example: "They decided to rebuild the bridge after the storm.",
    partOfSpeech: "verb",
    etymology: "The word uses a prefix meaning again and a root meaning construct."
  },
};

function getOfflineMorphemeFallback(word: string, fullEntry?: FullWordEntry | null): DecomposedWord {
  const clean = word.trim().toLowerCase();
  const override = MORPHEME_FALLBACKS[clean];
  const dictionaryEntry = fullEntry ?? fallbackSearchWord(clean);

  if (override) {
    return {
      word: dictionaryEntry.word || clean,
      phonetic: dictionaryEntry.phonetic || "",
      audioUrl: dictionaryEntry.audioUrl || "",
      partOfSpeech: override.partOfSpeech || dictionaryEntry.partOfSpeech || "noun",
      definition: override.definition || dictionaryEntry.definition,
      example: override.example || dictionaryEntry.example,
      meanings: dictionaryEntry.meanings || [{ partOfSpeech: override.partOfSpeech || dictionaryEntry.partOfSpeech || "noun", definitions: [{ definition: override.definition, example: override.example }], synonyms: [], antonyms: [] }],
      prefix: { label: override.prefix || "", origin: override.prefix ? "Greek/Latin prefix" : "", meaning: override.prefix ? "A meaningful word part added at the beginning." : "", related: override.prefix ? ["photograph", "photographing", "photoelectric"] : [], present: Boolean(override.prefix) },
      root: { label: override.root || clean, origin: "Historical English / Greek origin", meaning: "The core meaning-bearing part of the word.", related: [clean], present: true },
      suffix: { label: override.suffix || "", origin: override.suffix ? "English word-forming suffix" : "", meaning: override.suffix ? "A meaningful word part added at the end." : "", related: override.suffix ? [clean, `${clean}ly`] : [], present: Boolean(override.suffix) },
      etymology: override.etymology || "The word is built from meaningful parts that help explain its structure and origin."
    };
  }

  const prefixes = ["re-", "un-", "dis-", "mis-", "pre-", "post-", "sub-", "bio-", "photo-", "trans-"];
  const suffixes = ["-tion", "-ment", "-ness", "-ly", "-ous", "-ity", "-ive", "-able", "-al", "-ing", "-ed"];
  let prefix = "";
  let root = clean;
  let suffix = "";

  for (const candidate of prefixes.sort((a, b) => b.length - a.length)) {
    if (clean.startsWith(candidate) && clean.length > candidate.length + 2) {
      prefix = candidate;
      root = clean.slice(candidate.length);
      break;
    }
  }

  for (const candidate of suffixes.sort((a, b) => b.length - a.length)) {
    if (root.endsWith(candidate) && root.length > candidate.length + 2) {
      suffix = candidate;
      root = root.slice(0, -candidate.length);
      break;
    }
  }

  if (!root || root === clean) {
    root = clean;
  }

  const partOfSpeech = dictionaryEntry.partOfSpeech || (suffix.includes("tion") || clean.endsWith("ness") ? "noun" : "word");

  return {
    word: dictionaryEntry.word || clean,
    phonetic: dictionaryEntry.phonetic || "",
    audioUrl: dictionaryEntry.audioUrl || "",
    partOfSpeech,
    definition: dictionaryEntry.definition || `The word "${clean}" is used in English to communicate a specific idea or meaning.`,
    example: dictionaryEntry.example || `This word is commonly used in natural English sentences.`,
    meanings: dictionaryEntry.meanings || [{ partOfSpeech, definitions: [{ definition: dictionaryEntry.definition || `The word "${clean}" is used in English to communicate a specific idea or meaning.`, example: dictionaryEntry.example || `This word is commonly used in natural English sentences.` }], synonyms: [], antonyms: [] }],
    prefix: {
      label: prefix,
      origin: prefix ? "Prefix from a historical root" : "",
      meaning: prefix ? "A meaningful part added before the root to change or clarify the meaning." : "",
      related: prefix ? [clean, `${clean}ly`, `${clean}ness`] : [],
      present: Boolean(prefix)
    },
    root: {
      label: root || clean,
      origin: "Core word part",
      meaning: "The main meaning-bearing part of the word.",
      related: [clean],
      present: true
    },
    suffix: {
      label: suffix,
      origin: suffix ? "Word-forming suffix" : "",
      meaning: suffix ? "A meaningful ending that changes how the word is used." : "",
      related: suffix ? [clean, `${clean}ly`] : [],
      present: Boolean(suffix)
    },
    etymology: `The word "${clean}" is built from meaningful parts that combine to create its overall meaning.`
  };
}

// ─── Gemini-powered morpheme decomposer ─────────────────────────────────────

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 1,
  backoff = 500
): Promise<Response> {
  try {
    const res = await fetch(url, options);
    if ((res.status === 503 || res.status === 429) && retries > 0) {
      await new Promise((r) => setTimeout(r, backoff));
      return fetchWithRetry(url, options, retries - 1, backoff * 2);
    }
    return res;
  } catch (err) {
    if (retries > 0) {
      await new Promise((r) => setTimeout(r, backoff));
      return fetchWithRetry(url, options, retries - 1, backoff * 2);
    }
    throw err;
  }
}

const PRIMARY_GEMINI_MODEL = "gemini-3.6-flash";
const FALLBACK_GEMINI_MODEL = "gemini-3.5-flash";
const LAST_RESORT_GEMINI_MODEL = "gemini-flash-latest";

async function executeGeminiJson<T>(prompt: string): Promise<T> {
  const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY;
  if (!GEMINI_KEY) throw new Error("Gemini API key is not configured.");

  const body = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: "application/json" },
  });

  const sendRequest = async (model: string): Promise<T> => {
    const res = await fetchWithRetry(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body }
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw { status: res.status, message: err.error?.message || "Gemini error" };
    }
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Gemini returned no content.");
    return JSON.parse(text) as T;
  };

  const models = [PRIMARY_GEMINI_MODEL, FALLBACK_GEMINI_MODEL, LAST_RESORT_GEMINI_MODEL];
  let lastError: any = null;

  for (const model of models) {
    try {
      return await sendRequest(model);
    } catch (err: any) {
      lastError = err;
      if (err.status && err.status !== 503 && err.status !== 429 && err.status !== 404) {
        break;
      }
    }
  }

  throw lastError;
}

/**
 * Decompose a word into prefix / root / suffix using Gemini.
 * Returns a DecomposedWord that merges Dictionary API data with Gemini morphology.
 */
export async function decomposeWord(word: string): Promise<DecomposedWord> {
  const fullEntry = await searchWord(word).catch(() => null);

  try {
    const prompt = `You are an expert English etymologist and linguist.

For the word "${word}", provide a detailed morphological (morpheme) decomposition.

Return ONLY a valid JSON object (no markdown, no backticks) with this exact schema:
{
  "prefix": {
    "label": string,      // e.g. "un-" — empty string "" if the word has no prefix
    "origin": string,     // language of origin e.g. "Old English", "Latin", "Greek"
    "meaning": string,    // what this prefix means, e.g. "not, opposite of"
    "related": string[],  // 3-4 other words sharing this prefix
    "present": boolean    // true if this word actually has a prefix
  },
  "root": {
    "label": string,      // the core root morpheme e.g. "believe"
    "origin": string,
    "meaning": string,
    "related": string[],  // 3-4 related words
    "present": boolean    // always true
  },
  "suffix": {
    "label": string,      // e.g. "-able" — empty string if no suffix
    "origin": string,
    "meaning": string,
    "related": string[],  // 3-4 other words with this suffix
    "present": boolean    // true if this word actually has a suffix
  },
  "etymology": string,    // one concise sentence about the word's historical origin
  "definition": string,   // a clear, concise definition of the word (1-2 sentences)
  "partOfSpeech": string, // e.g. "noun", "verb", "adjective"
  "example": string       // an example sentence using the word naturally
}

Important rules:
- If there is no prefix, set prefix.label to "" and prefix.present to false (but still fill origin/meaning/related with reasonable data about the root's language).
- If there is no suffix, do the same for suffix.
- The definition, partOfSpeech, and example fields are mandatory — always provide them.
- Always return valid JSON only.`;

    const morphemes = await executeGeminiJson<any>(prompt);

    return {
      word: fullEntry?.word ?? word,
      phonetic: fullEntry?.phonetic ?? "",
      audioUrl: fullEntry?.audioUrl ?? "",
      partOfSpeech: fullEntry?.partOfSpeech || morphemes.partOfSpeech || "",
      definition: fullEntry?.definition || morphemes.definition || "",
      example: fullEntry?.example || morphemes.example || "",
      meanings: fullEntry?.meanings ?? [],
      prefix: morphemes.prefix,
      root: morphemes.root,
      suffix: morphemes.suffix,
      etymology: morphemes.etymology ?? "",
    };
  } catch (error) {
    console.warn("Gemini decomposer unavailable, using local offline decomposition.", error);
    return getOfflineMorphemeFallback(word, fullEntry);
  }
}

// ─── Category context (Gemini) ───────────────────────────────────────────────

export interface CategoryContext {
  description: string;     // Short definition e.g. "Study of the skin and its diseases."
  relatedTerms: string[];  // 8–10 representative or related words
}

const CAT_CACHE_PREFIX = "cat_ctx_";

/**
 * Returns a short description and related terms for a given vocabulary category.
 * Results are cached in sessionStorage so repeated clicks are instant.
 */
export async function getCategoryContext(
  categoryId: string,
  categoryName: string
): Promise<CategoryContext> {
  const cacheKey = CAT_CACHE_PREFIX + categoryId;

  // Check sessionStorage
  try {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached) as CategoryContext;
  } catch {
    // ignore
  }

  const prompt = `You are an expert English vocabulary educator.

For the vocabulary category "${categoryName}" (used in an English learning app), provide:
1. A short, clear description (1–2 sentences) explaining what this category covers.
2. A list of 8–10 representative terms/words that belong to or are closely related to this category. These should be real, interesting words a learner would encounter in this domain.

Return ONLY a valid JSON object (no markdown, no backticks):
{
  "description": string,
  "relatedTerms": string[]
}`;

  const result = await executeGeminiJson<CategoryContext>(prompt);

  // Cache in sessionStorage
  try {
    sessionStorage.setItem(cacheKey, JSON.stringify(result));
  } catch {
    // ignore quota errors
  }

  return result;
}

// ─── Corresponding words (same root family) ──────────────────────────────────

export interface CorrespondingWord {
  word: string;
  meaning: string;   // one-line definition
}

const CORR_CACHE_PREFIX = "corr_";

/**
 * Given a word and its root morpheme, returns 8-10 words that share the
 * same root (i.e., from the same morphological family).
 * Cached in sessionStorage per root to avoid repeated Gemini calls.
 */
export async function getCorrespondingWords(
  word: string,
  root: string
): Promise<CorrespondingWord[]> {
  const cacheKey = CORR_CACHE_PREFIX + root.toLowerCase().replace(/[^a-z]/g, "");

  try {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached) as CorrespondingWord[];
  } catch { /* ignore */ }

  const prompt = `You are an expert English morphologist.

The word "${word}" contains the root morpheme "${root}".

List 8 to 10 real English words that share this same root morpheme and therefore belong to the same word family (e.g. for "dermat-": dermatology, dermatologist, dermal, dermatitis, hypodermic, epidermis, etc.).

Do NOT include the original word "${word}" itself.

Return ONLY a valid JSON array (no markdown, no backticks):
[
  { "word": string, "meaning": string },
  ...
]

Each "meaning" should be a very short definition (5-10 words max).`;

  const result = await executeGeminiJson<CorrespondingWord[]>(prompt);

  try {
    sessionStorage.setItem(cacheKey, JSON.stringify(result));
  } catch { /* ignore */ }

  return result;
}

const PREFIX_CACHE_PREFIX = "prefix_words_";
const SUFFIX_CACHE_PREFIX = "suffix_words_";

/**
 * Given a word and its prefix morpheme, returns 6-8 words that share the
 * same prefix (e.g. "bio-" → biology, biochemistry, biomass…).
 * Cached in sessionStorage per prefix.
 */
export async function getPrefixWords(
  word: string,
  prefix: string
): Promise<CorrespondingWord[]> {
  const cacheKey = PREFIX_CACHE_PREFIX + prefix.toLowerCase().replace(/[^a-z]/g, "");

  try {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached) as CorrespondingWord[];
  } catch { /* ignore */ }

  const prompt = `You are an expert English morphologist.

The word "${word}" starts with the prefix "${prefix}".

List 6 to 8 real English words (other than "${word}") that also start with the prefix "${prefix}" and clearly use it with the same meaning (e.g. for "bio-": biology, biochemistry, biomass, biopsy, biography, biodiversity).

Return ONLY a valid JSON array (no markdown, no backticks):
[
  { "word": string, "meaning": string },
  ...
]

Each "meaning" should be a very short definition (5-10 words max).`;

  const result = await executeGeminiJson<CorrespondingWord[]>(prompt);

  try {
    sessionStorage.setItem(cacheKey, JSON.stringify(result));
  } catch { /* ignore */ }

  return result;
}

/**
 * Given a word and its suffix morpheme, returns 6-8 words that share the
 * same suffix (e.g. "-graphy" → geography, photography, biography…).
 * Cached in sessionStorage per suffix.
 */
export async function getSuffixWords(
  word: string,
  suffix: string
): Promise<CorrespondingWord[]> {
  const cacheKey = SUFFIX_CACHE_PREFIX + suffix.toLowerCase().replace(/[^a-z]/g, "");

  try {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached) as CorrespondingWord[];
  } catch { /* ignore */ }

  const prompt = `You are an expert English morphologist.

The word "${word}" ends with the suffix "${suffix}".

List 6 to 8 real English words (other than "${word}") that also end with the suffix "${suffix}" and clearly use it with the same meaning (e.g. for "-graphy": geography, photography, biography, choreography, calligraphy, cinematography).

Return ONLY a valid JSON array (no markdown, no backticks):
[
  { "word": string, "meaning": string },
  ...
]

Each "meaning" should be a very short definition (5-10 words max).`;

  const result = await executeGeminiJson<CorrespondingWord[]>(prompt);

  try {
    sessionStorage.setItem(cacheKey, JSON.stringify(result));
  } catch { /* ignore */ }

  return result;
}

// ─── Multi-language translations ─────────────────────────────────────────────

export interface WordTranslation {
  language: string;   // e.g. "Hindi"
  script: string;     // native script name e.g. "हिंदी"
  meaning: string;    // meaning of the word in that language
}

const TRANS_CACHE_PREFIX = "trans_";

const TARGET_LANGUAGES = [
  "Hindi", "Hinglish", "Marathi", "Tamil", "Telugu", "Bengali",
  "Gujarati", "Kannada", "Malayalam", "Punjabi", "Urdu",
];

// Note: "Hinglish" = Hindi meaning written in Roman (English) script, not Devanagari

/**
 * Uses Gemini to translate the meaning of an English word into 10 Indian languages.
 * Results are cached in sessionStorage per word.
 */
export async function getWordTranslations(
  word: string,
  definition: string
): Promise<WordTranslation[]> {
  const cacheKey = TRANS_CACHE_PREFIX + word.toLowerCase().replace(/[^a-z]/g, "");

  try {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached) as WordTranslation[];
  } catch { /* ignore */ }

  const prompt = `You are an expert multilingual translator specializing in Indian languages.

The English word is: "${word}"
Its definition is: "${definition}"

Translate the MEANING (not just the word) of "${word}" into each of these 11 Indian languages:
${TARGET_LANGUAGES.join(", ")}

IMPORTANT special instruction for "Hinglish":
- Hinglish means: write the Hindi meaning using Roman/English letters (transliteration), NOT Devanagari script.
- Example: instead of "अभूतपूर्व", write "abhootpoorv" or "anokha jo pehle kabhi nahi hua"
- For the "script" field of Hinglish, use "Roman Hindi"

For all other languages:
- Use their native script for the "meaning" field
- Use the native script name for the "script" field

Return ONLY a valid JSON array (no markdown, no backticks):
[
  { "language": "Hindi", "script": "हिंदी", "meaning": "<hindi meaning in Devanagari>" },
  { "language": "Hinglish", "script": "Roman Hindi", "meaning": "<hindi meaning in Roman letters>" },
  ...
]`;

  const result = await executeGeminiJson<WordTranslation[]>(prompt);

  try {
    sessionStorage.setItem(cacheKey, JSON.stringify(result));
  } catch { /* ignore */ }

  return result;
}
