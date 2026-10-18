import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  Flame,
  Award,
  BookOpen,
  Mic,
  Trophy,
  CheckCircle2,
  Calendar,
  Mail,
  Edit3,
  LogOut,
  Target,
  Sparkles,
  Zap,
  Globe,
  ChevronRight,
  ShieldCheck,
  User,
  Settings,
  Save,
  RotateCcw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface UserProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CEFR_LEVELS = [
  { level: "A1", name: "Beginner", desc: "Basic vocabulary & everyday greetings" },
  { level: "A2", name: "Elementary", desc: "Simple everyday expressions & phrases" },
  { level: "B1", name: "Intermediate", desc: "Work, school & travel conversations" },
  { level: "B2", name: "Upper Intermediate", desc: "Complex ideas & fluid native speech" },
  { level: "C1", name: "Advanced", desc: "Professional, academic & nuanced English" },
  { level: "C2", name: "Mastery", desc: "Native-like precision, idioms & eloquence" },
];

const AVATAR_COLORS = [
  { name: "Blue", class: "bg-blue-600", border: "border-blue-500" },
  { name: "Indigo", class: "bg-indigo-600", border: "border-indigo-500" },
  { name: "Purple", class: "bg-purple-600", border: "border-purple-500" },
  { name: "Emerald", class: "bg-emerald-600", border: "border-emerald-500" },
  { name: "Amber", class: "bg-amber-600", border: "border-amber-500" },
  { name: "Rose", class: "bg-rose-600", border: "border-rose-500" },
  { name: "Cyan", class: "bg-cyan-600", border: "border-cyan-500" },
  { name: "Slate", class: "bg-slate-700", border: "border-slate-600" },
];

const PRIMARY_FOCUS_OPTIONS = [
  "Vocabulary & Idioms",
  "Pronunciation & Speech",
  "Morphology & Roots",
  "News & Reading Comprehension",
  "IELTS / TOEFL Prep",
  "Business & Workplace English",
];

const INDIAN_LANGUAGES = [
  "Hindi",
  "Hinglish",
  "Marathi",
  "Tamil",
  "Telugu",
  "Bengali",
  "Gujarati",
  "Kannada",
  "Malayalam",
  "Punjabi",
  "Urdu",
];

