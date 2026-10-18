import { useState, useEffect } from "react";
import { Loader2, Briefcase, RefreshCw, CheckCircle2, AlertTriangle, MessageSquare, Play, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { generateInterviewQuestions, evaluateInterviewAnswer, InterviewQuestion, InterviewAnswerFeedback } from "@/services/interview/interviewService";
import SpeakingRecorder from "@/components/speaking/SpeakingRecorder";
import { useAuth } from "@/contexts/AuthContext";
import { speak } from "@/lib/tts";

export default function InterviewTrainer() {
  const { user, updateUser } = useAuth();
  const [config, setConfig] = useState({ type: "HR & Behavioral", difficulty: "Intermediate" });
  const [sessionState, setSessionState] = useState<"setup" | "loading" | "interview" | "review">("setup");
  
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [feedbacks, setFeedbacks] = useState<InterviewAnswerFeedback[]>([]);
  
  const [evaluating, setEvaluating] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  
  const handleStart = async () => {
    setSessionState("loading");
    try {
      const q = await generateInterviewQuestions(config.type, config.difficulty);
      setQuestions(q);
      setCurrentIdx(0);
      setFeedbacks([]);
      setSessionState("interview");
      // Optionally speak the first question
      // speak(q[0].question);
    } catch (err: any) {
      toast.error(err.message || "Failed to start interview");
      setSessionState("setup");
    }
  };

  const handleAnswerComplete = async (transcript: string, duration: number, audioBlob?: Blob) => {
    if (!transcript.trim()) {
      toast.error("No speech detected.");
      return;
    }

    setEvaluating(true);
    try {
      const feedback = await evaluateInterviewAnswer(questions[currentIdx].question, transcript, duration, audioBlob);
      setFeedbacks([...feedbacks, feedback]);
      setShowFeedbackModal(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to evaluate answer.");
    } finally {
      setEvaluating(false);
    }
  };

  const handleNextQuestion = () => {
    setShowFeedbackModal(false);
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      finishInterview();
    }
  };

  const finishInterview = () => {
    if (user && feedbacks.length > 0) {
      const currentInterviews = user.interview?.interviewsCompleted || 0;
      const currentAvg = user.interview?.averageScore || 0;
      
      const sessionAvg = Math.round(feedbacks.reduce((sum, f) => sum + f.score, 0) / feedbacks.length);
      const newAvg = Math.round(((currentAvg * currentInterviews) + sessionAvg) / (currentInterviews + 1));
      
      // Update global context
      updateUser({
        interview: {
          ...user.interview,
          interviewsCompleted: currentInterviews + 1,
          averageScore: newAvg,
          weakAreas: user.interview?.weakAreas || []
        }
      });
    }
    setSessionState("review");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 fade-in">
      {sessionState === "setup" && (
        <div className="bg-card border border-border p-10 rounded-2xl shadow-xl space-y-8 max-w-lg mx-auto">
          <div className="text-center space-y-2">
            <div className="h-16 w-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <Briefcase className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-bold text-heading">Interview Simulator</h2>
            <p className="text-muted-foreground">Practice answering realistic interview questions and get instant feedback on your fluency.</p>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Interview Type</label>
              <select 
                value={config.type}
                onChange={(e) => setConfig({ ...config, type: e.target.value })}
                className="w-full bg-muted/30 border border-border rounded-xl p-3 text-heading outline-none focus:border-primary"
              >
                <option value="HR & Behavioral">HR & Behavioral</option>
                <option value="Technical (Software)">Technical (Software)</option>
                <option value="Sales & Marketing">Sales & Marketing</option>
                <option value="General Conversation">General Conversation</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Difficulty Level</label>
              <select 
                value={config.difficulty}
                onChange={(e) => setConfig({ ...config, difficulty: e.target.value })}
                className="w-full bg-muted/30 border border-border rounded-xl p-3 text-heading outline-none focus:border-primary"
              >
                <option value="Beginner (A2)">Beginner (A2)</option>
                <option value="Intermediate (B1-B2)">Intermediate (B1-B2)</option>
                <option value="Advanced (C1)">Advanced (C1)</option>
              </select>
            </div>
          </div>
          
          <Button onClick={handleStart} className="w-full py-6 text-lg rounded-xl shadow-lg hover:scale-[1.02] transition-transform">
            Start Interview
          </Button>
        </div>
      )}

      {sessionState === "loading" && (
        <div className="flex flex-col items-center justify-center py-24 space-y-6">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
          <div className="text-center">
            <h3 className="text-xl font-bold text-heading">Preparing your interview...</h3>
            <p className="text-muted-foreground">The AI interviewer is generating your questions.</p>
          </div>
        </div>
      )}

      {sessionState === "interview" && (
        <div className="space-y-8 fade-in">
          <div className="flex items-center justify-between">
             <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
               Question {currentIdx + 1} of {questions.length}
             </span>
             <Button variant="ghost" size="sm" onClick={() => setSessionState("setup")} className="text-muted-foreground hover:text-destructive">
               End Interview
             </Button>
          </div>
          
          <div className="bg-blue-card-bg border border-blue-card-border p-8 rounded-2xl text-center space-y-6 shadow-sm">
            <div className="flex justify-center">
               <Button variant="outline" size="icon" className="rounded-full h-12 w-12 border-primary/30 text-primary hover:bg-primary/10" onClick={() => speak(questions[currentIdx].question)}>
                 <Play className="h-5 w-5 ml-1" />
               </Button>
            </div>
            <h2 className="text-3xl font-bold text-heading leading-tight">{questions[currentIdx].question}</h2>
            {questions[currentIdx].context && (
              <p className="text-muted-foreground italic text-sm">{questions[currentIdx].context}</p>
            )}
          </div>
          
          <div className="pt-8">
            {evaluating ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="font-medium text-heading">Analyzing your response...</p>
              </div>
            ) : !showFeedbackModal && (
              <SpeakingRecorder 
                hideTopic 
                maxDurationSeconds={180}
                onRecordingComplete={handleAnswerComplete}
              />
            )}
          </div>
        </div>
      )}

      {/* Answer Feedback Modal inline */}
      {showFeedbackModal && feedbacks[currentIdx] && (
        <div className="bg-card border border-border p-8 rounded-2xl shadow-xl space-y-6 fade-in animate-in slide-in-from-bottom-8">
           <div className="flex justify-between items-center border-b border-border pb-4">
             <h3 className="text-xl font-bold text-heading flex items-center gap-2">
               <MessageSquare className="h-5 w-5 text-primary" /> Feedback for this Answer
             </h3>
             <span className="text-2xl font-black text-primary">{feedbacks[currentIdx].score} <span className="text-sm font-medium text-muted-foreground">/ 100</span></span>
           </div>
           
           <div className="grid md:grid-cols-2 gap-6">
             <div className="space-y-4">
               <h4 className="flex items-center gap-2 font-bold text-success text-sm uppercase tracking-widest">
                 <CheckCircle2 className="h-4 w-4" /> Good Job
               </h4>
               <ul className="space-y-2">
                 {feedbacks[currentIdx].strengths.map((s, i) => (
                   <li key={i} className="text-sm text-body flex items-start gap-2"><span className="text-success mt-0.5">•</span> {s}</li>
                 ))}
               </ul>
             </div>
             <div className="space-y-4">
               <h4 className="flex items-center gap-2 font-bold text-destructive text-sm uppercase tracking-widest">
                 <AlertTriangle className="h-4 w-4" /> To Improve
               </h4>
               <ul className="space-y-2">
                 {feedbacks[currentIdx].weaknesses.map((w, i) => (
                   <li key={i} className="text-sm text-body flex items-start gap-2"><span className="text-destructive mt-0.5">•</span> {w}</li>
                 ))}
               </ul>
             </div>
           </div>
           
           <div className="bg-muted/30 p-5 rounded-xl space-y-2 border border-border">
             <p className="text-xs font-bold text-primary uppercase tracking-widest">How to say it better</p>
             <p className="text-sm text-heading italic">"{feedbacks[currentIdx].improvedVersion}"</p>
           </div>
           
           <Button onClick={handleNextQuestion} className="w-full py-6 text-lg rounded-xl">
             {currentIdx < questions.length - 1 ? "Next Question" : "Finish Interview"}
           </Button>
        </div>
      )}

      {sessionState === "review" && (
         <div className="bg-card border border-border p-10 rounded-2xl shadow-xl space-y-8 fade-in text-center max-w-2xl mx-auto">
           <h2 className="text-xl font-bold text-muted-foreground uppercase tracking-widest">Interview Complete</h2>
           <h3 className="text-4xl font-black text-heading">
             {Math.round(feedbacks.reduce((sum, f) => sum + f.score, 0) / feedbacks.length) >= 80 ? "🌟 NICE!" : "👍 GOOD JOB"}
           </h3>
           
           <div className="flex justify-center py-4">
             <div className="bg-primary/10 rounded-full h-32 w-32 flex flex-col items-center justify-center border-4 border-primary shadow-inner">
               <span className="text-4xl font-black text-primary">
                 {Math.round(feedbacks.reduce((sum, f) => sum + f.score, 0) / feedbacks.length)}
               </span>
               <span className="text-xs font-bold uppercase tracking-widest text-primary/70">/ 100</span>
             </div>
           </div>
           
           <div className="w-full border-t border-b border-border py-6 my-6">
             <div className="space-y-3 max-w-md mx-auto text-left">
               {[
                 { label: "Speaking Fluency", value: Math.round(feedbacks.reduce((s, f) => s + f.score, 0) / feedbacks.length) },
                 { label: "Pronunciation", value: Math.round(feedbacks.reduce((s, f) => s + (f.metrics?.pronunciation || 0), 0) / feedbacks.length) },
                 { label: "Clarity", value: Math.round(feedbacks.reduce((s, f) => s + (f.metrics?.clarity || 0), 0) / feedbacks.length) },
                 { label: "Grammar", value: Math.round(feedbacks.reduce((s, f) => s + (f.metrics?.grammar || 0), 0) / feedbacks.length) },
                 { label: "Vocabulary", value: Math.round(feedbacks.reduce((s, f) => s + (f.metrics?.vocabulary || 0), 0) / feedbacks.length) },
                 { label: "Pacing", value: Math.round(feedbacks.reduce((s, f) => s + (f.metrics?.pacing || 0), 0) / feedbacks.length) },
                 { label: "Filler Words", value: Math.max(0, 100 - Math.round(feedbacks.reduce((s, f) => s + (f.metrics?.fillers || 0), 0) / feedbacks.length)) }
               ].map((metric, i) => (
                 <div key={i} className="flex justify-between items-center text-sm font-medium">
                   <span className="text-muted-foreground">{metric.label}</span>
                   <span className="text-heading font-bold">{metric.value}</span>
                 </div>
               ))}
             </div>
           </div>

           <div className="w-full border-b border-border pb-6 my-6 text-left max-w-md mx-auto space-y-4">
             <div className="flex justify-between items-center">
               <span className="text-muted-foreground font-medium text-sm">Difficulty Completed:</span>
               <span className="text-heading font-bold">{config.difficulty.split(' ')[0]}</span>
             </div>
             <div className="flex justify-between items-center">
               <span className="text-muted-foreground font-medium text-sm">Questions Completed:</span>
               <span className="text-heading font-bold">{questions.length} / {questions.length}</span>
             </div>
           </div>
           
           <div className="grid md:grid-cols-2 gap-6 text-left max-w-md mx-auto">
             <div className="space-y-3">
               <h4 className="font-bold text-success flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Strong Areas</h4>
               <ul className="space-y-1">
                 <li className="text-sm text-muted-foreground flex items-center gap-2">✓ Clear communication</li>
                 <li className="text-sm text-muted-foreground flex items-center gap-2">✓ Relevant answers</li>
               </ul>
             </div>
             <div className="space-y-3">
               <h4 className="font-bold text-destructive flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Improve</h4>
               <ul className="space-y-1">
                 <li className="text-sm text-muted-foreground flex items-center gap-2">⚠ Reduce filler words</li>
                 <li className="text-sm text-muted-foreground flex items-center gap-2">⚠ Improve pacing</li>
               </ul>
             </div>
           </div>

           <div className="border-t border-border pt-6 mt-6 max-w-md mx-auto">
              <h4 className="font-bold text-heading mb-4">Recommended Practice</h4>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start gap-2">🎙️ Pronunciation Practice</Button>
                <Button variant="outline" className="w-full justify-start gap-2">🧠 Grammar Pattern Trainer</Button>
                <Button variant="outline" className="w-full justify-start gap-2">💼 Try Advanced Interview</Button>
              </div>
           </div>
           
           <div className="pt-6">
             <Button onClick={() => setSessionState("setup")} className="gap-2" size="lg">
               <RefreshCw className="h-5 w-5" /> Practice Another Interview
             </Button>
           </div>
         </div>
      )}
    </div>
  );
}
