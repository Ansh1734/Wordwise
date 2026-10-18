import { RefreshCcw, CheckCircle2, Target } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FluencyScoreProps {
  score: number;
  rating: string;
  breakdown: {
    pacing: number;
    fillers: number;
    clarity: number;
    grammar: number;
    vocabulary: number;
  };
  recommendations: string[];
  onRetry: () => void;
}

export default function FluencyScore({ score, rating, breakdown, recommendations, onRetry }: FluencyScoreProps) {
  const getScoreColor = (s: number) => {
    if (s >= 80) return "text-success";
    if (s >= 60) return "text-primary";
    return "text-destructive";
  };

  const getScoreBg = (s: number) => {
    if (s >= 80) return "bg-success/20";
    if (s >= 60) return "bg-primary/20";
    return "bg-destructive/20";
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm max-w-2xl w-full mx-auto fade-in space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-heading uppercase tracking-wider">{rating}</h2>
        <div className="flex items-center justify-center gap-2">
          <span className={`text-5xl font-black ${getScoreColor(score)}`}>{score}</span>
          <span className="text-2xl text-muted-foreground font-medium">/ 100</span>
        </div>
        <p className="text-muted-foreground font-medium">Speaking Fluency</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(breakdown).map(([key, val]) => (
          <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
            <span className="capitalize font-medium text-heading">{key}</span>
            <div className="flex items-center gap-3">
              <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${val >= 80 ? 'bg-success' : val >= 60 ? 'bg-primary' : 'bg-destructive'}`} 
                  style={{ width: `${val}%` }} 
                />
              </div>
              <span className={`font-bold w-8 text-right ${getScoreColor(val)}`}>{val}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border">
        <div className="space-y-3">
          <h3 className="font-semibold text-heading flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-success" /> 
            What you're doing well
          </h3>
          <ul className="space-y-2">
            {Object.entries(breakdown)
              .filter(([_, val]) => val >= 75)
              .slice(0, 3)
              .map(([key]) => (
                <li key={key} className="text-sm text-muted-foreground flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
                  Strong {key}
                </li>
              ))}
            {Object.entries(breakdown).filter(([_, val]) => val >= 75).length === 0 && (
              <li className="text-sm text-muted-foreground">Keep practicing to build strengths!</li>
            )}
          </ul>
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold text-heading flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" /> 
            Work on next
          </h3>
          <ul className="space-y-2">
            {recommendations.map((rec, i) => (
              <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="text-primary mt-0.5">→</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex justify-center pt-4">
        <Button onClick={onRetry} className="gap-2 px-8">
          <RefreshCcw className="h-4 w-4" /> Try Again
        </Button>
      </div>
    </div>
  );
}
