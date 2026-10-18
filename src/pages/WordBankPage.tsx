import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Search, Trash2, CheckCircle2, BookOpen, Volume2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { speak } from "@/lib/tts";

interface WordEntry {
  word: string;
  definition?: string;
  ipa?: string;
  example?: string;
  category?: string;
  added?: string;
  mastery?: number;
  learned?: boolean;
}

export default function WordBankPage() {
  const { user, updateUser } = useAuth();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "learned" | "unlearned">("all");

  const wordBank: WordEntry[] = user?.wordBank ?? [];

  const filtered = useMemo(() => {
    let list = wordBank;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (w) =>
          w.word.toLowerCase().includes(q) ||
          (w.definition ?? "").toLowerCase().includes(q)
      );
    }
    if (filter === "learned") list = list.filter((w) => w.learned);
    if (filter === "unlearned") list = list.filter((w) => !w.learned);
    return list;
  }, [wordBank, search, filter]);

  const handleDelete = (word: string) => {
    const updated = wordBank.filter((w) => w.word !== word);
    updateUser({ wordBank: updated, wordsLearned: updated.length });
    toast.success(`"${word}" removed from Word Bank`);
  };

  const toggleLearned = (word: string) => {
    const updated = wordBank.map((w) =>
      w.word === word ? { ...w, learned: !w.learned } : w
    );
    updateUser({ wordBank: updated });
    const item = updated.find((w) => w.word === word);
    toast.success(
      item?.learned ? `"${word}" marked as learned!` : `"${word}" unmarked`
    );
  };

  const learnedCount = wordBank.filter((w) => w.learned).length;

  if (wordBank.length === 0) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-16 text-center fade-in">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <BookOpen className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="mt-6 text-2xl font-bold text-heading">
          Your Word Bank is empty
        </h2>
        <p className="mt-2 text-muted-foreground max-w-md mx-auto">
          Save words from the Word of the Day, News Reader, or Word Decomposer
          to build your personal vocabulary collection.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button
            onClick={() => (window.location.href = "/word-of-day")}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Word of the Day
          </Button>
          <Button
            onClick={() => (window.location.href = "/news")}
            variant="outline"
          >
            News Reader
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-heading">Word Bank</h1>
        <p className="mt-1 text-muted-foreground">
          {wordBank.length} word{wordBank.length !== 1 ? "s" : ""} saved ·{" "}
          {learnedCount} learned
        </p>
      </div>

      {/* Search & Filters */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search words…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 focus-visible:ring-primary"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex gap-2">
          {(["all", "learned", "unlearned"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize transition-all ${
                filter === f
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-6 rounded-full bg-muted h-2 overflow-hidden">
        <div
          className="h-full rounded-full bg-secondary transition-all duration-500"
          style={{
            width: `${wordBank.length > 0 ? (learnedCount / wordBank.length) * 100 : 0}%`,
          }}
        />
      </div>

      {/* Words Grid */}
      {filtered.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">
          No words match your search.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((entry) => (
            <div
              key={entry.word}
              className={`group relative rounded-xl border bg-card p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${
                entry.learned
                  ? "border-l-4 border-l-secondary"
                  : "border-l-4 border-l-primary"
              }`}
            >
              {/* Learned badge */}
              {entry.learned && (
                <span className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-secondary/10 px-2 py-0.5 text-xs font-medium text-secondary">
                  <CheckCircle2 className="h-3 w-3" /> Learned
                </span>
              )}

              {/* Word + pronunciation */}
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-heading truncate">
                    {entry.word}
                  </h3>
                  {entry.ipa && (
                    <span className="text-xs text-muted-foreground">
                      {entry.ipa}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => speak(entry.word)}
                  className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                  title="Listen"
                >
                  <Volume2 className="h-4 w-4" />
                </button>
              </div>

              {/* Definition */}
              {entry.definition && (
                <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                  {entry.definition}
                </p>
              )}

              {/* Example */}
              {entry.example && (
                <p className="mt-1.5 text-xs italic text-muted-foreground/70 line-clamp-2">
                  "{entry.example}"
                </p>
              )}

              {/* Category & date */}
              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                {entry.category && (
                  <span className="rounded-full bg-muted px-2 py-0.5 capitalize">
                    {entry.category}
                  </span>
                )}
                {entry.added && <span>{entry.added}</span>}
              </div>

              {/* Actions */}
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => toggleLearned(entry.word)}
                  className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                    entry.learned
                      ? "bg-secondary/10 text-secondary hover:bg-secondary/20"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {entry.learned ? "Learned" : "Mark Learned"}
                </button>
                <button
                  onClick={() => handleDelete(entry.word)}
                  className="flex items-center justify-center rounded-lg px-3 py-2 text-xs font-medium text-destructive/70 hover:bg-destructive/10 hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
