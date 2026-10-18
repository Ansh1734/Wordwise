export interface FluencyStats {
  durationSeconds: number;
  totalWords: number;
  wpm: number;
  fillers: { count: number; words: string[]; percentage: number };
  clarityScore: number;
}

export function calculateFluency(
  stats: FluencyStats,
  grammarScore: number,
  vocabularyScore: number
) {
  // Pacing (20%): target ~120-160 WPM
  let pacingScore = 100;
  if (stats.wpm < 100) pacingScore -= (100 - stats.wpm) * 1.5;
  if (stats.wpm > 180) pacingScore -= (stats.wpm - 180);
  pacingScore = Math.max(0, Math.min(100, Math.round(pacingScore)));

  // Pauses (15%): Approximate based on pacing for now
  const pausesScore = pacingScore; 

  // Fillers (20%): Ideal is < 2%
  let fillerScore = 100 - (stats.fillers.percentage * 15);
  fillerScore = Math.max(0, Math.min(100, Math.round(fillerScore)));

  // Weights
  const total = 
    (pacingScore * 0.20) + 
    (pausesScore * 0.15) + 
    (fillerScore * 0.20) + 
    (stats.clarityScore * 0.25) + 
    (grammarScore * 0.10) + 
    (vocabularyScore * 0.10);

  const score = Math.round(total);

  let rating = "Let's Practice More 🌱";
  if (score >= 90) rating = "Excellent! 🏆";
  else if (score >= 80) rating = "Nice! 🌟";
  else if (score >= 70) rating = "Good! 👍";
  else if (score >= 60) rating = "Still Needs Improvement 💪";
  else if (score >= 50) rating = "You Can Do Better! 🚀";

  return {
    score,
    rating,
    breakdown: {
      pacing: pacingScore,
      fillers: fillerScore,
      clarity: stats.clarityScore,
      grammar: grammarScore,
      vocabulary: vocabularyScore
    }
  };
}
