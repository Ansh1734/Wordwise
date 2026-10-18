import { useState } from "react";
import { Mic, Volume2, RotateCcw, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { pronunciationWords } from "@/data/mockData";
import { toast } from "sonner";
import { speak } from "@/lib/tts";
import { calculateSimilarity } from "@/lib/nlp";
import { analyzePronunciationWithGemini } from "@/lib/gemini";
import SpeakingRecorder from "@/components/speaking/SpeakingRecorder";
import FluencyScore from "@/components/speaking/FluencyScore";
import TranscriptViewer from "@/components/speaking/TranscriptViewer";
import { analyzeGrammarAndVocabulary } from "@/services/nlp/grammarAnalyzer";
import { calculateFluency } from "@/services/nlp/fluencyCalculator";
import { useAuth } from "@/contexts/AuthContext";
import SearchAndPronounce from "@/components/speaking/SearchAndPronounce";
import InterviewTrainer from "@/components/interview/InterviewTrainer";
import { evaluateInterviewAnswer } from "@/services/interview/interviewService";
import CapgeminiPractice from "@/components/speaking/CapgeminiPractice";

type Mode = "fluency" | "search" | "interview" | "capgemini";
type FluencyState = "idle" | "recording" | "analyzing" | "result";

export default function PronunciationPage() {
  const { updateGrammarProfile } = useAuth();
  const [mode, setMode] = useState<Mode>(() => {
    const params = new URLSearchParams(window.location.search);
    return (params.get("tab") as Mode) || "search";
  });

  // Fluency State
  const FLUENCY_TOPICS = [
    "Describe your favorite childhood memory in detail.",
    "Talk about your favorite travel destination and why you love it.",
    "What is the most interesting book you've read recently and why?",
    "Describe a typical day in your life.",
    "If you could have dinner with any historical figure, who would it be and why?",
    "What are the advantages and disadvantages of working from home?",
    "Describe a challenge you recently faced and how you overcame it.",
    "If you had a million dollars, how would you spend it?",
    "What is your favorite hobby and how did you get started with it?",
    "Talk about a movie that changed your perspective on life."
  ];

  const [fluencyState, setFluencyState] = useState<FluencyState>("idle");
  const [fluencyResult, setFluencyResult] = useState<any>(null);
  const [fluencyPrompt, setFluencyPrompt] = useState(FLUENCY_TOPICS[0]);

  const handleChangeTopic = () => {
    let newTopic = fluencyPrompt;
    while (newTopic === fluencyPrompt) {
      newTopic = FLUENCY_TOPICS[Math.floor(Math.random() * FLUENCY_TOPICS.length)];
    }
    setFluencyPrompt(newTopic);
  };

  const handleFluencyComplete = async (transcript: string, durationSeconds: number, audioBlob?: Blob) => {
    if (!audioBlob && !transcript.trim()) {
      toast.error("No speech detected.");
      setFluencyState("idle");
      return;
    }

    setFluencyState("analyzing");
    
    try {
      // Calculate fillers & pacing locally
      const words = transcript.toLowerCase().match(/\b\w+\b/g) || [];
      const totalWords = words.length;
      const fillerList = ["um", "uh", "like", "you know", "actually", "basically", "i mean", "so", "well"];
      let fillerCount = 0;
      const usedFillers: string[] = [];
      
      words.forEach(w => {
        if (fillerList.includes(w)) {
          fillerCount++;
          if (!usedFillers.includes(w)) usedFillers.push(w);
        }
      });
      
      const transcriptLower = transcript.toLowerCase();
      ["you know", "i mean"].forEach(f => {
        const count = (transcriptLower.match(new RegExp(`\\b${f}\\b`, 'g')) || []).length;
        if (count > 0) {
          fillerCount += count;
          if (!usedFillers.includes(f)) usedFillers.push(f);
        }
      });

      const wpm = (totalWords / durationSeconds) * 60;
      
      const stats = {
        durationSeconds,
        totalWords,
        wpm,
        fillers: { count: fillerCount, words: usedFillers, percentage: totalWords > 0 ? (fillerCount / totalWords) * 100 : 0 },
        clarityScore: 85 // Mocking clarity score
      };

      // Get Rich AI Feedback + Grammar Errors in ONE ultra-fast call
      const feedback = await evaluateInterviewAnswer(fluencyPrompt, transcript, durationSeconds, audioBlob);
      
      const fluency = calculateFluency(stats, feedback.metrics.grammar, feedback.metrics.vocabulary);
      
      feedback.grammarErrors.forEach(err => {
        updateGrammarProfile(err.pattern, false);
      });
      
      setFluencyResult({
        score: fluency.score,
        rating: fluency.rating,
        breakdown: fluency.breakdown,
        recommendations: [...feedback.weaknesses, ...feedback.strengths],
        improvedVersion: feedback.improvedVersion,
        transcript,
        analysis: { errors: feedback.grammarErrors, score: feedback.metrics.grammar, vocabularyScore: feedback.metrics.vocabulary },
        stats
      });
      setFluencyState("result");
      
    } catch (error: any) {
      console.error(error);
      toast.error(`Analysis failed: ${error.message || 'Unknown error'}`);
      setFluencyState("idle");
    }
  };

  return (
    <div className="container py-8 space-y-8">
      <div className="rounded-xl bg-blue-card-bg p-6 border border-blue-card-border flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">Pronunciation Coach</h1>
          <p className="text-muted-foreground mt-1">Practice your pronunciation and speaking fluency</p>
        </div>
        
        <div className="flex bg-background p-1 rounded-lg border border-border shrink-0">
          <button 
            onClick={() => setMode("search")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${mode === "search" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted"}`}
          >
            Search & Pronounce
          </button>
          <button 
            onClick={() => setMode("fluency")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${mode === "fluency" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted"}`}
          >
            Speaking Fluency
          </button>
          <button 
            onClick={() => setMode("interview")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${mode === "interview" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted"}`}
          >
            Interview Prep
          </button>
          <button 
            onClick={() => setMode("capgemini")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${mode === "capgemini" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted"}`}
          >
            Capgemini Practice
          </button>
        </div>
      </div>

      {mode === "search" && <SearchAndPronounce />}
      {mode === "interview" && <InterviewTrainer />}
      {mode === "capgemini" && <CapgeminiPractice />}

      {mode === "fluency" && (
        <div className="mx-auto max-w-4xl space-y-8 fade-in">
          {fluencyState === "idle" && (
            <div className="flex flex-col items-center">
              <SpeakingRecorder 
                promptText={fluencyPrompt}
                onRecordingComplete={handleFluencyComplete} 
              />
              <div className="mt-8 flex gap-3">
                <Button variant="outline" onClick={handleChangeTopic}>
                  Change Topic
                </Button>
              </div>
            </div>
          )}

          {fluencyState === "analyzing" && (
            <div className="flex flex-col items-center justify-center py-20 space-y-6">
              <Loader2 className="h-16 w-16 text-primary animate-spin" />
              <div className="text-center space-y-2">
                <h3 className="text-xl font-bold text-heading">Analyzing your speech</h3>
                <p className="text-muted-foreground">Evaluating pacing, grammar, vocabulary, and clarity...</p>
              </div>
            </div>
          )}

          {fluencyState === "result" && fluencyResult && (
            <div className="space-y-8 fade-in">
              <FluencyScore 
                score={fluencyResult.score}
                rating={fluencyResult.rating}
                breakdown={fluencyResult.breakdown}
                recommendations={fluencyResult.recommendations.slice(0, 3)}
                onRetry={() => setFluencyState("idle")}
              />
              
              {fluencyResult.improvedVersion && (
                <div className="bg-muted/30 p-6 rounded-xl space-y-3 border border-border mx-auto max-w-2xl text-center">
                  <p className="text-sm font-bold text-primary uppercase tracking-widest">How to say it better</p>
                  <p className="text-md text-heading italic">"{fluencyResult.improvedVersion}"</p>
                </div>
              )}
              
              <TranscriptViewer 
                transcript={fluencyResult.transcript}
                errors={fluencyResult.analysis.errors}
                fillerWords={fluencyResult.stats.fillers.words}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
