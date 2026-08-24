import { useMemo } from "react";
import { computeSpectrogram } from "@/lib/audio/dsp";

export function SpectrumSlice({
  samples, sampleRate, t0, t1,
}: { samples: Float32Array; sampleRate: number; t0: number; t1: number }) {
  const { path, peakHz } = useMemo(() => {
    const a = Math.max(0, Math.min(t0, t1));
    const b = Math.max(t0, t1);
    const i0 = Math.floor(a * sampleRate);
    const i1 = Math.min(samples.length, Math.max(i0 + 512, Math.floor(b * sampleRate)));
    const slice = samples.subarray(i0, i1);
    const spec = computeSpectrogram(slice, sampleRate, 1024, 512);
    if (!spec.frames.length) return { path: "", peakHz: null as number | null };
    const n = spec.nBins;
    const acc = new Float32Array(n);
    for (const f of spec.frames) for (let i = 0; i < n; i++) acc[i] += f[i] ?? 0;
    const maxHz = 5000;
    const binMax = Math.max(8, Math.min(n - 1, Math.floor((maxHz / (sampleRate / 2)) * n)));
    let peak = 1e-12;
    let peakBin = 1;
    for (let i = 2; i < binMax; i++) {
      if ((acc[i] ?? 0) > peak) { peak = acc[i] ?? 0; peakBin = i; }
    }
    const w = 560, h = 120;
    let d = "";
    for (let i = 1; i < binMax; i++) {
      const x = (i / binMax) * w;
      const y = h - Math.min(h, (Math.log10(1 + ((acc[i] ?? 0) / peak) * 9) / Math.log10(10)) * h);
      d += `${i === 1 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)} `;
    }
    return { path: d, peakHz: (peakBin / n) * (sampleRate / 2) };
  }, [samples, sampleRate, t0, t1]);
  return (
    <div className="rounded-2xl border border-border bg-lab p-4">
      <div className="flex justify-between text-[10px] uppercase tracking-wider text-lab-muted mb-2">
        <span>Spectrum slice</span>
        <span className="font-mono">{peakHz != null ? `peak ${peakHz.toFixed(0)} Hz` : "\u2014"} · 0–5000 Hz</span>
      </div>
      <svg viewBox="0 0 560 120" className="w-full h-28">
        <path d={path} fill="none" stroke="#F8A800" strokeWidth="1.6" />
      </svg>
    </div>
  );
}
