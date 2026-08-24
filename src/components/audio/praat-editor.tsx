import { useEffect, useMemo, useRef, useState } from "react";
import { computeSpectrogram, downsample } from "@/lib/audio/dsp";
import type { AcousticMeasures, ContourPoint } from "@/lib/types";
import { cn } from "@/lib/utils";

export type FormantPoint = { t: number; f1: number; f2: number; f3: number; f4: number };

interface Props {
  samples: Float32Array;
  sampleRate: number;
  f0Contour: ContourPoint[];
  intensityContour: ContourPoint[];
  formantContour?: FormantPoint[];
  measures: AcousticMeasures;
  className?: string;
}

export function PraatEditor({
  samples,
  sampleRate,
  f0Contour,
  intensityContour,
  formantContour = [],
  measures,
  className,
}: Props) {
  const waveRef = useRef<HTMLCanvasElement>(null);
  const specRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [sel, setSel] = useState<[number, number] | null>(null);
  const drag = useRef<{ a: number } | null>(null);
  const [showPitch, setShowPitch] = useState(true);
  const [showFormants, setShowFormants] = useState(true);
  const [showIntensity, setShowIntensity] = useState(true);
  const [narrow, setNarrow] = useState(false);
  const [playing, setPlaying] = useState(false);
  const srcRef = useRef<AudioBufferSourceNode | null>(null);
  const acRef = useRef<AudioContext | null>(null);

  const pcm = useMemo(() => {
    const sr = sampleRate > 22050 ? 16000 : sampleRate;
    return {
      samples: sampleRate > 22050 ? downsample(samples, sampleRate, 16000) : samples,
      sr,
    };
  }, [samples, sampleRate]);

  const spec = useMemo(() => {
    const nfft = narrow ? 1024 : 256;
    const hop = narrow ? 160 : 64;
    return computeSpectrogram(pcm.samples, pcm.sr, nfft, hop);
  }, [pcm, narrow]);

  function tAt(clientX: number) {
    const el = wrapRef.current;
    if (!el) return 0;
    const r = el.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
    return x * measures.durationSec;
  }

  useEffect(() => {
    const wave = waveRef.current;
    const specC = specRef.current;
    const wrap = wrapRef.current;
    if (!wave || !specC || !wrap) return;
    const w = Math.max(1, wrap.clientWidth);
    const dpr = Math.min(2, window.devicePixelRatio || 1);

    wave.width = Math.floor(w * dpr);
    wave.height = Math.floor(88 * dpr);
    wave.style.width = `${w}px`;
    wave.style.height = "88px";
    const wctx = wave.getContext("2d");
    if (wctx) {
      wctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      wctx.fillStyle = "#f4f6f6";
      wctx.fillRect(0, 0, w, 88);
      wctx.strokeStyle = "#d8dfe1";
      wctx.beginPath();
      wctx.moveTo(0, 44);
      wctx.lineTo(w, 44);
      wctx.stroke();
      wctx.strokeStyle = "#385058";
      wctx.lineWidth = 1;
      wctx.beginPath();
      const step = Math.max(1, Math.floor(pcm.samples.length / w));
      for (let x = 0; x < w; x++) {
        const i = Math.min(pcm.samples.length - 1, x * step);
        let lo = 0;
        let hi = 0;
        for (let k = 0; k < step; k++) {
          const v = pcm.samples[i + k] ?? 0;
          lo = Math.min(lo, v);
          hi = Math.max(hi, v);
        }
        wctx.moveTo(x + 0.5, 44 - hi * 40);
        wctx.lineTo(x + 0.5, 44 - lo * 40);
      }
      wctx.stroke();
    }

    specC.width = Math.floor(w * dpr);
    specC.height = Math.floor(240 * dpr);
    specC.style.width = `${w}px`;
    specC.style.height = "240px";
    const sctx = specC.getContext("2d");
    if (sctx && spec.frames.length) {
      sctx.setTransform(1, 0, 0, 1, 0, 0);
      const iw = specC.width;
      const ih = specC.height;
      const img = sctx.createImageData(iw, ih);
      const maxHz = 5000;
      const nyquist = pcm.sr / 2;
      const binMax = Math.max(8, Math.min(spec.nBins - 1, Math.floor((maxHz / nyquist) * spec.nBins)));
      let peak = 1e-8;
      for (const f of spec.frames) {
        for (let i = 2; i < binMax; i++) peak = Math.max(peak, f[i] ?? 0);
      }
      for (let x = 0; x < iw; x++) {
        const fi = Math.min(spec.frames.length - 1, Math.floor((x / iw) * spec.frames.length));
        const frame = spec.frames[fi]!;
        for (let y = 0; y < ih; y++) {
          const bin = Math.min(binMax - 1, Math.max(1, Math.floor(((ih - 1 - y) / ih) * binMax)));
          const mag = frame[bin] ?? 0;
          const db = 20 * Math.log10(Math.max(mag, 1e-12) / peak);
          const t = Math.max(0, Math.min(1, (db + 48) / 50));
          const g = Math.round(255 * (1 - Math.pow(t, 0.65)));
          const idx = (y * iw + x) * 4;
          img.data[idx] = g;
          img.data[idx + 1] = g;
          img.data[idx + 2] = g;
          img.data[idx + 3] = 255;
        }
      }
      sctx.putImageData(img, 0, 0);
      sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const dur = measures.durationSec || 1;
      if (showPitch && f0Contour.length > 1) {
        sctx.strokeStyle = "#1d4ed8";
        sctx.lineWidth = 1.6;
        sctx.beginPath();
        f0Contour.forEach((p, i) => {
          const x = (p.t / dur) * w;
          const y = 240 - (p.v / 500) * 240;
          if (i === 0) sctx.moveTo(x, y);
          else sctx.lineTo(x, y);
        });
        sctx.stroke();
      }
      if (showFormants) {
        sctx.fillStyle = "#c81e1e";
        for (const p of formantContour) {
          const x = (p.t / dur) * w;
          for (const f of [p.f1, p.f2, p.f3, p.f4]) {
            if (!f) continue;
            const y = 240 - (f / 5000) * 240;
            sctx.fillRect(x - 1.2, y - 1.2, 2.4, 2.4);
          }
        }
      }
      if (showIntensity && intensityContour.length > 1) {
        sctx.strokeStyle = "#ca8a04";
        sctx.lineWidth = 1.4;
        sctx.beginPath();
        intensityContour.forEach((p, i) => {
          const x = (p.t / dur) * w;
          const y = 240 - ((p.v + 60) / 60) * 220;
          if (i === 0) sctx.moveTo(x, y);
          else sctx.lineTo(x, y);
        });
        sctx.stroke();
      }
    }

    if (sel && wctx) {
      const dur = measures.durationSec || 1;
      const x0 = (Math.min(sel[0], sel[1]) / dur) * w;
      const x1 = (Math.max(sel[0], sel[1]) / dur) * w;
      wctx.fillStyle = "rgba(64,168,168,0.22)";
      wctx.fillRect(x0, 0, Math.max(1, x1 - x0), 88);
    }
  }, [pcm, spec, f0Contour, intensityContour, formantContour, measures.durationSec, showPitch, showFormants, showIntensity, sel]);

  async function play(from = 0, to = measures.durationSec) {
    srcRef.current?.stop();
    const ac = acRef.current ?? new AudioContext();
    acRef.current = ac;
    const buf = ac.createBuffer(1, samples.length, sampleRate);
    buf.getChannelData(0).set(samples);
    const src = ac.createBufferSource();
    src.buffer = buf;
    src.connect(ac.destination);
    const start = Math.max(0, from);
    const dur = Math.max(0.05, to - from);
    src.start(0, start, dur);
    src.onended = () => setPlaying(false);
    srcRef.current = src;
    setPlaying(true);
  }

  function stop() {
    try { srcRef.current?.stop(); } catch { /* already stopped */ }
    setPlaying(false);
  }

  const rows: { k: string; v: string }[] = [
    { k: "Duration", v: `${measures.durationSec.toFixed(3)} s` },
    { k: "Median pitch", v: fmt(measures.f0Mean, 3, "Hz") },
    { k: "Mean pitch", v: fmt(measures.f0Mean, 3, "Hz") },
    { k: "Minimum pitch", v: fmt(measures.f0Min, 3, "Hz") },
    { k: "Maximum pitch", v: fmt(measures.f0Max, 3, "Hz") },
    { k: "Standard deviation", v: fmt(measures.f0Sd, 3, "Hz") },
    { k: "Jitter (local)", v: fmt(measures.jitterLocal, 3, "%") },
    { k: "Jitter (rap)", v: fmt(measures.jitterRap, 3, "%") },
    { k: "Jitter (ppq5)", v: fmt(measures.jitterPpq5, 3, "%") },
    { k: "Shimmer (local)", v: fmt(measures.shimmerLocal, 3, "%") },
    { k: "Shimmer (apq3)", v: fmt(measures.shimmerApq3, 3, "%") },
    { k: "Shimmer (apq5)", v: fmt(measures.shimmerApq5, 3, "%") },
    { k: "Mean HNR", v: fmt(measures.hnr, 3, "dB") },
    { k: "Mean NHR", v: fmt(measures.nhr, 6, "") },
    { k: "F1", v: fmt(measures.f1, 0, "Hz") },
    { k: "F2", v: fmt(measures.f2, 0, "Hz") },
    { k: "F3", v: fmt(measures.f3, 0, "Hz") },
    { k: "F4", v: fmt(measures.f4, 0, "Hz") },
  ];

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap gap-2 text-[11px] uppercase tracking-wider">
        <Toggle on={showPitch} onClick={() => setShowPitch((v) => !v)} color="#1d4ed8">Pitch</Toggle>
        <Toggle on={showFormants} onClick={() => setShowFormants((v) => !v)} color="#c81e1e">Formants</Toggle>
        <Toggle on={showIntensity} onClick={() => setShowIntensity((v) => !v)} color="#ca8a04">Intensity</Toggle>
        <Toggle on={narrow} onClick={() => setNarrow((v) => !v)}>{narrow ? "Narrow-band" : "Wide-band"}</Toggle>
        <button type="button" className="h-8 px-3 rounded-full border border-border bg-primary text-primary-foreground" onClick={() => (playing ? stop() : play(sel ? Math.min(...sel) : 0, sel ? Math.max(...sel) : measures.durationSec))}>
          {playing ? "Stop" : sel ? "Play sel" : "Play"}
        </button>
      </div>
      <div ref={wrapRef} className="rounded-xl overflow-hidden border border-[#b8c2c4] bg-[#f4f6f6] select-none"
        onPointerDown={(e) => { (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId); const t = tAt(e.clientX); drag.current = { a: t }; setSel([t, t]); }}
        onPointerMove={(e) => { if (!drag.current) return; setSel([drag.current.a, tAt(e.clientX)]); }}
        onPointerUp={() => { drag.current = null; }}>
        <canvas ref={waveRef} className="block w-full" />
        <div className="h-px bg-[#b8c2c4]" />
        <canvas ref={specRef} className="block w-full" />
        <div className="flex justify-between px-2 py-1 text-[10px] font-mono text-[#5a6a70] bg-[#eef1f2]">
          <span>0 s</span>
          <span>0–5000 Hz · {narrow ? "0.030 s window" : "0.005 s window"}</span>
          <span>{measures.durationSec.toFixed(3)} s</span>
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground">Drag on the editor to select. Blue = pitch, red = formants, gold = intensity — same overlays as Praat Sound.</p>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-2 border-b border-border bg-secondary/60">
          <p className="text-[11px] uppercase tracking-[0.16em] text-primary">Voice report</p>
          <p className="text-xs text-muted-foreground">Praat-style Pulses → Voice report on the visible sound</p>
        </div>
        <table className="w-full text-sm">
          <tbody>
            {rows.map((r) => (
              <tr key={r.k} className="border-t border-border/70">
                <td className="px-4 py-1.5 text-muted-foreground w-[46%]">{r.k}</td>
                <td className="px-4 py-1.5 font-mono tabular-nums">{r.v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function fmt(n: number | null | undefined, digits: number, unit: string) {
  if (n == null || Number.isNaN(n)) return "undefined";
  return `${n.toFixed(digits)}${unit ? ` ${unit}` : ""}`;
}

function Toggle({ on, onClick, children, color }: { on: boolean; onClick: () => void; children: React.ReactNode; color?: string }) {
  return (
    <button type="button" onClick={onClick} className={cn("h-8 px-3 rounded-full border text-[11px] uppercase tracking-wider", on ? "border-transparent text-white" : "border-border bg-card text-muted-foreground")} style={on ? { background: color ?? "#385058" } : undefined}>
      {children}
    </button>
  );
}
