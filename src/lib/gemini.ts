
import { calculateSimilarity } from "@/lib/nlp";

const newsCache: Record<string, string> = {};

const LOCAL_QUIZ_LIBRARY: Record<string, string[]> = {
  practice: ["repeated action to improve a skill", "a large public gathering", "a sudden change in weather", "to make a decision quickly"],
  focus: ["to give special attention to one thing", "to hide information from others", "to move very slowly", "to begin a conversation"],
  confidence: ["a feeling of trust in your own abilities", "a type of weather system", "a person who gives advice", "a method of travel"],
  grammar: ["the rules for arranging words and sentences", "a list of numbers", "a type of map", "the sound of applause"],
  clarity: ["the quality of being easy to understand", "the act of speaking loudly", "a short summary", "a way to measure time"],
  lesson: ["a period of learning or teaching", "a place to eat", "an instrument for writing", "a type of music"],
  sentence: ["a complete thought written or spoken in words", "a measurement of distance", "a mood or feeling", "a group of trees"],
  vocabulary: ["the words a person knows and uses", "the speed of a computer", "a kind of food", "a type of weather"],
  fluency: ["the ability to speak or write smoothly and naturally", "the opposite of bravery", "a strong smell", "a place to sleep"],
  improvement: ["the process of becoming better", "a small mistake", "an item of clothing", "a type of puzzle"],
};

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildLocalQuizFromWords(words: string[]) {
  const relevantWords = words.filter(Boolean).map((word) => word.trim().toLowerCase()).filter(Boolean);
  const seedWords = relevantWords.length > 0 ? relevantWords : Object.keys(LOCAL_QUIZ_LIBRARY).slice(0, 5);

  return seedWords.slice(0, 5).map((word, index) => {
    const correctDefinition = LOCAL_QUIZ_LIBRARY[word]?.[0] || `a word or idea connected to ${word}`;
    const distractors = (LOCAL_QUIZ_LIBRARY[word] || [correctDefinition])
      .slice(1)
      .concat(
        Object.entries(LOCAL_QUIZ_LIBRARY)
          .filter(([key]) => key !== word)
          .map(([, values]) => values[0])
      )
      .filter(Boolean);

    const options = shuffle([correctDefinition, ...distractors.slice(0, 3)]).slice(0, 4);
    const correctIndex = options.findIndex((option) => option === correctDefinition);

    return {
      id: index + 1,
      question: `What does the word "${word}" most likely mean in context?`,
      options,
      correct: correctIndex,
      explanation: `"${word}" means ${correctDefinition}. This is the best match for the context of learning and communication.`
    };
  });
}

function buildLocalArticleExpansion(title: string, snippet: string) {
  const headline = title || "Fresh language learning update";
  const intro = snippet || "The story centers on a major development that is relevant to daily learning and communication.";

  return [
    `${headline} is a story that matters because it connects real-world change to everyday learning. When people follow current events and practice new vocabulary in context, they build stronger understanding and more natural speaking habits. This article uses the event as a practical example of how language grows through reading, listening, and repetition.`,
    `The key idea here is simple: understanding a topic often becomes easier when learners connect new words to a clear situation. Instead of memorizing isolated terms, students see how language works in real life. That makes it easier to recognize meaning, remember structure, and use ideas confidently in conversations. The article highlights how context helps people interpret content more accurately and speak more naturally.`,
    `In this situation, the message is not only about the event itself but also about communication. A learner who reads carefully can notice how ideas are explained, how tone is shaped, and how vocabulary creates meaning. These details are useful for improving writing, speaking, and listening. Over time, this kind of practice builds fluency because students are learning to understand ideas and express them with greater confidence.`,
    `The broader takeaway is that real information becomes more useful when it is connected to language practice. By combining current events with vocabulary review and speaking exercises, learners can absorb new ideas more effectively. This creates a stronger cycle of understanding, retention, and communication. ${intro}`
  ].join("\n\n");
}

