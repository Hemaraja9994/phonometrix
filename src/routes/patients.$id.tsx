import { createFileRoute, Link } from "@tanstack/react-router";
import { useClinicStore } from "@/lib/store";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/patients/$id")({ component: PatientPage });

function PatientPage() {
  const { id } = Route.useParams();
  const patient = useClinicStore((s) => s.patients.find((p) => p.id === id));
  const recordings = useClinicStore((s) => s.recordings.filter((r) => r.patientId === id));
  if (!patient) return <div className="p-8">Patient not in this clinic file.</div>;
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 space-y-5">
      <h1 className="font-display text-3xl">{patient.name}</h1>
      <p className="text-sm text-muted-foreground">{patient.age} {patient.sex} · {patient.occupation} · {patient.city}</p>
      <p className="text-sm">{patient.chiefComplaint}</p>
      <div className="space-y-2">
        {recordings.map((r) => (
          <Link key={r.id} to="/analyze/$id" params={{ id: r.id }} className="block rounded-2xl border border-border bg-card p-4">
            <p className="font-medium">{r.label}</p>
            <p className="text-xs text-muted-foreground">F0 {r.measures.f0Mean ?? "—"} Hz · jitter {r.measures.jitterLocal ?? "—"}%</p>
          </Link>
        ))}
      </div>
      <Button asChild><Link to="/record">Record</Link></Button>
    </div>
  );
}
