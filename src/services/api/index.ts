import { fetchWithAuth } from './client';

export const grammarApi = {
  checkGrammar: async (text: string) => {
    return fetchWithAuth('/grammar/check', {
      method: 'POST',
      body: JSON.stringify({ text })
    });
  }
};

export const speakingApi = {
  analyzeSpeech: async (audioBlob: Blob, filename: string = "audio.webm") => {
    const formData = new FormData();
    formData.append('audio', audioBlob, filename);
    return fetchWithAuth('/speech/analyze', {
      method: 'POST',
      body: formData,
    });
  }
};

export const pronunciationApi = {
  analyzePronunciation: async (word: string, audioBlob: Blob, filename: string = "audio.webm") => {
    const formData = new FormData();
    formData.append('word', word);
    formData.append('audio', audioBlob, filename);
    return fetchWithAuth('/pronunciation/analyze', {
      method: 'POST',
      body: formData,
    });
  }
};

export const nlpApi = {
  decomposeWord: async (word: string) => {
    return fetchWithAuth('/nlp/decompose', {
      method: 'POST',
      body: JSON.stringify({ word })
    });
  },
  
  semanticSimilarity: async (sentence1: string, sentence2: string) => {
    return fetchWithAuth('/nlp/semantic-similarity', {
      method: 'POST',
      body: JSON.stringify({ sentence1, sentence2 })
    });
  }
};

export const readingApi = {
  analyzeReading: async (targetText: string, durationSeconds: number, audioBlob: Blob) => {
    const formData = new FormData();
    formData.append('targetText', targetText);
    formData.append('durationSeconds', durationSeconds.toString());
    formData.append('audio', audioBlob, 'reading.webm');
    
    return fetchWithAuth('/reading/analyze', {
      method: 'POST',
      body: formData,
    });
  }
};

export const interviewApi = {
  analyzeAnswer: async (question: string, durationSeconds: number, audioBlob: Blob) => {
    const formData = new FormData();
    formData.append('question', question);
    formData.append('durationSeconds', durationSeconds.toString());
    formData.append('audio', audioBlob, 'interview.webm');
    
    return fetchWithAuth('/interview/analyze-answer', {
      method: 'POST',
      body: formData,
    });
  }
};
