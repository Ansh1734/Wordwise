import { useState } from "react";
import { BookOpen, Timer, ArrowRight, RotateCcw, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { capgeminiQuestions, CapgeminiQuestion } from "@/data/capgeminiQuestions";
import { CapgeminiRunner } from "./CapgeminiRunner";

export function CapgeminiHub() {
  const [mode, setMode] = useState<"menu" | "practice-setup" | "practice-run" | "mock-run">("menu");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [activeQuestions, setActiveQuestions] = useState<CapgeminiQuestion[]>([]);

  const categories = Array.from(new Set(capgeminiQuestions.map(q => q.category)));

  const startPractice = (category: string) => {
    const qs = capgeminiQuestions.filter(q => q.category === category);
    setActiveQuestions(qs);
    setMode("practice-run");
  };

  const startMockTest = () => {
    // Shuffle and pick 15 questions for mock test
    const shuffled = [...capgeminiQuestions].sort(() => 0.5 - Math.random());
    setActiveQuestions(shuffled.slice(0, 15));
    setMode("mock-run");
  };

  if (mode === "practice-setup") {
    return (
      <div className="space-y-6 fade-in">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setMode("menu")}>← Back</Button>
          <h2 className="text-2xl font-bold text-heading">Select a Topic</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categories.map(cat => (
            <div key={cat} className="p-4 border rounded-xl hover:border-primary cursor-pointer bg-card transition-all" onClick={() => startPractice(cat)}>
              <h3 className="font-semibold text-lg">{cat}</h3>
              <p className="text-muted-foreground text-sm mt-1">{capgeminiQuestions.filter(q => q.category === cat).length} Questions</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (mode === "practice-run") {
    return <CapgeminiRunner questions={activeQuestions} isMock={false} onExit={() => setMode("menu")} />;
  }

  if (mode === "mock-run") {
    return <CapgeminiRunner questions={activeQuestions} isMock={true} onExit={() => setMode("menu")} />;
  }

  return (
    <div className="space-y-8 fade-in">
      <div className="text-center space-y-2 mb-8">
        <h2 className="text-3xl font-bold text-heading">Practice for Capgemini with Us</h2>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Prepare for verbal ability tests with topic-wise practice and timed mock tests. Note: These are practice questions designed in the style of the exam.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center space-y-4">
          <div className="p-4 bg-primary/10 rounded-full">
            <BookOpen className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-xl font-bold text-heading">Practice Mode</h3>
          <p className="text-muted-foreground text-sm flex-1">
            Master specific topics at your own pace. Get immediate feedback and detailed explanations for each question.
          </p>
          <Button onClick={() => setMode("practice-setup")} className="w-full mt-4">
            Start Practice
          </Button>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center space-y-4">
          <div className="p-4 bg-gold/10 rounded-full">
            <Timer className="h-8 w-8 text-gold" />
          </div>
          <h3 className="text-xl font-bold text-heading">Mock Test</h3>
          <p className="text-muted-foreground text-sm flex-1">
            Simulate the real exam experience with a timed, randomized test covering all verbal ability categories.
          </p>
          <Button onClick={startMockTest} className="w-full mt-4 bg-gold hover:bg-gold/90 text-black">
            Start Mock Test
          </Button>
        </div>
      </div>
    </div>
  );
}
