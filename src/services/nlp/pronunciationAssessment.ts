import { analyzePronunciationWithGemini } from "@/lib/gemini";
import { calculateSimilarity } from "@/lib/nlp";

export interface PronunciationAssessmentOptions {
  targetWord: string;
  expectedPhonetic?: string;
  transcript: string;
  recognitionConfidence?: number;
  audioBlob?: Blob; // Future-proofing for when audio analysis is fully available
}

export interface PronunciationAssessmentResult {
  recognitionConfidence: number;
  pronunciationScore: number; // 0-100
  isAcceptable: boolean;
  feedback: string;
  problemAreas?: string[];
  expectedPhonetic?: string;
}

export const PRONUNCIATION_THRESHOLDS = {
  excellent: 90,
  good: 80,
  acceptable: 70,
  needsImprovement: 60
};

/**
 * Pronunciation Assessment Engine Abstraction
 * Currently uses transcript similarity + Gemini NLP for phonetic evaluation,
 * since standard browser SpeechRecognition does not expose phoneme-level audio timing.
 */
export const pronunciationAssessment = {
  async analyze({
    targetWord,
    expectedPhonetic,
    transcript,
    recognitionConfidence = 0,
    audioBlob
  }: PronunciationAssessmentOptions): Promise<PronunciationAssessmentResult> {
    
    // 1. Clean inputs
    const cleanTarget = targetWord.toLowerCase().trim();
    const cleanTranscript = transcript.toLowerCase().trim();

    // 2. Base similarity calculation (Speech Recognition Match)
    // Find the best matching word in the transcript
    const words = cleanTranscript.split(/\s+/);
    let bestTranscriptMatchScore = 0;
    
    if (cleanTranscript.includes(cleanTarget)) {
       bestTranscriptMatchScore = 1;
    } else {
       for (const word of words) {
         const score = calculateSimilarity(cleanTarget, word);
         if (score > bestTranscriptMatchScore) {
           bestTranscriptMatchScore = score;
         }
       }
    }

    // 3. Pronunciation Assessment via capable model
    // Even if transcript matches 100%, the pronunciation might have been off (normalization by Speech API).
    // If we had a direct audio model, we'd pass audioBlob. Here we use our Gemini phonetic analysis.
    
    let aiScore = Math.round(bestTranscriptMatchScore * 100);
    let aiFeedback = "";
    let aiProblemAreas: string[] = [];
    
    // Forgiving confidence penalty: only penalize if the STT is actually struggling (confidence < 0.85)
    let confidencePenalty = 0;
    // Default to 1 if it's 0 or undefined, to avoid punishing unsupported browsers
    const actualConfidence = (recognitionConfidence === undefined || recognitionConfidence === 0) ? 1 : recognitionConfidence;
    if (actualConfidence < 0.85) {
       confidencePenalty = Math.round((0.85 - actualConfidence) * 150);
    }
    
    try {
      // Use Gemini to analyze the difference between what was said and the target
      // If the text matches perfectly but confidence is low, add a hint so Gemini knows it was mumbled
      const transcriptToAnalyze = (bestTranscriptMatchScore === 1 && recognitionConfidence < 0.9)
        ? `${cleanTranscript} (minor accent/unclear pronunciation)`
        : cleanTranscript;

      const analysis = await analyzePronunciationWithGemini(cleanTarget, transcriptToAnalyze, expectedPhonetic);
      
      // The final score is the Gemini text-based score, minus the audio confidence penalty
      aiScore = Math.min(100, Math.max(0, analysis.score - confidencePenalty));
      aiFeedback = analysis.feedback;
      aiProblemAreas = analysis.problemAreas || [];
    } catch (e) {
      console.warn("AI pronunciation analysis failed, falling back to transcript similarity", e);
      aiScore = Math.round(bestTranscriptMatchScore * 100);
      aiFeedback = aiScore >= PRONUNCIATION_THRESHOLDS.acceptable 
        ? "Good pronunciation!" 
        : `We heard "${cleanTranscript}". Try to pronounce it closer to "${cleanTarget}".`;
    }

    // Determine if acceptable
    const isAcceptable = aiScore >= PRONUNCIATION_THRESHOLDS.acceptable;

    return {
      recognitionConfidence: recognitionConfidence,
      pronunciationScore: aiScore,
      isAcceptable,
      feedback: aiFeedback,
      problemAreas: aiProblemAreas,
      expectedPhonetic
    };
  }
};
