import { useState } from "react";
import { Search, Volume2, Mic, RotateCcw, Square, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { searchWord } from "@/lib/dictionary";
import { toast } from "sonner";
import { speak } from "@/lib/tts";
import { pronunciationAssessment } from "@/services/nlp/pronunciationAssessment";

export default function SearchAndPronounce() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [practiceResult, setPracticeResult] = useState<any>(null);
  const [nlpFeedback, setNlpFeedback] = useState<string | null>(null);
  const [isNlpAnalyzing, setIsNlpAnalyzing] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setLoading(true);
    setResult(null);
    setPracticeResult(null);
    setHasRecorded(false);
    setIsAnalyzing(false);
    setIsRecording(false);
    setNlpFeedback(null);
    
    try {
      const data = await searchWord(query);
      setResult(data);
    } catch (err: any) {
      toast.error(err.message || "Word not found.");
    } finally {
      setLoading(false);
    }
  };

  const handleListen = () => {
    if (result) {
      if (result.audioUrl) {
        const audio = new Audio(result.audioUrl);
        audio.play().catch(() => speak(result.word));
      } else {
        speak(result.word);
      }
    }
  };

  const handlePracticeRecord = () => {
    if (!window.SpeechRecognition && !(window as any).webkitSpeechRecognition) {
      toast.error("Speech recognition is not supported in this browser.");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 3;

    setIsRecording(true);
    setHasRecorded(false);
    setNlpFeedback(null);

    recognition.onresult = async (event: any) => {
      const targetWord = result.word.toLowerCase();
      const results = event.results[0];
      
      let bestTranscript = results[0].transcript.toLowerCase();

      setIsRecording(false);
      setIsAnalyzing(true);
      
      try {
        const assessment = await pronunciationAssessment.analyze({
          targetWord,
          expectedPhonetic: result.phonetic,
          transcript: bestTranscript,
          recognitionConfidence: results[0].confidence
        });

        setPracticeResult({
          score: assessment.pronunciationScore,
          matched: assessment.isAcceptable,
          confidence: assessment.recognitionConfidence,
          transcript: bestTranscript,
          feedback: assessment.feedback,
          problemAreas: assessment.problemAreas,
          expectedPhonetic: assessment.expectedPhonetic
        });
        
        setHasRecorded(true);
      } catch (err) {
        console.error("Pronunciation assessment failed", err);
        toast.error("Failed to analyze pronunciation.");
      } finally {
        setIsAnalyzing(false);
      }
    };

    recognition.onerror = () => {
      setIsRecording(false);
      toast.error("Could not record properly. Please try again.");
    };

    recognition.start();
    
    // Auto stop after 2.5 seconds
    setTimeout(() => {
      if (isRecording) {
        recognition.stop();
        setIsRecording(false);
      }
    }, 2500);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8 fade-in">
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search any English word..."
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-card text-heading focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
          />
        </div>
        <Button type="submit" disabled={loading} className="py-3 h-auto px-6 rounded-xl shadow-sm">
          {loading ? "Searching..." : "Search"}
        </Button>
      </form>

      {result && (
        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm space-y-8 fade-in">
          <div className="text-center space-y-3">
            <h2 className="text-4xl font-bold text-heading">{result.word}</h2>
            {result.phonetic && <p className="font-mono text-muted-foreground text-lg">{result.phonetic}</p>}
            <Button onClick={handleListen} size="lg" className="mt-2 px-8 rounded-full shadow-md hover:scale-105 transition-transform">
              <Volume2 className="h-5 w-5 mr-2" /> Listen
            </Button>
          </div>

          <div className="bg-muted/30 p-6 rounded-xl border border-border space-y-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-primary mb-1 block">Definition</span>
              <p className="text-body font-medium">{result.definition}</p>
            </div>
            {result.example && (
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-primary mb-1 block">Example</span>
                <p className="text-muted-foreground italic">"{result.example}"</p>
              </div>
            )}
          </div>

          <div className="border-t border-border pt-8 text-center space-y-6">
            <div>
              <h3 className="text-xl font-bold text-heading">Practice this word</h3>
              <p className="text-muted-foreground text-sm mt-1">Tap the mic and repeat the word clearly.</p>
            </div>
            
            <div className="flex flex-col items-center justify-center gap-6">
              <button
                onClick={handlePracticeRecord}
                disabled={isRecording || isAnalyzing}
                className={`flex h-20 w-20 items-center justify-center rounded-full transition-all ${
                  isRecording 
                    ? "bg-destructive text-destructive-foreground pulse-ring scale-110 shadow-[0_0_20px_rgba(239,68,68,0.5)]" 
                    : isAnalyzing 
                    ? "bg-primary/50 text-primary-foreground cursor-not-allowed"
                    : "bg-primary text-primary-foreground hover:scale-105 hover:shadow-lg"
                }`}
              >
                {isRecording ? <Square className="h-8 w-8" /> : isAnalyzing ? <Loader2 className="h-8 w-8 animate-spin" /> : <Mic className="h-8 w-8" />}
              </button>

              {isRecording && (
                <div className="flex items-center justify-center gap-1 h-8 fade-in">
                  {[...Array(5)].map((_, i) => (
                    <div 
                      key={i} 
                      className="w-1.5 bg-destructive rounded-full animate-pulse" 
                      style={{ 
                        height: `${Math.random() * 60 + 40}%`,
                        animationDelay: `${i * 0.15}s`,
                        animationDuration: '0.6s'
                      }} 
                    />
                  ))}
                </div>
              )}
              
              {isAnalyzing && (
                <div className="flex flex-col items-center gap-2 fade-in text-primary">
                  <span className="text-sm font-medium animate-pulse">NLP Model Analyzing Pronunciation...</span>
                </div>
              )}
            </div>

            {hasRecorded && practiceResult && !isAnalyzing && (
              <div className="fade-in max-w-sm mx-auto bg-card p-6 rounded-2xl border border-border space-y-4 shadow-md">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Pronunciation Score</span>
                  <span className={`text-2xl font-black ${practiceResult.score >= 80 ? 'text-success' : practiceResult.score >= 50 ? 'text-warning' : 'text-destructive'}`}>
                    {practiceResult.score}%
                  </span>
                </div>
                
                <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                  <div 
                    className={`h-2.5 rounded-full transition-all duration-1000 ${
                      practiceResult.score >= 80 ? 'bg-success' : practiceResult.score >= 50 ? 'bg-warning' : 'bg-destructive'
                    }`}
                    style={{ width: `${practiceResult.score}%` }}
                  ></div>
                </div>

                <div className={`text-lg font-bold mt-4 ${practiceResult.score >= 90 ? 'text-success' : practiceResult.score >= 80 ? 'text-primary' : practiceResult.score >= 70 ? 'text-warning' : 'text-destructive'}`}>
                  {practiceResult.score >= 90 ? "🌟 Excellent!" : practiceResult.score >= 80 ? "👍 Good!" : practiceResult.score >= 70 ? "💪 Still Needs Improvement" : "🔄 Let's Try Again"}
                </div>
                
                <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                  Heard: <span className="italic font-medium text-foreground">"{practiceResult.transcript}"</span>
                </p>
                
                <div className="mt-2 text-left">
                  {practiceResult.feedback && (
                    <p className="text-sm text-muted-foreground mt-2 border-t border-border pt-3 leading-relaxed">
                      {practiceResult.feedback}
                    </p>
                  )}
                  {practiceResult.problemAreas && practiceResult.problemAreas.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-bold uppercase text-destructive mb-1">Try focusing on:</p>
                      <ul className="list-disc pl-4 text-sm text-muted-foreground">
                        {practiceResult.problemAreas.map((area: string, idx: number) => (
                          <li key={idx}>{area}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                
                {!practiceResult.matched && (
                  <div className="mt-4 border-t border-border pt-4 bg-muted/30 p-3 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Correct Pronunciation</p>
                      <p className="text-sm font-mono text-foreground">{practiceResult.expectedPhonetic || result.phonetic}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleListen}>
                      <Volume2 className="h-4 w-4 mr-2" /> Listen
                    </Button>
                  </div>
                )}
                
                <Button variant="outline" size="sm" onClick={() => setHasRecorded(false)} className="w-full mt-4 hover:bg-muted">
                  <RotateCcw className="h-4 w-4 mr-2" /> Try Again
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
