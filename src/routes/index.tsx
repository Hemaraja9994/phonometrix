import { useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useClinicStore } from "@/lib/store";
import { analyzeBlob } from "@/lib/audio/dsp";
import { saveAudio } from "@/lib/audio/idb";
import { uid } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/")({ component: HomePage });

const MODULES = [
  { k: "01", t: "Spectrogram", d: "Wide- and narrow-band STFT, 0–5000 Hz." },
  { k: "02", t: "Pitch", d: "YIN F0. Indian adult working bands, not only Western means." },
  { k: "03", t: "Formants", d: "LPC F1–F4 on the spectrogram for /aː iː uː/." },
  { k: "04", t: "Intensity", d: "RMS intensity contour in dB, for MPT and loudness." },
  { k: "05", t: "Voice report", d: "Jitter local / RAP / PPQ5 / DDP, shimmer, HNR, NHR, pulses, voice breaks." },
  { k: "06", t: "Indian battery", d: "Sustained /aː/, MPT, s/z, CAPE-V, reading in 11 languages." },
];

function HomePage() {
  const recordings = useClinicStore((s) => s.recordings);
  const patients = useClinicStore((s) => s.patients);
  const addRecording = useClinicStore((s) => s.addRecording);
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [sel, setSel] = useState<string | null>(recordings[0]?.id ?? null);

  async function onOpen(file: File) {
    const patientId = patients[0]?.id;
    if (!patientId) {
      toast.error("Create a participant first.");
      void navigate({ to: "/patients/new" });
      return;
    }
    try {
      toast.message("Reading sound…");
      const analysis = await analyzeBlob(file);
      const id = uid("r");
      await saveAudio(id, file);
      addRecording({
        id, patientId, protocolId: "voice-battery", task: "sustained-a",
        label: file.name.replace(/\.[^.]+$/, ""), language: "en",
        durationSec: analysis.measures.durationSec, sampleRate: analysis.sampleRate,
        hasAudio: true, quality: analysis.measures.quality, measures: analysis.measures,
        f0Contour: analysis.f0Contour, intensityContour: analysis.intensityContour,
      });
      toast.success("Opened in the lab.");
      void navigate({ to: "/analyze/$id", params: { id } });
    } catch (e) {
      console.error(e);
      toast.error("Could not open that file. Use WAV, M4A, or WebM.");
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 space-y-10">
      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] items-end">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-coral">Phonometrix · India</p>
          <h1 className="font-display text-4xl sm:text-5xl mt-2">Clinical voice laboratory</h1>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-xl leading-relaxed">
            New software for Indian SLPs and student clinicians. Record, open, and analyse voice
            with spectrogram, pitch, formants, intensity and a Voice report — methods aligned to Praat 7,
            built for a phone in a teaching clinic.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button asChild><Link to="/patients/new">New participant</Link></Button>
            <Button variant="outline" asChild><Link to="/record">Record</Link></Button>
            <Button variant="outline" onClick={() => fileRef.current?.click()}>Open sound</Button>
            <Button variant="ghost" asChild><Link to="/about">About the software</Link></Button>
            <input ref={fileRef} type="file" accept="audio/*,.wav,.mp3,.m4a,.webm,.ogg" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) void onOpen(f); e.currentTarget.value = ""; }} />
          </div>
        </div>
        <div className="rounded-3xl border border-border bg-card p-5 grid grid-cols-2 gap-3">
          {MODULES.slice(0, 4).map((m) => (
            <div key={m.k} className="rounded-2xl bg-secondary/70 p-3">
              <p className="font-mono text-[10px] text-coral">{m.k}</p>
              <p className="font-medium text-sm mt-1">{m.t}</p>
            </div>
          ))}
        </div>
      </section>
      <section>
        <p className="text-[11px] uppercase tracking-[0.18em] text-primary mb-3">Lab modules</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {MODULES.map((m) => (
            <article key={m.k} className="rounded-2xl border border-border bg-card p-4">
              <p className="font-mono text-[10px] text-trace">{m.k}</p>
              <h2 className="font-display text-xl mt-1">{m.t}</h2>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{m.d}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="rounded-3xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.16em] text-primary">Session</p>
            <p className="text-xs text-muted-foreground">Participants and sounds on this device</p>
          </div>
          <Button size="sm" asChild><Link to="/patients/new">New participant</Link></Button>
        </div>
        <ul>
          {patients.map((p) => (
            <li key={p.id} className="border-t border-border/80 first:border-t-0">
              <Link to="/patients/$id" params={{ id: p.id }} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/60">
                <div>
                  <p className="font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.age} yrs · {p.sex} · {p.occupation} · {p.diagnosis}</p>
                </div>
                <span className="text-[10px] uppercase tracking-wider text-trace">Participant</span>
              </Link>
              {recordings.filter((r) => r.patientId === p.id).map((r) => (
                <button key={r.id} type="button" onClick={() => setSel(r.id)}
                  onDoubleClick={() => void navigate({ to: "/analyze/$id", params: { id: r.id } })}
                  className={`w-full text-left pl-8 pr-4 py-2.5 flex justify-between gap-3 border-t border-border/50 ${sel === r.id ? "bg-accent" : "hover:bg-muted/40"}`}>
                  <span className="text-sm truncate">{r.label}</span>
                  <span className="font-mono text-xs text-muted-foreground shrink-0">{r.measures.f0Mean != null ? `${r.measures.f0Mean.toFixed(0)} Hz` : "Sound"}</span>
                </button>
              ))}
            </li>
          ))}
        </ul>
        <div className="px-4 py-3 border-t border-border flex flex-wrap gap-2 bg-secondary/40">
          <Button size="sm" disabled={!sel} onClick={() => sel && void navigate({ to: "/analyze/$id", params: { id: sel } })}>Open lab</Button>
          <Button size="sm" variant="outline" asChild><Link to="/record">Record</Link></Button>
        </div>
      </section>
    </div>
  );
}
