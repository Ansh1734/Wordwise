import { useState, useEffect } from "react";
import {
  Play,
  Star,
  CheckCircle2,
  Volume2,
  RefreshCw,
  Loader2,
  BookOpen,
  ArrowLeftRight,
  CalendarDays,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { speak } from "@/lib/tts";
import { useAuth } from "@/contexts/AuthContext";
import {
  getWordForDate,
  clearWordOfTheDayCache,
  type DictionaryEntry,
} from "@/lib/dictionary";
import TranslationsPanel from "@/components/TranslationsPanel";

// ── Helpers ───────────────────────────────────────────────────────────────────

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function dateToStr(d: Date) {
  return d.toISOString().split("T")[0];
}

// Build last-7-days array (oldest first, today last)
function buildCalendar() {
  const today = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    return d;
  });
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function WordOfDayPage() {
  const { user, updateUser } = useAuth();
  const [reviewed, setReviewed] = useState(false);
  const [rating, setRating] = useState(0);

  const [wotd, setWotd] = useState<DictionaryEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected day (defaults to today)
  const [selectedDate, setSelectedDate] = useState(todayStr());

  const calendarDays = buildCalendar();
  const isToday = selectedDate === todayStr();

  // ── Fetch word for selected date ────────────────────────────────────────────
  const loadWord = async (dateStr: string, forceRefresh = false) => {
    setLoading(true);
    setError(null);
    setReviewed(false);
    setRating(0);
    try {
      const entry = await getWordForDate(dateStr, forceRefresh);
      setWotd(entry);
    } catch (err: any) {
      setError(err.message || "Failed to load word.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWord(selectedDate);
  }, [selectedDate]);

  // ── Audio ───────────────────────────────────────────────────────────────────
  const handleListen = () => {
    if (!wotd) return;
    if (wotd.audioUrl) {
      new Audio(wotd.audioUrl).play().catch(() => speak(wotd.word));
    } else {
      speak(wotd.word);
    }
  };

  // ── Mark as reviewed ────────────────────────────────────────────────────────
  const handleReviewWord = () => {
    if (!user || !wotd) return;
    setReviewed(true);
    const word = wotd.word;
    const wordBank = user.wordBank || [];
    const already = wordBank.some((w: any) =>
      (typeof w === "string" ? w : w.word).toLowerCase() === word.toLowerCase()
    );
    if (!already) {
      updateUser({
        wordBank: [
          ...wordBank,
          { word, definition: wotd.definition, ipa: wotd.phonetic, added: new Date().toISOString().split("T")[0], mastery: 0 },
        ],
        wordsLearned: user.wordsLearned + 1,
      });
      toast.success(`"${word}" marked as reviewed and saved to Word Bank!`);
    } else {
      toast.info(`"${word}" marked as reviewed!`);
    }
  };

  // ── Skeleton ─────────────────────────────────────────────────────────────────
  const renderSkeleton = () => (
    <div className="rounded-xl border-l-4 border-l-green-card-border bg-card p-8 shadow-sm animate-pulse">
      <div className="h-4 w-24 rounded bg-muted mb-4" />
      <div className="h-10 w-48 rounded bg-muted mb-3" />
      <div className="h-5 w-36 rounded bg-muted mb-2" />
      <div className="h-4 w-20 rounded bg-muted mb-6" />
      <div className="h-4 w-full rounded bg-muted mb-2" />
      <div className="h-4 w-5/6 rounded bg-muted mb-2" />
      <div className="h-4 w-4/6 rounded bg-muted" />
    </div>
  );

  // ── Word card ─────────────────────────────────────────────────────────────────
  const renderWord = (entry: DictionaryEntry) => (
    <div className="rounded-xl border-l-4 border-l-green-card-border bg-card p-8 shadow-sm">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-success mb-2">
            {isToday ? "Today's Word" : `Word for ${new Date(selectedDate + "T00:00:00").toLocaleDateString("en", { weekday: "long", month: "short", day: "numeric" })}`}
          </div>
          <h2 className="text-4xl font-bold text-heading capitalize">{entry.word}</h2>
          <p className="mt-2 font-mono text-lg text-muted-foreground">{entry.phonetic}</p>
          <span className="mt-1 inline-block text-sm italic text-muted-foreground">{entry.partOfSpeech}</span>
        </div>

        {/* Force-refresh button (today only) */}
        {isToday && (
          <button
            onClick={() => loadWord(selectedDate, true)}
            title="Load a different word"
            className="text-muted-foreground hover:text-foreground transition-colors mt-1"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Listen */}
      <Button
        size="sm"
        variant="outline"
        onClick={handleListen}
        className="mt-4 gap-2 border-primary text-primary hover:bg-primary/5"
      >
        <Play className="h-4 w-4" /> Listen
      </Button>

      {/* Definition */}
      <div className="mt-6 rounded-lg bg-green-card-bg border border-green-card-border p-4">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="h-4 w-4 text-success" />
          <span className="text-xs font-semibold uppercase tracking-wider text-success">Definition</span>
        </div>
        <p className="text-body leading-relaxed">{entry.definition}</p>
      </div>

      {/* Example */}
      {entry.example && (
        <p className="mt-4 text-sm italic text-muted-foreground border-l-2 border-green-card-border pl-3">
          "{entry.example}"
        </p>
      )}

      {/* Synonyms / Antonyms */}
      {(entry.synonyms.length > 0 || entry.antonyms.length > 0) && (
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {entry.synonyms.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <ArrowLeftRight className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">Synonyms</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {entry.synonyms.map((s) => (
                  <span key={s} className="rounded-full bg-blue-card-bg px-3 py-1 text-xs font-medium text-primary border border-blue-card-border">{s}</span>
                ))}
              </div>
            </div>
          )}
          {entry.antonyms.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <ArrowLeftRight className="h-3.5 w-3.5 text-destructive" />
                <span className="text-xs font-semibold uppercase tracking-wider text-destructive">Antonyms</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {entry.antonyms.map((a) => (
                  <span key={a} className="rounded-full bg-destructive/5 px-3 py-1 text-xs font-medium text-destructive border border-destructive/20">{a}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Rating + Review */}
      <div className="mt-6 flex items-center gap-4 flex-wrap">
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <button key={s} onClick={() => setRating(s)}>
              <Star className={`h-5 w-5 transition-colors ${s <= rating ? "fill-gold text-gold" : "text-border"}`} />
            </button>
          ))}
        </div>
        <Button
          onClick={handleReviewWord}
          disabled={reviewed}
          className={`rounded-lg ${reviewed ? "bg-success/80" : "bg-success hover:bg-success/90"} text-success-foreground`}
        >
          {reviewed ? "✓ Reviewed" : "Mark as Reviewed"}
        </Button>
      </div>

      {/* Lock notice */}
      {isToday && (
        <p className="mt-4 text-xs text-muted-foreground">
          🔒 Today's word refreshes automatically every 24 hours.
        </p>
      )}

      {/* Multi-language translations */}
      <TranslationsPanel
        key={entry.word}
        word={entry.word}
        definition={entry.definition}
        className="mt-4"
      />
    </div>
  );

  // ── JSX ───────────────────────────────────────────────────────────────────────
  return (
    <div className="container py-8 space-y-8">
      {/* Header */}
      <div className="rounded-xl bg-green-card-bg p-6 border border-green-card-border">
        <div className="flex items-center gap-3">
          <CalendarDays className="h-6 w-6 text-success" />
          <div>
            <h1 className="text-2xl font-bold text-success">Word of the Day</h1>
            <p className="text-muted-foreground mt-0.5">Expand your vocabulary one word at a time</p>
          </div>
        </div>
      </div>

      {/* Clickable Calendar Strip */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Browse Past Words
        </p>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {calendarDays.map((d, i) => {
            const dStr = dateToStr(d);
            const isSelected = dStr === selectedDate;
            const isTodayDay = dStr === todayStr();
            return (
              <button
                key={i}
                onClick={() => setSelectedDate(dStr)}
                className={`flex min-w-[70px] flex-col items-center rounded-xl p-3 text-center transition-all border ${
                  isSelected
                    ? "border-2 border-green-card-border bg-green-card-bg shadow-sm scale-105"
                    : "border-border bg-card hover:bg-muted hover:border-green-card-border/50"
                }`}
              >
                <span className="text-xs text-muted-foreground">
                  {d.toLocaleDateString("en", { weekday: "short" })}
                </span>
                <span className={`text-lg font-bold ${isSelected ? "text-success" : "text-heading"}`}>
                  {d.getDate()}
                </span>
                {isTodayDay && (
                  <span className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-success">Today</span>
                )}
                {!isTodayDay && (
                  <span className="mt-0.5 h-3" /> // spacer to keep height consistent
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Word card */}
      {loading ? (
        <div className="flex flex-col items-center gap-3 py-4">
          <Loader2 className="h-8 w-8 animate-spin text-success" />
          <p className="text-sm text-muted-foreground">Fetching word…</p>
          {renderSkeleton()}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center space-y-4">
          <p className="text-destructive font-medium">{error}</p>
          <Button variant="outline" onClick={() => loadWord(selectedDate)} className="gap-2 border-destructive/40 text-destructive hover:bg-destructive/5">
            <RefreshCw className="h-4 w-4" /> Try Again
          </Button>
        </div>
      ) : wotd ? (
        renderWord(wotd)
      ) : null}
    </div>
  );
}
