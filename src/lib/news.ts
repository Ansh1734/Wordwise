
export interface NewsArticle {
  id: string;
  source: string;
  title: string;
  excerpt: string;
  content: string;
  url: string;
  urlToImage?: string;
  publishedAt: string;
  readTime: string;
  level: string;
}

const FALLBACK_ARTICLES: Record<string, NewsArticle[]> = {
  All: [
    {
      id: "local-1",
      source: "WordWise Desk",
      title: "AI-powered language learning tools help students build confidence faster",
      excerpt: "Educational platforms are combining short lessons, speaking practice, and daily vocabulary routines to help learners retain words in realistic scenes.",
      content: "Language learners often improve fastest when they combine short, consistent practice with immediate feedback. Modern education tools are increasingly designed around this principle, helping students review vocabulary, speak with confidence, and understand grammar in context. Instead of memorizing long lists, learners now work with engaging exercises that connect words to real usage, speaking drills, and meaningful communication. This approach helps people practice more naturally and can reduce anxiety when speaking English in everyday situations.",
      url: "https://example.com/local-1",
      publishedAt: new Date().toISOString(),
      readTime: "3 min",
      level: "B1"
    },
    {
      id: "local-2",
      source: "News Studio",
      title: "Teams are using short reading breaks to improve comprehension and focus",
      excerpt: "Researchers say regular short reading sessions can improve attention, vocabulary depth, and retention across ages.",
      content: "Short reading sessions create a manageable rhythm for learners and reduce the pressure of long study blocks. Experts argue that consistent exposure to relevant reading material helps people absorb new vocabulary in a more natural way. By reading a little each day, students build a stronger sense of sentence structure, tone, and nuance. The result is better comprehension without feeling overwhelmed by difficult material.",
      url: "https://example.com/local-2",
      publishedAt: new Date().toISOString(),
      readTime: "4 min",
      level: "B1"
    }
  ],
  Business: [
    {
      id: "local-business-1",
      source: "Business Brief",
      title: "Flexible communication skills prove essential in modern workplaces",
      excerpt: "Professionals are placing more emphasis on clear speaking, confident collaboration, and concise presentations.",
      content: "In modern workplaces, communication skills are often just as important as technical knowledge. Teams depend on clear instructions, thoughtful feedback, and the ability to explain ideas without confusion. Employers increasingly value workers who can speak clearly, listen well, and adapt their language for different audiences. As a result, communication practice has become a key part of professional development.",
      url: "https://example.com/local-business-1",
      publishedAt: new Date().toISOString(),
      readTime: "3 min",
      level: "B2"
    }
  ],
  Technology: [
    {
      id: "local-tech-1",
      source: "Future Tech",
      title: "Assistive language tools are becoming more practical for everyday learners",
      excerpt: "New tools combine instant feedback, pronunciation checks, and personalized exercises to make learning more responsive.",
      content: "Modern language learning tools are increasingly built around practical support rather than one-size-fits-all lessons. Some systems focus on speech recognition, others on vocabulary practice, and many combine both to provide immediate feedback. This creates a more useful learning loop, where students can try a phrase, get guidance, and improve with each attempt. For many learners, this makes the experience feel more responsive and motivating.",
      url: "https://example.com/local-tech-1",
      publishedAt: new Date().toISOString(),
      readTime: "4 min",
      level: "B1"
    }
  ],
  Science: [
    {
      id: "local-science-1",
      source: "Science Roundup",
      title: "Focused practice improves memory for complex ideas and new vocabulary",
      excerpt: "Studies suggest that repeated recall and explanation help people retain information more effectively than passive reading.",
      content: "Scientific research in education repeatedly points to the value of active recall. When learners explain an idea aloud or test themselves on new words, the memory path becomes stronger than it would through passive review alone. This is why short question sets, speaking tasks, and quick summaries are effective study tools. The learner is not only reading information but actively using it in context.",
      url: "https://example.com/local-science-1",
      publishedAt: new Date().toISOString(),
      readTime: "3 min",
      level: "B2"
    }
  ],
  Health: [
    {
      id: "local-health-1",
      source: "Wellbeing Daily",
      title: "Regular learning habits support stronger focus and lower stress",
      excerpt: "Small daily routines can build confidence and reduce the pressure that often comes with studying a new language.",
      content: "Creating a manageable learning routine can improve both performance and wellbeing. Instead of long, exhausting sessions, short repeated practice blocks often produce better results. This consistency helps learners stay calm, build confidence, and stay motivated over time. When the process feels realistic, it becomes easier to keep improving without frustration.",
      url: "https://example.com/local-health-1",
      publishedAt: new Date().toISOString(),
      readTime: "2 min",
      level: "B1"
    }
  ],
  Sports: [
    {
      id: "local-sports-1",
      source: "Sports Wire",
      title: "Training routines and communication drills help teams work better together",
      excerpt: "Coaches emphasize consistent practice, team communication, and clear instructions across every level of sport.",
      content: "Strong sports teams depend on clear communication and steady practice. Repetition helps athletes respond quickly under pressure, while disciplined coaching improves focus and confidence. The same principle applies to language learning: regular practice with clear feedback creates stronger habits. Over time, better communication builds trust and performance across the whole group.",
      url: "https://example.com/local-sports-1",
      publishedAt: new Date().toISOString(),
      readTime: "3 min",
      level: "B1"
    }
  ],
  Entertainment: [
    {
      id: "local-entertainment-1",
      source: "Culture Watch",
      title: "Storytelling and dialogue practice remain among the best ways to improve language fluency",
      excerpt: "Creative media gives learners a natural context for learning vocabulary, tone, and expression.",
      content: "Stories make language memorable. When learners hear natural dialogue, they begin to notice rhythm, emphasis, and word choice in ways that textbooks often miss. This helps improve both understanding and speaking confidence. Because storytelling is engaging, it creates a stronger emotional connection to the language, making it easier to remember what has been learned.",
      url: "https://example.com/local-entertainment-1",
      publishedAt: new Date().toISOString(),
      readTime: "3 min",
      level: "B1"
    }
  ]
};

function getFallbackArticles(category: string = ""): NewsArticle[] {
  const normalized = category && category !== "All" ? category : "All";
  return (FALLBACK_ARTICLES[normalized] || FALLBACK_ARTICLES.All).map((article) => ({
    ...article,
    publishedAt: article.publishedAt || new Date().toISOString(),
    level: article.level || "B1"
  }));
}

export async function fetchLiveNews(category: string = ""): Promise<NewsArticle[]> {
  const API_KEY = import.meta.env.VITE_NEWS_API_KEY;
  if (!API_KEY) {
    return getFallbackArticles(category);
  }

  const categoryParam = category && category !== "All" ? `&category=${category.toLowerCase()}` : "";
  const url = `https://newsapi.org/v2/top-headlines?language=en${categoryParam}&apiKey=${API_KEY}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to fetch news");
    }

    const data = await response.json();

    return (data.articles || [])
      .filter((a: any) => a.title && (a.content || a.description) && a.title !== "[Removed]")
      .map((a: any, index: number) => ({
        id: a.url || index.toString(),
        source: a.source?.name || "News",
        title: a.title,
        excerpt: a.description || "No description available",
        content: a.content || a.description || "No content available",
        url: a.url,
        urlToImage: a.urlToImage,
        publishedAt: a.publishedAt,
        readTime: "3 min",
        level: category || "B1"
      }));
  } catch (error) {
    console.warn("Live news failed; loading local fallback articles.", error);
    return getFallbackArticles(category);
  }
}
