import { fetchWithRetry } from "@/lib/gemini";

export interface InterviewQuestion {
  id: string;
  question: string;
  context?: string;
}

export interface InterviewAnswerFeedback {
  score: number; // 0-100
  rating: string;
  strengths: string[];
  weaknesses: string[];
  improvedVersion: string;
  metrics: {
    pronunciation: number;
    clarity: number;
    grammar: number;
    vocabulary: number;
    pacing: number;
    relevance: number;
    fillers: number; // Percentage
  };
  grammarErrors: {
    type: string;
    pattern: string;
    original: string;
    correction: string;
    explanation: string;
    severity: "low" | "medium" | "high";
    confidence: number;
  }[];
}

import { interviewQuestions } from "@/data/interviewQuestions";

export async function generateInterviewQuestions(type: string, difficulty: string): Promise<InterviewQuestion[]> {
  // Map UI difficulty string to our structured data keys
  let levelKey = "intermediate"; // default
  const diffLower = difficulty.toLowerCase();
  if (diffLower.includes("beginner") || diffLower.includes("a2")) {
    levelKey = "beginner";
  } else if (diffLower.includes("advanced") || diffLower.includes("c1")) {
    levelKey = "advanced";
  }

  const questions = interviewQuestions[levelKey] || interviewQuestions["intermediate"];

  // Return the mapped questions
  return questions.map((q) => ({
    id: `q_${levelKey}_${q.order}`,
    question: q.question,
    context: q.context
  }));
}

import { interviewApi } from '../api';

export async function evaluateInterviewAnswer(
  question: string,
  answerTranscript: string, // Kept for backwards compatibility 
  durationSeconds: number,
  audioBlob?: Blob
): Promise<InterviewAnswerFeedback> {
  if (!audioBlob) {
    throw new Error("Audio is required for interview analysis.");
  }
  
  try {
    const analysis = await interviewApi.analyzeAnswer(question, durationSeconds, audioBlob);
    return analysis as InterviewAnswerFeedback;
  } catch (err) {
    console.error("Interview analysis failed:", err);
    throw new Error("Failed to analyze interview via backend. Please try again.");
  }
}
