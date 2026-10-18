import { readingApi } from '../api';

export interface ReadingAnalysisResult {
  stats: {
    wordsRead: number;
    wordsRecognized: number;
    skippedWords: number;
    repeatedWords: number;
  };
  scores: {
    pacing: number;
    clarity: number;
    pronunciation: number;
    pauses: number;
    overall: number;
  };
  feedback: {
    strengths: string[];
    weaknesses: string[];
  };
  problemWords: string[];
}

export async function analyzeReading(
  targetText: string,
  spokenTranscript: string, // Kept for backwards compatibility but not mainly used by backend
  durationSeconds: number,
  audioBlob?: Blob
): Promise<ReadingAnalysisResult> {
  if (!audioBlob) {
    throw new Error("Audio is required for reading analysis.");
  }
  
  try {
    const analysis = await readingApi.analyzeReading(targetText, durationSeconds, audioBlob);
    return analysis as ReadingAnalysisResult;
  } catch (err) {
    console.error("Reading analysis failed:", err);
    throw new Error("Failed to analyze reading via backend. Please try again.");
  }
}
