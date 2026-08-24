import { createFileRoute, Link } from "@tanstack/react-router";
import { useClinicStore } from "@/lib/store";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({ component: HomePage });

function Ring({ value, label, color }: { value: number; label: string; color: string }) {
  const r = 36;
  const c = 2 * Math.PI * r;
  const dash = (value / 100) * c;
  return (
    <div className="flex flex-col items-center gap-2">
      <svg viewBox="0 0 96 96" className="h-24 w-24">
        <circle cx="48" cy="48" r={r} fill="none" stroke="#e6eaea" strokeWidth="8" />
        <circle cx="48" cy="48" r={r} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" strokeDasharray={`${dash} ${c}`} transform="rotate(-90 48 48)" />
        <text x="48" y="52" textAnchor="middle" className="fill-foreground" style={{ fontSize: 16, fontFamily: "IBM Plex Mono" }}>{value}%</text>
      </svg>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}

function HomePage() {
  const patients = useClinicStore((s) => s.patients);
  const recordings = useClinicStore((s) => s.recordings);
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8 space-y-8">
      <div>
        <p className="text-[11px] uppercase tracking-[0.2em] text-primary">Phonometrix</p>
        <h1 className="font-display text-4xl mt-1">Voice laboratory</h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-xl">Record, analyse and document voice with Praat-based measures. Samples stay on this device.</p>
        <div className="mt-4 flex gap-3">
          <Button asChild><Link to="/record">New sample</Link></Button>
          <Button variant="outline" asChild><Link to="/patients">Caseload</Link></Button>
        </div>
      </div>
      <div className="rounded-3xl border border-border bg-card p-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Ring value={Math.min(100, patients.length * 25)} label="Caseload" color="#D05028" />
        <Ring value={Math.min(100, recordings.length * 20)} label="Samples" color="#40A8A8" />
        <Ring value={60} label="Jitter in range" color="#F8A800" />
        <Ring value={70} label="Signal quality" color="#385058" />
      </div>
      <div className="grid gap-3">
        {recordings.slice(0, 4).map((r) => {
          const p = patients.find((x) => x.id === r.patientId);
          return (
            <Link key={r.id} to="/analyze/$id" params={{ id: r.id }} className="rounded-2xl border border-border bg-card p-4 flex justify-between">
              <div>
                <p className="font-medium">{p?.name ?? "Unknown"}</p>
                <p className="text-xs text-muted-foreground">{r.label}</p>
              </div>
              <p className="font-mono text-sm">{r.measures.f0Mean ?? "—"} Hz</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
