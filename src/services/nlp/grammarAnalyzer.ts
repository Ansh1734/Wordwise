import { grammarApi } from '../api';

export interface GrammarCorrection {
  type: string;
  pattern: string;
  original: string;
  correction: string;
  explanation: string;
  severity: "low" | "medium" | "high";
  confidence: number;
}

export interface GrammarAnalysisResult {
  score: number;
  rating: string;
  errors: GrammarCorrection[];
  vocabularyScore: number;
  vocabularyFeedback: string;
}

export async function analyzeGrammarAndVocabulary(transcript: string): Promise<GrammarAnalysisResult> {
  try {
    const response = await grammarApi.checkGrammar(transcript);
    
    return {
      score: response.score || 70,
      rating: response.score > 80 ? "Great!" : "Good effort",
      errors: response.errors || [],
      vocabularyScore: 80, // Default for now as backend grammar focuses on grammar
      vocabularyFeedback: "Good use of vocabulary."
    };
  } catch (error) {
    console.error("Failed to analyze grammar via backend:", error);
    throw new Error("Grammar analysis failed. Please try again.");
  }
}
