import { supabase } from '@/lib/supabase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
const DEMO_TOKEN = 'wordwise-demo-token';

function buildOfflineResponse(endpoint: string, options: RequestInit) {
  const bodyText = typeof options.body === 'string' ? options.body : '';
  const parseJson = <T>(fallback: T): T => {
    try {
      return bodyText ? JSON.parse(bodyText) as T : fallback;
    } catch {
      return fallback;
    }
  };

  switch (endpoint) {
    case '/grammar/check': {
      const payload = parseJson<{ text?: string }>({ text: 'This is a sample sentence.' });
      const text = (payload.text || '').trim();
      const score = text.length > 20 ? 88 : 82;
      return {
        score,
        rating: score >= 85 ? 'Strong!' : 'Good effort',
        errors: text.toLowerCase().includes('dont') ? [{
          type: 'grammar',
          pattern: 'contraction',
          original: 'dont',
          correction: 'don\'t',
          explanation: 'Use the standard apostrophe form in formal writing.',
          severity: 'medium',
          confidence: 0.92,
        }] : [],
        vocabularyScore: 84,
        vocabularyFeedback: 'Vocabulary is clear and appropriate for everyday communication.',
      };
    }
    case '/speech/analyze': {
      return {
        success: true,
        transcript: 'This is a demo speech analysis response while the backend is unavailable.',
        metrics: {
          wordsPerMinute: 120,
          fluencyScore: 86,
          clarity: 88,
          pauses: 2,
          overall: 87,
        },
      };
    }
    case '/pronunciation/analyze': {
      return {
        success: true,
        transcript: 'Demo pronunciation analysis is active.',
        score: 89,
        feedback: 'Clear and confident pronunciation with strong rhythm.',
        problemAreas: [],
      };
    }
    case '/nlp/decompose': {
      const payload = parseJson<{ word?: string }>({ word: 'practice' });
      const word = payload.word || 'practice';
      return {
        word,
        partOfSpeech: 'noun',
        definition: 'Repeated action to improve a skill or ability.',
        example: 'Daily practice improves confidence and clarity.',
        prefix: { label: 'none', present: false },
        root: { label: 'pract', present: true },
        suffix: { label: 'ice', present: true },
      };
    }
    case '/nlp/semantic-similarity': {
      return {
        similarity: 0.9,
        score: 0.9,
        match: 'Strong semantic match in offline demo mode.',
      };
    }
    case '/reading/analyze': {
      return {
        stats: {
          wordsRead: 142,
          wordsRecognized: 138,
          skippedWords: 2,
          repeatedWords: 1,
        },
        scores: {
          pacing: 86,
          clarity: 89,
          pronunciation: 88,
          pauses: 80,
          overall: 87,
        },
        feedback: {
          strengths: ['Clear pacing', 'Good comprehension flow'],
          weaknesses: ['Reduce a few pauses between sentences'],
        },
        problemWords: [],
      };
    }
    case '/interview/analyze-answer': {
      return {
        success: true,
        score: 86,
        rating: 'Strong answer',
        transcript: 'Demo interview answer analysis is currently running offline.',
        feedback: 'Your response is structured well and shows confident communication.',
      };
    }
    default:
      return {
        success: true,
        offline: true,
        message: 'The backend is unavailable, so this feature is running in local demo mode.',
      };
  }
}

async function requestWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 8000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const hasSupabaseSession = Boolean(supabase && typeof supabase.auth?.getSession === 'function');

  if (!hasSupabaseSession) {
    return buildOfflineResponse(endpoint, options);
  }

  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || DEMO_TOKEN;
    const headers = {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    } as Record<string, string>;

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await requestWithTimeout(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMessage = 'An error occurred with the API request.';
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorMessage;
      } catch {
        // Ignore if not JSON
      }

      if (response.status >= 500 || response.status === 404) {
        return buildOfflineResponse(endpoint, options);
      }

      throw new Error(errorMessage);
    }

    return response.json();
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return buildOfflineResponse(endpoint, options);
    }

    console.warn(`API request failed for ${endpoint}; using offline fallback.`, error);
    return buildOfflineResponse(endpoint, options);
  }
}
