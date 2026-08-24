import { createFileRoute } from "@tanstack/react-router";
import { INDIAN_NORM_NOTES, NORMS } from "@/lib/clinical/norms";

export const Route = createFileRoute("/norms")({ component: NormsPage });

function NormsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      <div>
        <p className="text-[11px] uppercase tracking-[0.2em] text-primary">Reference</p>
        <h1 className="font-display text-3xl sm:text-4xl mt-1">Working norms</h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
          Adult clinic working ranges used to flag Phonometrix measures. Not a substitute for a lab’s own normative study.
        </p>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-[10px] uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-3 font-medium">Measure</th>
              <th className="px-4 py-3 font-medium">Female</th>
              <th className="px-4 py-3 font-medium">Male</th>
            </tr>
          </thead>
          <tbody>
            {NORMS.map((n) => (
              <tr key={n.key} className="border-b border-border/70 last:border-0">
                <td className="px-4 py-3"><p className="font-medium">{n.label}</p></td>
                <td className="px-4 py-3 font-mono text-xs tabular-nums">{n.female.low}–{n.female.high} {n.unit}</td>
                <td className="px-4 py-3 font-mono text-xs tabular-nums">{n.male.low}–{n.male.high} {n.unit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {INDIAN_NORM_NOTES.map((n) => (
          <article key={n.title} className="rounded-2xl border border-border bg-card p-4">
            <h2 className="font-display text-lg">{n.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{n.body}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
