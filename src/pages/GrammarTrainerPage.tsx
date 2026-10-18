import GrammarTrainer from "@/components/grammar/GrammarTrainer";
import GrammarProgress from "@/components/grammar/GrammarProgress";
import { BookOpen } from "lucide-react";

export default function GrammarTrainerPage() {
  return (
    <div className="container py-8 space-y-8">
      <div className="rounded-xl bg-blue-card-bg p-6 border border-blue-card-border">
        <div className="flex items-center gap-3 mb-2">
          <BookOpen className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-primary">Grammar Pattern Trainer</h1>
        </div>
        <p className="text-muted-foreground">Master English grammar with adaptive exercises tailored to your personal weaknesses.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <GrammarTrainer />
        </div>
        <div>
          <GrammarProgress />
        </div>
      </div>
    </div>
  );
}
