import { createFileRoute, Link } from "@tanstack/react-router";
import { PROTOCOLS, TASK_META } from "@/lib/clinical/protocols";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/record")({
  validateSearch: (s: Record<string, unknown>) => ({
    protocol: typeof s.protocol === "string" ? s.protocol : "voice-battery",
    task: typeof s.task === "string" ? s.task : undefined,
  }),
  component: RecordPage,
});

function RecordPage() {
  const { protocol } = Route.useSearch();
  const p = PROTOCOLS.find((x) => x.id === protocol) ?? PROTOCOLS[0]!;
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 space-y-6">
      <div>
        <p className="text-[11px] uppercase tracking-[0.2em] text-primary">Booth</p>
        <h1 className="font-display text-3xl mt-1">Record</h1>
        <p className="mt-2 text-sm text-muted-foreground">{p.name}. Microphone permission is required. Samples stay on this device.</p>
      </div>
      <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
        {p.tasks.map((t, i) => (
          <div key={`${t}-${i}`} className="rounded-xl bg-secondary p-3">
            <p className="font-medium">{TASK_META[t].label}</p>
            <p className="text-xs text-muted-foreground">{TASK_META[t].prompt}</p>
          </div>
        ))}
      </div>
      <Button asChild><Link to="/patients">Open caseload</Link></Button>
    </div>
  );
}
