import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useClinicStore } from "@/lib/store";

export const Route = createFileRoute("/patients/$id")({ component: PatientChart });

function PatientChart() {
  const { id } = Route.useParams();
  const patient = useClinicStore((s) => s.patients.find((p) => p.id === id));
  const recordings = useClinicStore((s) => s.recordings.filter((r) => r.patientId === id));
  if (!patient) {
    return (
      <div className="p-10 text-center">
        <p className="font-display text-2xl">File not found</p>
        <Button className="mt-4" asChild><Link to="/patients">Caseload</Link></Button>
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-primary">{patient.mrn}</p>
          <h1 className="font-display text-3xl mt-1">{patient.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">{patient.age} yrs · {patient.sex} · {patient.occupation} · {patient.city || "\u2014"}</p>
        </div>
        <Button asChild><Link to="/record" search={{ patient: patient.id }}>Record</Link></Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Info label="Working diagnosis" value={patient.diagnosis} />
        <Info label="Category" value={patient.diagnosisCategory} />
        <Info label="Chief complaint" value={patient.chiefComplaint || "\u2014"} />
        <Info label="Referred by" value={patient.referredBy || "\u2014"} />
        <Info label="Vocal history" value={patient.vocalHistory || "\u2014"} />
        <Info label="Medical history" value={patient.medicalHistory || "\u2014"} />
      </div>
      <div>
        <h2 className="font-display text-xl mb-2">Sounds</h2>
        <div className="grid gap-2">
          {recordings.length === 0 && <p className="text-sm text-muted-foreground">No sounds yet. Record a sustained /aː/.</p>}
          {recordings.map((r) => (
            <Link key={r.id} to="/analyze/$id" params={{ id: r.id }} className="rounded-xl border border-border bg-card px-4 py-3 flex justify-between hover:border-primary/40">
              <div>
                <p className="font-medium text-sm">{r.label}</p>
                <p className="text-xs text-muted-foreground">{r.task} · {r.durationSec.toFixed(2)} s</p>
              </div>
              <p className="font-mono text-sm">{r.measures.f0Mean != null ? `${r.measures.f0Mean.toFixed(0)} Hz` : "View"}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm leading-relaxed whitespace-pre-wrap">{value}</p>
    </div>
  );
}
