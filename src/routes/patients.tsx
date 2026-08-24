import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useClinicStore } from "@/lib/store";

export const Route = createFileRoute("/patients")({ component: PatientsPage });

function PatientsPage() {
  const patients = useClinicStore((s) => s.patients);
  const recordings = useClinicStore((s) => s.recordings);
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-primary">Caseload</p>
          <h1 className="font-display text-3xl mt-1">Participants</h1>
          <p className="text-sm text-muted-foreground mt-1">Each file is a speaker. Sounds attach to a participant.</p>
        </div>
        <Button asChild><Link to="/patients/new">New participant</Link></Button>
      </div>
      <div className="grid gap-3">
        {patients.map((p) => (
          <Link key={p.id} to="/patients/$id" params={{ id: p.id }} className="rounded-2xl border border-border bg-card p-4 flex justify-between gap-3 hover:border-primary/40">
            <div>
              <p className="font-medium">{p.name}</p>
              <p className="text-xs text-muted-foreground">{p.age} yrs · {p.sex} · {p.occupation} · {p.city || "\u2014"}</p>
              <p className="text-xs text-muted-foreground mt-1">{p.diagnosis}</p>
            </div>
            <p className="font-mono text-xs shrink-0">{recordings.filter((r) => r.patientId === p.id).length} sounds</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
