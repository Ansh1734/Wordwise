import { useState } from "react";
import { Button } from "@/components/ui/button";
import { GrammarExercise } from "@/services/nlp/grammarExerciseGenerator";
import { CheckCircle2, XCircle } from "lucide-react";

interface GrammarQuestionProps {
  exercise: GrammarExercise;
  onAnswer: (isCorrect: boolean) => void;
}

export default function GrammarQuestion({ exercise, onAnswer }: GrammarQuestionProps) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [textInput, setTextInput] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const handleSubmit = () => {
    let correct = false;
    if (exercise.level === 1) {
      correct = selectedOption === exercise.correctAnswer;
    } else if (exercise.level === 2 || exercise.level === 3) {
      // Basic string matching, ideally would use NLP or fuzzy matching
      const target = String(exercise.correctAnswer).toLowerCase().trim();
      const input = textInput.toLowerCase().trim();
      // Remove punctuation for easier matching
      const cleanTarget = target.replace(/[.,!?]/g, "");
      const cleanInput = input.replace(/[.,!?]/g, "");
      correct = cleanInput === cleanTarget;
    } else {
      // Level 4 production: assume correct for MVP if they wrote something reasonable
      correct = textInput.trim().split(" ").length > 3;
    }
    
    setIsCorrect(correct);
    setShowResult(true);
    onAnswer(correct);
  };

  if (showResult) {
    return (
      <div className="space-y-6 fade-in p-6 bg-card border border-border rounded-xl">
        <div className="flex items-center gap-3">
          {isCorrect ? <CheckCircle2 className="h-8 w-8 text-success" /> : <XCircle className="h-8 w-8 text-destructive" />}
          <h3 className={`text-xl font-bold ${isCorrect ? 'text-success' : 'text-destructive'}`}>
            {isCorrect ? 'Correct!' : 'Not quite right.'}
          </h3>
        </div>
        
        <div className="p-4 rounded-lg bg-muted/30 border border-border/50 text-heading text-lg">
          {exercise.level !== 4 && (
            <p><span className="text-muted-foreground text-sm block mb-1">Correct Answer:</span> {
              exercise.level === 1 && exercise.options 
                ? exercise.options[exercise.correctAnswer as number]
                : exercise.correctAnswer
            }</p>
          )}
        </div>
        
        <div className="p-4 rounded-lg bg-blue-card-bg border border-blue-card-border">
          <span className="text-primary font-semibold block mb-1">Explanation:</span>
          <p className="text-sm text-heading">{exercise.explanation}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in p-6 bg-card border border-border rounded-xl">
      <div className="flex justify-between items-center mb-4">
        <span className="text-xs font-bold px-3 py-1 bg-primary/10 text-primary rounded-full uppercase tracking-wider">
          Level {exercise.level}
        </span>
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          {exercise.pattern.replace(/_/g, ' ')}
        </span>
      </div>
      
      <p className="text-xl font-medium text-heading mb-6">{exercise.question}</p>

      {exercise.level === 1 && exercise.options && (
        <div className="grid gap-3">
          {exercise.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => setSelectedOption(i)}
              className={`p-4 rounded-lg text-left transition-all border ${
                selectedOption === i 
                  ? 'border-primary bg-primary/10 text-primary font-medium' 
                  : 'border-border bg-background hover:border-primary/50 text-heading'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}

      {(exercise.level === 2 || exercise.level === 3 || exercise.level === 4) && (
        <textarea
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          placeholder={exercise.level === 4 ? "Write your sentence here..." : "Type the correct answer..."}
          className="w-full p-4 rounded-lg border border-border bg-background text-heading focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none h-32"
        />
      )}

      <div className="pt-4 flex justify-end">
        <Button 
          onClick={handleSubmit} 
          disabled={exercise.level === 1 ? selectedOption === null : !textInput.trim()}
          className="px-8"
        >
          Submit Answer
        </Button>
      </div>
    </div>
  );
}
