import { Link, useNavigate } from "react-router-dom";
import {
  BookOpen, Mic, BarChart3, Calendar, ArrowRight, Play,
  Star, Newspaper, Trophy, FolderOpen, Puzzle, Flame,
  Loader2, Volume2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { modules } from "@/data/mockData";
import { speak } from "@/lib/tts";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { getWordOfTheDay, type DictionaryEntry } from "@/lib/dictionary";

const iconMap: Record<string, React.ElementType> = {
  Mic, Puzzle, Newspaper, Calendar, Trophy, FolderOpen,
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [reviewed, setReviewed] = useState(false);
  const [rating, setRating] = useState(0);
  const firstName = user?.name?.split(" ")[0] ?? "Learner";

  // ── Live Word of the Day ────────────────────────────────────────────────────
  const [wotd, setWotd] = useState<DictionaryEntry | null>(null);
  const [wotdLoading, setWotdLoading] = useState(true);

  useEffect(() => {
    getWordOfTheDay()
      .then((entry) => { setWotd(entry); setWotdLoading(false); })
      .catch(() => setWotdLoading(false));
  }, []);

  const handleListen = () => {
    if (!wotd) return;
    if (wotd.audioUrl) {
      new Audio(wotd.audioUrl).play().catch(() => speak(wotd.word));
    } else {
      speak(wotd.word);
    }
  };

  const handleSaveWord = () => {
    if (!user || !wotd) return;
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
      toast.success(`"${word}" saved to Word Bank!`);
    } else {
      toast.info(`"${word}" is already in your Word Bank`);
    }
  };

  const handleReview = () => {
    setReviewed(true);
    handleSaveWord();
  };

  const stats = [
    { label: "Words Learned", value: user?.wordsLearned ?? 0, icon: BookOpen, color: "blue" as const },
    { label: "Pronunciation", value: user?.pronunciationAccuracy ? `${user.pronunciationAccuracy}%` : "--", icon: Mic, color: "green" as const },
    { label: "Quiz Score", value: user?.weeklyQuizScore ? `${user.weeklyQuizScore}%` : "--", icon: BarChart3, color: "blue" as const },
    { label: "Due Today", value: user?.wordsDueToday ?? 0, icon: Calendar, color: "green" as const },
  ];

  const paths: Record<string, string> = {
    pronunciation: "/pronunciation", decomposer: "/decomposer", news: "/news",
    wotd: "/word-of-day", quiz: "/quiz", categories: "/categories",
  };

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-10 space-y-10">
      {/* Hero Greeting */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-heading">{getGreeting()}, {firstName}</h1>
        <p className="text-muted-foreground">Ready to learn something new today?</p>
        <div className="flex items-center gap-4 mt-1 flex-wrap">
          <div className="flex items-center gap-1.5">
            <Flame className="h-5 w-5 text-gold" />
            <span className="text-sm font-bold text-gold">{user?.currentStreak ?? 0} day streak</span>
          </div>
          {(user?.longestStreak ?? 0) > 0 && (
            <span className="text-xs text-muted-foreground">
              🏆 Best: <strong className="text-heading">{user?.longestStreak}</strong> days
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className={`rounded-xl bg-card p-5 shadow-sm border-l-4 ${
              s.color === "blue" ? "border-l-blue-card-border" : "border-l-green-card-border"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className={`mt-1 text-2xl font-bold ${s.color === "blue" ? "text-primary" : "text-success"}`}>{s.value}</p>
              </div>
              <s.icon className={`h-7 w-7 ${s.color === "blue" ? "text-primary/30" : "text-success/30"}`} />
            </div>
          </div>
        ))}
      </div>

      {/* Word of the Day — live */}
      <div className="rounded-xl border-l-4 border-l-green-card-border bg-card p-6 shadow-md">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-success">Word of the Day</div>
          <Link
            to="/word-of-day"
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            Full details <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {wotdLoading ? (
          /* Skeleton */
          <div className="animate-pulse space-y-3">
            <div className="h-8 w-48 rounded bg-muted" />
            <div className="h-4 w-32 rounded bg-muted" />
            <div className="h-4 w-full rounded bg-muted" />
            <div className="h-4 w-4/5 rounded bg-muted" />
          </div>
        ) : wotd ? (
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-3 flex-1">
              <h2 className="text-3xl font-bold text-heading capitalize">{wotd.word}</h2>
              {wotd.phonetic && (
                <p className="text-muted-foreground font-mono text-sm">{wotd.phonetic}</p>
              )}
              {wotd.partOfSpeech && (
                <span className="text-xs italic text-muted-foreground">{wotd.partOfSpeech}</span>
              )}

              <div className="flex gap-2 pt-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleListen}
                  className="gap-2 border-primary text-primary hover:bg-primary/5"
                >
                  <Play className="h-4 w-4" /> Listen
                </Button>
              </div>

              {/* Synonyms as chips if available */}
              {wotd.synonyms.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {wotd.synonyms.slice(0, 4).map((s) => (
                    <span
                      key={s}
                      className="rounded-full bg-blue-card-bg px-3 py-0.5 text-xs font-medium text-primary border border-blue-card-border"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}

              <p className="text-body leading-relaxed">{wotd.definition}</p>
              {wotd.example && (
                <p className="text-sm italic text-muted-foreground">"{wotd.example}"</p>
              )}
            </div>

            {/* Right side actions */}
            <div className="flex flex-col items-end gap-3 shrink-0">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button key={s} onClick={() => setRating(s)}>
                    <Star className={`h-5 w-5 transition-colors ${s <= rating ? "fill-gold text-gold" : "text-border"}`} />
                  </button>
                ))}
              </div>
              <Button
                onClick={handleReview}
                disabled={reviewed}
                className={`rounded-lg ${reviewed ? "bg-success/80" : "bg-success hover:bg-success/90"} text-success-foreground`}
              >
                {reviewed ? "✓ Reviewed" : "Mark as Reviewed"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleSaveWord}
                className="border-success text-success hover:bg-success/5"
              >
                Save to Word Bank
              </Button>
            </div>
          </div>
        ) : (
          /* Fallback if API failed */
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground mb-3">Could not load today's word.</p>
            <Button size="sm" variant="outline" onClick={() => navigate("/word-of-day")} className="gap-2 text-primary border-primary">
              Open Word of the Day <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>

      {/* Practice for Capgemini Feature */}
      <div className="rounded-xl border border-border bg-card shadow-sm p-6 flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-md transition-all fade-in bg-gradient-to-br from-card to-primary/5">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎯</span>
            <h2 className="text-2xl font-bold text-heading">Practice for Capgemini</h2>
          </div>
          <p className="text-muted-foreground leading-relaxed max-w-2xl">
            Prepare for verbal ability tests with topic-wise practice and timed mock tests covering grammar, vocabulary, sentence correction, idioms, reading comprehension and more.
          </p>
        </div>
        <Button onClick={() => navigate("/quiz?tab=capgemini")} className="shrink-0 group px-8 py-6 text-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm">
          Practice Now <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
        </Button>
      </div>

      {/* Capgemini Pronunciation Practice Promo */}
      <div className="rounded-xl border border-border bg-card shadow-sm p-6 flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-md transition-all fade-in bg-gradient-to-br from-card to-success/5">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎯</span>
            <h2 className="text-2xl font-bold text-heading">Practice for Capgemini English</h2>
          </div>
          <p className="text-muted-foreground leading-relaxed max-w-2xl">
            Build better pronunciation, speaking fluency and English communication skills with guided Capgemini-style practice.
          </p>
        </div>
        <Button onClick={() => navigate("/pronunciation?tab=capgemini")} className="shrink-0 group px-8 py-6 text-lg bg-success hover:bg-success/90 text-success-foreground shadow-sm">
          Practice Now <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
        </Button>
      </div>

      {/* Module Cards */}
      <div>
        <h2 className="mb-4 text-xl font-bold text-heading">Modules</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((m) => {
            const Icon = iconMap[m.icon] || BookOpen;
            return (
              <Link
                key={m.id}
                to={paths[m.id] || "/"}
                className={`group flex items-center gap-4 rounded-xl border-l-4 bg-card p-5 shadow-sm transition-all hover:shadow-md ${
                  m.color === "blue" ? "border-l-blue-card-border" : "border-l-green-card-border"
                }`}
              >
                <div className={`rounded-lg p-2.5 ${m.color === "blue" ? "bg-blue-card-bg" : "bg-green-card-bg"}`}>
                  <Icon className={`h-5 w-5 ${m.color === "blue" ? "text-primary" : "text-success"}`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-heading">{m.title}</h3>
                  <p className="text-sm text-muted-foreground">{m.subtitle}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
