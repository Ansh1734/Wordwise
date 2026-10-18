import { describe, it, expect } from 'vitest';
import { fetchLiveNews } from '@/lib/news';
import { generateQuizFromWords } from '@/lib/gemini';
import { decomposeWord } from '@/lib/dictionary';

describe('offline feature fallbacks', () => {
  it('returns local news articles when no news API token is configured', async () => {
    const articles = await fetchLiveNews('Technology');

    expect(Array.isArray(articles)).toBe(true);
    expect(articles.length).toBeGreaterThan(0);
    expect(articles[0]).toMatchObject({
      title: expect.any(String),
      excerpt: expect.any(String),
      content: expect.any(String),
      source: expect.any(String)
    });
  });

  it('builds a quiz locally when no Gemini token is configured', async () => {
    const quiz = await generateQuizFromWords(['practice', 'focus', 'confidence', 'grammar', 'clarity']);

    expect(Array.isArray(quiz)).toBe(true);
    expect(quiz).toHaveLength(5);
    expect(quiz[0]).toMatchObject({
      id: expect.any(Number),
      question: expect.any(String),
      options: expect.any(Array),
      correct: expect.any(Number),
      explanation: expect.any(String)
    });
    expect(quiz[0].options).toHaveLength(4);
  });

  it('decomposes a word locally when no Gemini token is configured', async () => {
    const result = await decomposeWord('photosynthesis');

    expect(result).toMatchObject({
      word: 'photosynthesis',
      partOfSpeech: expect.any(String),
      definition: expect.any(String),
      example: expect.any(String),
      prefix: expect.objectContaining({
        label: expect.any(String),
        present: expect.any(Boolean)
      }),
      root: expect.objectContaining({
        label: expect.any(String),
        present: true
      }),
      suffix: expect.objectContaining({
        label: expect.any(String),
        present: expect.any(Boolean)
      })
    });
  });
});
