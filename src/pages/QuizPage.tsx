import { useState, useEffect, useCallback, useRef } from "react";
import { CheckCircle2, XCircle, RotateCcw, Newspaper, Loader2, Sparkles, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { quizQuestions as defaultQuizQuestions } from "@/data/mockData";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { generateQuizFromWords } from "@/lib/gemini";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CapgeminiHub } from "@/components/quiz/CapgeminiHub";

const TIMER_SECONDS = 20;

interface Question {
  id: number;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

function RegularQuiz() {
  const { user, updateUser } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [finished, setFinished] = useState(false);

  // ── Timer state ─────────────────────────────────────────────────────────────
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const [timedOut, setTimedOut] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const wordBank = user?.wordBank ?? [];
  const wordBankCount = wordBank.length;

  // ── Fetch quiz ───────────────────────────────────────────────────────────────
  const fetchDynamicQuiz = useCallback(async () => {
    if (wordBankCount < 5) return;
    setLoading(true);
    try {
      const words = wordBank.map((w: any) => typeof w === "string" ? w : w.word);
      const shuffledWords = [...words].sort(() => 0.5 - Math.random()).slice(0, 15);
      const generatedQuestions = await generateQuizFromWords(shuffledWords);
      setQuestions(generatedQuestions);
    } catch (error) {
      console.error("Failed to fetch dynamic quiz:", error);
      toast.error("Could not generate personalized quiz. Using standard questions.");
      setQuestions(defaultQuizQuestions);
    } finally {
      setLoading(false);
    }
  }, [wordBankCount, wordBank]);

  useEffect(() => {
    if (wordBankCount >= 5 && questions.length === 0 && !loading) {
      fetchDynamicQuiz();
    }
  }, [wordBankCount, questions.length, loading, fetchDynamicQuiz]);

  // ── Timer logic ──────────────────────────────────────────────────────────────
  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    setTimeLeft(TIMER_SECONDS);
    setTimedOut(false);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Time's up — auto-advance with null answer
          setTimedOut(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [stopTimer]);

  // Start timer whenever question changes (and quiz is active)
  useEffect(() => {
    const currentQuestions = questions.length > 0 ? questions : defaultQuizQuestions;
    if (!finished && currentQuestions.length > 0 && !loading) {
      startTimer();
    }
    return stopTimer;
  }, [currentQ, finished, loading, questions.length]);

  // When timed out → lock answer as null and show timeout state
  useEffect(() => {
    if (timedOut && selected === null) {
      stopTimer();
      setSelected(-1); // -1 = timed out, no selection
    }
  }, [timedOut, selected, stopTimer]);

  // Stop timer once user selects an answer
  const handleSelect = (idx: number) => {
    if (selected !== null) return;
    stopTimer();
    setSelected(idx);
  };

  const handleNext = () => {
    const ans = selected === -1 ? null : selected; // treat timeout as null
    const newAnswers = [...answers, ans];
    setAnswers(newAnswers);
    setSelected(null);
    setTimedOut(false);

    const currentQuestions = questions.length > 0 ? questions : defaultQuizQuestions;
    if (currentQ + 1 >= currentQuestions.length) {
      setFinished(true);
      stopTimer();
      const correct = newAnswers.filter((a, i) => a === currentQuestions[i].correct).length;
      const score = Math.round((correct / currentQuestions.length) * 100);
      if (user) {
        updateUser({
          weeklyQuizScore: score,
          quizHistory: [...(user.quizHistory || []), score],
        });
      }
      toast.info("Quiz submitted!");
    } else {
      setCurrentQ((c) => c + 1);
    }
  };

  const handleRestart = () => {
    setQuestions([]);
    setCurrentQ(0);
    setSelected(null);
    setAnswers([]);
    setFinished(false);
    setTimedOut(false);
    fetchDynamicQuiz();
  };

  // ── Not enough words ─────────────────────────────────────────────────────────
  if (wordBankCount < 5) {
    return (
      <div className="container py-16 text-center space-y-4 fade-in">
        <Newspaper className="mx-auto h-16 w-16 text-success/30" />
        <h2 className="text-xl font-bold text-heading">Not enough words yet</h2>
        <p className="text-muted-foreground">You need at least 5 words in your word bank to take a personalized quiz.</p>
        <Link to="/news">
          <Button className="mt-2 bg-success text-success-foreground hover:bg-success/90">Go to News Reader</Button>
        </Link>
      </div>
    );
  }

  // ── Loading ───────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="container py-32 flex flex-col items-center justify-center space-y-6 fade-in">
        <div className="relative">
          <div className="absolute -inset-4 rounded-full bg-primary/20 animate-ping" />
          <Sparkles className="h-16 w-16 text-primary animate-pulse" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-heading">Analyzing Your Word Bank...</h2>
          <p className="text-muted-foreground flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            AI is crafting your personalized vocabulary quiz
          </p>
        </div>
      </div>
    );
  }

  const currentQuestions = questions.length > 0 ? questions : defaultQuizQuestions;
  const question = currentQuestions[currentQ];
  const progress = ((currentQ + (selected !== null ? 1 : 0)) / currentQuestions.length) * 100;

  // ── Results ───────────────────────────────────────────────────────────────────
  const correctCount = answers.filter((a, i) => a === currentQuestions[i].correct).length;
  const scorePercent = Math.round((correctCount / currentQuestions.length) * 100);

  if (finished) {
    return (
      <div className="container py-8 max-w-2xl space-y-8 fade-in">
        <div className="text-center space-y-6">
          <h1 className="text-2xl font-bold text-heading">Quiz Complete!</h1>
          <div className="mx-auto relative h-40 w-40">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" strokeWidth="8" className="stroke-border" />
              <circle cx="50" cy="50" r="45" fill="none" strokeWidth="8" strokeDasharray={`${scorePercent * 2.83} 283`} className="stroke-primary transition-all duration-1000" strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl font-bold text-heading">{scorePercent}%</span>
            </div>
          </div>
          <div className="flex justify-center gap-6">
            <div className="text-center"><p className="text-2xl font-bold text-primary">{correctCount}</p><p className="text-sm text-muted-foreground">Correct</p></div>
            <div className="text-center"><p className="text-2xl font-bold text-destructive">{currentQuestions.length - correctCount}</p><p className="text-sm text-muted-foreground">Incorrect / Skipped</p></div>
          </div>
        </div>
        <div className="space-y-3">
          <h3 className="font-semibold text-heading">Review</h3>
          {currentQuestions.map((q, i) => {
            if (answers[i] === q.correct) return null;
            return (
              <div key={q.id} className="rounded-xl bg-card p-4 shadow-sm border border-border">
                <p className="font-medium text-heading">{q.question}</p>
                <p className="mt-1 text-sm text-success">Correct: {q.options[q.correct]}</p>
                {answers[i] === null && (
                  <p className="mt-1 text-xs text-gold font-medium">⏱ Time ran out</p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">{q.explanation}</p>
              </div>
            );
          })}
        </div>
        <div className="text-center">
          <Button onClick={handleRestart} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
            <RotateCcw className="h-4 w-4" /> New AI Quiz
          </Button>
        </div>
      </div>
    );
  }

  if (!question) return null;

  // ── Timer ring colour ─────────────────────────────────────────────────────────
  const timerFraction = timeLeft / TIMER_SECONDS;
  const timerColor =
    timerFraction > 0.5 ? "text-success" :
    timerFraction > 0.25 ? "text-gold" : "text-destructive";
  const ringColor =
    timerFraction > 0.5 ? "stroke-success" :
    timerFraction > 0.25 ? "stroke-gold" : "stroke-destructive";
  const circumference = 2 * Math.PI * 20; // r=20
  const dashOffset = circumference * (1 - timerFraction);

  return (
    <div className="container py-8 max-w-2xl space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-1 border-b border-border pb-4">
        <div className="flex items-center gap-2 text-primary">
          <Sparkles className="h-4 w-4 animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">AI Powered Learning</span>
        </div>
        <h1 className="text-3xl font-bold text-heading tracking-tight">Personalized Quiz</h1>
        <p className="text-muted-foreground text-sm">Reviewing {wordBankCount} words from your collection</p>
      </div>

      {/* Progress bar + Timer row */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          {/* Progress text */}
          <div className="flex justify-between text-sm text-muted-foreground flex-1">
            <span>Question {currentQ + 1} of {currentQuestions.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>

          {/* Circular countdown */}
          <div className={`relative flex items-center justify-center shrink-0 ${timerColor}`} title={`${timeLeft}s remaining`}>
            <svg width="52" height="52" viewBox="0 0 52 52" className="-rotate-90">
              <circle cx="26" cy="26" r="20" fill="none" strokeWidth="4" className="stroke-muted" />
              <circle
                cx="26" cy="26" r="20" fill="none" strokeWidth="4"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                className={`${ringColor} transition-all duration-1000`}
              />
            </svg>
            <div className="absolute flex flex-col items-center leading-none">
              <Clock className="h-3 w-3 mb-0.5" />
              <span className="text-xs font-bold tabular-nums">{timeLeft}</span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2 w-full rounded-full bg-muted">
          <div className="h-2 rounded-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Question card */}
      <div className="rounded-xl bg-card p-8 shadow-md border border-border fade-in" key={currentQ}>
        {/* Timeout banner */}
        {timedOut && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-gold/10 border border-gold/30 px-4 py-2 text-sm font-semibold text-gold">
            <Clock className="h-4 w-4" />
            Time's up! The correct answer is highlighted below.
          </div>
        )}

        <h2 className="text-xl font-bold text-heading mb-6">{question.question}</h2>
        <div className="space-y-3">
          {question.options.map((opt, i) => {
            let classes = "w-full rounded-lg border border-border bg-card p-4 text-left font-medium text-heading transition-all hover:bg-blue-card-bg";
            if (selected !== null) {
              if (i === question.correct) {
                classes = "w-full rounded-lg border-2 border-green-card-border bg-green-card-bg p-4 text-left font-medium text-success";
              } else if (i === selected && selected !== -1) {
                classes = "w-full rounded-lg border-2 border-destructive bg-destructive/5 p-4 text-left font-medium text-destructive";
              }
            }
            return (
              <button key={i} onClick={() => handleSelect(i)} className={classes} disabled={selected !== null}>
                <div className="flex items-center justify-between">
                  <span>{opt}</span>
                  {selected !== null && i === question.correct && <CheckCircle2 className="h-5 w-5 text-success" />}
                  {selected !== null && i === selected && selected !== -1 && i !== question.correct && <XCircle className="h-5 w-5 text-destructive" />}
                </div>
              </button>
            );
          })}
        </div>

        {selected !== null && (
          <div className="mt-4 fade-in">
            <p className="text-sm text-muted-foreground mb-3">{question.explanation}</p>
            <Button onClick={handleNext} className="bg-primary text-primary-foreground hover:bg-primary/90">
              {currentQ + 1 >= currentQuestions.length ? "See Results" : "Next Question"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function QuizPage() {
  const tab = new URLSearchParams(window.location.search).get("tab") || "regular";
  
  return (
    <div className="container py-8 max-w-4xl mx-auto fade-in">
      <Tabs defaultValue={tab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8 h-12">
          <TabsTrigger value="regular" className="text-base h-full">Regular AI Quiz</TabsTrigger>
          <TabsTrigger value="capgemini" className="text-base h-full">🎯 Practice for Capgemini with Us</TabsTrigger>
        </TabsList>
        <TabsContent value="regular" className="mt-0">
          <RegularQuiz />
        </TabsContent>
        <TabsContent value="capgemini" className="mt-0">
          <CapgeminiHub />
        </TabsContent>
      </Tabs>
    </div>
  );
}
