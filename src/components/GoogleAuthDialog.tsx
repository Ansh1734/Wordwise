import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { User, Plus, ArrowRight, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface GoogleAuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PRESET_ACCOUNTS = [
  {
    name: "Parth Verma",
    email: "parthverma@gmail.com",
    avatarBg: "bg-blue-600",
  },
  {
    name: "Alex Johnson",
    email: "alex.johnson@gmail.com",
    avatarBg: "bg-emerald-600",
  },
];

export default function GoogleAuthDialog({ open, onOpenChange }: GoogleAuthDialogProps) {
  const navigate = useNavigate();
  const { signInWithGoogleProfile } = useAuth();
  const [customMode, setCustomMode] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSelectAccount = (accName: string, accEmail: string) => {
    setLoading(true);
    setTimeout(() => {
      const err = signInWithGoogleProfile(accName, accEmail);
      setLoading(false);
      if (err) {
        toast.error(err);
        return;
      }
      toast.success(`Signed in as ${accName} with Google!`);
      onOpenChange(false);
      navigate("/");
    }, 400);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter your Google account email");
      return;
    }
    const derivedName = name.trim() || email.split("@")[0];
    handleSelectAccount(derivedName, email.trim());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] p-6 rounded-2xl border border-border shadow-2xl bg-card">
        <DialogHeader className="text-center space-y-2 pb-2">
          {/* Google Logo */}
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-700">
            <svg className="h-6 w-6" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          </div>
          <DialogTitle className="text-xl font-bold text-heading">Sign in with Google</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Choose an account to continue to <span className="font-semibold text-primary">WordWise</span>
          </DialogDescription>
        </DialogHeader>

        {!customMode ? (
          <div className="space-y-3 pt-2">
            {/* Preset Accounts */}
            <div className="space-y-2">
              {PRESET_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  disabled={loading}
                  onClick={() => handleSelectAccount(acc.name, acc.email)}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-border/80 hover:border-primary/50 hover:bg-primary/5 transition-all text-left group cursor-pointer disabled:opacity-50"
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-full ${acc.avatarBg} text-white font-bold flex items-center justify-center text-sm shadow-sm`}>
                      {acc.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                        {acc.name}
                      </p>
                      <p className="text-xs text-muted-foreground">{acc.email}</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:text-primary transition-all group-hover:translate-x-0.5" />
                </button>
              ))}
            </div>

            {/* Use Another Account Button */}
            <button
              type="button"
              disabled={loading}
              onClick={() => setCustomMode(true)}
              className="w-full flex items-center gap-3 p-3 rounded-xl border border-dashed border-border hover:border-primary/60 hover:bg-muted/40 transition-all text-left text-sm font-medium text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                <Plus className="h-5 w-5" />
              </div>
              <span>Use another Google account</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleCustomSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="google-name" className="text-xs font-semibold text-muted-foreground">
                Your Full Name (optional)
              </Label>
              <Input
                id="google-name"
                type="text"
                placeholder="e.g. John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-10 text-sm"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="google-email" className="text-xs font-semibold text-muted-foreground">
                Google Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="google-email"
                type="email"
                required
                placeholder="your.email@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10 text-sm"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCustomMode(false)}
                className="w-1/2 h-10 text-sm"
              >
                Back
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="w-1/2 h-10 text-sm bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
              >
                {loading ? "Signing in..." : "Continue"}
              </Button>
            </div>
          </form>
        )}

        <div className="pt-2 text-center text-[11px] text-muted-foreground/80">
          By continuing, Google shares your name, email address, and profile picture with WordWise.
        </div>
      </DialogContent>
    </Dialog>
  );
}
