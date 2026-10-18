import { fetchWithRetry } from "@/lib/gemini";

export interface GrammarExercise {
  id: string;
  level: number;
  pattern: string;
  question: string;
  options?: string[]; // only for level 1
  correctAnswer?: string | number; // for level 1, 2, 3
  explanation: string;
}

export async function generateGrammarExerciseBatch(pattern: string, level: number, count = 5): Promise<GrammarExercise[]> {
  const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
  if (!API_KEY) throw new Error("Gemini API key is not configured");

  const prompt = `You are an expert English teacher.
Generate exactly ${count} different grammar exercises for the pattern: "${pattern}".
Difficulty Level: ${level} (1 = Multiple Choice, 2 = Correct the Sentence, 3 = Fill in the Blank, 4 = Production Prompt).

For Level 1: Provide "options" (array of 4 strings) and "correctAnswer" (0-3 index).
For Level 2: Provide an incorrect sentence in "question" and the corrected sentence in "correctAnswer" (string).
For Level 3: Provide a sentence with a blank "___" in "question" and the missing word(s) in "correctAnswer" (string).
For Level 4: Provide a creative prompt in "question" (e.g. "Write a sentence describing what you did yesterday") and omit "correctAnswer".

Return strict JSON array of objects:
[
  {
    "id": "random_string_id_1",
    "level": ${level},
    "pattern": "${pattern}",
    "question": "string",
    "options": ["optional", "array"],
    "correctAnswer": "string or number based on level",
    "explanation": "Brief explanation of the grammar rule."
  }
]

Rule: Return ONLY a valid JSON array. No markdown formatting.`;

  const models = ["gemini-3.6-flash", "gemini-3.5-flash", "gemini-flash-latest"];
  let parsed: any = null;
  let lastError = new Error("Failed to generate exercise");

  for (const model of models) {
    try {
      const response = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" }
        })
      });

      if (!response.ok) throw new Error(`Model ${model} returned ${response.status}`);
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error("No content returned");

      const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsed = JSON.parse(cleanText);
      break;
    } catch (e: any) {
      console.warn(`Model ${model} failed for generating exercise: ${e.message}`);
      lastError = e;
    }
  }

  if (!parsed) {
    throw lastError;
  }
  
  return parsed as GrammarExercise[];
}
