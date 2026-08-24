import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PraatEditor } from "@/components/audio/praat-editor";
import { useClinicStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { analyzeSamples } from "@/lib/audio/dsp";
import { loadRecordingAudio } from "@/lib/audio/load-recording";
import { encodeWav } from "@/lib/audio/synth";
import type { AnalysisResult } from "@/lib/audio/dsp";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/analyze/$id")({ component: AnalyzePage });

function AnalyzePage() {
  const { id } = Route.useParams();
  const recording = useClinicStore((s) => s.recordings.find((r) => r.id === id));
  const patient = useClinicStore((s) => s.patients.find((p) => p.id === recording?.patientId));
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [synthetic, setSynthetic] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!recording) return;
    let cancelled = false;
    (async () => {
      try {
        const audio = await loadRecordingAudio(recording);
        if (cancelled) return;
        const analysis = analyzeSamples(audio.samples, audio.sampleRate);
        setResult(analysis);
        setSynthetic(audio.synthetic);
      } catch (e) {
        console.error(e);
        if (!cancelled) setErr("Could not analyse this sound.");
      }
    })();
    return () => { cancelled = true; };
  }, [recording]);

  if (!recording || !patient) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="font-display text-2xl">Sound not in the Objects list</p>
        <Button className="mt-4" asChild><Link to="/">Back to Objects</Link></Button>
      </div>
    );
  }

  function download() {
    if (!result || !recording) return;
    const blob = encodeWav(result.samples, result.sampleRate);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${recording.label.replace(/\s+/g, "_")}.wav`;
    a.click();
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Objects
          </Link>
          <h1 className="font-display text-3xl mt-1">Sound: {recording.label}</h1>
          <p className="text-sm text-muted-foreground">
            {patient.name} · {recording.task} · {recording.sampleRate} Hz
            {synthetic ? " · synthesised demo token (record to analyse a live vowel)" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={download} disabled={!result}>Write WAV</Button>
          <Button asChild>
            <Link to="/record" search={{ patient: patient.id, task: recording.task }}>Record again</Link>
          </Button>
        </div>
      </div>
      {err && <p className="text-sm text-coral">{err}</p>}
      {!result && !err && <p className="text-sm text-muted-foreground">Computing spectrogram, pitch, formants…</p>}
      {result && (
        <PraatEditor
          samples={result.samples}
          sampleRate={result.sampleRate}
          f0Contour={result.f0Contour}
          intensityContour={result.intensityContour}
          formantContour={result.formantContour}
          measures={result.measures}
        />
      )}
    </div>
  );
}
