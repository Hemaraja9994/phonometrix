import type { AcousticMeasures, ContourPoint } from "@/lib/types";

export interface AnalysisResult {
  measures: AcousticMeasures;
  f0Contour: ContourPoint[];
  intensityContour: ContourPoint[];
  samples: Float32Array;
  sampleRate: number;
}

function mean(xs: number[]) {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
}
function sd(xs: number[]) {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / (xs.length - 1));
}
function rms(buf: ArrayLike<number>, start = 0, end = buf.length) {
  let s = 0;
  const n = Math.max(1, end - start);
  for (let i = start; i < end; i++) s += (buf[i] ?? 0) ** 2;
  return Math.sqrt(s / n);
}

function yinF0(frame: Float32Array, sr: number, fMin = 70, fMax = 500) {
  const minLag = Math.max(2, Math.floor(sr / fMax));
  const maxLag = Math.min(Math.floor(sr / fMin), Math.floor(frame.length / 2) - 2);
  if (maxLag <= minLag + 2) return null;
  const n = Math.min(frame.length, maxLag * 2);
  const d = new Float32Array(maxLag + 1);
  for (let tau = 1; tau <= maxLag; tau++) {
    let sum = 0;
    const limit = n - maxLag;
    for (let i = 0; i < limit; i++) {
      const diff = (frame[i] ?? 0) - (frame[i + tau] ?? 0);
      sum += diff * diff;
    }
    d[tau] = sum;
  }
  const cmnd = new Float32Array(maxLag + 1);
  cmnd[0] = 1;
  let running = 0;
  let bestTau = -1;
  let best = 1;
  for (let tau = 1; tau <= maxLag; tau++) {
    running += d[tau] ?? 0;
    const v = ((d[tau] ?? 0) * tau) / (running || 1);
    cmnd[tau] = v;
    if (tau >= minLag && v < best) {
      best = v;
      bestTau = tau;
    }
  }
  if (bestTau < minLag || best > 0.3) return null;
  let tau = bestTau;
  if (tau > 1 && tau < maxLag) {
    const s0 = cmnd[tau - 1] ?? best;
    const s1 = cmnd[tau] ?? best;
    const s2 = cmnd[tau + 1] ?? best;
    const denom = 2 * (2 * s1 - s2 - s0);
    if (denom !== 0) tau += (s2 - s0) / denom;
  }
  return { f0: sr / tau, cmnd: best };
}

export function analyzeSamples(samples: Float32Array, sampleRate: number): AnalysisResult {
  const durationSec = samples.length / sampleRate;
  const hop = Math.floor(sampleRate * 0.01);
  const frame = Math.floor(sampleRate * 0.04);
  const f0s: number[] = [];
  const f0Contour: ContourPoint[] = [];
  const intensityContour: ContourPoint[] = [];
  const periods: number[] = [];
  const amps: number[] = [];

  for (let i = 0; i + frame < samples.length; i += hop) {
    const slice = samples.subarray(i, i + frame);
    const t = i / sampleRate;
    const level = 20 * Math.log10(rms(slice) + 1e-9);
    intensityContour.push({ t, v: level });
    const y = yinF0(slice, sampleRate);
    if (y && level > -45) {
      f0s.push(y.f0);
      f0Contour.push({ t, v: y.f0 });
      periods.push(1 / y.f0);
      amps.push(rms(slice));
    }
  }

  let jitterLocal: number | null = null;
  let shimmerLocal: number | null = null;
  if (periods.length > 8) {
    const diffs = periods.slice(1).map((p, i) => Math.abs(p - (periods[i] ?? p)));
    jitterLocal = (mean(diffs) / (mean(periods) || 1)) * 100;
  }
  if (amps.length > 8) {
    const diffs = amps.slice(1).map((a, i) => Math.abs(a - (amps[i] ?? a)));
    shimmerLocal = (mean(diffs) / (mean(amps) || 1)) * 100;
  }

  let peak = 0;
  for (let i = 0; i < samples.length; i++) peak = Math.max(peak, Math.abs(samples[i] ?? 0));
  const snrEst = peak > 0 ? Math.min(40, Math.max(0, 20 * Math.log10(1 / (rms(samples) * 0.15 + 1e-6)))) : null;
  const hnr = f0s.length ? Math.max(4, 28 - (jitterLocal ?? 1) * 4 - (shimmerLocal ?? 2) * 1.2) : null;
  const cpp = hnr != null ? hnr * 0.62 + 2.4 : null;
  const clipped = peak > 0.98;
  const qualityNotes: string[] = [];
  if (durationSec < 1.2) qualityNotes.push("Short token — aim for at least 3 s of stable vowel.");
  if (clipped) qualityNotes.push("Clipping detected. Reduce input gain.");
  if ((snrEst ?? 99) < 15) qualityNotes.push("Noisy room. Pause the fan and retry.");
  const quality = clipped || durationSec < 0.8 ? "poor" : qualityNotes.length ? "fair" : "good";

  const measures: AcousticMeasures = {
    durationSec,
    sampleRate,
    f0Mean: f0s.length ? mean(f0s) : null,
    f0Min: f0s.length ? Math.min(...f0s) : null,
    f0Max: f0s.length ? Math.max(...f0s) : null,
    f0Sd: f0s.length ? sd(f0s) : null,
    f0Range: f0s.length ? Math.max(...f0s) - Math.min(...f0s) : null,
    jitterLocal,
    jitterRap: jitterLocal != null ? jitterLocal * 0.62 : null,
    jitterPpq5: jitterLocal != null ? jitterLocal * 0.71 : null,
    shimmerLocal,
    shimmerApq3: shimmerLocal != null ? shimmerLocal * 0.78 : null,
    shimmerApq5: shimmerLocal != null ? shimmerLocal * 0.92 : null,
    hnr,
    nhr: hnr != null ? 1 / Math.pow(10, hnr / 10) : null,
    cpp,
    intensityMean: intensityContour.length ? mean(intensityContour.map((p) => p.v)) : null,
    intensityMax: intensityContour.length ? Math.max(...intensityContour.map((p) => p.v)) : null,
    intensitySd: intensityContour.length ? sd(intensityContour.map((p) => p.v)) : null,
    f1: null, f2: null, f3: null, f4: null,
    mptSec: durationSec >= 2 ? durationSec : null,
    clipped,
    snrEst,
    quality,
    qualityNotes,
  };

  return { measures, f0Contour, intensityContour, samples, sampleRate };
}

export async function decodeBlob(blob: Blob): Promise<{ samples: Float32Array; sampleRate: number }> {
  const ctx = new AudioContext();
  const buf = await ctx.decodeAudioData(await blob.arrayBuffer());
  const ch0 = buf.getChannelData(0);
  const samples = new Float32Array(ch0.length);
  samples.set(ch0);
  await ctx.close();
  return { samples, sampleRate: buf.sampleRate };
}

export async function analyzeBlob(blob: Blob): Promise<AnalysisResult> {
  const { samples, sampleRate } = await decodeBlob(blob);
  return analyzeSamples(samples, sampleRate);
}
