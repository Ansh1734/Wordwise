import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { generateGrammarExerciseBatch, GrammarExercise } from "@/services/nlp/grammarExerciseGenerator";
import GrammarQuestion from "./GrammarQuestion";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GrammarTrainer() {
  const { user, updateGrammarProfile } = useAuth();
  const [exercise, setExercise] = useState<GrammarExercise | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionScore, setSessionScore] = useState({ correct: 0, total: 0 });

  const [exerciseQueue, setExerciseQueue] = useState<GrammarExercise[]>([]);
  const [questionPool, setQuestionPool] = useState<GrammarExercise[]>([]);

  const getTargetPatternAndLevel = () => {
    let targetPattern = "simple_past";
    let level = 1;

    if (user && user.grammarProfile) {
      const patterns = Object.keys(user.grammarProfile);
      if (patterns.length > 0) {
        const weakest = patterns.sort((a, b) => user.grammarProfile![a].score - user.grammarProfile![b].score)[0];
        targetPattern = weakest;
        const score = user.grammarProfile[weakest].score;
        if (score > 80) level = 4;
        else if (score > 60) level = 3;
        else if (score > 40) level = 2;
        else level = 1;
      }
    }
    return { targetPattern, level };
  };

  const loadNextQuestion = async () => {
    if (exerciseQueue.length > 0) {
      const nextEx = exerciseQueue[0];
      setExercise(nextEx);
      
      let nextQueue = exerciseQueue.slice(1);
      if (nextQueue.length <= 2 && questionPool.length > 0) {
        const shuffled = [...questionPool].sort(() => Math.random() - 0.5);
        nextQueue = [...nextQueue, ...shuffled];
      }
      setExerciseQueue(nextQueue);
      return;
    }

    setLoading(true);
    setError(null);
    setExercise(null);
    try {
      const { targetPattern, level } = getTargetPatternAndLevel();
      const exBatch = await generateGrammarExerciseBatch(targetPattern, level, 20);
      setQuestionPool(exBatch);
      setExercise(exBatch[0]);
      setExerciseQueue(exBatch.slice(1));
    } catch (e: any) {
      setError(e.message || "Failed to generate exercise");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (isCorrect: boolean) => {
    if (exercise) {
      updateGrammarProfile(exercise.pattern, isCorrect);
    }
    setSessionScore(s => ({ correct: s.correct + (isCorrect ? 1 : 0), total: s.total + 1 }));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4 text-center">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <p className="text-muted-foreground">Generating personalized grammar exercise...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-destructive mb-4">{error}</p>
        <Button onClick={loadNextQuestion}>Try Again</Button>
      </div>
    );
  }

  if (!exercise) {
    return (
      <div className="text-center py-20 space-y-6">
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <Sparkles className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-heading">Ready for a challenge?</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          We'll automatically generate exercises tailored to your grammar weaknesses based on your speaking and reading mistakes.
        </p>
        <Button size="lg" onClick={loadNextQuestion} className="px-8 mt-4">
          Start Training
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {sessionScore.total > 0 && (
        <div className="flex justify-between items-center text-sm font-medium text-muted-foreground px-2">
          <span>Session Progress</span>
          <span>{sessionScore.correct} / {sessionScore.total} Correct</span>
        </div>
      )}
      
      <GrammarQuestion key={exercise.id} exercise={exercise} onAnswer={handleAnswer} />
      
      <div className="pt-8 flex justify-center">
        <Button variant="outline" onClick={loadNextQuestion}>
          Next Question
        </Button>
      </div>
    </div>
  );
}
