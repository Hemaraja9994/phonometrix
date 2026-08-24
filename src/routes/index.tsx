import { useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useClinicStore } from "@/lib/store";
import { analyzeBlob } from "@/lib/audio/dsp";
import { saveAudio } from "@/lib/audio/idb";
import { uid } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/")({ component: ObjectsPage });

type Obj = { kind: "participant"; id: string } | { kind: "sound"; id: string };

function ObjectsPage() {
  const recordings = useClinicStore((s) => s.recordings);
  const patients = useClinicStore((s) => s.patients);
  const addRecording = useClinicStore((s) => s.addRecording);
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [sel, setSel] = useState<Obj | null>(
    recordings[0] ? { kind: "sound", id: recordings[0].id } : patients[0] ? { kind: "participant", id: patients[0].id } : null,
  );

  const rows: { obj: Obj; n: number; title: string; sub: string }[] = [];
  patients.forEach((p) => {
    rows.push({ obj: { kind: "participant", id: p.id }, n: 0, title: `Participant ${p.name}`, sub: `${p.age} yrs · ${p.sex} · ${p.occupation} · ${p.diagnosis}` });
    recordings.filter((r) => r.patientId === p.id).forEach((r) => {
      rows.push({
        obj: { kind: "sound", id: r.id },
        n: 0,
        title: `Sound ${r.label}`,
        sub: `${r.durationSec.toFixed(2)} s · ${r.sampleRate} Hz · F0 ${r.measures.f0Mean != null ? r.measures.f0Mean.toFixed(0) + " Hz" : "\u2014"}`,
      });
    });
  });
  recordings.filter((r) => !patients.some((p) => p.id === r.patientId)).forEach((r) => {
    rows.push({ obj: { kind: "sound", id: r.id }, n: 0, title: `Sound ${r.label}`, sub: `${r.durationSec.toFixed(2)} s` });
  });
  rows.forEach((r, i) => { r.n = i + 1; });

  async function onOpen(file: File) {
    const patientId = sel?.kind === "participant" ? sel.id : sel?.kind === "sound" ? recordings.find((r) => r.id === sel.id)?.patientId : patients[0]?.id;
    if (!patientId) {
      toast.error("Create a participant first, then Open a sound onto that file.");
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
      setSel({ kind: "sound", id });
      toast.success("Sound added. Opening editor.");
      void navigate({ to: "/analyze/$id", params: { id } });
    } catch (e) {
      console.error(e);
      toast.error("Could not open that file. Use WAV, M4A, or WebM.");
    }
  }

  function viewEdit() {
    if (!sel) return toast.error("Select an object.");
    if (sel.kind === "sound") void navigate({ to: "/analyze/$id", params: { id: sel.id } });
    else void navigate({ to: "/patients/$id", params: { id: sel.id } });
  }

  function record() {
    const patientId = sel?.kind === "participant" ? sel.id : sel?.kind === "sound" ? recordings.find((r) => r.id === sel.id)?.patientId : patients[0]?.id;
    if (!patientId) { void navigate({ to: "/patients/new" }); return; }
    void navigate({ to: "/record", search: { patient: patientId } });
  }

  const selectedTitle = rows.find((r) => r.obj.kind === sel?.kind && r.obj.id === sel?.id)?.title;

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6 space-y-4">
      <div>
        <p className="text-[11px] uppercase tracking-[0.2em] text-primary">Praat 6 · Objects</p>
        <h1 className="font-display text-3xl mt-1">Objects</h1>
        <p className="mt-2 text-sm text-muted-foreground">Create a participant, Record or Open a sound, then View &amp; Edit — waveform, spectrogram, pitch, formants, intensity, Voice report.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button asChild><Link to="/patients/new">New participant</Link></Button>
        <Button variant="outline" onClick={record}>Record</Button>
        <Button variant="outline" onClick={() => fileRef.current?.click()}>Open</Button>
        <input ref={fileRef} type="file" accept="audio/*,.wav,.mp3,.m4a,.webm,.ogg" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void onOpen(f); e.currentTarget.value = ""; }} />
      </div>
      <div className="rounded-xl border border-[#9aa6aa] bg-[#ececec] overflow-hidden shadow-sm">
        <div className="px-3 py-1.5 bg-[#d8d8d8] border-b border-[#b8b8b8] text-[12px] font-medium text-[#222]">Phonometrix Objects</div>
        <ul className="max-h-[52vh] overflow-y-auto bg-white font-mono text-[13px]">
          {rows.map((r) => {
            const active = sel?.kind === r.obj.kind && sel.id === r.obj.id;
            return (
              <li key={`${r.obj.kind}-${r.obj.id}`}>
                <button type="button" onClick={() => setSel(r.obj)} onDoubleClick={viewEdit}
                  className={`w-full text-left px-3 py-2 border-b border-[#eee] ${active ? "bg-[#316ac5] text-white" : "hover:bg-[#f3f6fa]"}`}>
                  <span className="opacity-70 mr-2">{r.n}.</span>{r.title}
                  <span className={`block text-[11px] mt-0.5 ${active ? "text-white/80" : "text-[#667]"}`}>{r.sub}</span>
                </button>
              </li>
            );
          })}
        </ul>
        <div className="p-2 bg-[#d8d8d8] border-t border-[#b8b8b8] grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          <ObjBtn onClick={viewEdit}>View &amp; Edit</ObjBtn>
          <ObjBtn onClick={viewEdit}>Voice report</ObjBtn>
          <ObjBtn onClick={record}>Record</ObjBtn>
          <ObjBtn onClick={() => fileRef.current?.click()}>Open</ObjBtn>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">Selected: {selectedTitle ?? "none"}. Double-click a Sound to open the editor.</p>
    </div>
  );
}

function ObjBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="h-9 rounded-sm border border-[#8a8a8a] bg-[#f3f3f3] text-[12px] hover:bg-white">{children}</button>
  );
}
