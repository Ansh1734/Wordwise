import { useAuth } from "@/contexts/AuthContext";
import { BookOpen, Target, Flame } from "lucide-react";

export default function GrammarProgress() {
  const { user } = useAuth();
  
  if (!user || !user.grammarProfile) return null;

  const profile = user.grammarProfile;
  const patterns = Object.keys(profile);
  
  if (patterns.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm text-center">
        <h3 className="text-lg font-bold text-heading mb-2">Grammar Profile</h3>
        <p className="text-muted-foreground">Start practicing speaking or writing to build your grammar profile!</p>
      </div>
    );
  }

  // Sort by score ascending (weakest first)
  const sortedPatterns = patterns.sort((a, b) => profile[a].score - profile[b].score);

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-xl bg-primary/10">
          <BookOpen className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-heading">Grammar Profile</h3>
          <p className="text-sm text-muted-foreground">Your strengths and areas for improvement</p>
        </div>
      </div>

      <div className="space-y-4">
        {sortedPatterns.map(pattern => {
          const stats = profile[pattern];
          const isWeak = stats.score < 60;
          const isStrong = stats.score >= 80;
          
          return (
            <div key={pattern} className="flex flex-col gap-2 p-3 rounded-lg bg-background border border-border">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-heading capitalize flex items-center gap-2">
                  {isWeak && <Target className="h-4 w-4 text-destructive" />}
                  {isStrong && <Flame className="h-4 w-4 text-success" />}
                  {pattern.replace(/_/g, ' ')}
                </span>
                <span className={`font-bold ${isStrong ? 'text-success' : isWeak ? 'text-destructive' : 'text-primary'}`}>
                  {stats.score}/100
                </span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${isStrong ? 'bg-success' : isWeak ? 'bg-destructive' : 'bg-primary'}`} 
                  style={{ width: `${stats.score}%` }} 
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Correct: {stats.correct}</span>
                <span>Mistakes: {stats.mistakes}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
