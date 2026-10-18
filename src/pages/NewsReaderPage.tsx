import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Save, Volume2, Loader2, X, RefreshCw, ExternalLink, Mic, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { speak } from "@/lib/tts";
import { useAuth } from "@/contexts/AuthContext";
import { fetchLiveNews, NewsArticle } from "@/lib/news";

const categories = ["All", "Business", "Technology", "Science", "Health", "Sports", "Entertainment"];

interface DictionaryEntry {
  word: string;
  phonetic?: string;
  phonetics: { text?: string; audio?: string }[];
  meanings: {
    partOfSpeech: string;
    definitions: { definition: string; example?: string }[];
  }[];
}

import { expandNewsArticle } from "@/lib/gemini";
import SpeakingRecorder from "@/components/speaking/SpeakingRecorder";
import { analyzeReading, ReadingAnalysisResult } from "@/services/nlp/speechAnalysisService";
import ReadingResultDashboard from "@/components/speaking/ReadingResultDashboard";

export default function NewsReaderPage() {
  const { user, updateUser } = useAuth();
  const [activeCategory, setActiveCategory] = useState("All");
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [isExpanding, setIsExpanding] = useState(false);
  const [expandedContent, setExpandedContent] = useState<string | null>(null);
  const [savedWords, setSavedWords] = useState<Set<string>>(new Set());
  const [popupWord, setPopupWord] = useState<{ 
    word: string; 
    x: number; 
    y: number;
    loading: boolean;
    data?: DictionaryEntry;
    error?: string;
  } | null>(null);

  const [readMode, setReadMode] = useState<"read" | "aloud" | "result">("read");
  const [readingResult, setReadingResult] = useState<ReadingAnalysisResult | null>(null);
  const [analyzingReading, setAnalyzingReading] = useState(false);

  useEffect(() => {
    if (selectedArticle) {
       const triggerExpansion = async () => {
         setIsExpanding(true);
         setExpandedContent(null);
         try {
           const fullText = await expandNewsArticle(selectedArticle.title, selectedArticle.excerpt || selectedArticle.content);
           setExpandedContent(fullText);
         } catch (err) {
           console.error("Expansion failed:", err);
           toast.error("Could not expand full article. Showing snippet instead.");
         } finally {
           setIsExpanding(false);
         }
       };
       triggerExpansion();
    }
  }, [selectedArticle]);

  const loadNews = useCallback(async (cat: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchLiveNews(cat);
      setArticles(data);
    } catch (err: any) {
      setError(err.message || "Failed to load news articles");
      toast.error("Could not fetch latest news. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNews(activeCategory);
  }, [activeCategory, loadNews]);

  const fetchDefinition = async (word: string, x: number, y: number) => {
    const clean = word.replace(/[^a-zA-Z]/g, "");
    if (clean.length < 3) return;

    setPopupWord({ word: clean, x, y, loading: true });

    const localFallback = {
      practice: { word: clean, phonetic: "/ˈpræk.tɪs/", meanings: [{ partOfSpeech: "noun", definitions: [{ definition: "Repeated action to improve a skill or ability.", example: "Daily practice helps you speak more confidently." }], synonyms: ["training", "repetition"], antonyms: ["neglect"] }] },
      focus: { word: clean, phonetic: "/ˈfoʊ.kəs/", meanings: [{ partOfSpeech: "verb", definitions: [{ definition: "To give special attention to one thing.", example: "Please focus on the main idea in the paragraph." }], synonyms: ["concentrate", "direct"], antonyms: ["ignore"] }] },
      confidence: { word: clean, phonetic: "/ˈkɒn.fɪ.dəns/", meanings: [{ partOfSpeech: "noun", definitions: [{ definition: "A feeling of trust in your own ability or judgment.", example: "Her confidence improved after repeated practice." }], synonyms: ["assurance", "self-belief"], antonyms: ["doubt"] }] },
      grammar: { word: clean, phonetic: "/ˈɡræm.ər/", meanings: [{ partOfSpeech: "noun", definitions: [{ definition: "The rules for arranging words and phrases to make clear sentences.", example: "Good grammar makes the meaning easier to follow." }], synonyms: ["structure", "rules"], antonyms: ["chaos"] }] },
      clarity: { word: clean, phonetic: "/ˈklær.ɪ.ti/", meanings: [{ partOfSpeech: "noun", definitions: [{ definition: "The quality of being easy to understand or see.", example: "Clarity in writing helps readers understand the point quickly." }], synonyms: ["lucidity", "transparency"], antonyms: ["confusion"] }] },
      fluency: { word: clean, phonetic: "/ˈfluː.ən.si/", meanings: [{ partOfSpeech: "noun", definitions: [{ definition: "The ability to speak or write smoothly and naturally.", example: "She gained fluency through consistent reading and conversation." }], synonyms: ["smoothness", "ease"], antonyms: ["hesitation"] }] }
    } as Record<string, any>;

    try {
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${clean.toLowerCase()}`);
      if (!response.ok) throw new Error("Word not found");
      const data = await response.json();
      setPopupWord({ word: clean, x, y, loading: false, data: data[0] });
    } catch (err) {
      const key = clean.toLowerCase();
      const offline = localFallback[key] || {
        word: clean,
        phonetic: "",
        meanings: [{
          partOfSpeech: "noun",
          definitions: [{ definition: `The dictionary service is unavailable right now, so a quick offline definition is shown for “${clean}”.`, example: "Try reading the context around this word to infer the meaning." }],
          synonyms: [],
          antonyms: []
        }]
      };
      setPopupWord({ word: clean, x, y, loading: false, data: offline, error: "Offline definition loaded." });
    }
  };

  const handleWordClick = (word: string, e: React.MouseEvent) => {
    fetchDefinition(word, e.clientX, e.clientY);
  };

  const playAudio = (data?: DictionaryEntry) => {
    const audioUrl = data?.phonetics.find(p => p.audio)?.audio;
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play().catch(() => speak(data.word));
    } else if (data) {
      speak(data.word);
    }
  };

  const saveWord = (word: string) => {
    if (!user) return;
    const cleanWord = word.toLowerCase().replace(/[^a-zA-Z]/g, "");
    
    // Check if already in global word bank
    const wordBank = user.wordBank || [];
    const already = wordBank.some((w: any) => 
      (typeof w === "string" ? w : w.word).toLowerCase() === cleanWord
    );

    if (!already) {
      updateUser({
        wordBank: [...wordBank, { 
          word: cleanWord, 
          added: new Date().toISOString().split("T")[0],
          mastery: 0
        }],
        wordsLearned: user.wordsLearned + 1
      });
      toast.success(`"${cleanWord}" saved to Word Bank!`);
    } else {
      toast.info(`"${cleanWord}" is already in your Word Bank`);
    }

    setSavedWords((prev) => new Set(prev).add(cleanWord));
    setPopupWord(null);
  };

  if (selectedArticle) {
    const displayContent = expandedContent || selectedArticle.content || selectedArticle.excerpt;
    const words = displayContent.replace(/\[\+\d+ chars\]/g, "").split(/(\s+)/);

    return (
      <div className="container py-8 max-w-3xl space-y-6 fade-in">
        <Button variant="ghost" onClick={() => { setSelectedArticle(null); setPopupWord(null); setExpandedContent(null); setReadMode("read"); }} className="gap-2 text-primary">
          <ArrowLeft className="h-4 w-4" /> Back to Articles
        </Button>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <span className="rounded-full px-2 py-0.5 text-xs font-bold uppercase tracking-wider bg-blue-card-bg text-primary border border-blue-card-border">
                {selectedArticle.source}
              </span>
              <span className="rounded-full px-2 py-0.5 text-xs font-bold uppercase tracking-wider bg-green-card-bg text-success border border-green-card-border">
                Live News
              </span>
            </div>
            <a href={selectedArticle.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary flex items-center gap-1 hover:underline">
              View original <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          
          <h1 className="text-3xl font-bold text-heading leading-tight">{selectedArticle.title}</h1>
          
          {selectedArticle.urlToImage && (
            <div className="rounded-2xl overflow-hidden aspect-video border border-border shadow-sm">
              <img src={selectedArticle.urlToImage} alt={selectedArticle.title} className="w-full h-full object-cover" />
            </div>
          )}
          
          <div className="flex gap-3 pt-2">
             <Button 
               variant={readMode === "aloud" ? "default" : "outline"}
               className="gap-2 rounded-xl"
               onClick={() => setReadMode(readMode === "aloud" ? "read" : "aloud")}
             >
               <Mic className="h-4 w-4" />
               Read Aloud & Analyze
             </Button>
          </div>
        </div>

        {readMode === "aloud" && (
           <div className="bg-blue-card-bg border border-blue-card-border rounded-2xl p-6 shadow-sm mb-6 fade-in">
             <div className="text-center mb-6">
               <h3 className="text-xl font-bold text-primary flex items-center justify-center gap-2">
                 <Activity className="h-5 w-5" /> Reading Analyzer
               </h3>
               <p className="text-sm text-muted-foreground mt-1">Read the article aloud clearly. We will analyze your pacing and pronunciation.</p>
             </div>
             
             {analyzingReading ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <p className="font-medium text-heading">Analyzing your reading...</p>
                </div>
             ) : (
                <SpeakingRecorder 
                  hideTopic
                  maxDurationSeconds={300} // Up to 5 mins for reading
                  onRecordingComplete={async (transcript, duration, audioBlob) => {
                    setAnalyzingReading(true);
                    try {
                      if (!audioBlob) throw new Error("No audio recorded");
                      const res = await analyzeReading(displayContent, transcript, duration, audioBlob);
                      
                      // Update User Data Reading Metrics
                      if (user) {
                        const currentArticles = user.reading?.articlesCompleted || 0;
                        const currentPron = user.reading?.averagePronunciation || 0;
                        const currentClarity = user.reading?.averageClarity || 0;
                        
                        const newPron = Math.round(((currentPron * currentArticles) + res.scores.pronunciation) / (currentArticles + 1));
                        const newClarity = Math.round(((currentClarity * currentArticles) + res.scores.clarity) / (currentArticles + 1));
                        
                        updateUser({
                          reading: {
                            articlesCompleted: currentArticles + 1,
                            averagePronunciation: newPron,
                            averageClarity: newClarity
                          }
                        });
                      }

                      setReadingResult(res);
                      setReadMode("result");
                    } catch (err: any) {
                      toast.error(err.message || "Failed to analyze reading");
                      setReadMode("read");
                    } finally {
                      setAnalyzingReading(false);
                    }
                  }} 
                />
             )}
           </div>
        )}

        {readMode === "result" && readingResult && (
           <div className="mb-6 fade-in">
             <ReadingResultDashboard 
               result={readingResult}
               onRetry={() => setReadMode("aloud")}
             />
           </div>
        )}

        <div className="relative rounded-2xl bg-card p-10 shadow-xl border border-border leading-relaxed text-body text-xl shadow-primary/5">
          {isExpanding && (
            <div className="absolute inset-x-0 -top-4 flex justify-center z-20">
              <div className="bg-primary text-primary-foreground px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 shadow-lg animate-bounce">
                <RefreshCw className="h-3 w-3 animate-spin" />
                Reconstructing Full Article
              </div>
            </div>
          )}
          
          <div className={isExpanding ? "opacity-30 blur-[1px] transition-all duration-500" : "transition-all duration-500"}>
            {words.map((w, i) => {
              const clean = w.replace(/[^a-zA-Z]/g, "").toLowerCase();
              const isSaved = clean && savedWords.has(clean);
              return (
                <span
                  key={i}
                  onClick={(e) => handleWordClick(w, e)}
                  className={`cursor-pointer transition-colors px-0.5 rounded ${
                    isSaved 
                      ? "bg-success/10 underline decoration-success decoration-2 underline-offset-4" 
                      : "hover:bg-primary/10 hover:text-primary hover:underline hover:decoration-primary hover:decoration-2 hover:underline-offset-4"
                  }`}
                >
                  {w}
                </span>
              );
            })}
          </div>
          
          {!isExpanding && expandedContent && (
             <div className="mt-12 pt-8 border-t border-border flex flex-col items-center gap-4 text-center">
               <div className="bg-success/10 text-success px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
                 <RefreshCw className="h-3 w-3" />
                 Full AI-Generated Article for Learners
               </div>
               <p className="text-sm text-muted-foreground italic max-w-md">
                 Our AI has reconstructed this story to provide you with a full-length reading challenge at your level.
               </p>
             </div>
          )}

          {!isExpanding && !expandedContent && (
            <div className="mt-8 pt-8 border-t border-border flex flex-col items-center gap-4 text-center">
              <p className="text-sm text-muted-foreground italic">
                Note: NewsAPI extracts are limited to snippets. Click "View original" for the full story.
              </p>
              <Button variant="outline" className="gap-2 border-primary text-primary hover:bg-primary/10" onClick={() => window.open(selectedArticle.url, '_blank')}>
                Read Full Article at {selectedArticle.source} <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {popupWord && (
          <div
            className="fixed z-50 rounded-xl bg-card border border-border shadow-2xl p-5 w-80 shadow-primary/10 animate-in zoom-in-95 duration-200"
            style={{ 
              top: Math.min(popupWord.y, window.innerHeight - 350), 
              left: Math.max(20, Math.min(popupWord.x - 160, window.innerWidth - 340)) 
            }}
          >
            <button 
              onClick={() => setPopupWord(null)}
              className="absolute right-3 top-3 p-1 rounded-full hover:bg-muted text-muted-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            {popupWord.loading ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground font-medium">Analyzing word...</p>
              </div>
            ) : popupWord.error ? (
              <div className="py-4 text-center">
                <p className="text-sm text-destructive">{popupWord.error}</p>
                <Button size="sm" variant="link" onClick={() => setPopupWord(null)}>Close</Button>
              </div>
            ) : popupWord.data ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-primary capitalize tracking-tight">{popupWord.data.word}</h3>
                    <p className="text-sm font-mono text-muted-foreground opacity-70">{popupWord.data.phonetic || popupWord.data.phonetics.find(p => p.text)?.text}</p>
                  </div>
                  <Button size="icon" variant="outline" className="h-10 w-10 rounded-full border-primary/30 text-primary hover:bg-primary/10" onClick={() => playAudio(popupWord.data)}>
                    <Volume2 className="h-5 w-5" />
                  </Button>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-4 pr-3 custom-scrollbar">
                  {popupWord.data.meanings.slice(0, 2).map((meaning, mi) => (
                    <div key={mi} className="space-y-1.5">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-primary/60 border-b border-primary/10 pb-0.5">{meaning.partOfSpeech}</p>
                      <ul className="space-y-2">
                        {meaning.definitions.slice(0, 2).map((def, di) => (
                          <li key={di} className="text-[13px] text-body leading-relaxed group">
                            <span className="text-primary mr-1 bg-primary/10 rounded px-1 text-[10px] items-center inline-flex h-4 mb-0.5">{di + 1}</span>
                            {def.definition}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                <div className="pt-2 flex gap-2">
                  <Button size="sm" onClick={() => saveWord(popupWord.word)} className="flex-1 gap-1.5 bg-success text-success-foreground hover:bg-success/90 text-xs font-bold shadow-sm shadow-success/20">
                    <Save className="h-3.5 w-3.5" /> Save to Word Bank
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-8 animate-in fade-in duration-500">
      <div className="rounded-2xl bg-gradient-to-r from-primary to-primary/60 p-8 border border-primary/20 shadow-lg shadow-primary/5">
        <h1 className="text-3xl font-bold text-primary-foreground tracking-tight">Live English News</h1>
        <p className="text-primary-foreground/80 mt-2 font-medium">Real-time headlines to sharpen your vocabulary</p>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 custom-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`rounded-xl px-5 py-2.5 text-sm font-bold transition-all whitespace-nowrap border ${
              activeCategory === cat
                ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20"
                : "bg-card text-muted-foreground border-border hover:border-primary/30 hover:text-primary"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-32 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary opacity-50" />
          <p className="text-muted-foreground font-medium animate-pulse">Fetching latest stories...</p>
        </div>
      ) : error ? (
        <div className="py-20 text-center space-y-6 bg-destructive/5 rounded-2xl border border-destructive/20 max-w-lg mx-auto">
          <p className="text-destructive font-medium px-6">{error}</p>
          <Button onClick={() => loadNews(activeCategory)} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
            <RefreshCw className="h-4 w-4" /> Try Again
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((a) => (
            <button
              key={a.id}
              onClick={() => setSelectedArticle(a)}
              className="group flex flex-col h-full rounded-2xl border border-border bg-card shadow-sm text-left transition-all hover:shadow-xl hover:border-primary/20 overflow-hidden"
            >
              {a.urlToImage && (
                <div className="h-44 w-full overflow-hidden bg-muted relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10" />
                  <img src={a.urlToImage} alt={a.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  <span className="absolute top-3 left-3 z-20 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest bg-black/50 text-white backdrop-blur-md">
                    {a.source}
                  </span>
                </div>
              )}
              <div className="p-6 flex flex-col flex-1">
                {!a.urlToImage && (
                  <div className="flex items-center gap-2 mb-3">
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest bg-blue-card-bg text-primary border border-blue-card-border">
                      {a.source}
                    </span>
                  </div>
                )}
                <h3 className="font-bold text-heading leading-snug group-hover:text-primary transition-colors line-clamp-2 mb-3">
                  {a.title}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-3 mb-4 flex-1">
                  {a.excerpt}
                </p>
                <div className="flex items-center justify-between pt-4 border-t border-border mt-auto">
                  <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                    {new Date(a.publishedAt).toLocaleDateString()}
                  </span>
                  <span className="text-[10px] font-bold text-primary flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Start Reading <ExternalLink className="h-3 w-3" />
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
