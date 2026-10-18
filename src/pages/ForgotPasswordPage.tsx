import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { sendPasswordResetCodeEmail, canSendVerificationEmail } from "@/lib/emailService";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { requestPasswordReset, verifyPasswordResetCode, resetPassword } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) {
      setError("Please enter your email");
      return;
    }

    const result = requestPasswordReset(email.trim());
    if (result.error) {
      setError(result.error);
      toast.error(result.error);
      return;
    }

    const sendErr = await sendPasswordResetCodeEmail(email.trim(), result.code!);
    if (sendErr) {
      setError(sendErr);
      toast.error(sendErr);
      return;
    }

    toast.success("Verification code sent to your email");
    setStep(2);
  };

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!code.trim()) {
      setError("Please enter the verification code");
      return;
    }

    const err = verifyPasswordResetCode(email.trim(), code.trim());
    if (err) {
      setError(err);
      toast.error(err);
      return;
    }

    toast.success("Code verified. Set your new password.");
    setStep(3);
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!newPassword) {
      setError("Please enter a new password");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    const err = resetPassword(email.trim(), newPassword);
    if (err) {
      setError(err);
      toast.error(err);
      return;
    }

    toast.success("Password reset successful. Please sign in.");
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-primary">WordWise</h1>
          <p className="mt-2 text-sm text-muted-foreground">Reset your password</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
          <h2 className="mb-6 text-xl font-bold text-heading">Forgot Password</h2>

          {step === 1 && (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="focus-visible:ring-primary"
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              {!canSendVerificationEmail() && (
                <p className="text-xs text-muted-foreground">
                  Email setup pending. Add EmailJS keys in `.env` to send code to Gmail.
                </p>
              )}
              <Button type="submit" className="w-full rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">
                Send Verification Code
              </Button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Verification Code</Label>
                <Input
                  id="code"
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="focus-visible:ring-primary"
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">
                Verify Code
              </Button>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="focus-visible:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="focus-visible:ring-primary"
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">
                Reset Password
              </Button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Back to{" "}
            <Link to="/login" className="font-medium text-primary hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
