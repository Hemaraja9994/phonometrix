import { createFileRoute, Link } from "@tanstack/react-router";
import { PROTOCOLS, TASK_META } from "@/lib/clinical/protocols";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/protocols")({ component: ProtocolsPage });

function ProtocolsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      <div>
        <p className="text-[11px] uppercase tracking-[0.2em] text-primary">Clinic library</p>
        <h1 className="font-display text-3xl sm:text-4xl mt-1">Protocols</h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
          Batteries modelled on Dr. Speech, Praat vowel reports, ASHA CAPE-V, and Indian teaching-hospital pathways.
        </p>
      </div>
      <div className="space-y-4">
        {PROTOCOLS.map((p) => (
          <article key={p.id} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-primary">{p.short} · {p.duration}</p>
                <h2 className="font-display text-2xl mt-1">{p.name}</h2>
              </div>
              <Button size="sm" asChild>
                <Link to="/record" search={{ protocol: p.id, task: p.tasks[0] }}>Run</Link>
              </Button>
            </div>
            <p className="mt-3 text-sm leading-relaxed">{p.description}</p>
            <p className="mt-3 text-xs text-muted-foreground"><span className="uppercase tracking-wider text-primary mr-2">Student</span>{p.studentTip}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
