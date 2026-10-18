import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Search, BookOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { Link } from "react-router-dom";

const BLUE = "#1A56DB";
const GREEN = "#0E9F6E";

export default function ProgressPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");

  const hasData = user && (user.wordsLearned > 0 || user.wordBank.length > 0 || user.quizHistory.length > 0);

  if (!hasData) {
    return (
      <div className="container py-16 text-center space-y-4 fade-in">
        <BookOpen className="mx-auto h-16 w-16 text-primary/30" />
        <h2 className="text-xl font-bold text-heading">No data yet!</h2>
        <p className="text-muted-foreground">Start learning to see your progress here.</p>
        <Link to="/">
          <Button className="mt-2 bg-primary text-primary-foreground hover:bg-primary/90">Start Learning</Button>
        </Link>
      </div>
    );
  }

  const weeklyVocab = [
    { week: "Week 1", words: 0 }, { week: "Week 2", words: 0 },
    { week: "Week 3", words: 0 }, { week: "Week 4", words: user.wordsLearned },
  ];
  const quizScores = user.quizHistory.length > 0
    ? user.quizHistory.slice(-4).map((s: number, i: number) => ({ week: `Quiz ${i + 1}`, score: s }))
    : [{ week: "Week 1", score: user.weeklyQuizScore }];
  const pronunciationData = [
    { name: "Correct", value: user.pronunciationAccuracy || 0 },
    { name: "Needs Work", value: 100 - (user.pronunciationAccuracy || 0) },
  ];

  const filteredBank = (user.wordBank || []).filter((w: any) =>
    w.word?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container py-8 space-y-8">
      <div className="rounded-xl bg-blue-card-bg p-6 border border-blue-card-border">
        <h1 className="text-2xl font-bold text-primary">Progress Dashboard</h1>
        <p className="text-muted-foreground mt-1">Track your learning journey</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl bg-card p-6 shadow-sm border border-border">
          <h3 className="mb-4 font-bold text-heading">Vocabulary Growth</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={weeklyVocab}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="week" tick={{ fontSize: 12 }} stroke="#94A3B8" />
              <YAxis tick={{ fontSize: 12 }} stroke="#94A3B8" />
              <Tooltip />
              <Line type="monotone" dataKey="words" stroke={BLUE} strokeWidth={3} dot={{ fill: BLUE, r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl bg-card p-6 shadow-sm border border-border">
          <h3 className="mb-4 font-bold text-heading">Quiz Scores</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={quizScores}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="week" tick={{ fontSize: 12 }} stroke="#94A3B8" />
              <YAxis tick={{ fontSize: 12 }} stroke="#94A3B8" />
              <Tooltip />
              <Bar dataKey="score" fill={GREEN} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl bg-card p-6 shadow-sm border border-border">
          <h3 className="mb-4 font-bold text-heading">Pronunciation Accuracy</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pronunciationData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" strokeWidth={0}>
                <Cell fill={BLUE} />
                <Cell fill={GREEN} />
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 text-sm">
            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-primary inline-block" /> Correct</span>
            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-success inline-block" /> Needs Work</span>
          </div>
        </div>
      </div>

      {user.wordBank.length > 0 && (
        <div className="rounded-xl bg-card p-6 shadow-sm border border-border">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-bold text-heading">Word Bank</h3>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search words..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 focus-visible:ring-primary" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-3 text-left font-semibold text-primary">Word</th>
                  <th className="pb-3 text-left font-semibold text-primary">Added</th>
                </tr>
              </thead>
              <tbody>
                {filteredBank.map((w: any, i: number) => (
                  <tr key={i} className="border-b border-border/50 last:border-0">
                    <td className="py-3 font-medium text-heading">{w.word}</td>
                    <td className="py-3 text-muted-foreground">{w.added || "--"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
