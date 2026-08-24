import { createFileRoute, Link } from "@tanstack/react-router";
import { LabView } from "@/components/analysis/lab-view";
import { useClinicStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/analyze/$id")({ component: AnalyzePage });

function AnalyzePage() {
  const { id } = Route.useParams();
  const recording = useClinicStore((s) => s.recordings.find((r) => r.id === id));
  const patient = useClinicStore((s) => s.patients.find((p) => p.id === recording?.patientId));
  const student = useClinicStore((s) => s.clinic.role === "student");
  if (!recording || !patient) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="font-display text-2xl">Sample not in this clinic file</p>
        <Button className="mt-4" asChild><Link to="/patients">Back to caseload</Link></Button>
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6 sm:py-8 space-y-5">
      <Link to="/patients/$id" params={{ id: patient.id }} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> {patient.name}
      </Link>
      <LabView recording={recording} patient={patient} student={student} />
    </div>
  );
}
