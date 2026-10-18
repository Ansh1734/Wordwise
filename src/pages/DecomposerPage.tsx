import { useState, useRef, useEffect } from "react";
import {
  Search,
  Save,
  Volume2,
  Play,
  Loader2,
  ChevronDown,
  ChevronUp,
  History,
  BookOpen,
  Layers,
  X,
  Network,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { speak } from "@/lib/tts";
import { decomposeWord, getCorrespondingWords, getPrefixWords, getSuffixWords, type DecomposedWord, type MorphemePart, type CorrespondingWord } from "@/lib/dictionary";
import TranslationsPanel from "@/components/TranslationsPanel";

// ─── Types ────────────────────────────────────────────────────────────────────

interface HistoryItem {
  word: string;
  partOfSpeech: string;
}

// ─── Morpheme Card ────────────────────────────────────────────────────────────

function MorphemeCard({
  type,
  part,
}: {
  type: "prefix" | "root" | "suffix";
  part: MorphemePart;
}) {
  const isRoot = type === "root";
  const absent = !part.present;

  const colorClasses = isRoot
    ? "border-l-green-card-border bg-green-card-bg text-success"
    : "border-l-blue-card-border bg-blue-card-bg text-primary";

  const chipClasses = isRoot
    ? "bg-card text-success border border-green-card-border"
    : "bg-card text-primary border border-blue-card-border";

  return (
    <div
      className={`rounded-xl border-l-4 p-5 shadow-sm transition-all ${colorClasses} ${
        absent ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-semibold uppercase tracking-wider">
          {type === "prefix" ? "Prefix" : type === "root" ? "Root" : "Suffix"}
        </p>
        {absent && (
          <span className="text-xs rounded-full px-2 py-0.5 bg-muted text-muted-foreground">
            none
          </span>
        )}
      </div>

      <p className="mt-2 text-2xl font-bold text-heading">
        {part.label || <span className="italic text-muted-foreground text-base">—</span>}
      </p>

      <p className="mt-1 text-xs text-muted-foreground">
        Origin: <span className="font-medium text-body">{part.origin}</span>
      </p>
      <p className="text-sm text-body mt-1 leading-snug">{part.meaning}</p>

      {part.related.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {part.related.map((w) => (
            <span key={w} className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${chipClasses}`}>
              {w}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Meanings Accordion ───────────────────────────────────────────────────────

function MeaningsPanel({ decomposed }: { decomposed: DecomposedWord }) {
  const [open, setOpen] = useState(false);
  if (decomposed.meanings.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary" />
          <span className="font-semibold text-heading text-sm">
            All Meanings ({decomposed.meanings.length})
          </span>
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {open && (
        <div className="divide-y divide-border">
          {decomposed.meanings.map((m, mi) => (
            <div key={mi} className="p-4 space-y-2">
              <span className="inline-block rounded-full bg-blue-card-bg px-3 py-0.5 text-xs font-semibold text-primary border border-blue-card-border italic">
                {m.partOfSpeech}
              </span>
              <ol className="space-y-2 pl-1">
                {m.definitions.map((d, di) => (
                  <li key={di} className="text-sm">
                    <span className="font-mono text-muted-foreground mr-2">{di + 1}.</span>
                    <span className="text-body">{d.definition}</span>
                    {d.example && (
                      <p className="mt-1 ml-5 text-xs italic text-muted-foreground border-l-2 border-border pl-2">
                        "{d.example}"
                      </p>
                    )}
                  </li>
                ))}
              </ol>
              {(m.synonyms.length > 0 || m.antonyms.length > 0) && (
                <div className="flex flex-wrap gap-3 pt-1">
                  {m.synonyms.length > 0 && (
                    <div>
                      <span className="text-xs text-muted-foreground mr-1">Synonyms:</span>
                      {m.synonyms.map((s) => (
                        <span key={s} className="mr-1 text-xs text-primary font-medium">{s}</span>
                      ))}
                    </div>
                  )}
                  {m.antonyms.length > 0 && (
                    <div>
                      <span className="text-xs text-muted-foreground mr-1">Antonyms:</span>
                      {m.antonyms.map((a) => (
                        <span key={a} className="mr-1 text-xs text-destructive font-medium">{a}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Corresponding Words Panel ────────────────────────────────────────────────

type MorphemeTab = "prefix" | "root" | "suffix";

interface WordGroup {
  words: CorrespondingWord[];
  loading: boolean;
  error: boolean;
}

function WordChips({
  group,
  tab,
  label,
  onWordClick,
}: {
  group: WordGroup;
  tab: MorphemeTab;
  label: string;
  onWordClick: (w: string) => void;
}) {
  const isRoot = tab === "root";
  const chipBase = isRoot
    ? "border-green-card-border bg-green-card-bg text-success hover:bg-success hover:border-success hover:text-success-foreground"
    : "border-blue-card-border bg-blue-card-bg text-primary hover:bg-primary hover:border-primary hover:text-primary-foreground";
  const labelColor = isRoot ? "text-success" : "text-primary";

  if (group.loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground py-1">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Finding words with <span className={`font-semibold ${labelColor}`}>{label}</span>…
      </div>
    );
  }
  if (group.error || group.words.length === 0) {
    return <p className="text-xs text-muted-foreground py-1">No words found.</p>;
  }
  return (
    <>
      <p className="text-xs text-muted-foreground mb-3">
        Words sharing <span className={`font-semibold ${labelColor}`}>"{label}"</span> — click any to decompose it.
      </p>
      <div className="flex flex-wrap gap-2">
        {group.words.map((w) => (
          <button
            key={w.word}
            onClick={() => onWordClick(w.word)}
            title={w.meaning}
            className={`group flex flex-col items-start rounded-xl border px-3 py-2 text-left transition-all ${chipBase}`}
          >
            <span className="text-sm font-semibold capitalize">{w.word}</span>
            <span className="text-xs text-muted-foreground group-hover:text-inherit/80 leading-tight mt-0.5">
              {w.meaning}
            </span>
          </button>
        ))}
      </div>
    </>
  );
}

function CorrespondingWordsPanel({
  word,
  prefix,
  root,
  suffix,
  onWordClick,
}: {
  word: string;
  prefix: string;   // empty string if no prefix
  root: string;
  suffix: string;   // empty string if no suffix
  onWordClick: (w: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<MorphemeTab>("root");

  // Lazy-loaded groups — only fetched when their tab is first visited
  // "idle" = not yet fetched; loading/words/error track state after fetch starts
  const [prefixGroup, setPrefixGroup] = useState<WordGroup & { idle: boolean }>({ words: [], loading: false, error: false, idle: true });
  const [rootGroup,   setRootGroup]   = useState<WordGroup & { idle: boolean }>({ words: [], loading: true,  error: false, idle: false });
  const [suffixGroup, setSuffixGroup] = useState<WordGroup & { idle: boolean }>({ words: [], loading: false, error: false, idle: true });

  // Load root words immediately on mount (default tab)
  useEffect(() => {
    let cancelled = false;
    setRootGroup({ words: [], loading: true, error: false, idle: false });
    setPrefixGroup({ words: [], loading: false, error: false, idle: true });
    setSuffixGroup({ words: [], loading: false, error: false, idle: true });

    getCorrespondingWords(word, root)
      .then((data) => { if (!cancelled) setRootGroup({ words: data, loading: false, error: false, idle: false }); })
      .catch(() => { if (!cancelled) setRootGroup({ words: [], loading: false, error: true, idle: false }); });

    return () => { cancelled = true; };
  }, [word]);

  // Lazy-load prefix/suffix when user clicks those tabs for the first time
  const handleTabClick = (tab: MorphemeTab) => {
    setActiveTab(tab);

    if (tab === "prefix" && prefix && prefixGroup.idle) {
      setPrefixGroup({ words: [], loading: true, error: false, idle: false });
      getPrefixWords(word, prefix)
        .then((data) => setPrefixGroup({ words: data, loading: false, error: false, idle: false }))
        .catch(() => setPrefixGroup({ words: [], loading: false, error: true, idle: false }));
    }

    if (tab === "suffix" && suffix && suffixGroup.idle) {
      setSuffixGroup({ words: [], loading: true, error: false, idle: false });
      getSuffixWords(word, suffix)
        .then((data) => setSuffixGroup({ words: data, loading: false, error: false, idle: false }))
        .catch(() => setSuffixGroup({ words: [], loading: false, error: true, idle: false }));
    }
  };

  const totalWords = rootGroup.words.length + prefixGroup.words.length + suffixGroup.words.length;

  const tabs: { id: MorphemeTab; label: string; show: boolean }[] = [
    { id: "prefix", label: prefix || "Prefix", show: !!prefix },
    { id: "root",   label: root,               show: true      },
    { id: "suffix", label: suffix || "Suffix", show: !!suffix  },
  ];

  const activeGroup =
    activeTab === "prefix" ? prefixGroup :
    activeTab === "suffix" ? suffixGroup :
    rootGroup;

  const activeLabel =
    activeTab === "prefix" ? prefix :
    activeTab === "suffix" ? suffix :
    root;

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <button
        onClick={() => setExpanded((o) => !o)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Network className="h-4 w-4 text-success" />
          <span className="font-semibold text-heading text-sm">
            Word Family Explorer
          </span>
          {totalWords > 0 && (
            <span className="text-xs rounded-full bg-green-card-bg text-success border border-green-card-border px-2 py-0.5">
              {totalWords} words
            </span>
          )}
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-border">
          {/* Tabs */}
          <div className="flex border-b border-border">
            {tabs.filter((t) => t.show).map((t) => {
              const isActive = activeTab === t.id;
              const isRoot = t.id === "root";
              const activeStyle = isRoot
                ? "border-b-2 border-success text-success bg-green-card-bg/50"
                : "border-b-2 border-primary text-primary bg-blue-card-bg/50";
              const inactiveStyle = "text-muted-foreground hover:text-heading hover:bg-muted/40";
              const grp = t.id === "prefix" ? prefixGroup : t.id === "suffix" ? suffixGroup : rootGroup;
              return (
                <button
                  key={t.id}
                  onClick={() => handleTabClick(t.id)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold transition-colors ${
                    isActive ? activeStyle : inactiveStyle
                  }`}
                >
                  <span className="capitalize">{t.label}</span>
                  <span className="text-[10px] rounded-full bg-muted px-1.5 py-0.5 font-normal text-muted-foreground">
                    {t.id === "prefix" ? "prefix" : t.id === "suffix" ? "suffix" : "root"}
                  </span>
                  {!grp.loading && grp.words.length > 0 && (
                    <span className="text-[10px] rounded-full px-1.5 py-0.5 bg-muted text-muted-foreground">
                      {grp.words.length}
                    </span>
                  )}
                  {grp.loading && (
                    <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="p-4">
            <WordChips
              group={activeGroup}
              tab={activeTab}
              label={activeLabel}
              onWordClick={onWordClick}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────


export default function DecomposerPage() {
  const { user, updateUser } = useAuth();
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<DecomposedWord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Pick up prefill from Category Explorer ───────────────────────────────────
  useEffect(() => {
    const prefill = sessionStorage.getItem("decompose_prefill");
    if (prefill) {
      sessionStorage.removeItem("decompose_prefill");
      setQuery(prefill);
      // Auto-trigger search
      setTimeout(() => handleSearch(prefill), 50);
    }
  }, []);

  // ── Search ──────────────────────────────────────────────────────────────────
  const handleSearch = async (word?: string) => {
    const target = (word ?? query).trim();
    if (!target) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const decomposed = await decomposeWord(target);
      setResult(decomposed);
      setQuery(decomposed.word);

      // Add to history (unique, most-recent first)
      setHistory((prev) => {
        const filtered = prev.filter(
          (h) => h.word.toLowerCase() !== decomposed.word.toLowerCase()
        );
        return [
          { word: decomposed.word, partOfSpeech: decomposed.partOfSpeech },
          ...filtered,
        ].slice(0, 8);
      });
    } catch (err: any) {
      setError(err.message || "Failed to decompose word. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Listen ─────────────────────────────────────────────────────────────────
  const handleListen = () => {
    if (!result) return;
    if (result.audioUrl) {
      new Audio(result.audioUrl).play().catch(() => speak(result.word));
    } else {
      speak(result.word);
    }
  };

  // ── Save to word bank ──────────────────────────────────────────────────────
  const handleSaveWord = () => {
    if (!user || !result) return;
    const word = result.word;
    const wordBank = user.wordBank || [];
    const already = wordBank.some((w: any) =>
      (typeof w === "string" ? w : w.word).toLowerCase() === word.toLowerCase()
    );

    if (!already) {
      updateUser({
        wordBank: [
          ...wordBank,
          {
            word,
            definition: result.definition,
            ipa: result.phonetic,
            added: new Date().toISOString().split("T")[0],
            mastery: 0,
          },
        ],
        wordsLearned: user.wordsLearned + 1,
      });
      toast.success(`"${word}" saved to Word Bank!`);
    } else {
      toast.info(`"${word}" is already in your Word Bank.`);
    }
  };

  // ── Word breakdown visual ──────────────────────────────────────────────────
  const renderBreakdown = (d: DecomposedWord) => {
    const parts: { text: string; color: string }[] = [];
    if (d.prefix.present && d.prefix.label) {
      parts.push({ text: d.prefix.label, color: "text-primary" });
    }
    if (d.root.label) {
      parts.push({ text: d.root.label, color: "text-success" });
    }
    if (d.suffix.present && d.suffix.label) {
      parts.push({ text: d.suffix.label, color: "text-primary" });
    }

    if (parts.length <= 1) {
      return (
        <span className="text-heading font-bold">{d.word}</span>
      );
    }

    return (
      <span>
        {parts.map((p, i) => (
          <span key={i}>
            {i > 0 && <span className="text-muted-foreground mx-1 font-normal">+</span>}
            <span className={`${p.color} font-bold`}>{p.text}</span>
          </span>
        ))}
      </span>
    );
  };

  return (
    <div className="container py-8 space-y-8">
      {/* Header */}
      <div className="rounded-xl bg-blue-card-bg p-6 border border-blue-card-border">
        <div className="flex items-center gap-3">
          <Layers className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-primary">Word Decomposer</h1>
            <p className="text-muted-foreground mt-0.5">
              Search any English word — get live definitions, morpheme breakdown & etymology
            </p>
          </div>
        </div>

      </div>

      {/* Search Bar */}
      <div className="mx-auto max-w-xl flex gap-2">
        <div className="relative flex-1">
          <Input
            ref={inputRef}
            placeholder="Enter any English word…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="focus-visible:ring-primary pr-8"
            disabled={loading}
          />
          {query && !loading && (
            <button
              onClick={() => { setQuery(""); setResult(null); setError(null); inputRef.current?.focus(); }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <Button
          onClick={() => handleSearch()}
          disabled={loading || !query.trim()}
          className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 shrink-0"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
          {loading ? "Analyzing…" : "Decompose"}
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-auto max-w-xl rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-center">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="mx-auto max-w-3xl space-y-6 animate-pulse">
          <div className="text-center space-y-3">
            <div className="h-8 w-48 rounded bg-muted mx-auto" />
            <div className="h-5 w-36 rounded bg-muted mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="rounded-xl border bg-card p-5 space-y-3">
                <div className="h-3 w-16 rounded bg-muted" />
                <div className="h-7 w-24 rounded bg-muted" />
                <div className="h-4 w-full rounded bg-muted" />
                <div className="h-4 w-5/6 rounded bg-muted" />
                <div className="flex gap-1">
                  <div className="h-5 w-16 rounded-full bg-muted" />
                  <div className="h-5 w-14 rounded-full bg-muted" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Result */}
      {!loading && result && (
        <div className="mx-auto max-w-3xl space-y-6 fade-in">
          {/* Word header */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-4xl font-bold text-heading capitalize">{result.word}</h2>
                {result.phonetic && (
                  <p className="mt-1 font-mono text-muted-foreground">{result.phonetic}</p>
                )}
                {result.partOfSpeech && (
                  <span className="mt-1 inline-block text-sm italic text-muted-foreground">
                    {result.partOfSpeech}
                  </span>
                )}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleListen}
                className="gap-2 border-primary text-primary hover:bg-primary/5 shrink-0"
              >
                <Play className="h-3.5 w-3.5" /> Listen
              </Button>
            </div>

            {result.definition && (
              <p className="mt-4 text-body leading-relaxed">{result.definition}</p>
            )}
            {result.example && (
              <p className="mt-2 text-sm italic text-muted-foreground border-l-2 border-blue-card-border pl-3">
                "{result.example}"
              </p>
            )}

            {result.etymology && (
              <div className="mt-4 flex gap-2 items-start rounded-lg bg-muted/50 p-3">
                <BookOpen className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <span className="font-semibold text-body">Etymology: </span>
                  {result.etymology}
                </p>
              </div>
            )}
          </div>

          {/* Visual breakdown */}
          <div className="text-center py-2">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
              Morpheme Breakdown
            </p>
            <div className="text-2xl">{renderBreakdown(result)}</div>
          </div>

          {/* Morpheme cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <MorphemeCard type="prefix" part={result.prefix} />
            <MorphemeCard type="root" part={result.root} />
            <MorphemeCard type="suffix" part={result.suffix} />
          </div>

          {/* Corresponding words */}
          {result.root.label && (
            <CorrespondingWordsPanel
              key={result.word}
              word={result.word}
              prefix={result.prefix.present ? result.prefix.label : ""}
              root={result.root.label}
              suffix={result.suffix.present ? result.suffix.label : ""}
              onWordClick={(w) => { setQuery(w); handleSearch(w); }}
            />
          )}

          {/* All meanings accordion */}
          <MeaningsPanel decomposed={result} />

          {/* Multi-language translations */}
          <TranslationsPanel
            key={result.word}
            word={result.word}
            definition={result.definition}
          />

          {/* Save button */}
          <div className="text-center">
            <Button
              onClick={handleSaveWord}
              className="gap-2 bg-success text-success-foreground hover:bg-success/90"
            >
              <Save className="h-4 w-4" /> Save to Word Bank
            </Button>
          </div>
        </div>
      )}

      {/* Search History */}
      {history.length > 0 && (
        <div className="mx-auto max-w-xl">
          <div className="flex items-center gap-2 mb-3">
            <History className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-heading">Recent Searches</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {history.map((h) => (
              <button
                key={h.word}
                onClick={() => { setQuery(h.word); handleSearch(h.word); }}
                className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm text-heading shadow-sm transition-colors hover:bg-muted hover:border-primary/40"
              >
                <span className="font-medium">{h.word}</span>
                {h.partOfSpeech && (
                  <span className="text-xs italic text-muted-foreground">{h.partOfSpeech}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && !result && !error && (
        <div className="mx-auto max-w-xl text-center py-12 space-y-3">
          <Layers className="h-12 w-12 text-muted-foreground/30 mx-auto" />
          <p className="text-muted-foreground text-sm">
            Type any English word and press <span className="font-semibold">Decompose</span> to see its morpheme breakdown, definition, and etymology.
          </p>
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {["unbelievable", "international", "photosynthesis", "serendipity", "ephemeral"].map((w) => (
              <button
                key={w}
                onClick={() => { setQuery(w); handleSearch(w); }}
                className="rounded-full border border-blue-card-border bg-blue-card-bg px-3 py-1 text-xs text-primary font-medium hover:bg-primary/10 transition-colors"
              >
                {w}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
