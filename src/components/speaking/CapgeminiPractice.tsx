import { useState } from "react";
import { Mic, Volume2, RotateCcw, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { speak } from "@/lib/tts";
import { calculateSimilarity } from "@/lib/nlp";
import SpeakingRecorder from "@/components/speaking/SpeakingRecorder";
import FluencyScore from "@/components/speaking/FluencyScore";
import TranscriptViewer from "@/components/speaking/TranscriptViewer";
import { evaluateInterviewAnswer } from "@/services/interview/interviewService";
import { calculateFluency } from "@/services/nlp/fluencyCalculator";

// Mock data for Capgemini-style practice
const capgeminiWords = [
  { word: "Accommodate", ipa: "/əˈkɒmədeɪt/", phonemes: ["ə", "ˈkɒm", "ə", "deɪt"] },
  { word: "Conscientious", ipa: "/ˌkɒnʃiˈenʃəs/", phonemes: ["ˌkɒn", "ʃi", "ˈen", "ʃəs"] },
  { word: "Dilemma", ipa: "/dɪˈlemə/", phonemes: ["dɪ", "ˈlem", "ə"] },
  { word: "Entrepreneur", ipa: "/ˌɒntrəprəˈnɜː(r)/", phonemes: ["ˌɒntr", "ə", "prə", "ˈnɜː"] },
  { word: "Hierarchy", ipa: "/ˈhaɪərɑːki/", phonemes: ["ˈhaɪ", "ə", "rɑː", "ki"] }
];

const capgeminiSentences = [
  "I am confident that I can contribute effectively to the team.",
  "My greatest strength is my ability to learn quickly and adapt.",
  "I have a strong background in software development and problem-solving.",
  "We need to evaluate the pros and cons before making a decision.",
  "Effective communication is crucial for successful project collaboration."
];

const capgeminiSpeakingPrompts = [
  "Introduce yourself.",
  "Describe your strengths and weaknesses.",
  "Talk about a project you have worked on.",
  "Where do you see yourself in five years?",
  "Why should we hire you for this role?",
  "Describe a time you faced a difficult challenge and how you overcame it."
];

type CapgeminiMode = "word" | "sentence" | "speaking";

export default function CapgeminiPractice() {
  const [subMode, setSubMode] = useState<CapgeminiMode>("word");

  // Word Practice State
  const [currentWordIdx, setCurrentWordIdx] = useState(0);
  const [isWordRecording, setIsWordRecording] = useState(false);
  const [hasWordResult, setHasWordResult] = useState(false);
  const [wordTranscript, setWordTranscript] = useState("");
  const [wordScore, setWordScore] = useState(0);

  const word = capgeminiWords[currentWordIdx];

  const handleWordRecord = () => {
    if (!window.SpeechRecognition && !(window as any).webkitSpeechRecognition) {
      toast.error("Speech recognition is not supported in this browser.");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    setIsWordRecording(true);
    setHasWordResult(false);
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      setIsWordRecording(false);
      
      const similarity = calculateSimilarity(word.word.toLowerCase(), transcript);
      const score = Math.round(similarity * 100);
      
      setWordTranscript(transcript);
      setWordScore(score);
      setHasWordResult(true);
    };

    recognition.onerror = () => {
      setIsWordRecording(false);
    };

    recognition.start();

    setTimeout(() => {
      if (isWordRecording) {
        try { recognition.stop(); } catch(e) {}
        setIsWordRecording(false);
      }
    }, 2500);
  };

  const handleNextWord = () => {
    setCurrentWordIdx((prev) => (prev + 1) % capgeminiWords.length);
    setHasWordResult(false);
  };

  // Sentence Practice State
  const [currentSentenceIdx, setCurrentSentenceIdx] = useState(0);
  const [isSentenceRecording, setIsSentenceRecording] = useState(false);
  const [hasSentenceResult, setHasSentenceResult] = useState(false);
  const [sentenceTranscript, setSentenceTranscript] = useState("");
  const [sentenceScore, setSentenceScore] = useState(0);

  const sentence = capgeminiSentences[currentSentenceIdx];

  const handleSentenceRecord = () => {
    if (!window.SpeechRecognition && !(window as any).webkitSpeechRecognition) {
      toast.error("Speech recognition is not supported in this browser.");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    setIsSentenceRecording(true);
    setHasSentenceResult(false);
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      setIsSentenceRecording(false);
      
      const similarity = calculateSimilarity(sentence.toLowerCase(), transcript);
      const score = Math.round(similarity * 100);
      
      setSentenceTranscript(transcript);
      setSentenceScore(score);
      setHasSentenceResult(true);
    };

    recognition.onerror = () => {
      setIsSentenceRecording(false);
    };

    recognition.start();

    setTimeout(() => {
      if (isSentenceRecording) {
        try { recognition.stop(); } catch(e) {}
        setIsSentenceRecording(false);
      }
    }, 6000);
  };

  const handleNextSentence = () => {
    setCurrentSentenceIdx((prev) => (prev + 1) % capgeminiSentences.length);
    setHasSentenceResult(false);
  };

  // Speaking Practice State
  const [speakingPrompt, setSpeakingPrompt] = useState(capgeminiSpeakingPrompts[0]);
  const [speakingState, setSpeakingState] = useState<"idle" | "analyzing" | "result">("idle");
  const [speakingResult, setSpeakingResult] = useState<any>(null);

  const handleChangeSpeakingPrompt = () => {
    let newPrompt = speakingPrompt;
    while (newPrompt === speakingPrompt) {
      newPrompt = capgeminiSpeakingPrompts[Math.floor(Math.random() * capgeminiSpeakingPrompts.length)];
    }
    setSpeakingPrompt(newPrompt);
  };

  const handleSpeakingComplete = async (transcript: string, durationSeconds: number, audioBlob?: Blob) => {
    if (!transcript.trim()) {
      toast.error("No speech detected.");
      setSpeakingState("idle");
      return;
    }

    setSpeakingState("analyzing");
    
    try {
      const words = transcript.toLowerCase().match(/\b\w+\b/g) || [];
      const totalWords = words.length;
      const wpm = (totalWords / durationSeconds) * 60;
      
      const stats = {
        durationSeconds,
        totalWords,
        wpm,
        fillers: { count: 0, words: [], percentage: 0 },
        clarityScore: 85
      };

      const feedback = await evaluateInterviewAnswer(speakingPrompt, transcript, durationSeconds, audioBlob);
      const fluency = calculateFluency(stats, feedback.metrics.grammar, feedback.metrics.vocabulary);
      
      setSpeakingResult({
        score: fluency.score,
        rating: fluency.rating,
        breakdown: fluency.breakdown,
        recommendations: [...feedback.weaknesses, ...feedback.strengths],
        improvedVersion: feedback.improvedVersion,
        transcript,
        analysis: { errors: feedback.grammarErrors, score: feedback.metrics.grammar, vocabularyScore: feedback.metrics.vocabulary },
        stats
      });
      setSpeakingState("result");
      
    } catch (error: any) {
      toast.error(`Analysis failed: ${error.message || 'Unknown error'}`);
      setSpeakingState("idle");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="flex justify-center bg-background p-1 rounded-lg border border-border inline-flex mx-auto">
        <button 
          onClick={() => setSubMode("word")}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${subMode === "word" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted"}`}
        >
          Word Practice
        </button>
        <button 
          onClick={() => setSubMode("sentence")}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${subMode === "sentence" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted"}`}
        >
          Sentence Practice
        </button>
        <button 
          onClick={() => setSubMode("speaking")}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${subMode === "speaking" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted"}`}
        >
          Speaking Practice
        </button>
      </div>

      {subMode === "word" && (
        <div className="mx-auto max-w-lg space-y-6 text-center fade-in">
          <div>
            <h2 className="text-4xl font-bold text-heading">{word.word}</h2>
            <p className="mt-2 font-mono text-muted-foreground">{word.ipa}</p>
          </div>

          <div className="flex flex-col items-center justify-center gap-6 pt-4">
            <button
              onClick={handleWordRecord}
              disabled={isWordRecording}
              className={`flex h-28 w-28 items-center justify-center rounded-full text-primary-foreground transition-all ${
                isWordRecording ? "bg-primary pulse-ring scale-110 shadow-[0_0_20px_rgba(59,130,246,0.5)]" : "bg-primary hover:scale-105 hover:shadow-lg"
              }`}
            >
              {isWordRecording ? <Mic className="h-10 w-10 animate-pulse" /> : <Mic className="h-10 w-10" />}
            </button>
            <p className="text-sm text-muted-foreground mt-2">
              {isWordRecording ? "Listening to your pronunciation..." : "Tap the mic and say the word"}
            </p>
          </div>

          {hasWordResult && (
            <div className="space-y-4 fade-in">
              <div className="flex items-center justify-center gap-4">
                <span className={`rounded-full px-3 py-1 text-sm font-medium ${
                  wordScore >= 80 ? "bg-green-card-bg text-success border border-green-card-border" : "bg-destructive/10 text-destructive border border-destructive/30"
                }`}>
                  Accuracy: {wordScore}%
                </span>
              </div>
              
              <div className={`mt-4 p-4 rounded-xl border text-sm text-left ${wordScore >= 80 ? 'bg-success/10 border-success/20' : 'bg-destructive/10 border-destructive/20'}`}>
                {wordScore >= 80 ? (
                  <>
                    <span className="font-semibold text-success block mb-1">Great pronunciation! 🌟</span> 
                  </>
                ) : (
                  <>
                    <span className="font-semibold text-destructive block mb-1">We heard: <span className="italic">"{wordTranscript}"</span></span>
                    <p className="text-muted-foreground mt-1">Try to pronounce it more clearly.</p>
                  </>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-wrap justify-center gap-3 pt-4">
            <Button variant="outline" onClick={() => speak(word.word)} className="gap-2 border-primary text-primary hover:bg-primary/5">
              <Volume2 className="h-4 w-4" /> Listen
            </Button>
            {hasWordResult && (
              <Button variant="outline" onClick={handleNextWord} className="gap-2 border-primary text-primary hover:bg-primary/5">
                <ArrowRight className="h-4 w-4" /> Next Word
              </Button>
            )}
          </div>
        </div>
      )}

      {subMode === "sentence" && (
        <div className="mx-auto max-w-2xl space-y-6 text-center fade-in">
          <div className="bg-muted/30 p-8 rounded-xl border border-border">
            <p className="text-sm font-bold text-primary uppercase tracking-widest mb-4">Read this sentence aloud:</p>
            <h2 className="text-2xl font-medium text-heading leading-relaxed">"{sentence}"</h2>
          </div>

          <div className="flex flex-col items-center justify-center gap-6 pt-4">
            <button
              onClick={handleSentenceRecord}
              disabled={isSentenceRecording}
              className={`flex h-24 w-24 items-center justify-center rounded-full text-primary-foreground transition-all ${
                isSentenceRecording ? "bg-primary pulse-ring scale-110 shadow-[0_0_20px_rgba(59,130,246,0.5)]" : "bg-primary hover:scale-105 hover:shadow-lg"
              }`}
            >
              {isSentenceRecording ? <Mic className="h-8 w-8 animate-pulse" /> : <Mic className="h-8 w-8" />}
            </button>
            <p className="text-sm text-muted-foreground mt-2">
              {isSentenceRecording ? "Listening..." : "Tap the mic to start speaking"}
            </p>
          </div>

          {hasSentenceResult && (
            <div className="space-y-4 fade-in">
              <div className="flex items-center justify-center gap-4">
                <span className={`rounded-full px-3 py-1 text-sm font-medium ${
                  sentenceScore >= 80 ? "bg-green-card-bg text-success border border-green-card-border" : "bg-destructive/10 text-destructive border border-destructive/30"
                }`}>
                  Accuracy: {sentenceScore}%
                </span>
              </div>
              
              <div className={`mt-4 p-4 rounded-xl border text-sm text-left ${sentenceScore >= 80 ? 'bg-success/10 border-success/20' : 'bg-destructive/10 border-destructive/20'}`}>
                {sentenceScore >= 80 ? (
                  <span className="font-semibold text-success block">Excellent reading! 🌟</span> 
                ) : (
                  <>
                    <span className="font-semibold text-destructive block mb-1">We heard: <span className="italic">"{sentenceTranscript}"</span></span>
                    <p className="text-muted-foreground mt-1">Keep practicing to improve clarity and pacing.</p>
                  </>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-wrap justify-center gap-3 pt-4">
            <Button variant="outline" onClick={() => speak(sentence)} className="gap-2 border-primary text-primary hover:bg-primary/5">
              <Volume2 className="h-4 w-4" /> Listen
            </Button>
            {hasSentenceResult && (
              <Button variant="outline" onClick={handleNextSentence} className="gap-2 border-primary text-primary hover:bg-primary/5">
                <ArrowRight className="h-4 w-4" /> Next Sentence
              </Button>
            )}
          </div>
        </div>
      )}

      {subMode === "speaking" && (
        <div className="mx-auto max-w-4xl space-y-8 fade-in">
          {speakingState === "idle" && (
            <div className="flex flex-col items-center">
              <SpeakingRecorder 
                promptText={speakingPrompt}
                onRecordingComplete={handleSpeakingComplete} 
              />
              <div className="mt-8 flex gap-3">
                <Button variant="outline" onClick={handleChangeSpeakingPrompt}>
                  Change Prompt
                </Button>
              </div>
            </div>
          )}

          {speakingState === "analyzing" && (
            <div className="flex flex-col items-center justify-center py-20 space-y-6">
              <Loader2 className="h-16 w-16 text-primary animate-spin" />
              <div className="text-center space-y-2">
                <h3 className="text-xl font-bold text-heading">Analyzing your response</h3>
                <p className="text-muted-foreground">Evaluating fluency, grammar, and vocabulary...</p>
              </div>
            </div>
          )}

          {speakingState === "result" && speakingResult && (
            <div className="space-y-8 fade-in">
              <FluencyScore 
                score={speakingResult.score}
                rating={speakingResult.rating}
                breakdown={speakingResult.breakdown}
                recommendations={speakingResult.recommendations.slice(0, 3)}
                onRetry={() => setSpeakingState("idle")}
              />
              
              {speakingResult.improvedVersion && (
                <div className="bg-muted/30 p-6 rounded-xl space-y-3 border border-border mx-auto max-w-2xl text-center">
                  <p className="text-sm font-bold text-primary uppercase tracking-widest">How to say it better</p>
                  <p className="text-md text-heading italic">"{speakingResult.improvedVersion}"</p>
                </div>
              )}
              
              <TranscriptViewer 
                transcript={speakingResult.transcript}
                errors={speakingResult.analysis.errors}
                fillerWords={speakingResult.stats.fillers.words}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
