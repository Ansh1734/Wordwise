import { useState, useEffect } from "react";
import {
  Stethoscope, Scale, FlaskConical, Briefcase, GraduationCap,
  BookOpen, ArrowRight, Loader2, Info, Tag, Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { categories, categoryWords } from "@/data/mockData";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { getCategoryContext, type CategoryContext } from "@/lib/dictionary";
import TranslationsPanel from "@/components/TranslationsPanel";

const iconMap: Record<string, React.ElementType> = {
  Stethoscope, Scale, FlaskConical, Briefcase, GraduationCap, BookOpen,
};

const suffixFilters = ["-ology", "-itis", "-tion", "-ment", "-ance", "-est", "-ify", "-able", "-ous"];
const prefixFilters = ["bio-", "pre-", "anti-", "micro-", "inter-", "un-", "re-", "over-", "sub-"];

// ─── Category Info Panel ──────────────────────────────────────────────────────

function CategoryInfoPanel({
  categoryId,
  categoryName,
  onTermClick,
}: {
  categoryId: string;
  categoryName: string;
  onTermClick: (term: string) => void;
}) {
  const [ctx, setCtx] = useState<CategoryContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setCtx(null);
    setError(false);
    setLoading(true);

    getCategoryContext(categoryId, categoryName)
      .then((data) => { if (!cancelled) { setCtx(data); setLoading(false); } })
      .catch(() => { if (!cancelled) { setError(true); setLoading(false); } });

    return () => { cancelled = true; };
  }, [categoryId, categoryName]);

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-4 animate-pulse space-y-3">
        <div className="flex items-center gap-2">
          <Loader2 className="h-3.5 w-3.5 text-muted-foreground animate-spin" />
          <span className="text-xs text-muted-foreground">Loading category info…</span>
        </div>
        <div className="h-3 w-full rounded bg-muted" />
        <div className="h-3 w-4/5 rounded bg-muted" />
        <div className="flex flex-wrap gap-1.5 pt-1">
          {[80, 100, 70, 90, 60].map((w) => (
            <div key={w} className="h-5 rounded-full bg-muted" style={{ width: w }} />
          ))}
        </div>
      </div>
    );
  }

  if (error || !ctx) return null;

  return (
    <div className="rounded-xl border border-blue-card-border bg-blue-card-bg p-4 space-y-3 transition-all">
      {/* Description */}
      <div className="flex items-start gap-2">
        <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
        <p className="text-sm text-body leading-relaxed">{ctx.description}</p>
      </div>

      {/* Related terms */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <Tag className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">
            Related Terms
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {ctx.relatedTerms.map((term) => (
            <button
              key={term}
              onClick={() => onTermClick(term)}
              title={`Search "${term}" in Word Decomposer`}
              className="rounded-full bg-card border border-blue-card-border px-3 py-1 text-xs font-medium text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
            >
              {term}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Click any term to decompose it →
        </p>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CategoryExplorerPage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [selectedCat, setSelectedCat] = useState("medical");
  const [activeSuffixes, setActiveSuffixes] = useState<Set<string>>(new Set());
  const [activePrefixes, setActivePrefixes] = useState<Set<string>>(new Set());
  const [termSearch, setTermSearch] = useState<string | null>(null);

  const toggleFilter = (set: Set<string>, val: string, setter: (s: Set<string>) => void) => {
    const next = new Set(set);
    next.has(val) ? next.delete(val) : next.add(val);
    setter(next);
  };

  const words = categoryWords[selectedCat] || [];
  const filtered = words.filter((w) => {
    if (activeSuffixes.size > 0 && w.suffix && !Array.from(activeSuffixes).some((s) => w.suffix?.includes(s.replace("-", "")))) return false;
    if (activePrefixes.size > 0 && w.prefix && !Array.from(activePrefixes).some((p) => w.prefix?.includes(p.replace("-", "")))) return false;
    if (activeSuffixes.size > 0 && !w.suffix) return false;
    if (activePrefixes.size > 0 && !w.prefix) return false;
    return true;
  });
  const displayWords = activeSuffixes.size === 0 && activePrefixes.size === 0 ? words : filtered;
  const cat = categories.find((c) => c.id === selectedCat)!;

  const handleLearn = (word: string) => {
    if (!user) return;
    const already = user.wordBank.some((w: any) => w.word === word);
    if (already) { toast.info(`"${word}" is already in your Word Bank`); return; }
    updateUser({
      wordBank: [...user.wordBank, { word, added: new Date().toISOString().split("T")[0] }],
      wordsLearned: user.wordsLearned + 1,
    });
    toast.success(`"${word}" saved to Word Bank!`);
  };

  // When a related term chip is clicked → navigate to decomposer with that term
  const handleRelatedTermClick = (term: string) => {
    sessionStorage.setItem("decompose_prefill", term);
    navigate("/decomposer");
    toast.info(`Opening "${term}" in Word Decomposer…`);
  };

  // Navigate directly to decomposer for a specific word
  const handleOpenDecomposer = (word: string) => {
    sessionStorage.setItem("decompose_prefill", word);
    navigate("/decomposer");
  };

  return (
    <div className="container py-8 space-y-8">
      {/* Header */}
      <div className="rounded-xl bg-green-card-bg p-6 border border-green-card-border">
        <h1 className="text-2xl font-bold text-success">Category Explorer</h1>
        <p className="text-muted-foreground mt-1">Explore domain-specific vocabulary by category</p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr]">
        {/* ── Sidebar ─────────────────────────────────────────────────────── */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-heading mb-3">Choose Category</h3>
          {categories.map((c) => {
            const Icon = iconMap[c.icon] || BookOpen;
            const active = selectedCat === c.id;
            return (
              <button
                key={c.id}
                onClick={() => {
                  setSelectedCat(c.id);
                  setActiveSuffixes(new Set());
                  setActivePrefixes(new Set());
                  setTermSearch(null);
                }}
                className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition-all ${
                  active
                    ? c.color === "green"
                      ? "bg-success text-success-foreground"
                      : "bg-primary text-primary-foreground"
                    : c.color === "green"
                    ? "bg-green-card-bg text-success border border-green-card-border hover:bg-green-card-bg/80"
                    : "bg-blue-card-bg text-primary border border-blue-card-border hover:bg-blue-card-bg/80"
                }`}
              >
                <Icon className="h-5 w-5" />
                <div>
                  <p className="font-semibold text-sm">{c.name}</p>
                  <p className={`text-xs ${active ? "opacity-80" : "opacity-60"}`}>{c.wordCount} words</p>
                </div>
              </button>
            );
          })}

          {/* ── Category Info Panel (below sidebar) ─────────────────────── */}
          <div className="pt-3">
            <CategoryInfoPanel
              key={selectedCat}
              categoryId={selectedCat}
              categoryName={cat.name}
              onTermClick={handleRelatedTermClick}
            />
          </div>
        </div>

        {/* ── Main content ─────────────────────────────────────────────────── */}
        <div className="space-y-6">
          {/* Suffix filters */}
          <div>
            <p className="text-sm font-semibold text-heading mb-2">Filter by Suffix</p>
            <div className="flex flex-wrap gap-2">
              {suffixFilters.map((s) => (
                <button
                  key={s}
                  onClick={() => toggleFilter(activeSuffixes, s, setActiveSuffixes)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    activeSuffixes.has(s)
                      ? "bg-success text-success-foreground"
                      : "bg-green-card-bg text-success border border-green-card-border hover:bg-green-card-bg/80"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Prefix filters */}
          <div>
            <p className="text-sm font-semibold text-heading mb-2">Filter by Prefix</p>
            <div className="flex flex-wrap gap-2">
              {prefixFilters.map((p) => (
                <button
                  key={p}
                  onClick={() => toggleFilter(activePrefixes, p, setActivePrefixes)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    activePrefixes.has(p)
                      ? "bg-primary text-primary-foreground"
                      : "bg-blue-card-bg text-primary border border-blue-card-border hover:bg-blue-card-bg/80"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Showing {displayWords.length} words in{" "}
            <strong className="text-heading">{cat.name}</strong>
          </p>

          {/* Word cards */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {displayWords.map((w) => (
              <div key={w.word} className="rounded-xl border-l-4 border-l-green-card-border bg-card p-4 shadow-sm">
                <h4 className="font-bold text-heading">{w.word}</h4>
                <div className="mt-2 flex flex-wrap gap-1">
                  {w.prefix && (
                    <span className="rounded-full bg-blue-card-bg px-2 py-0.5 text-xs text-primary border border-blue-card-border">
                      {w.prefix}
                    </span>
                  )}
                  <span className="rounded-full bg-green-card-bg px-2 py-0.5 text-xs text-success border border-green-card-border">
                    {w.root}
                  </span>
                  {w.suffix && (
                    <span className="rounded-full bg-blue-card-bg px-2 py-0.5 text-xs text-primary border border-blue-card-border">
                      {w.suffix}
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{w.definition}</p>
                <div className="mt-3 flex gap-2 flex-wrap">
                  <Button
                    size="sm"
                    onClick={() => handleLearn(w.word)}
                    className="gap-1 bg-success text-success-foreground hover:bg-success/90 text-xs"
                  >
                    Learn <ArrowRight className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenDecomposer(w.word)}
                    className="gap-1 border-blue-card-border text-primary hover:bg-blue-card-bg text-xs"
                  >
                    <Layers className="h-3 w-3" /> Word Decomposer
                  </Button>
                </div>
                <TranslationsPanel
                  key={w.word}
                  word={w.word}
                  definition={w.definition}
                  className="mt-3"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
