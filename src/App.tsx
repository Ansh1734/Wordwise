import { Suspense, lazy, useState, useCallback } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import SplashScreen from "@/components/SplashScreen";
import Layout from "./components/Layout";
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const AuthCallbackPage = lazy(() => import("./pages/AuthCallbackPage"));
const PronunciationPage = lazy(() => import("./pages/PronunciationPage"));
const DecomposerPage = lazy(() => import("./pages/DecomposerPage"));
const NewsReaderPage = lazy(() => import("./pages/NewsReaderPage"));
const WordOfDayPage = lazy(() => import("./pages/WordOfDayPage"));
const QuizPage = lazy(() => import("./pages/QuizPage"));
const CategoryExplorerPage = lazy(() => import("./pages/CategoryExplorerPage"));
const ProgressPage = lazy(() => import("./pages/ProgressPage"));
const WordBankPage = lazy(() => import("./pages/WordBankPage"));
const UserProfilePage = lazy(() => import("./pages/UserProfilePage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => {
  const [showSplash, setShowSplash] = useState(true);
  const handleSplashComplete = useCallback(() => setShowSplash(false), []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Sonner />
        {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
        <AuthProvider>
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Suspense fallback={<div className="flex min-h-[50vh] items-center justify-center text-muted-foreground" role="status">Loading page…</div>}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/auth/callback" element={<AuthCallbackPage />} />
              <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/pronunciation" element={<PronunciationPage />} />
                <Route path="/decomposer" element={<DecomposerPage />} />
                <Route path="/news" element={<NewsReaderPage />} />
                <Route path="/word-of-day" element={<WordOfDayPage />} />
                <Route path="/quiz" element={<QuizPage />} />
                <Route path="/categories" element={<CategoryExplorerPage />} />
                <Route path="/progress" element={<ProgressPage />} />
                <Route path="/word-bank" element={<WordBankPage />} />
                <Route path="/profile" element={<UserProfilePage />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
            </Suspense>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
