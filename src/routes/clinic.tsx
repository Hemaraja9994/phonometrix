import { createFileRoute } from "@tanstack/react-router";
import { useClinicStore } from "@/lib/store";

export const Route = createFileRoute("/clinic")({ component: ClinicPage });

function ClinicPage() {
  const clinic = useClinicStore((s) => s.clinic);
  const updateClinic = useClinicStore((s) => s.updateClinic);
  return (
    <div className="mx-auto max-w-xl px-4 py-8 space-y-4">
      <h1 className="font-display text-3xl">Clinic settings</h1>
      <label className="block text-sm">Clinician
        <input className="mt-1 w-full rounded-xl border border-border bg-card px-3 h-11" value={clinic.clinician} onChange={(e) => updateClinic({ clinician: e.target.value })} />
      </label>
      <label className="block text-sm">College / hospital
        <input className="mt-1 w-full rounded-xl border border-border bg-card px-3 h-11" value={clinic.college} onChange={(e) => updateClinic({ college: e.target.value })} />
      </label>
      <p className="text-xs text-muted-foreground">Recordings stay in this browser. No cloud upload.</p>
    </div>
  );
}
