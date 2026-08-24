import type { Patient, Recording } from "@/lib/types";
import { NORMS, statusFor } from "@/lib/clinical/norms";

export function LabView({ recording, patient }: { recording: Recording; patient: Patient; student?: boolean }) {
  const m = recording.measures;
  return (
    <section className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <div>
        <p className="text-[10px] uppercase tracking-wider text-primary">{recording.task}</p>
        <h1 className="font-display text-2xl">{recording.label}</h1>
        <p className="text-sm text-muted-foreground">{patient.name} · {patient.age} {patient.sex} · {recording.durationSec.toFixed(1)} s</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {NORMS.slice(0, 6).map((n) => {
          const value = m[n.key] as number | null;
          const status = statusFor(value, patient.sex, n.key);
          return (
            <div key={n.key} className="rounded-xl bg-secondary p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{n.label}</p>
              <p className="font-mono text-lg tabular-nums">{value == null ? "—" : value.toFixed(n.digits)} <span className="text-xs">{n.unit}</span></p>
              <p className="text-[10px] uppercase tracking-wider text-trace">{status}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
