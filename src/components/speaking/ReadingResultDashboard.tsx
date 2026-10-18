import { ReadingAnalysisResult } from "@/services/nlp/speechAnalysisService";
import { CheckCircle2, AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { speak } from "@/lib/tts";

interface ReadingResultDashboardProps {
  result: ReadingAnalysisResult;
  onRetry: () => void;
}

export default function ReadingResultDashboard({ result, onRetry }: ReadingResultDashboardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-success";
    if (score >= 60) return "text-primary";
    return "text-destructive";
  };

  const getRating = (score: number) => {
    if (score >= 90) return "Excellent! 🏆";
    if (score >= 80) return "Nice! 🌟";
    if (score >= 70) return "Good! 👍";
    if (score >= 60) return "Still Needs Improvement 💪";
    if (score >= 50) return "You Can Do Better! 🚀";
    return "Let's Practice More 🌱";
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-8 shadow-xl max-w-2xl mx-auto space-y-8 fade-in">
      <div className="text-center space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Reading Review</h2>
        <h3 className="text-3xl font-bold text-heading">{getRating(result.scores.overall)}</h3>
        <div className="flex items-center justify-center gap-2">
          <span className={`text-6xl font-black ${getScoreColor(result.scores.overall)}`}>{result.scores.overall}</span>
          <span className="text-2xl text-muted-foreground font-medium">/ 100</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-border">
        <div className="text-center p-4 bg-muted/30 rounded-xl">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Read</p>
          <p className="text-xl font-bold text-heading">{result.stats.wordsRead}</p>
        </div>
        <div className="text-center p-4 bg-muted/30 rounded-xl">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Skipped</p>
          <p className={`text-xl font-bold ${result.stats.skippedWords > 5 ? 'text-destructive' : 'text-heading'}`}>
            {result.stats.skippedWords}
          </p>
        </div>
        <div className="text-center p-4 bg-muted/30 rounded-xl">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Pacing</p>
          <p className={`text-xl font-bold ${getScoreColor(result.scores.pacing)}`}>{result.scores.pacing}</p>
        </div>
        <div className="text-center p-4 bg-muted/30 rounded-xl">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Clarity</p>
          <p className={`text-xl font-bold ${getScoreColor(result.scores.clarity)}`}>{result.scores.clarity}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        <div className="space-y-4">
          <h4 className="flex items-center gap-2 font-bold text-success text-lg">
            <CheckCircle2 className="h-5 w-5" /> What You Did Well
          </h4>
          <ul className="space-y-2">
            {result.feedback.strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-body">
                <span className="text-success font-bold mt-0.5">✓</span> {s}
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-4">
          <h4 className="flex items-center gap-2 font-bold text-destructive text-lg">
            <AlertTriangle className="h-5 w-5" /> Work On These
          </h4>
          <ul className="space-y-2">
            {result.feedback.weaknesses.map((w, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-body">
                <span className="text-destructive font-bold mt-0.5">⚠</span> {w}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {result.problemWords && result.problemWords.length > 0 && (
        <div className="pt-6 border-t border-border space-y-4">
          <h4 className="font-bold text-heading text-lg">Recommended Practice</h4>
          <p className="text-sm text-muted-foreground">Some words may have been recognized, but your pronunciation may need improvement. Try listening to them and repeating them slowly.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {result.problemWords.map((word, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                <span className="font-semibold text-primary capitalize">{word}</span>
                <Button size="sm" variant="outline" onClick={() => speak(word)}>🔊 Listen</Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="pt-4 flex justify-center">
        <Button onClick={onRetry} size="lg" className="gap-2">
          <RotateCcw className="h-5 w-5" /> Read Again
        </Button>
      </div>
    </div>
  );
}
