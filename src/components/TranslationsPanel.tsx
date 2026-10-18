import { useState } from "react";
import { Languages, Loader2, ChevronDown, ChevronUp, Check } from "lucide-react";
import { getWordTranslations, type WordTranslation } from "@/lib/dictionary";

interface TranslationsPanelProps {
  word: string;
  definition: string;
  className?: string;
}

// All 11 languages with their native labels and colour palette
const ALL_LANGS = [
  { key: "Hinglish",  label: "Hinglish",   native: "Roman Hindi", color: "bg-pink-50   border-pink-300   text-pink-800   hover:bg-pink-100"   },
  { key: "Hindi",     label: "Hindi",       native: "हिंदी",        color: "bg-orange-50 border-orange-300 text-orange-800 hover:bg-orange-100" },
  { key: "Marathi",   label: "Marathi",     native: "मराठी",        color: "bg-yellow-50 border-yellow-300 text-yellow-800 hover:bg-yellow-100" },
  { key: "Tamil",     label: "Tamil",       native: "தமிழ்",        color: "bg-rose-50   border-rose-300   text-rose-800   hover:bg-rose-100"   },
  { key: "Telugu",    label: "Telugu",      native: "తెలుగు",       color: "bg-purple-50 border-purple-300 text-purple-800 hover:bg-purple-100" },
  { key: "Bengali",   label: "Bengali",     native: "বাংলা",        color: "bg-sky-50    border-sky-300    text-sky-800    hover:bg-sky-100"    },
  { key: "Gujarati",  label: "Gujarati",    native: "ગુજરાતી",      color: "bg-lime-50   border-lime-300   text-lime-800   hover:bg-lime-100"   },
  { key: "Kannada",   label: "Kannada",     native: "ಕನ್ನಡ",        color: "bg-red-50    border-red-300    text-red-800    hover:bg-red-100"    },
  { key: "Malayalam", label: "Malayalam",   native: "മലയാളം",       color: "bg-teal-50   border-teal-300   text-teal-800   hover:bg-teal-100"   },
  { key: "Punjabi",   label: "Punjabi",     native: "ਪੰਜਾਬੀ",      color: "bg-amber-50  border-amber-300  text-amber-800  hover:bg-amber-100"  },
  { key: "Urdu",      label: "Urdu",        native: "اردو",         color: "bg-indigo-50 border-indigo-300 text-indigo-800 hover:bg-indigo-100" },
];

// Card colours for selected translation display
const CARD_COLORS: Record<string, string> = {
  Hinglish:  "bg-pink-50   border-pink-200   text-pink-900",
  Hindi:     "bg-orange-50 border-orange-200 text-orange-900",
  Marathi:   "bg-yellow-50 border-yellow-200 text-yellow-900",
  Tamil:     "bg-rose-50   border-rose-200   text-rose-900",
  Telugu:    "bg-purple-50 border-purple-200 text-purple-900",
  Bengali:   "bg-sky-50    border-sky-200    text-sky-900",
  Gujarati:  "bg-lime-50   border-lime-200   text-lime-900",
  Kannada:   "bg-red-50    border-red-200    text-red-900",
  Malayalam: "bg-teal-50   border-teal-200   text-teal-900",
  Punjabi:   "bg-amber-50  border-amber-200  text-amber-900",
  Urdu:      "bg-indigo-50 border-indigo-200 text-indigo-900",
};

export default function TranslationsPanel({ word, definition, className = "" }: TranslationsPanelProps) {
  const [open, setOpen] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [allTranslations, setAllTranslations] = useState<WordTranslation[]>([]);
  // Default: Hindi + Hinglish selected
  const [selected, setSelected] = useState<Set<string>>(new Set(["Hindi", "Hinglish"]));

  const toggleLang = (lang: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(lang) ? next.delete(lang) : next.add(lang);
      return next;
    });
  };

  const handleTogglePanel = async () => {
    const next = !open;
    setOpen(next);
    if (next && !fetched && !loading) {
      setLoading(true);
      setError(false);
      try {
        const data = await getWordTranslations(word, definition);
        setAllTranslations(data);
        setFetched(true);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
  };

  const visibleTranslations = allTranslations.filter((t) => selected.has(t.language));

  return (
    <div className={`rounded-xl border border-border bg-card shadow-sm overflow-hidden ${className}`}>
      {/* Header toggle */}
      <button
        onClick={handleTogglePanel}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Languages className="h-4 w-4 text-primary" />
          <span className="font-semibold text-heading text-sm">Meanings in Indian Languages</span>
          {selected.size > 0 && fetched && (
            <span className="text-xs rounded-full bg-blue-card-bg text-primary border border-blue-card-border px-2 py-0.5">
              {selected.size} selected
            </span>
          )}
        </div>
        {open
          ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
          : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="border-t border-border p-4 space-y-4">
          {/* Language selector chips */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">Select languages to show:</p>
            <div className="flex flex-wrap gap-1.5">
              {ALL_LANGS.map(({ key, label, native, color }) => {
                const isSelected = selected.has(key);
                return (
                  <button
                    key={key}
                    onClick={() => toggleLang(key)}
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                      isSelected
                        ? color + " shadow-sm scale-105"
                        : "bg-muted border-border text-muted-foreground hover:border-primary/40 hover:text-heading"
                    }`}
                  >
                    {isSelected && <Check className="h-3 w-3" />}
                    <span>{label}</span>
                    <span className="opacity-60 text-[10px]">{native}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Translation cards */}
          {loading ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Translating into 11 Indian languages…
            </div>
          ) : error ? (
            <p className="text-xs text-destructive">Could not load translations. Check your Gemini API key.</p>
          ) : !fetched ? null : selected.size === 0 ? (
            <p className="text-xs text-muted-foreground italic">Select at least one language above to see the translation.</p>
          ) : visibleTranslations.length === 0 ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Loading selected translations…
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {visibleTranslations.map((t) => (
                <div
                  key={t.language}
                  className={`rounded-lg border px-3 py-2.5 ${CARD_COLORS[t.language] ?? "bg-muted border-border text-body"}`}
                >
                  <div className="flex items-baseline gap-1.5 mb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider opacity-60">{t.language}</span>
                    <span className="text-[11px] opacity-40">·</span>
                    <span className="text-[11px] opacity-50">{t.script}</span>
                  </div>
                  <p className="text-sm font-medium leading-snug">{t.meaning}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
