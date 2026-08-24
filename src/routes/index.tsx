import { useRef } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useClinicStore } from "@/lib/store";
import { analyzeBlob } from "@/lib/audio/dsp";
import { saveAudio } from "@/lib/audio/idb";
import { uid } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/")({ component: ObjectsPage });

function ObjectsPage() {
  const recordings = useClinicStore((s) => s.recordings);
  const patients = useClinicStore((s) => s.patients);
  const addRecording = useClinicStore((s) => s.addRecording);
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  async function onOpen(file: File) {
    try {
      toast.message("Reading sound…");
      const analysis = await analyzeBlob(file);
      const id = uid("r");
      await saveAudio(id, file);
      const patientId = patients[0]?.id ?? "p-open";
      addRecording({
        id,
        patientId,
        protocolId: "voice-battery",
        task: "sustained-a",
        label: file.name.replace(/\.[^.]+$/, ""),
        language: "en",
        durationSec: analysis.measures.durationSec,
        sampleRate: analysis.sampleRate,
        hasAudio: true,
        quality: analysis.measures.quality,
        measures: analysis.measures,
        f0Contour: analysis.f0Contour,
        intensityContour: analysis.intensityContour,
      });
      toast.success("Sound added to Objects.");
      void navigate({ to: "/analyze/$id", params: { id } });
    } catch (e) {
      console.error(e);
      toast.error("Could not open that file. Use WAV, M4A, or WebM.");
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 space-y-6">
      <div>
        <p className="text-[11px] uppercase tracking-[0.2em] text-primary">Praat-style workstation</p>
        <h1 className="font-display text-4xl mt-1">Objects</h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-xl">
          Record or open a sound, then View &amp; Edit — waveform, wide-band spectrogram, pitch,
          formants, intensity, and a Voice report in the browser.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button asChild><Link to="/record">Record</Link></Button>
        <Button variant="outline" onClick={() => fileRef.current?.click()}>Open</Button>
        <input ref={fileRef} type="file" accept="audio/*,.wav,.mp3,.m4a,.webm,.ogg" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) void onOpen(f); e.currentTarget.value = ""; }} />
      </div>
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-2 border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground">Sounds</div>
        <ul>
          {recordings.map((r) => {
            const patient = patients.find((p) => p.id === r.patientId);
            return (
              <li key={r.id} className="border-t border-border/80 first:border-t-0">
                <Link to="/analyze/$id" params={{ id: r.id }} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/70">
                  <div className="min-w-0">
                    <p className="font-medium truncate">Sound {r.label}</p>
                    <p className="text-xs text-muted-foreground truncate">{patient?.name ?? "Untitled"} · {r.durationSec.toFixed(2)} s · {r.sampleRate} Hz</p>
                  </div>
                  <span className="text-xs font-mono text-trace shrink-0">{r.measures.f0Mean != null ? `${r.measures.f0Mean.toFixed(0)} Hz` : "View"}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
      <p className="text-xs text-muted-foreground max-w-xl">
        Inspired by Praat (Boersma &amp; Weenink). Measures are educational approximations of jitter,
        shimmer and HNR — not a certified medical device. Record a live /aː/ for a real spectrogram.
      </p>
    </div>
  );
}
