import { useEffect, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { PROTOCOLS, TASK_META, protocolById } from "@/lib/clinical/protocols";
import { useClinicStore } from "@/lib/store";
import { analyzeBlob } from "@/lib/audio/dsp";
import { saveAudio } from "@/lib/audio/idb";
import { uid } from "@/lib/utils";
import type { LanguageCode, RecordingTask } from "@/lib/types";
import { toast } from "sonner";

type Search = { patient?: string; protocol?: string; task?: string };

export const Route = createFileRoute("/record")({
  component: RecordPage,
  validateSearch: (s: Record<string, unknown>): Search => ({
    patient: typeof s.patient === "string" ? s.patient : undefined,
    protocol: typeof s.protocol === "string" ? s.protocol : undefined,
    task: typeof s.task === "string" ? s.task : undefined,
  }),
});

function RecordPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const patients = useClinicStore((s) => s.patients);
  const addRecording = useClinicStore((s) => s.addRecording);
  const patientId = search.patient ?? patients[0]?.id ?? "";
  const protocolId = search.protocol ?? "voice-battery";
  const protocol = protocolById(protocolId);
  const task = ((search.task as RecordingTask) || protocol.tasks[0] || "sustained-a") as RecordingTask;
  const patient = patients.find((p) => p.id === patientId);
  const meta = TASK_META[task];

  const [busy, setBusy] = useState(false);
  const [recording, setRecording] = useState(false);
  const [level, setLevel] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const raf = useRef(0);
  const started = useRef(0);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => () => {
    cancelAnimationFrame(raf.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
  }, []);

  function patch(next: Search) {
    void navigate({ to: "/record", search: { patient: patientId, protocol: protocolId, task, ...next } });
  }

  async function start() {
    if (!patient) { toast.error("Add a patient first."); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
      streamRef.current = stream;
      const ctx = new AudioContext();
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      src.connect(analyser);
      const data = new Uint8Array(analyser.fftSize);
      const tick = () => {
        analyser.getByteTimeDomainData(data);
        let s = 0;
        for (let i = 0; i < data.length; i++) {
          const v = ((data[i] ?? 128) - 128) / 128;
          s += v * v;
        }
        setLevel(Math.min(1, Math.sqrt(s / data.length) * 4));
        setSeconds((performance.now() - started.current) / 1000);
        raf.current = requestAnimationFrame(tick);
      };
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "audio/webm";
      const rec = new MediaRecorder(stream, { mimeType: mime });
      chunks.current = [];
      rec.ondataavailable = (e) => { if (e.data.size) chunks.current.push(e.data); };
      rec.onstop = async () => {
        cancelAnimationFrame(raf.current);
        stream.getTracks().forEach((t) => t.stop());
        await ctx.close();
        setRecording(false);
        setBusy(true);
        try {
          const blob = new Blob(chunks.current, { type: rec.mimeType });
          const analysis = await analyzeBlob(blob);
          const id = uid("r");
          await saveAudio(id, blob);
          addRecording({
            id,
            patientId: patient.id,
            protocolId,
            task,
            label: `${meta.label} — ${new Date().toLocaleTimeString()}`,
            language: (patient.primaryLanguage ?? "en") as LanguageCode,
            durationSec: analysis.measures.durationSec,
            sampleRate: analysis.sampleRate,
            hasAudio: true,
            quality: analysis.measures.quality,
            measures: analysis.measures,
            f0Contour: analysis.f0Contour,
            intensityContour: analysis.intensityContour,
          });
          toast.success("Sample analysed.");
          void navigate({ to: "/analyze/$id", params: { id } });
        } catch (err) {
          console.error(err);
          toast.error("Could not analyse that take. Try a longer vowel.");
        } finally {
          setBusy(false);
          setLevel(0);
        }
      };
      recRef.current = rec;
      started.current = performance.now();
      rec.start(120);
      setRecording(true);
      tick();
    } catch {
      toast.error("Microphone permission denied. Allow the mic and retry.");
    }
  }

  function stop() {
    recRef.current?.state === "recording" && recRef.current.stop();
  }

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6 sm:py-8 space-y-5">
      <div>
        <p className="text-[11px] uppercase tracking-[0.2em] text-primary">Acquisition</p>
        <h1 className="font-display text-3xl mt-1">Record a sample</h1>
        <p className="text-sm text-muted-foreground mt-2">Phone or headset, 10–15 cm off-axis. Pause the fan. Samples stay on this device.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-sm space-y-1">Patient
          <select className="mt-1 w-full h-11 rounded-xl border border-border bg-card px-3" value={patientId} onChange={(e) => patch({ patient: e.target.value })}>
            {patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </label>
        <label className="text-sm space-y-1">Protocol
          <select className="mt-1 w-full h-11 rounded-xl border border-border bg-card px-3" value={protocolId} onChange={(e) => patch({ protocol: e.target.value, task: protocolById(e.target.value).tasks[0] })}>
            {PROTOCOLS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </label>
        <label className="text-sm space-y-1">Task
          <select className="mt-1 w-full h-11 rounded-xl border border-border bg-card px-3" value={task} onChange={(e) => patch({ task: e.target.value })}>
            {protocol.tasks.map((t, i) => <option key={`${t}-${i}`} value={t}>{TASK_META[t].label}</option>)}
          </select>
        </label>
      </div>
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <p className="text-[10px] uppercase tracking-wider text-primary">{meta.label}</p>
        <p className="text-sm leading-relaxed">{meta.prompt}</p>
        <div className="h-3 rounded-full bg-secondary overflow-hidden">
          <div className="h-full bg-coral transition-[width] duration-75" style={{ width: `${Math.round(level * 100)}%` }} />
        </div>
        <p className="font-mono text-sm tabular-nums">{seconds.toFixed(1)} s</p>
        <div className="flex gap-3">
          {!recording ? (
            <Button onClick={start} disabled={busy}>{busy ? "Analysing…" : "Start recording"}</Button>
          ) : (
            <Button variant="destructive" onClick={stop}>Stop</Button>
          )}
        </div>
      </div>
    </div>
  );
}