function buildLocalPronunciationAnalysis(targetWord: string, transcript: string) {
  const cleanTarget = targetWord.toLowerCase().trim();
  const cleanTranscript = transcript.toLowerCase().trim();
  const similarity = calculateSimilarity(cleanTarget, cleanTranscript);
  const score = Math.max(0, Math.min(100, Math.round(similarity * 100)));

  if (score >= 80) {
    return {
      score,
      feedback: `Good work. Your pronunciation is close to "${targetWord}". Keep the rhythm and vowel sounds steady.`,
      problemAreas: []
    };
  }

  let problemAreas: string[] = [];
  if (cleanTarget.includes("a") && !cleanTranscript.includes("a")) problemAreas.push("vowel sound");
  if (cleanTarget.length > 4 && cleanTranscript.length < cleanTarget.length - 1) problemAreas.push("syllable length");
  if (!problemAreas.length) problemAreas.push("word stress");

  return {
    score: Math.max(45, score),
    feedback: `We heard "${transcript}". Focus on matching the sounds of "${targetWord}" more closely, especially the vowel and stress pattern.`,
    problemAreas
  };
}

export async function fetchWithRetry(url: string, options: RequestInit, retries = 1, backoff = 700): Promise<Response> {
  try {
    const response = await fetch(url, options);

    if ((response.status === 503 || response.status === 429) && retries > 0) {
      const msg = response.status === 429 ? "Rate limit hit (429)" : "High demand (503)";
      console.warn(`Gemini API ${msg}. Retrying in ${backoff}ms... (${retries} retries left)`);
      await new Promise((resolve) => setTimeout(resolve, backoff));
      return fetchWithRetry(url, options, retries - 1, backoff * 2);
    }
    return response;
  } catch (error) {
    if (retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, backoff));
      return fetchWithRetry(url, options, retries - 1, backoff * 2);
    }
    throw error;
  }
}

export async function generateQuizFromWords(words: string[]) {
  const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
  const PRIMARY_MODEL = "gemini-3.6-flash";
  const FALLBACK_MODEL = "gemini-3.5-flash";
  const LAST_RESORT_MODEL = "gemini-flash-latest";
  const cleanWords = words.filter(Boolean).map((word) => String(word).trim()).filter(Boolean);

  if (!API_KEY) {
    console.warn("Gemini API key missing; using local quiz engine.");
    return buildLocalQuizFromWords(cleanWords);
  }

  const prompt = `You are a helpful language learning assistant. 
  Please create a 5-question multiple choice quiz for an English learner based on the following word bank words: ${cleanWords.join(", ")}.
  
  CRITICAL REQUIREMENT: Every single question MUST be directly related to and test the meaning or usage of the words from the word bank provided. Do not use generic vocabulary. Focus specifically on: ${cleanWords.join(", ")}.
  
  Return the result as a JSON array of objects with this schema:
  [
    {
      "id": number,
      "question": string,
      "options": string[],
      "correct": number,
      "explanation": string
    }
  ]
  
  Rules:
  - The "correct" field must be the 0-indexed position of the right answer in the "options" array.
  - Provide a clear explanation for each correct answer.
  - Return ONLY the JSON; do not include markdown backticks or any other text.`;

  const getBody = () => JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
    }
  });

  const sendRequest = async (model: string) => {
    const response = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: getBody()
    });

    if (!response.ok) {
      let errorData: any = {};
      try {
        errorData = await response.json();
      } catch {
        errorData = {};
      }
      throw { status: response.status, message: errorData.error?.message || "Failed to generate quiz questions" };
    }

    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!resultText) {
      throw new Error("Gemini API did not return any content.");
    }

    return JSON.parse(resultText);
  };

  try {
    return await sendRequest(PRIMARY_MODEL);
  } catch (error: any) {
    if (error.status === 503 || error.status === 429) {
      console.warn(`Primary model issue (${error.status}). Attempting fallback model...`);
      try {
        return await sendRequest(FALLBACK_MODEL);
      } catch (fallbackError) {
        console.warn("Gemini fallback model failed; using local quiz engine.", fallbackError);
        return buildLocalQuizFromWords(cleanWords);
      }
    }
    console.warn("Gemini quiz generation failed; using local quiz engine.", error);
    return buildLocalQuizFromWords(cleanWords);
  }
}

