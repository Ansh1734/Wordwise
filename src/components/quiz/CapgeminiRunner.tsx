import { useState, useEffect, useCallback, useRef } from "react";
import { CheckCircle2, XCircle, Clock, RotateCcw, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CapgeminiQuestion } from "@/data/capgeminiQuestions";

interface Props {
  questions: CapgeminiQuestion[];
  isMock: boolean;
  onExit: () => void;
}

const TIMER_SECONDS = 30; // 30 seconds per question for mock test

export function CapgeminiRunner({ questions, isMock, onExit }: Props) {
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [finished, setFinished] = useState(false);

  // Timer logic for Mock Test
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const [timedOut, setTimedOut] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    if (!isMock) return;
    stopTimer();
    setTimeLeft(TIMER_SECONDS);
    setTimedOut(false);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setTimedOut(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [isMock, stopTimer]);

  useEffect(() => {
    if (!finished && isMock) {
      startTimer();
    }
    return stopTimer;
  }, [currentQ, finished, isMock, startTimer, stopTimer]);

  useEffect(() => {
    if (timedOut && selected === null && isMock) {
      stopTimer();
      setSelected(-1); // timed out
    }
  }, [timedOut, selected, isMock, stopTimer]);

  const handleSelect = (idx: number) => {
    if (selected !== null) return;
    stopTimer();
    setSelected(idx);
  };

  const handleNext = () => {
    const ans = selected === -1 ? null : selected;
    const newAnswers = [...answers, ans];
    setAnswers(newAnswers);
    setSelected(null);
    setTimedOut(false);

    if (currentQ + 1 >= questions.length) {
      setFinished(true);
      stopTimer();
    } else {
      setCurrentQ((c) => c + 1);
    }
  };

  if (finished) {
    const correctCount = answers.filter((a, i) => a !== null && questions[i].options[a] === questions[i].answer).length;
    const scorePercent = Math.round((correctCount / questions.length) * 100);

    return (
      <div className="container py-8 max-w-2xl space-y-8 fade-in mx-auto">
        <div className="text-center space-y-6">
          <h1 className="text-3xl font-bold text-heading">{isMock ? "Mock Test Complete!" : "Practice Complete!"}</h1>
          
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
            <div className="text-center"><p className="text-2xl font-bold text-destructive">{questions.length - correctCount}</p><p className="text-sm text-muted-foreground">Incorrect / Missed</p></div>
          </div>
        </div>
        
        <div className="space-y-4">
          <h3 className="font-semibold text-xl text-heading border-b pb-2">Review Answers</h3>
          {questions.map((q, i) => {
            const isCorrect = answers[i] !== null && q.options[answers[i] as number] === q.answer;
            return (
              <div key={q.id} className={`rounded-xl p-4 shadow-sm border ${isCorrect ? 'border-success/30 bg-success/5' : 'border-destructive/30 bg-destructive/5'}`}>
                <div className="flex justify-between items-start gap-4">
                  <p className="font-medium text-heading">{q.question}</p>
                  {isCorrect ? <CheckCircle2 className="h-5 w-5 text-success shrink-0" /> : <XCircle className="h-5 w-5 text-destructive shrink-0" />}
                </div>
                <div className="mt-2 space-y-1">
                  <p className="text-sm"><span className="text-muted-foreground">Your Answer:</span> {answers[i] !== null ? q.options[answers[i] as number] : <span className="text-gold italic">Time ran out</span>}</p>
                  {!isCorrect && <p className="text-sm"><span className="text-muted-foreground">Correct Answer:</span> <span className="text-success font-medium">{q.answer}</span></p>}
                </div>
                {q.explanation && (
                  <p className="mt-3 text-xs text-muted-foreground bg-background p-2 rounded-md">{q.explanation}</p>
                )}
              </div>
            );
          })}
        </div>
        
        <div className="text-center">
          <Button onClick={onExit} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-6 text-lg">
            Back to Capgemini Hub
          </Button>
        </div>
      </div>
    );
  }

  const question = questions[currentQ];
  const progress = ((currentQ + (selected !== null ? 1 : 0)) / questions.length) * 100;
  
  const timerFraction = timeLeft / TIMER_SECONDS;
  const timerColor = timerFraction > 0.5 ? "text-success" : timerFraction > 0.25 ? "text-gold" : "text-destructive";
  const ringColor = timerFraction > 0.5 ? "stroke-success" : timerFraction > 0.25 ? "stroke-gold" : "stroke-destructive";
  const circumference = 2 * Math.PI * 20;
  const dashOffset = circumference * (1 - timerFraction);

  const correctAnswerIndex = question.options.findIndex(opt => opt === question.answer);

  return (
    <div className="container py-4 max-w-2xl space-y-8 mx-auto fade-in">
      <div className="flex items-center justify-between mb-4">
         <Button variant="ghost" onClick={onExit} size="sm">← Exit</Button>
         <div className="text-sm font-bold text-muted-foreground bg-muted px-3 py-1 rounded-full uppercase tracking-wider">{question.category}</div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex justify-between text-sm text-muted-foreground flex-1">
            <span>Question {currentQ + 1} of {questions.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>

          {isMock && (
            <div className={`relative flex items-center justify-center shrink-0 ${timerColor}`} title={`${timeLeft}s remaining`}>
              <svg width="52" height="52" viewBox="0 0 52 52" className="-rotate-90">
                <circle cx="26" cy="26" r="20" fill="none" strokeWidth="4" className="stroke-muted" />
                <circle cx="26" cy="26" r="20" fill="none" strokeWidth="4" strokeDasharray={circumference} strokeDashoffset={dashOffset} strokeLinecap="round" className={`${ringColor} transition-all duration-1000`} />
              </svg>
              <div className="absolute flex flex-col items-center leading-none">
                <Clock className="h-3 w-3 mb-0.5" />
                <span className="text-xs font-bold tabular-nums">{timeLeft}</span>
              </div>
            </div>
          )}
        </div>
        <div className="h-2 w-full rounded-full bg-muted">
          <div className="h-2 rounded-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="rounded-xl bg-card p-6 md:p-8 shadow-md border border-border">
        {timedOut && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-gold/10 border border-gold/30 px-4 py-2 text-sm font-semibold text-gold">
            <Clock className="h-4 w-4" /> Time's up! The correct answer is highlighted below.
          </div>
        )}

        <h2 className="text-xl md:text-2xl font-bold text-heading mb-6">{question.question}</h2>
        
        <div className="space-y-3">
          {question.options.map((opt, i) => {
            // Determine styles
            let classes = "w-full rounded-lg border border-border bg-card p-4 text-left font-medium text-heading transition-all hover:bg-blue-card-bg";
            if (selected !== null) {
              if (i === correctAnswerIndex) {
                classes = "w-full rounded-lg border-2 border-green-card-border bg-green-card-bg p-4 text-left font-medium text-success";
              } else if (i === selected && selected !== -1) {
                classes = "w-full rounded-lg border-2 border-destructive bg-destructive/5 p-4 text-left font-medium text-destructive";
              }
            }
            return (
              <button key={i} onClick={() => handleSelect(i)} className={classes} disabled={selected !== null}>
                <div className="flex items-center justify-between">
                  <span>{opt}</span>
                  {selected !== null && i === correctAnswerIndex && <CheckCircle2 className="h-5 w-5 text-success" />}
                  {selected !== null && i === selected && selected !== -1 && i !== correctAnswerIndex && <XCircle className="h-5 w-5 text-destructive" />}
                </div>
              </button>
            );
          })}
        </div>

        {selected !== null && (
          <div className="mt-6 fade-in border-t pt-4">
            {question.explanation && !isMock && (
              <div className="mb-4 p-4 bg-muted/50 rounded-lg">
                <p className="text-sm font-semibold text-heading mb-1">Explanation:</p>
                <p className="text-sm text-muted-foreground">{question.explanation}</p>
              </div>
            )}
            <Button onClick={handleNext} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-6 text-lg">
              {currentQ + 1 >= questions.length ? "Submit Test" : "Next Question"} <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
