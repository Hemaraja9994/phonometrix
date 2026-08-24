import { createFileRoute, Link } from "@tanstack/react-router";
import { useClinicStore } from "@/lib/store";

export const Route = createFileRoute("/patients")({ component: PatientsPage });

function PatientsPage() {
  const patients = useClinicStore((s) => s.patients);
  const recordings = useClinicStore((s) => s.recordings);
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
      <div>
        <p className="text-[11px] uppercase tracking-[0.2em] text-primary">Caseload</p>
        <h1 className="font-display text-3xl mt-1">Patients</h1>
      </div>
      <div className="grid gap-3">
        {patients.map((p) => (
          <Link key={p.id} to="/patients/$id" params={{ id: p.id }} className="rounded-2xl border border-border bg-card p-4">
            <p className="font-medium">{p.name}</p>
            <p className="text-xs text-muted-foreground">{p.diagnosis} · {recordings.filter((r) => r.patientId === p.id).length} samples</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
