import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export interface UserData {
  name: string;
  email: string;
  password: string;
  avatar: string;
  avatarBg?: string;
  dailyGoal?: number;
  primaryFocus?: string;
  preferredLanguage?: string;
  bio?: string;
  wordsLearned: number;
  pronunciationAccuracy: number;
  weeklyQuizScore: number;
  wordsDueToday: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;   // "YYYY-MM-DD" — used for streak tracking
  wordBank: any[];
  quizHistory: any[];
  pronunciationLogs: any[];
  newsHistory: any[];
  joinDate: string;
  cefr: string;
  grammarProfile?: Record<string, { mistakes: number; correct: number; score: number }>;
  speakingFluencyHistory?: { date: string; score: number; rating: string }[];
  pronunciation?: { wordsPracticed: string[]; weakWords: string[]; averageScore: number };
  reading?: { articlesCompleted: number; averagePronunciation: number; averageClarity: number };
  interview?: { interviewsCompleted: number; averageScore: number; weakAreas: string[] };
}

interface AuthContextType {
  user: UserData | null;
  token: string | null;
  login: (email: string, password: string) => string | null;
  register: (name: string, email: string, password: string) => string | null;
  loginWithGoogle: () => Promise<string | null>;
  signInWithGoogleProfile: (name: string, email: string, avatarUrl?: string) => string | null;
  completeGoogleSignIn: () => Promise<string | null>;
  requestPasswordReset: (email: string) => { error: string | null; code: string | null };
  verifyPasswordResetCode: (email: string, code: string) => string | null;
  resetPassword: (email: string, newPassword: string) => string | null;
  logout: () => void;
  updateUser: (updates: Partial<UserData>) => void;
  updateGrammarProfile: (pattern: string, isCorrect: boolean) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

function getAllUsers(): UserData[] {
  try {
    return JSON.parse(localStorage.getItem("wordwise_users") || "[]");
  } catch { return []; }
}

function saveAllUsers(users: UserData[]) {
  localStorage.setItem("wordwise_users", JSON.stringify(users));
}

interface PasswordResetRequest {
  email: string;
  code: string;
  expiresAt: number;
  verified: boolean;
}

function getAllPasswordResetRequests(): PasswordResetRequest[] {
  try {
    return JSON.parse(localStorage.getItem("wordwise_password_resets") || "[]");
  } catch {
    return [];
  }
}

function saveAllPasswordResetRequests(requests: PasswordResetRequest[]) {
  localStorage.setItem("wordwise_password_resets", JSON.stringify(requests));
}

/**
 * Computes updated streak fields based on the user's lastActiveDate.
 * - Same day  → no change (already counted today)
 * - Yesterday → extend streak by 1
 * - Older / missing → reset to 1
 * Always bumps longestStreak if currentStreak exceeds it.
 */
function computeStreak(u: UserData): Pick<UserData, "currentStreak" | "longestStreak" | "lastActiveDate"> {
  const today = new Date().toISOString().split("T")[0];
  const last = u.lastActiveDate || "";

  if (last === today) {
    // Already counted today — no change
    return { currentStreak: u.currentStreak, longestStreak: u.longestStreak, lastActiveDate: today };
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  const newStreak = last === yesterdayStr ? (u.currentStreak || 0) + 1 : 1;
  const newLongest = Math.max(u.longestStreak || 0, newStreak);

  return { currentStreak: newStreak, longestStreak: newLongest, lastActiveDate: today };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const getAppBaseUrl = () => {
    const configured = import.meta.env.VITE_APP_URL as string | undefined;
    return configured?.trim() || window.location.origin;
  };

  const [user, setUser] = useState<UserData | null>(() => {
    try {
      const u = localStorage.getItem("wordwise_user");
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("wordwise_token"));

  useEffect(() => {
    const t = localStorage.getItem("wordwise_token");
    const u = localStorage.getItem("wordwise_user");
    if (t && u) {
      try {
        const parsed: UserData = JSON.parse(u);
        // Update streak on session restore (app open / page refresh)
        const streakUpdate = computeStreak(parsed);
        const updated = { ...parsed, ...streakUpdate };
        // Persist streak update
        localStorage.setItem("wordwise_user", JSON.stringify(updated));
        const users = getAllUsers();
        const idx = users.findIndex(usr => usr.email === updated.email);
        if (idx >= 0) { users[idx] = updated; saveAllUsers(users); }
        setToken(t);
        setUser(updated);
      } catch {
        localStorage.removeItem("wordwise_token");
        localStorage.removeItem("wordwise_user");
      }
    }
  }, []);

  const applyAuthState = (authUser: UserData, authToken: string) => {
    localStorage.setItem("wordwise_token", authToken);
    localStorage.setItem("wordwise_user", JSON.stringify(authUser));
    setToken(authToken);
    setUser(authUser);
  };

  const login = (email: string, password: string): string | null => {
    const users = getAllUsers();
    const found = users.find(u => u.email === email);
    if (!found) return "Invalid email or password";
    if (found.password !== password) return "Invalid email or password";
    // Apply streak on login
    const streakUpdate = computeStreak(found);
    const loggedIn = { ...found, ...streakUpdate };
    const idx = users.findIndex(u => u.email === email);
    if (idx >= 0) { users[idx] = loggedIn; saveAllUsers(users); }
    const newToken = btoa(email + Date.now());
    localStorage.setItem("wordwise_token", newToken);
    localStorage.setItem("wordwise_user", JSON.stringify(loggedIn));
    setToken(newToken);
    setUser(loggedIn);
    return null;
  };

  const register = (name: string, email: string, password: string): string | null => {
    const users = getAllUsers();
    if (users.find(u => u.email === email)) return "Email is already registered";
    const today = new Date().toISOString().split("T")[0];
    const newUser: UserData = {
      name, email, password,
      avatar: name.charAt(0).toUpperCase(),
      wordsLearned: 0,
      pronunciationAccuracy: 0,
      weeklyQuizScore: 0,
      wordsDueToday: 0,
      currentStreak: 1,
      longestStreak: 1,
      lastActiveDate: today,
      wordBank: [],
      quizHistory: [],
      pronunciationLogs: [],
      newsHistory: [],
      joinDate: today,
      cefr: "A2",
      grammarProfile: {},
      speakingFluencyHistory: [],
      pronunciation: { wordsPracticed: [], weakWords: [], averageScore: 0 },
      reading: { articlesCompleted: 0, averagePronunciation: 0, averageClarity: 0 },
      interview: { interviewsCompleted: 0, averageScore: 0, weakAreas: [] },
    };
    users.push(newUser);
    saveAllUsers(users);
    const newToken = btoa(email + Date.now());
    localStorage.setItem("wordwise_token", newToken);
    localStorage.setItem("wordwise_user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    return null;
  };

  const signInWithGoogleProfile = (name: string, email: string, avatarUrl?: string): string | null => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return "Email is required for Google Sign-In";

    const cleanName = name.trim() || cleanEmail.split("@")[0] || "Google User";
    const users = getAllUsers();
    let existing = users.find((u) => u.email.toLowerCase() === cleanEmail);

    if (!existing) {
      existing = {
        name: cleanName,
        email: cleanEmail,
        password: "",
        avatar: avatarUrl || cleanName.charAt(0).toUpperCase(),
        wordsLearned: 0,
        pronunciationAccuracy: 0,
        weeklyQuizScore: 0,
        wordsDueToday: 0,
        currentStreak: 1,
        longestStreak: 1,
        lastActiveDate: new Date().toISOString().split("T")[0],
        wordBank: [],
        quizHistory: [],
        pronunciationLogs: [],
        newsHistory: [],
        joinDate: new Date().toISOString().split("T")[0],
        cefr: "A2",
        grammarProfile: {},
        speakingFluencyHistory: [],
        pronunciation: { wordsPracticed: [], weakWords: [], averageScore: 0 },
        reading: { articlesCompleted: 0, averagePronunciation: 0, averageClarity: 0 },
        interview: { interviewsCompleted: 0, averageScore: 0, weakAreas: [] },
      };
      users.push(existing);
      saveAllUsers(users);
    }

    const streakUpdate = computeStreak(existing);
    const withStreak = { ...existing, ...streakUpdate };
    const updIdx = users.findIndex((u) => u.email.toLowerCase() === cleanEmail);
    if (updIdx >= 0) {
      users[updIdx] = withStreak;
      saveAllUsers(users);
    }

    const googleToken = `google_session_${btoa(cleanEmail + "_" + Date.now())}`;
    applyAuthState(withStreak, googleToken);
    return null;
  };

  const loginWithGoogle = async (): Promise<string | null> => {
    if (!isSupabaseConfigured || !supabase) {
      const demoUser = signInWithGoogleProfile("Demo User", "demo@wordwise.app", "D");
      return demoUser;
    }

    try {
      const redirectTo = `${getAppBaseUrl()}/auth/callback`;
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });
      if (error) {
        if (error.message.includes("requested path is invalid")) {
          return `OAuth redirect is invalid. Add ${redirectTo} in Supabase Authentication URL Configuration.`;
        }
        return error.message;
      }
      if (data?.url) {
        window.location.assign(data.url);
        return null;
      }
    } catch {
      // Fallback gracefully
    }
    return null;
  };

  const completeGoogleSignIn = async (): Promise<string | null> => {
    if (!isSupabaseConfigured || !supabase) {
      const demoUser = signInWithGoogleProfile("Demo User", "demo@wordwise.app", "D");
      return demoUser;
    }

    const { data, error } = await supabase.auth.getSession();
    if (error) return error.message;
    if (!data.session?.user) return "Google sign-in session not found. Try again.";

    const sessionUser = data.session.user;
    const email = sessionUser.email || "";
    if (!email) return "Google account email is missing.";

    const users = getAllUsers();
    let existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

    if (!existing) {
      const displayName =
        (sessionUser.user_metadata?.full_name as string | undefined) ||
        (sessionUser.user_metadata?.name as string | undefined) ||
        email.split("@")[0];

      existing = {
        name: displayName,
        email,
        password: "",
        avatar: displayName.charAt(0).toUpperCase(),
        wordsLearned: 0,
        pronunciationAccuracy: 0,
        weeklyQuizScore: 0,
        wordsDueToday: 0,
        currentStreak: 0,
        longestStreak: 0,
        lastActiveDate: new Date().toISOString().split("T")[0],
        wordBank: [],
        quizHistory: [],
        pronunciationLogs: [],
        newsHistory: [],
        joinDate: new Date().toISOString().split("T")[0],
        cefr: "A2",
        grammarProfile: {},
        speakingFluencyHistory: [],
        pronunciation: { wordsPracticed: [], weakWords: [], averageScore: 0 },
        reading: { articlesCompleted: 0, averagePronunciation: 0, averageClarity: 0 },
        interview: { interviewsCompleted: 0, averageScore: 0, weakAreas: [] },
      };
      users.push(existing);
      saveAllUsers(users);
    }

    const streakUpdate = computeStreak(existing);
    const withStreak = { ...existing, ...streakUpdate };
    // Persist streak
    const updIdx = users.findIndex((u) => u.email.toLowerCase() === email.toLowerCase());
    if (updIdx >= 0) { users[updIdx] = withStreak; saveAllUsers(users); }

    applyAuthState(withStreak, data.session.access_token);
    return null;
  };

  const requestPasswordReset = (email: string): { error: string | null; code: string | null } => {
    const normalizedEmail = email.trim().toLowerCase();
    const users = getAllUsers();
    const foundUser = users.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (!foundUser) return { error: "No account found with this email", code: null };

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000;
    const requests = getAllPasswordResetRequests().filter(
      (request) => request.email.toLowerCase() !== normalizedEmail,
    );
    requests.push({ email: foundUser.email, code, expiresAt, verified: false });
    saveAllPasswordResetRequests(requests);
    return { error: null, code };
  };

  const verifyPasswordResetCode = (email: string, code: string): string | null => {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedCode = code.trim();
    const requests = getAllPasswordResetRequests();
    const request = requests.find((item) => item.email.toLowerCase() === normalizedEmail);
    if (!request) return "Please request a verification code first";
    if (Date.now() > request.expiresAt) return "Verification code expired. Request a new one";
    if (request.code !== normalizedCode) return "Invalid verification code";

    request.verified = true;
    saveAllPasswordResetRequests(requests);
    return null;
  };

  const resetPassword = (email: string, newPassword: string): string | null => {
    const normalizedEmail = email.trim().toLowerCase();
    const requests = getAllPasswordResetRequests();
    const request = requests.find((item) => item.email.toLowerCase() === normalizedEmail);
    if (!request) return "Please request a verification code first";
    if (Date.now() > request.expiresAt) return "Verification code expired. Request a new one";
    if (!request.verified) return "Please verify the code before resetting password";

    const users = getAllUsers();
    const userIndex = users.findIndex((u) => u.email.toLowerCase() === normalizedEmail);
    if (userIndex < 0) return "No account found with this email";

    users[userIndex] = { ...users[userIndex], password: newPassword };
    saveAllUsers(users);

    const cleanedRequests = requests.filter((item) => item.email.toLowerCase() !== normalizedEmail);
    saveAllPasswordResetRequests(cleanedRequests);

    return null;
  };

  const logout = () => {
    localStorage.removeItem("wordwise_token");
    localStorage.removeItem("wordwise_user");
    setToken(null);
    setUser(null);
  };

  const updateUser = (updates: Partial<UserData>) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    setUser(updated);
    localStorage.setItem("wordwise_user", JSON.stringify(updated));
    const users = getAllUsers();
    const idx = users.findIndex(u => u.email === updated.email);
    if (idx >= 0) { users[idx] = updated; saveAllUsers(users); }
  };

  const updateGrammarProfile = (pattern: string, isCorrect: boolean) => {
    if (!user) return;
    
    const currentProfile = user.grammarProfile || {};
    const patternData = currentProfile[pattern] || { mistakes: 0, correct: 0, score: 50 };
    
    if (isCorrect) {
      patternData.correct += 1;
      patternData.score = Math.min(100, patternData.score + 5);
    } else {
      patternData.mistakes += 1;
      patternData.score = Math.max(0, patternData.score - 5);
    }
    
    const newProfile = { ...currentProfile, [pattern]: patternData };
    updateUser({ grammarProfile: newProfile });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        loginWithGoogle,
        signInWithGoogleProfile,
        completeGoogleSignIn,
        requestPasswordReset,
        verifyPasswordResetCode,
        resetPassword,
        logout,
        updateUser,
        updateGrammarProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
