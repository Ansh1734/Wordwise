import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const { completeGoogleSignIn } = useAuth();

  useEffect(() => {
    let isMounted = true;

    const handleCallback = async () => {
      const err = await completeGoogleSignIn();
      if (!isMounted) return;

      if (err) {
        toast.error(err);
        navigate("/login", { replace: true });
        return;
      }

      toast.success("Signed in with Google");
      navigate("/", { replace: true });
    };

    void handleCallback();

    return () => {
      isMounted = false;
    };
  }, [completeGoogleSignIn, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <p className="text-sm text-muted-foreground">Completing Google sign-in...</p>
    </div>
  );
}
