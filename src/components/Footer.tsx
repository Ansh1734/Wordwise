export default function Footer() {
  return (
    <footer className="border-t border-border bg-card py-8">
      <div className="container flex flex-col items-center justify-between gap-4 sm:flex-row">
        <span className="text-lg font-bold text-primary">WordWise</span>
        <p className="text-sm text-muted-foreground">
          Learn Smarter, Speak Clearer. © 2026 WordWise. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