export async function expandNewsArticle(title: string, snippet: string) {
  const cacheKey = `${title}-${snippet}`.slice(0, 100);
  if (newsCache[cacheKey]) {
    console.log("Serving expanded news from cache...");
    return newsCache[cacheKey];
  }

  const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
  const PRIMARY_MODEL = "gemini-3.6-flash";
  const FALLBACK_MODEL = "gemini-3.5-flash";
  const LAST_RESORT_MODEL = "gemini-flash-latest";

  if (!API_KEY) {
    const localText = buildLocalArticleExpansion(title, snippet);
    newsCache[cacheKey] = localText;
    return localText;
  }

  const prompt = `You are a professional journalist and expert English language teacher.
  
  Based on the following news headline and short snippet, please write a complete, detailed, and engaging news article (approximately 400-500 words) suitable for an intermediate English learner (B1/B2 level).
  
  Headline: ${title}
  Snippet: ${snippet}
  
  Guidelines:
  - Write in clear, standard English with rich and varied vocabulary.
  - Use a mix of common and slightly advanced vocabulary words naturally — this article will be used by English learners to discover and learn new words by clicking on them.
  - Structure the article with a clear introduction, 3-4 detailed body paragraphs, and a brief conclusion.
  - Ensure the tone is informative and neutral.
  - Include contextual clues around advanced words so learners can guess meanings.
  - Reconstruct the story logically based on the provided info, using your broad knowledge of current events if necessary, but stay faithful to the main facts.
  - DO NOT include any preamble like "Here is the expanded article". Return ONLY the article text.`;

  const getBody = () => JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
  });

  const sendRequest = async (model: string) => {
    const response = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: getBody()
    });

    if (!response.ok) {
      let errorData: any = {};
      try {
        errorData = await response.json();
      } catch {
        errorData = {};
      }
      throw { status: response.status, message: errorData.error?.message || "Failed to expand news article" };
    }

    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!resultText) {
      throw new Error("Gemini API did not return any content.");
    }

    return resultText;
  };

  const models = [PRIMARY_MODEL, FALLBACK_MODEL, LAST_RESORT_MODEL];
  let lastError: any = null;

  for (const model of models) {
    try {
      const result = await sendRequest(model);
      newsCache[cacheKey] = result;
      return result;
    } catch (error: any) {
      lastError = error;
      console.warn(`Model ${model} failed (${error.status || "unknown"}). ${models.indexOf(model) < models.length - 1 ? "Trying next model..." : "All models exhausted."}`);
      if (error.status && error.status !== 503 && error.status !== 429) {
        break;
      }
    }
  }

  const localText = buildLocalArticleExpansion(title, snippet);
  newsCache[cacheKey] = localText;
  console.warn("Gemini expansion failed; using local article expansion algorithm.", lastError);
  return localText;
}

export async function analyzePronunciationWithGemini(targetWord: string, transcript: string, expectedPhonetic?: string) {
  const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
  const PRIMARY_MODEL = "gemini-3.6-flash";
  const FALLBACK_MODEL = "gemini-3.5-flash";
  const LAST_RESORT_MODEL = "gemini-flash-latest";

  if (!API_KEY) {
    return buildLocalPronunciationAnalysis(targetWord, transcript);
  }

  const prompt = `You are a helpful, encouraging, and highly accurate English pronunciation coach.
  The user was trying to pronounce the target word: "${targetWord}"
  ${expectedPhonetic ? `The expected phonetic pronunciation is: ${expectedPhonetic}\n` : ""}
  However, the speech recognition system heard them say: "${transcript}"
  
  Analyze the phonetic and structural differences between the target word and what was heard.
  1. Determine a pronunciation score from 0 to 100 representing how close their speech was to the target word, ignoring simple normalization.
  2. Provide a short, 1-2 sentence feedback. If they mispronounced it (e.g., missed a syllable, wrong stress, wrong vowel), tell them exactly which sounds to fix.
  3. Identify 1-3 specific syllables or problem areas they missed (if any).
  
  Return ONLY a valid JSON object matching this schema:
  {
    "score": number, // 0-100
    "feedback": string,
    "problemAreas": string[]
  }
  `;

  const getBody = () => JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: "application/json" }
  });

  const sendRequest = async (model: string) => {
    const response = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: getBody()
    });

    if (!response.ok) {
      throw new Error("Failed to get pronunciation feedback");
    }

    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!resultText) {
      throw new Error("Gemini API did not return any content.");
    }

    return JSON.parse(resultText.trim());
  };

  const models = [PRIMARY_MODEL, FALLBACK_MODEL, LAST_RESORT_MODEL];

  for (const model of models) {
    try {
      return await sendRequest(model);
    } catch (error: any) {
      console.warn(`Model ${model} failed for analyzePronunciation. Trying next...`);
    }
  }

  return buildLocalPronunciationAnalysis(targetWord, transcript);
}
