import { createFileRoute, Link } from "@tanstack/react-router";
import { NewParticipantForm } from "@/components/clinic/new-participant";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/patients/new")({ component: NewParticipantPage });

function NewParticipantPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-6 sm:py-8 space-y-5">
      <div>
        <Link to="/patients" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Caseload
        </Link>
        <p className="text-[11px] uppercase tracking-[0.2em] text-primary mt-3">New</p>
        <h1 className="font-display text-3xl mt-1">Create participant</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Age and sex set the Voice report working ranges. After save, the recorder opens on this file.
        </p>
      </div>
      <NewParticipantForm />
    </div>
  );
}
