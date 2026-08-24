import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/learn")({ component: LearnPage });

function LearnPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 space-y-4">
      <p className="text-[11px] uppercase tracking-[0.2em] text-primary">Academy</p>
      <h1 className="font-display text-3xl">Student clinic notes</h1>
      <article className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-display text-xl">Never quote a single number</h2>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">Report F0, jitter, shimmer, HNR and CPP together. If jitter is high and CPP is preserved, repeat the vowel before you write severe dysphonia.</p>
      </article>
      <article className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-display text-xl">Indian working ranges</h2>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">Western Praat cut-offs are a starting point. Teachers, singers and puberphonia caseloads need clinical listening, not software diagnosis.</p>
      </article>
    </div>
  );
}
