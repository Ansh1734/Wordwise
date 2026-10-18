import { Link, useLocation, useNavigate } from "react-router-dom";
import { Flame, LogOut, Menu, X, User, Trophy, BookOpen, Target, Sparkles, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import UserProfileModal from "@/components/UserProfileModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navLinks = [
  { label: "Dashboard", path: "/" },
  { label: "Pronunciation", path: "/pronunciation" },
  { label: "Decomposer", path: "/decomposer" },
  { label: "News", path: "/news" },
  { label: "Word of Day", path: "/word-of-day" },
  { label: "Quiz", path: "/quiz" },
  { label: "Categories", path: "/categories" },
  { label: "Word Bank", path: "/word-bank" },
  { label: "Progress", path: "/progress" },
];

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-xl font-extrabold text-primary">WordWise</span>
          </Link>

          <div className="hidden items-center gap-1 lg:flex">
            {navLinks.map((l) => (
              <Link
                key={l.path}
                to={l.path}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  location.pathname === l.path
                    ? "text-primary border-b-2 border-primary"
                    : "text-body hover:text-primary"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {/* Streak Counter */}
            <div
              onClick={() => setProfileModalOpen(true)}
              className="flex items-center gap-1 rounded-full bg-gold/10 px-3 py-1 cursor-pointer hover:bg-gold/20 transition-all"
              title="Click to view streak stats"
            >
              <Flame className="h-4 w-4 text-gold" />
              <span className="text-sm font-bold text-gold">{user?.currentStreak ?? 1}</span>
            </div>

            {/* User Avatar with Dropdown & Dashboard Trigger */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={`flex h-9 w-9 items-center justify-center rounded-full ${user?.avatarBg || "bg-primary"} text-sm font-bold text-white shadow-sm hover:ring-2 hover:ring-primary/40 hover:scale-105 active:scale-95 transition-all cursor-pointer outline-none`}
                  title="User Profile & Dashboard"
                >
                  {user?.avatar || user?.name?.charAt(0)?.toUpperCase() || "P"}
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-64 p-2 rounded-2xl border border-border shadow-xl bg-card">
                <DropdownMenuLabel className="p-3 bg-muted/40 rounded-xl mb-1">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${user?.avatarBg || "bg-primary"} text-base font-bold text-white shadow-sm`}>
                      {user?.avatar || user?.name?.charAt(0)?.toUpperCase() || "P"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-foreground truncate">{user?.name || "Parth Verma"}</p>
                      <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-border/60 text-[11px] font-semibold text-muted-foreground">
                    <span className="flex items-center gap-1 text-primary">
                      <Target className="h-3 w-3" /> CEFR: {user?.cefr || "B2"}
                    </span>
                    <span className="flex items-center gap-1 text-gold">
                      <Flame className="h-3 w-3" /> {user?.currentStreak || 1} day streak
                    </span>
                  </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={() => setProfileModalOpen(true)}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl cursor-pointer font-medium hover:bg-primary/10 hover:text-primary transition-colors text-xs"
                >
                  <LayoutDashboard className="h-4 w-4 text-primary" />
                  <span>User Dashboard & Stats</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => navigate("/word-bank")}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl cursor-pointer font-medium hover:bg-primary/10 hover:text-primary transition-colors text-xs"
                >
                  <BookOpen className="h-4 w-4 text-blue-500" />
                  <span>My Word Bank ({user?.wordBank?.length || 0})</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => navigate("/quiz")}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl cursor-pointer font-medium hover:bg-primary/10 hover:text-primary transition-colors text-xs"
                >
                  <Trophy className="h-4 w-4 text-emerald-500" />
                  <span>AI Quiz & Scores</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={handleLogout}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl cursor-pointer font-medium text-destructive hover:bg-destructive/10 transition-colors text-xs"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Direct Logout Icon */}
            <button onClick={handleLogout} className="text-muted-foreground hover:text-destructive transition-colors p-1" title="Logout">
              <LogOut className="h-4 w-4" />
            </button>

            {/* Mobile menu toggle */}
            <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden text-muted-foreground">
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="border-t border-border bg-card lg:hidden fade-in">
            <div className="container flex flex-col py-2">
              <button
                onClick={() => {
                  setMobileOpen(false);
                  setProfileModalOpen(true);
                }}
                className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 text-primary text-sm font-bold text-left mb-2"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
                  {user?.avatar || user?.name?.charAt(0)?.toUpperCase() || "P"}
                </div>
                <div>
                  <p>{user?.name || "Parth Verma"}</p>
                  <p className="text-xs font-normal text-muted-foreground">View User Dashboard</p>
                </div>
              </button>

              {navLinks.map((l) => (
                <Link
                  key={l.path}
                  to={l.path}
                  onClick={() => setMobileOpen(false)}
                  className={`rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    location.pathname === l.path
                      ? "text-primary bg-primary/5 font-semibold"
                      : "text-body hover:text-primary"
                  }`}
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Full User Profile Dashboard Modal */}
      <UserProfileModal open={profileModalOpen} onOpenChange={setProfileModalOpen} />
    </>
  );
}
