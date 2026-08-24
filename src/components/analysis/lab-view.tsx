import type { Patient, Recording } from "@/lib/types";
import { NORMS, statusFor } from "@/lib/clinical/norms";

export function LabView({ recording, patient }: { recording: Recording; patient: Patient; student?: boolean }) {
  const m = recording.measures;
  const contour = recording.f0Contour;
  const w = 560;
  const h = 120;
  const vals = contour.map((p) => p.v);
  const min = vals.length ? Math.min(...vals) - 10 : 0;
  const max = vals.length ? Math.max(...vals) + 10 : 1;
  const path = contour
    .map((p, i) => {
      const x = contour.length < 2 ? 0 : (i / (contour.length - 1)) * w;
      const y = h - ((p.v - min) / (max - min || 1)) * h;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <section className="space-y-4">
      <div>
        <p className="text-[10px] uppercase tracking-wider text-primary">{recording.task}</p>
        <h1 className="font-display text-2xl">{recording.label}</h1>
        <p className="text-sm text-muted-foreground">{patient.name} · {patient.age} {patient.sex} · {recording.durationSec.toFixed(1)} s · {recording.quality}</p>
      </div>
      <div className="rounded-2xl border border-border bg-lab p-4 overflow-x-auto">
        <p className="text-[10px] uppercase tracking-wider text-lab-muted mb-2">F0 contour</p>
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-28">
          <path d={path} fill="none" stroke="#40A8A8" strokeWidth="2" />
        </svg>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {NORMS.map((n) => {
          const value = m[n.key] as number | null;
          const status = statusFor(value, patient.sex, n.key);
          const color = status === "within" ? "text-ok" : status === "borderline" ? "text-warn" : status === "outside" ? "text-coral" : "text-muted-foreground";
          return (
            <div key={n.key} className="rounded-xl border border-border bg-card p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{n.label}</p>
              <p className={`font-mono text-lg tabular-nums ${color}`}>{value == null ? "\u2014" : value.toFixed(n.digits)} <span className="text-xs">{n.unit}</span></p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{status}</p>
            </div>
          );
        })}
      </div>
      {m.qualityNotes.length > 0 && (
        <ul className="text-sm text-muted-foreground list-disc pl-5">
          {m.qualityNotes.map((n) => <li key={n}>{n}</li>)}
        </ul>
      )}
    </section>
  );
}
