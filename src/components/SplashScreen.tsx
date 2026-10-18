import { useEffect, useState } from "react";
import { BookOpen, Mic } from "lucide-react";

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [phase, setPhase] = useState<"in" | "out">("in");

  useEffect(() => {
    const fadeOutTimer = setTimeout(() => setPhase("out"), 1600);
    const completeTimer = setTimeout(onComplete, 2200);
    return () => {
      clearTimeout(fadeOutTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-gradient-to-br from-primary via-primary to-secondary transition-opacity duration-500 ${
        phase === "in" ? "opacity-100" : "opacity-0"
      }`}
    >
      <div
        className={`flex flex-col items-center gap-6 transition-all duration-700 ${
          phase === "in"
            ? "translate-y-0 opacity-100 scale-100"
            : "translate-y-4 opacity-0 scale-95"
        }`}
        style={{ animationDelay: "0.2s" }}
      >
        {/* Logo */}
        <div className="relative flex items-center justify-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm shadow-2xl">
            <BookOpen className="h-12 w-12 text-white" strokeWidth={2} />
            <Mic className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-white p-1 text-primary shadow-lg" strokeWidth={2.5} />
          </div>
          {/* Decorative ring */}
          <div className="absolute inset-0 -m-3 rounded-3xl border-2 border-white/20 animate-[pulse_2s_ease-in-out_infinite]" />
        </div>

        {/* Text */}
        <div className="text-center">
          <h1 className="text-5xl font-extrabold tracking-tight text-white drop-shadow-lg">
            WordWise
          </h1>
          <p className="mt-2 text-lg font-medium text-white/80 tracking-wide">
            Learn Smarter, Speak Clearer
          </p>
        </div>

        {/* Loading dots */}
        <div className="flex gap-2 mt-4">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-2 w-2 rounded-full bg-white/60"
              style={{
                animation: "pulse 1.2s ease-in-out infinite",
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
