import { GrammarCorrection } from "@/services/nlp/grammarAnalyzer";

interface TranscriptViewerProps {
  transcript: string;
  errors: GrammarCorrection[];
  fillerWords: string[];
}

export default function TranscriptViewer({ transcript, errors, fillerWords }: TranscriptViewerProps) {
  // Simple word-by-word tokenization to highlight fillers and errors
  // A robust implementation would map errors strictly by indices, but word matching is okay for MVP
  
  let highlightedElements: React.ReactNode[] = [];
  
  // We'll highlight the whole transcript if it's simple, or just list errors below
  // For safety, let's just render the text and then an interactive list of corrections.

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm max-w-2xl w-full mx-auto space-y-6">
      <div>
        <h3 className="text-lg font-bold text-heading mb-3">Your Transcript</h3>
        <p className="text-muted-foreground leading-relaxed p-4 bg-muted/30 rounded-lg border border-border/50">
          {transcript}
        </p>
      </div>
      
      {errors.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-heading text-destructive flex items-center gap-2">
            Grammar Corrections
          </h3>
          <div className="grid gap-3">
            {errors.map((err, i) => (
              <div key={i} className="p-4 rounded-lg bg-destructive/5 border border-destructive/20 space-y-2">
                <div className="flex items-start gap-2 text-sm">
                  <span className="text-destructive font-semibold min-w-16">You said:</span>
                  <span className="line-through text-muted-foreground">{err.original}</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <span className="text-success font-semibold min-w-16">Correction:</span>
                  <span className="font-medium text-heading">{err.correction}</span>
                </div>
                <div className="text-sm text-muted-foreground mt-2 pt-2 border-t border-destructive/10">
                  <span className="font-semibold text-primary mr-1">{err.pattern.replace(/_/g, ' ')}:</span> 
                  {err.explanation}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {errors.length === 0 && (
        <div className="p-4 rounded-lg bg-success/10 border border-success/20 text-success text-sm font-medium">
          Great job! No major grammar mistakes were detected in your speech.
        </div>
      )}
    </div>
  );
}
