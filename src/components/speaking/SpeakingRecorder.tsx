import { useState, useRef, useEffect } from "react";
import { Mic, Square } from "lucide-react";
import { toast } from "sonner";

interface SpeakingRecorderProps {
  promptText?: string;
  onRecordingComplete: (transcript: string, durationSeconds: number, audioBlob?: Blob) => void;
  maxDurationSeconds?: number;
  hideTopic?: boolean;
}

export default function SpeakingRecorder({ promptText, onRecordingComplete, maxDurationSeconds = 90, hideTopic = false }: SpeakingRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [timeRemaining, setTimeRemaining] = useState(maxDurationSeconds);
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<number | null>(null);
  const transcriptRef = useRef("");
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const finalAudioBlobRef = useRef<Blob | null>(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const text = Array.from(event.results)
          .map((res: any) => res[0].transcript)
          .join('');
        setTranscript(text);
        transcriptRef.current = text;
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        if (event.error === 'not-allowed') {
          toast.error("Microphone access denied. Please allow microphone permissions.");
          stopRecording();
        }
      };
      recognitionRef.current = recognition;
    } else {
      toast.error("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      recognitionRef.current?.stop();
    };
  }, []);

  const startRecording = async () => {
    if (!recognitionRef.current) return;
    setTranscript("");
    transcriptRef.current = "";
    audioChunksRef.current = [];
    finalAudioBlobRef.current = null;
    setTimeRemaining(maxDurationSeconds);
    setIsRecording(true);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        finalAudioBlobRef.current = audioBlob;
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      recognitionRef.current.start();
    } catch (e) {
      console.error(e);
      toast.error("Could not access microphone.");
      setIsRecording(false);
      return;
    }

    timerRef.current = window.setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          stopRecording();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    // Use functional state update or refs to avoid stale closure if this was called from the timeout
    setIsRecording(prev => {
      if (!prev) return false;
      
      try {
        recognitionRef.current?.stop();
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
        }
      } catch (e) {
        console.error(e);
      }
      
      // Calculate duration before we reset state
      // We need to read timeRemaining from the closure, but it might be stale.
      // Better to rely on the current timeRemaining value in state.
      return false; 
    });
  };

  // We need a separate effect to trigger onRecordingComplete when isRecording changes to false
  const prevIsRecording = useRef(false);
  useEffect(() => {
    if (prevIsRecording.current && !isRecording) {
      const duration = maxDurationSeconds - timeRemaining;
      
      if (duration < 5) {
        toast.error("Recording too short. Please try to speak a bit more.");
      } else {
        setTimeout(() => {
          onRecordingComplete(transcriptRef.current, duration, finalAudioBlobRef.current || undefined);
        }, 800); // Give a brief moment for final recognition results to arrive
      }
    }
    prevIsRecording.current = isRecording;
  }, [isRecording, timeRemaining, onRecordingComplete]);

  return (
    <div className="flex flex-col items-center space-y-6 w-full">
      {!hideTopic && promptText && (
        <div className="bg-blue-card-bg border border-blue-card-border p-6 rounded-xl max-w-md w-full text-center">
          <p className="text-muted-foreground text-sm mb-2">Topic</p>
          <p className="text-lg font-medium text-heading">{promptText}</p>
        </div>
      )}

      <div className="relative flex flex-col items-center">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`flex h-24 w-24 items-center justify-center rounded-full transition-all ${
            isRecording 
              ? "bg-destructive text-destructive-foreground pulse-ring scale-110" 
              : "bg-primary text-primary-foreground hover:scale-105 hover:shadow-lg"
          }`}
        >
          {isRecording ? <Square className="h-8 w-8" /> : <Mic className="h-10 w-10" />}
        </button>
        {isRecording && (
          <button 
            onClick={stopRecording} 
            className="mt-8 px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg hover:bg-primary/90 transition-transform hover:scale-105 animate-in fade-in slide-in-from-bottom-4"
          >
            Submit Answer
          </button>
        )}
      </div>

      <div className="text-center">
        <p className="text-3xl font-mono text-heading">
          {Math.floor(timeRemaining / 60).toString().padStart(2, '0')}:{(timeRemaining % 60).toString().padStart(2, '0')}
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          {isRecording ? "Recording..." : `Tap mic to start (max ${maxDurationSeconds}s)`}
        </p>
      </div>
      
      {isRecording && transcript && (
        <div className="max-w-md w-full mt-4 p-4 bg-muted/30 rounded-lg text-muted-foreground text-sm italic h-24 overflow-y-auto">
          "{transcript}"
        </div>
      )}
    </div>
  );
}
