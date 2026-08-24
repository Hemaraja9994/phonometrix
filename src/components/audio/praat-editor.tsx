import { useEffect, useMemo, useRef, useState } from "react";
import { computeSpectrogram, downsample } from "@/lib/audio/dsp";
import { formatVoiceReport } from "@/lib/audio/voice-report";
import { SpectrumSlice } from "@/components/audio/spectrum-slice";
import type { AcousticMeasures, ContourPoint, Sex } from "@/lib/types";
import { cn } from "@/lib/utils";

export type FormantPoint = { t: number; f1: number; f2: number; f3: number; f4: number };

interface Props {
  samples: Float32Array;
  sampleRate: number;
  f0Contour: ContourPoint[];
  intensityContour: ContourPoint[];
  formantContour?: FormantPoint[];
  measures: AcousticMeasures;
  label: string;
  sex: Sex;
  age: number;
  className?: string;
}

export function PraatEditor({
  samples, sampleRate, f0Contour, intensityContour, formantContour = [], measures, label, sex, age, className,
}: Props) {
  const waveRef = useRef<HTMLCanvasElement>(null);
  const specRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [sel, setSel] = useState<[number, number] | null>(null);
  const drag = useRef<{ a: number } | null>(null);
  const [showPitch, setShowPitch] = useState(true);
  const [showFormants, setShowFormants] = useState(true);
  const [showIntensity, setShowIntensity] = useState(true);
  const [showPulses, setShowPulses] = useState(true);
  const [narrow, setNarrow] = useState(false);
  const [showSlice, setShowSlice] = useState(false);
  const [playing, setPlaying] = useState(false);
  const srcRef = useRef<AudioBufferSourceNode | null>(null);
  const acRef = useRef<AudioContext | null>(null);

  const pcm = useMemo(() => {
    const sr = sampleRate > 22050 ? 16000 : sampleRate;
    return { samples: sampleRate > 22050 ? downsample(samples, sampleRate, 16000) : samples, sr };
  }, [samples, sampleRate]);

  const spec = useMemo(() => {
    const nfft = narrow ? 1024 : 256;
    const hop = narrow ? 160 : 64;
    return computeSpectrogram(pcm.samples, pcm.sr, nfft, hop);
  }, [pcm, narrow]);

  const dur = measures.durationSec;
  function tAt(clientX: number) {
    const el = wrapRef.current;
    if (!el) return 0;
    const r = el.getBoundingClientRect();
    return Math.min(dur, Math.max(0, ((clientX - r.left) / r.width) * dur));
  }

  useEffect(() => {
    const wave = waveRef.current;
    const specC = specRef.current;
    const wrap = wrapRef.current;
    if (!wave || !specC || !wrap) return;
    const w = Math.max(320, wrap.clientWidth);
    const waveH = 110, specH = 220;
    wave.width = w * 2; wave.height = waveH * 2;
    specC.width = w * 2; specC.height = specH * 2;
    const wctx = wave.getContext("2d");
    const sctx = specC.getContext("2d");
    if (!wctx || !sctx) return;
    wctx.setTransform(2, 0, 0, 2, 0, 0);
    sctx.setTransform(2, 0, 0, 2, 0, 0);
    wctx.fillStyle = "#f4f6f6"; wctx.fillRect(0, 0, w, waveH);
    wctx.beginPath(); wctx.strokeStyle = "#385058"; wctx.lineWidth = 1;
    const step = Math.max(1, Math.floor(pcm.samples.length / w));
    for (let x = 0; x < w; x++) {
      const i = Math.min(pcm.samples.length - 1, x * step);
      const y = waveH / 2 - (pcm.samples[i] ?? 0) * (waveH * 0.42);
      if (x === 0) wctx.moveTo(x, y); else wctx.lineTo(x, y);
    }
    wctx.stroke();
    if (showPulses) {
      wctx.strokeStyle = "#1d4ed8"; wctx.lineWidth = 1;
      for (const p of f0Contour) {
        const x = (p.t / dur) * w;
        wctx.beginPath(); wctx.moveTo(x, 8); wctx.lineTo(x, waveH - 8); wctx.stroke();
      }
    }
    const nBins = spec.nBins;
    const maxHz = 5000;
    const binMax = Math.max(8, Math.min(nBins - 1, Math.floor((maxHz / (pcm.sr / 2)) * nBins)));
    let peak = 1e-12;
    for (const f of spec.frames) for (let i = 1; i < binMax; i++) peak = Math.max(peak, f[i] ?? 0);
    const img = sctx.createImageData(w, specH);
    for (let x = 0; x < w; x++) {
      const fi = Math.min(spec.frames.length - 1, Math.floor((x / w) * spec.frames.length));
      const frame = spec.frames[fi];
      for (let y = 0; y < specH; y++) {
        const bin = Math.floor(((specH - 1 - y) / specH) * binMax);
        const mag = frame?.[bin] ?? 0;
        const g = Math.min(255, Math.floor((Math.log10(1 + (mag / peak) * 9) / Math.log10(10)) * 255));
        const o = (y * w + x) * 4;
        img.data[o] = 255 - g; img.data[o + 1] = 255 - g; img.data[o + 2] = 255 - g; img.data[o + 3] = 255;
      }
    }
    sctx.putImageData(img, 0, 0);
    sctx.setTransform(2, 0, 0, 2, 0, 0);
    if (showPitch) {
      sctx.strokeStyle = "#1d4ed8"; sctx.lineWidth = 1.5; sctx.beginPath();
      f0Contour.forEach((p, i) => {
        const x = (p.t / dur) * w; const y = specH - (p.v / 500) * specH;
        if (i === 0) sctx.moveTo(x, y); else sctx.lineTo(x, y);
      });
      sctx.stroke();
    }
    if (showFormants) {
      sctx.fillStyle = "#c81e1e";
      for (const p of formantContour) {
        const x = (p.t / dur) * w;
        for (const f of [p.f1, p.f2, p.f3, p.f4]) {
          if (!f) continue;
          const y = specH - (f / 5000) * specH;
          sctx.fillRect(x - 1.2, y - 1.2, 2.4, 2.4);
        }
      }
    }
    if (showIntensity) {
      sctx.strokeStyle = "#ca8a04"; sctx.lineWidth = 1.4; sctx.beginPath();
      intensityContour.forEach((p, i) => {
        const x = (p.t / dur) * w; const y = specH - ((p.v + 60) / 60) * specH;
        if (i === 0) sctx.moveTo(x, y); else sctx.lineTo(x, y);
      });
      sctx.stroke();
    }
    if (sel) {
      const a = (Math.min(...sel) / dur) * w; const b = (Math.max(...sel) / dur) * w;
      wctx.fillStyle = "rgba(64,168,168,0.22)"; wctx.fillRect(a, 0, b - a, waveH);
      sctx.fillStyle = "rgba(64,168,168,0.18)"; sctx.fillRect(a, 0, b - a, specH);
    }
  }, [pcm, spec, f0Contour, formantContour, intensityContour, showPitch, showFormants, showIntensity, showPulses, sel, dur]);

  function play(from: number, to: number) {
    stop();
    const ac = acRef.current ?? new AudioContext();
    acRef.current = ac;
    const i0 = Math.floor(from * sampleRate);
    const i1 = Math.min(samples.length, Math.floor(to * sampleRate));
    const buf = ac.createBuffer(1, Math.max(1, i1 - i0), sampleRate);
    buf.getChannelData(0).set(samples.subarray(i0, i1));
    const src = ac.createBufferSource();
    src.buffer = buf; src.connect(ac.destination); src.start();
    src.onended = () => setPlaying(false);
    srcRef.current = src; setPlaying(true);
  }
  function stop() {
    try { srcRef.current?.stop(); } catch { /* already stopped */ }
    setPlaying(false);
  }

  const t0 = sel ? Math.min(...sel) : 0;
  const t1 = sel ? Math.max(...sel) : dur;
  const report = formatVoiceReport(measures, f0Contour, { sex, age, label, t0, t1 });
  function onMenu(cmd: string) {
    if (cmd === "wide") setNarrow(false);
    if (cmd === "narrow") setNarrow(true);
    if (cmd === "slice") setShowSlice((v) => !v);
    if (cmd === "pitch") setShowPitch((v) => !v);
    if (cmd === "formants") setShowFormants((v) => !v);
    if (cmd === "intensity") setShowIntensity((v) => !v);
    if (cmd === "pulses") setShowPulses((v) => !v);
    if (cmd === "copy") void navigator.clipboard.writeText(report);
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap gap-1 rounded-xl border border-border bg-card p-1 text-[12px]">
        <Menu label="Spectrum" items={[["wide", "Wide-band (0.005 s)"], ["narrow", "Narrow-band (0.030 s)"], ["slice", "View spectral slice"]]} onPick={onMenu} />
        <Menu label="Pitch" items={[["pitch", showPitch ? "Hide pitch" : "Show pitch"]]} onPick={onMenu} />
        <Menu label="Intensity" items={[["intensity", showIntensity ? "Hide intensity" : "Show intensity"]]} onPick={onMenu} />
        <Menu label="Formants" items={[["formants", showFormants ? "Hide formants" : "Show formants"]]} onPick={onMenu} />
        <Menu label="Pulses" items={[["pulses", showPulses ? "Hide pulses" : "Show pulses"], ["copy", "Copy Voice report"]]} onPick={onMenu} />
        <button type="button" className="h-8 px-3 rounded-lg bg-primary text-primary-foreground ml-auto" onClick={() => (playing ? stop() : play(t0, t1))}>
          {playing ? "Stop" : sel ? "Play sel" : "Play"}
        </button>
      </div>
      <div ref={wrapRef} className="rounded-xl overflow-hidden border border-border bg-lab select-none"
        onPointerDown={(e) => { (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId); const t = tAt(e.clientX); drag.current = { a: t }; setSel([t, t]); }}
        onPointerMove={(e) => { if (!drag.current) return; setSel([drag.current.a, tAt(e.clientX)]); }}
        onPointerUp={() => { drag.current = null; }}>
        <canvas ref={waveRef} className="block w-full" />
        <div className="h-px bg-border" />
        <canvas ref={specRef} className="block w-full" />
        <div className="flex justify-between px-2 py-1 text-[10px] font-mono text-lab-muted bg-secondary/80">
          <span>0 s</span>
          <span>0–5000 Hz · {narrow ? "narrow 0.030 s" : "wide 0.005 s"} · blue pitch · red formants · gold intensity</span>
          <span>{dur.toFixed(3)} s</span>
        </div>
      </div>
      {showSlice && <SpectrumSlice samples={pcm.samples} sampleRate={pcm.sr} t0={t0} t1={Math.max(t1, t0 + 0.04)} />}
      <div className="rounded-xl border border-border bg-lab overflow-hidden">
        <div className="px-4 py-2 border-b border-border bg-secondary/60 flex justify-between">
          <p className="text-[11px] uppercase tracking-[0.16em] text-primary">Voice report</p>
          <button type="button" className="text-[11px] uppercase tracking-wider text-trace" onClick={() => void navigator.clipboard.writeText(report)}>Copy</button>
        </div>
        <pre className="p-4 text-[12px] leading-relaxed font-mono text-lab-ink overflow-x-auto whitespace-pre-wrap">{report}</pre>
      </div>
    </div>
  );
}

function Menu({ label, items, onPick }: { label: string; items: [string, string][]; onPick: (cmd: string) => void }) {
  return (
    <label className="inline-flex items-center">
      <span className="sr-only">{label}</span>
      <select className="h-8 rounded-lg bg-transparent px-2 text-[12px]" defaultValue="" onChange={(e) => { const v = e.target.value; e.target.value = ""; if (v) onPick(v); }}>
        <option value="" disabled>{label}</option>
        {items.map(([k, t]) => <option key={k} value={k}>{t}</option>)}
      </select>
    </label>
  );
}