export default function UserProfileModal({ open, onOpenChange }: UserProfileModalProps) {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();

  // Form states for Edit Information
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [avatarText, setAvatarText] = useState(user?.avatar || "P");
  const [avatarBg, setAvatarBg] = useState(user?.avatarBg || "bg-blue-600");
  const [dailyGoal, setDailyGoal] = useState<number>(user?.dailyGoal || 10);
  const [primaryFocus, setPrimaryFocus] = useState(user?.primaryFocus || "Vocabulary & Idioms");
  const [preferredLang, setPreferredLang] = useState(user?.preferredLanguage || "Hindi");
  const [activeTab, setActiveTab] = useState("edit-info");

  // Sync state whenever user object or modal opens
  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
      setBio(user.bio || "");
      setAvatarText(user.avatar || (user.name ? user.name.charAt(0).toUpperCase() : "P"));
      setAvatarBg(user.avatarBg || "bg-blue-600");
      setDailyGoal(user.dailyGoal || 10);
      setPrimaryFocus(user.primaryFocus || "Vocabulary & Idioms");
      setPreferredLang(user.preferredLanguage || "Hindi");
    }
  }, [user, open]);

  if (!user) return null;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Full name cannot be empty");
      return;
    }
    if (!email.trim()) {
      toast.error("Email address cannot be empty");
      return;
    }

    const finalAvatar = avatarText.trim() || name.trim().charAt(0).toUpperCase();

    updateUser({
      name: name.trim(),
      email: email.trim(),
      bio: bio.trim(),
      avatar: finalAvatar,
      avatarBg: avatarBg,
      dailyGoal: dailyGoal,
      primaryFocus: primaryFocus,
      preferredLanguage: preferredLang,
    });

    toast.success("Profile information successfully updated!");
  };

  const handleResetForm = () => {
    setName(user.name || "");
    setEmail(user.email || "");
    setBio(user.bio || "");
    setAvatarText(user.avatar || "P");
    setAvatarBg(user.avatarBg || "bg-blue-600");
    setDailyGoal(user.dailyGoal || 10);
    setPrimaryFocus(user.primaryFocus || "Vocabulary & Idioms");
    setPreferredLang(user.preferredLanguage || "Hindi");
    toast.info("Form reset to saved profile");
  };

  const handleCefrChange = (lvl: string) => {
    updateUser({ cefr: lvl });
    toast.success(`Proficiency goal set to ${lvl}`);
  };

  const handleLogout = () => {
    onOpenChange(false);
    logout();
    navigate("/login");
  };

  const completedQuizzesCount = user.quizHistory?.length || 0;
  const wordBankCount = user.wordBank?.length || 0;
  const accuracyScore = user.pronunciationAccuracy || 85;
  const weeklyScore = user.weeklyQuizScore || 0;

  const badges = [
    {
      id: "first_word",
      title: "First Step",
      desc: "Started your English learning journey",
      icon: <Zap className="h-5 w-5 text-amber-500" />,
      unlocked: true,
      color: "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400",
    },
    {
      id: "streak_3",
      title: "Streak Champion",
      desc: `${user.currentStreak || 1} day active learning streak`,
      icon: <Flame className="h-5 w-5 text-orange-500" />,
      unlocked: (user.currentStreak || 0) >= 1,
      color: "bg-orange-500/10 border-orange-500/20 text-orange-600 dark:text-orange-400",
    },
    {
      id: "quiz_ace",
      title: "Quiz Ace",
      desc: completedQuizzesCount > 0 ? `${completedQuizzesCount} Quizzes Completed` : "Complete your first AI Quiz",
      icon: <Trophy className="h-5 w-5 text-emerald-500" />,
      unlocked: completedQuizzesCount > 0,
      color: "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400",
    },
    {
      id: "word_collector",
      title: "Word Collector",
      desc: wordBankCount > 0 ? `${wordBankCount} Words in Word Bank` : "Save 3+ words to your Word Bank",
      icon: <BookOpen className="h-5 w-5 text-blue-500" />,
      unlocked: wordBankCount >= 1,
      color: "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400",
    },
    {
      id: "polyglot",
      title: "Polyglot",
      desc: "Explored multi-language Indian translations",
      icon: <Globe className="h-5 w-5 text-purple-500" />,
      unlocked: true,
      color: "bg-purple-500/10 border-purple-500/20 text-purple-600 dark:text-purple-400",
    },
    {
      id: "linguist",
      title: "Morphology Scholar",
      desc: "Used Gemini Morpheme Decomposer",
      icon: <Sparkles className="h-5 w-5 text-pink-500" />,
      unlocked: true,
      color: "bg-pink-500/10 border-pink-500/20 text-pink-600 dark:text-pink-400",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto p-0 rounded-3xl border border-border shadow-2xl bg-card">
        {/* Profile Banner */}
        <div className="relative bg-gradient-to-r from-primary via-primary/95 to-blue-700 p-6 sm:p-7 text-primary-foreground">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Avatar circle */}
              <div className="relative">
                <div className={`flex h-18 w-18 sm:h-20 sm:w-20 items-center justify-center rounded-2xl ${user.avatarBg || "bg-blue-600"} text-3xl font-extrabold text-white shadow-xl ring-4 ring-white/20`}>
                  {user.avatar || user.name?.charAt(0)?.toUpperCase() || "P"}
                </div>
                <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white ring-2 ring-white" title="Verified Account">
                  <ShieldCheck className="h-3.5 w-3.5" />
                </span>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-black tracking-tight">{user.name}</h2>
                  <button
                    onClick={() => setActiveTab("edit-info")}
                    className="rounded-lg px-2 py-0.5 text-xs font-semibold bg-white/20 hover:bg-white/30 text-white flex items-center gap-1 transition-colors"
                    title="Edit Profile"
                  >
                    <Edit3 className="h-3 w-3" /> Edit
                  </button>
                </div>
                <p className="text-xs text-white/80 flex items-center gap-1.5 mt-0.5">
                  <Mail className="h-3.5 w-3.5" />
                  {user.email}
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 backdrop-blur text-white">
                    <Target className="h-3 w-3" /> CEFR: {user.cefr || "B2"}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/10 text-white/90">
                    <Calendar className="h-3 w-3" /> Joined {user.joinDate || "2026"}
                  </span>
                  {user.dailyGoal && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/10 text-white/90">
                      🎯 Goal: {user.dailyGoal} words/day
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white gap-1.5 text-xs font-medium"
              >
                <LogOut className="h-3.5 w-3.5" /> Sign Out
              </Button>
            </div>
          </div>
        </div>

        {/* 4 Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-6 pb-2">
          {/* Streak */}
          <div className="rounded-2xl border border-border/80 bg-gradient-to-br from-amber-500/5 to-transparent p-3.5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Streak</span>
              <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-500">
                <Flame className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-1.5 text-2xl font-black text-foreground">{user.currentStreak || 1} <span className="text-xs font-semibold text-muted-foreground">Days</span></p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Best: {user.longestStreak || 1} days</p>
          </div>

          {/* Words Mastered */}
          <div className="rounded-2xl border border-border/80 bg-gradient-to-br from-blue-500/5 to-transparent p-3.5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Vocabulary</span>
              <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500">
                <BookOpen className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-1.5 text-2xl font-black text-foreground">{user.wordsLearned || wordBankCount} <span className="text-xs font-semibold text-muted-foreground">Words</span></p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{wordBankCount} in Word Bank</p>
          </div>

          {/* Quiz Score */}
          <div className="rounded-2xl border border-border/80 bg-gradient-to-br from-emerald-500/5 to-transparent p-3.5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Quiz Score</span>
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                <Trophy className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-1.5 text-2xl font-black text-foreground">{weeklyScore > 0 ? `${weeklyScore}%` : "80%"} <span className="text-xs font-semibold text-muted-foreground">Avg</span></p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{completedQuizzesCount} completed</p>
          </div>

          {/* Pronunciation */}
          <div className="rounded-2xl border border-border/80 bg-gradient-to-br from-purple-500/5 to-transparent p-3.5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Speaking</span>
              <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-500">
                <Mic className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-1.5 text-2xl font-black text-foreground">{accuracyScore}% <span className="text-xs font-semibold text-muted-foreground">Accuracy</span></p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Voice evaluated</p>
          </div>
        </div>

        {/* Deep Dive Tabs */}
        <div className="px-6 pb-6 pt-1">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-4 h-11 bg-muted/60 p-1 rounded-xl">
              <TabsTrigger value="edit-info" className="rounded-lg text-xs font-semibold gap-1.5">
                <Edit3 className="h-3.5 w-3.5" /> Edit Info
              </TabsTrigger>
              <TabsTrigger value="achievements" className="rounded-lg text-xs font-semibold gap-1.5">
                <Award className="h-3.5 w-3.5" /> Milestones
              </TabsTrigger>
              <TabsTrigger value="proficiency" className="rounded-lg text-xs font-semibold gap-1.5">
                <Target className="h-3.5 w-3.5" /> CEFR Level
              </TabsTrigger>
              <TabsTrigger value="preferences" className="rounded-lg text-xs font-semibold gap-1.5">
                <Sparkles className="h-3.5 w-3.5" /> Quick Hub
              </TabsTrigger>
            </TabsList>

            {/* ═════════ TAB 1: EDIT INFORMATION ═════════ */}
            <TabsContent value="edit-info" className="space-y-5 pt-4">
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-name" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-primary" /> Full Name
                    </Label>
                    <Input
                      id="edit-name"
                      type="text"
                      required
                      placeholder="e.g. Parth Verma"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-10 text-sm rounded-xl focus-visible:ring-primary"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-email" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-primary" /> Email Address
                    </Label>
                    <Input
                      id="edit-email"
                      type="email"
                      required
                      placeholder="parthverma@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-10 text-sm rounded-xl focus-visible:ring-primary"
                    />
                  </div>
                </div>

                {/* Avatar Initial & Color Picker */}
                <div className="rounded-2xl border border-border bg-muted/20 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-primary" /> Avatar Customization
                    </Label>
                    <span className="text-[11px] text-muted-foreground">Pick your initial and theme color</span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    {/* Live Avatar Preview */}
                    <div className="flex items-center gap-3">
                      <div className={`h-14 w-14 rounded-2xl ${avatarBg} text-white text-2xl font-black flex items-center justify-center shadow-md ring-2 ring-primary/20`}>
                        {avatarText || name.charAt(0).toUpperCase() || "P"}
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="avatar-char" className="text-[11px] font-semibold text-muted-foreground">
                          Badge Letter / Emoji
                        </Label>
                        <Input
                          id="avatar-char"
                          maxLength={3}
                          value={avatarText}
                          onChange={(e) => setAvatarText(e.target.value)}
                          placeholder="P"
                          className="h-8 w-20 text-center font-bold text-sm uppercase rounded-lg"
                        />
                      </div>
                    </div>

                    {/* Color Swatches */}
                    <div className="flex-1">
                      <Label className="text-[11px] font-semibold text-muted-foreground block mb-1.5">
                        Avatar Color Theme
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {AVATAR_COLORS.map((c) => (
                          <button
                            key={c.name}
                            type="button"
                            onClick={() => setAvatarBg(c.class)}
                            className={`h-7 w-7 rounded-full ${c.class} transition-all cursor-pointer ${
                              avatarBg === c.class ? "ring-2 ring-offset-2 ring-primary scale-110 shadow-sm" : "opacity-80 hover:opacity-100"
                            }`}
                            title={c.name}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Learning Preferences */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  {/* Daily Goal */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-foreground">
                      Daily Word Goal
                    </Label>
                    <select
                      value={dailyGoal}
                      onChange={(e) => setDailyGoal(Number(e.target.value))}
                      className="w-full h-10 px-3 text-sm rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                    >
                      <option value={5}>5 words / day (Casual)</option>
                      <option value={10}>10 words / day (Standard)</option>
                      <option value={15}>15 words / day (Intensive)</option>
                      <option value={20}>20 words / day (Pro)</option>
                    </select>
                  </div>

                  {/* Primary Focus */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-foreground">
                      Primary Learning Focus
                    </Label>
                    <select
                      value={primaryFocus}
                      onChange={(e) => setPrimaryFocus(e.target.value)}
                      className="w-full h-10 px-3 text-sm rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                    >
                      {PRIMARY_FOCUS_OPTIONS.map((f) => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                  </div>

                  {/* Translation Language */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-foreground">
                      Translation Language
                    </Label>
                    <select
                      value={preferredLang}
                      onChange={(e) => setPreferredLang(e.target.value)}
                      className="w-full h-10 px-3 text-sm rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                    >
                      {INDIAN_LANGUAGES.map((l) => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Bio / Objective */}
                <div className="space-y-1.5">
                  <Label htmlFor="edit-bio" className="text-xs font-bold text-foreground">
                    Learning Objective / Bio (optional)
                  </Label>
                  <Input
                    id="edit-bio"
                    type="text"
                    placeholder="e.g. Preparing for GRE/TOEFL and mastering fluent vocabulary"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="h-10 text-sm rounded-xl focus-visible:ring-primary"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleResetForm}
                    className="h-10 text-xs font-semibold gap-1.5 rounded-xl"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Discard
                  </Button>
                  <Button
                    type="submit"
                    className="h-10 text-xs font-bold gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl px-5 shadow-sm"
                  >
                    <Save className="h-3.5 w-3.5" /> Save Information
                  </Button>
                </div>
              </form>
            </TabsContent>

            {/* ═════════ TAB 2: ACHIEVEMENTS & MILESTONES ═════════ */}
            <TabsContent value="achievements" className="space-y-4 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {badges.map((badge) => (
                  <div
                    key={badge.id}
                    className={`flex items-start gap-3.5 p-3.5 rounded-2xl border transition-all ${
                      badge.unlocked
                        ? "bg-card border-border/90 shadow-sm"
                        : "bg-muted/30 border-dashed border-border/60 opacity-60"
                    }`}
                  >
                    <div className={`p-2 rounded-xl border ${badge.color} flex items-center justify-center shrink-0`}>
                      {badge.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-sm font-bold text-foreground truncate">{badge.title}</h4>
                        {badge.unlocked && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{badge.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* ═════════ TAB 3: CEFR PROFICIENCY ═════════ */}
            <TabsContent value="proficiency" className="space-y-4 pt-4">
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Select your target CEFR proficiency. WordWise tailors daily words, news complexity, and quiz difficulty to this level:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                  {CEFR_LEVELS.map((item) => {
                    const isSelected = (user.cefr || "B2") === item.level;
                    return (
                      <button
                        key={item.level}
                        type="button"
                        onClick={() => handleCefrChange(item.level)}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? "border-primary bg-primary/10 shadow-sm ring-2 ring-primary/20"
                            : "border-border hover:border-primary/40 hover:bg-muted/40"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-black text-base text-foreground">{item.level}</span>
                          {isSelected && <CheckCircle2 className="h-4 w-4 text-primary" />}
                        </div>
                        <p className="text-xs font-semibold text-foreground mt-0.5">{item.name}</p>
                        <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{item.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </TabsContent>

            {/* ═════════ TAB 4: QUICK LEARNING HUB ═════════ */}
            <TabsContent value="preferences" className="space-y-3 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    onOpenChange(false);
                    navigate("/quiz");
                  }}
                  className="flex items-center justify-between p-3.5 rounded-2xl border border-border bg-card hover:bg-primary/5 hover:border-primary/50 transition-all text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
                      <Trophy className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">Start Daily AI Quiz</p>
                      <p className="text-xs text-muted-foreground">Test vocabulary with Gemini AI</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onOpenChange(false);
                    navigate("/word-bank");
                  }}
                  className="flex items-center justify-between p-3.5 rounded-2xl border border-border bg-card hover:bg-primary/5 hover:border-primary/50 transition-all text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">Explore Word Bank</p>
                      <p className="text-xs text-muted-foreground">Review saved & mastered words</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onOpenChange(false);
                    navigate("/decomposer");
                  }}
                  className="flex items-center justify-between p-3.5 rounded-2xl border border-border bg-card hover:bg-primary/5 hover:border-primary/50 transition-all text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">Morpheme Decomposer</p>
                      <p className="text-xs text-muted-foreground">Break words into prefixes & roots</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onOpenChange(false);
                    navigate("/pronunciation");
                  }}
                  className="flex items-center justify-between p-3.5 rounded-2xl border border-border bg-card hover:bg-primary/5 hover:border-primary/50 transition-all text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600">
                      <Mic className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">Pronunciation Lab</p>
                      <p className="text-xs text-muted-foreground">Practice speaking & accent training</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
