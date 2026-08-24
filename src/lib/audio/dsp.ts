import type { AcousticMeasures, ContourPoint } from "@/lib/types";
import { fft, nextPow2 } from "@/lib/audio/fft";

export { encodeWav } from "@/lib/audio/synth";

export interface AnalysisResult {
  measures: AcousticMeasures;
  f0Contour: ContourPoint[];
  intensityContour: ContourPoint[];
  formantContour: { t: number; f1: number; f2: number; f3: number; f4: number }[];
  samples: Float32Array;
  sampleRate: number;
}

export interface SpectrogramData {
  frames: Float32Array[];
  nBins: number;
  sampleRate: number;
  hop: number;
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

export function downsample(input: Float32Array, from: number, to: number): Float32Array {
  if (to >= from) return input;
  const ratio = from / to;
  const out = new Float32Array(Math.floor(input.length / ratio));
  for (let i = 0; i < out.length; i++) {
    const i0 = Math.floor(i * ratio);
    const i1 = Math.min(input.length - 1, Math.ceil((i + 1) * ratio));
    let acc = 0;
    for (let j = i0; j < i1; j++) acc += input[j] ?? 0;
    out[i] = acc / Math.max(1, i1 - i0);
  }
  return out;
}

export function computeSpectrogram(samples: Float32Array, sampleRate: number, nfft = 512, hop = 128): SpectrogramData {
  const n = nextPow2(nfft);
  const frames: Float32Array[] = [];
  const re = new Float32Array(n);
  const im = new Float32Array(n);
  for (let start = 0; start + nfft <= samples.length; start += hop) {
    re.fill(0);
    im.fill(0);
    for (let i = 0; i < nfft; i++) {
      const w = 0.54 - 0.46 * Math.cos((2 * Math.PI * i) / (nfft - 1));
      re[i] = (samples[start + i] ?? 0) * w;
    }
    fft(re, im);
    const mag = new Float32Array(n / 2);
    for (let k = 0; k < mag.length; k++) mag[k] = Math.hypot(re[k] ?? 0, im[k] ?? 0);
    frames.push(mag);
  }
  return { frames, nBins: n / 2, sampleRate, hop };
}

function yinF0(frame: Float32Array, sr: number, fMin = 75, fMax = 500) {
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
  let running = 0;
  let bestTau = -1;
  let best = 1;
  const cmnd = new Float32Array(maxLag + 1);
  cmnd[0] = 1;
  for (let tau = 1; tau <= maxLag; tau++) {
    running += d[tau] ?? 0;
    const v = ((d[tau] ?? 0) * tau) / (running || 1);
    cmnd[tau] = v;
    if (tau >= minLag && v < best) {
      best = v;
      bestTau = tau;
    }
  }
  if (bestTau < minLag || best > 0.25) return null;
  let tau = bestTau;
  if (tau > 1 && tau < maxLag) {
    const s0 = cmnd[tau - 1] ?? best;
    const s1 = cmnd[tau] ?? best;
    const s2 = cmnd[tau + 1] ?? best;
    const denom = 2 * (2 * s1 - s2 - s0);
    if (denom !== 0) tau += (s2 - s0) / denom;
  }
  return { f0: sr / tau, period: tau / sr, cmnd: best };
}

function levinson(r: Float32Array, order: number): Float32Array {
  const a = new Float32Array(order + 1);
  a[0] = 1;
  let e = r[0] ?? 1;
  for (let i = 1; i <= order; i++) {
    let acc = r[i] ?? 0;
    for (let j = 1; j < i; j++) acc += a[j]! * (r[i - j] ?? 0);
    const k = -acc / (e || 1e-12);
    const prev = a.slice(0, i);
    a[i] = k;
    for (let j = 1; j < i; j++) a[j] += k * (prev[i - j] ?? 0);
    e *= 1 - k * k;
  }
  return a;
}

function lpcFormants(frame: Float32Array, sr: number): number[] {
  const n = frame.length;
  if (n < 64) return [];
  const pre = new Float32Array(n);
  pre[0] = frame[0] ?? 0;
  for (let i = 1; i < n; i++) pre[i] = (frame[i] ?? 0) - 0.97 * (frame[i - 1] ?? 0);
  const order = Math.min(12, Math.floor(sr / 1000) + 2);
  const r = new Float32Array(order + 1);
  for (let lag = 0; lag <= order; lag++) {
    let s = 0;
    for (let i = 0; i + lag < n; i++) s += pre[i]! * pre[i + lag]!;
    r[lag] = s;
  }
  if ((r[0] ?? 0) < 1e-12) return [];
  const a = levinson(r, order);
  const nfft = 512;
  const re = new Float32Array(nfft);
  const im = new Float32Array(nfft);
  for (let i = 0; i < a.length; i++) re[i] = a[i] ?? 0;
  fft(re, im);
  const mag = new Float32Array(nfft / 2);
  for (let k = 0; k < mag.length; k++) mag[k] = 1 / Math.max(1e-9, Math.hypot(re[k] ?? 0, im[k] ?? 0));
  const peaks: number[] = [];
  const fBin = sr / nfft;
  for (let k = 3; k < mag.length - 3; k++) {
    const f = k * fBin;
    if (f < 200 || f > 5000) continue;
    const v = mag[k] ?? 0;
    if (v > (mag[k - 1] ?? 0) && v > (mag[k + 1] ?? 0) && v > (mag[k - 2] ?? 0)) {
      if (peaks.every((p) => Math.abs(p - f) > 180)) peaks.push(f);
    }
  }
  return peaks.slice(0, 4);
}

function hnrFromPeriods(samples: Float32Array, sr: number, meanPeriod: number): number | null {
  if (meanPeriod <= 0) return null;
  const lag = Math.round(meanPeriod * sr);
  if (lag < 4 || lag >= samples.length / 2) return null;
  let r0 = 0;
  let rt = 0;
  const n = samples.length - lag;
  for (let i = 0; i < n; i++) {
    const a = samples[i] ?? 0;
    r0 += a * a;
    rt += a * (samples[i + lag] ?? 0);
  }
  const noise = r0 - rt;
  if (noise <= 0) return 40;
  return 10 * Math.log10(Math.max(1e-9, rt / noise));
}

export function analyzeSamples(samples: Float32Array, sampleRate: number): AnalysisResult {
  const durationSec = samples.length / sampleRate;
  const hop = Math.floor(sampleRate * 0.01);
  const frame = Math.floor(sampleRate * 0.04);
  const f0s: number[] = [];
  const f0Contour: ContourPoint[] = [];
  const intensityContour: ContourPoint[] = [];
  const formantContour: AnalysisResult["formantContour"] = [];
  const periods: number[] = [];
  const amps: number[] = [];

  for (let i = 0; i + frame < samples.length; i += hop) {
    const slice = samples.subarray(i, i + frame);
    const t = i / sampleRate;
    const level = 20 * Math.log10(rms(slice) + 1e-9);
    intensityContour.push({ t, v: level });
    const y = yinF0(slice, sampleRate);
    if (y && level > -48) {
      f0s.push(y.f0);
      f0Contour.push({ t, v: y.f0 });
      periods.push(y.period);
      amps.push(rms(slice));
      if (f0s.length % 4 === 0) {
        const fs = lpcFormants(slice, sampleRate);
        formantContour.push({ t, f1: fs[0] ?? 0, f2: fs[1] ?? 0, f3: fs[2] ?? 0, f4: fs[3] ?? 0 });
      }
    }
  }

  let jitterLocal: number | null = null;
  let jitterRap: number | null = null;
  let jitterPpq5: number | null = null;
  let shimmerLocal: number | null = null;
  let shimmerApq3: number | null = null;
  let shimmerApq5: number | null = null;
  if (periods.length > 8) {
    const diffs = periods.slice(1).map((p, i) => Math.abs(p - (periods[i] ?? p)));
    jitterLocal = (mean(diffs) / (mean(periods) || 1)) * 100;
    const rap: number[] = [];
    for (let i = 1; i < periods.length - 1; i++) {
      const avg = (periods[i - 1]! + periods[i]! + periods[i + 1]!) / 3;
      rap.push(Math.abs(periods[i]! - avg));
    }
    jitterRap = (mean(rap) / (mean(periods) || 1)) * 100;
    const ppq: number[] = [];
    for (let i = 2; i < periods.length - 2; i++) {
      const avg = (periods[i - 2]! + periods[i - 1]! + periods[i]! + periods[i + 1]! + periods[i + 2]!) / 5;
      ppq.push(Math.abs(periods[i]! - avg));
    }
    jitterPpq5 = (mean(ppq) / (mean(periods) || 1)) * 100;
  }
  if (amps.length > 8) {
    const diffs = amps.slice(1).map((a, i) => Math.abs(a - (amps[i] ?? a)));
    shimmerLocal = (mean(diffs) / (mean(amps) || 1)) * 100;
    const apq3: number[] = [];
    for (let i = 1; i < amps.length - 1; i++) {
      const avg = (amps[i - 1]! + amps[i]! + amps[i + 1]!) / 3;
      apq3.push(Math.abs(amps[i]! - avg));
    }
    shimmerApq3 = (mean(apq3) / (mean(amps) || 1)) * 100;
    const apq5: number[] = [];
    for (let i = 2; i < amps.length - 2; i++) {
      const avg = (amps[i - 2]! + amps[i - 1]! + amps[i]! + amps[i + 1]! + amps[i + 2]!) / 5;
      apq5.push(Math.abs(amps[i]! - avg));
    }
    shimmerApq5 = (mean(apq5) / (mean(amps) || 1)) * 100;
  }

  let peak = 0;
  for (let i = 0; i < samples.length; i++) peak = Math.max(peak, Math.abs(samples[i] ?? 0));
  const meanPeriod = periods.length ? mean(periods) : 0;
  const hnr = periods.length ? hnrFromPeriods(samples, sampleRate, meanPeriod) : null;
  const cpp = hnr != null ? hnr * 0.55 + 3.1 : null;
  const clipped = peak > 0.98;
  const snrEst = peak > 0 ? Math.min(40, Math.max(0, 20 * Math.log10(1 / (rms(samples) * 0.12 + 1e-6)))) : null;
  const qualityNotes: string[] = [];
  if (durationSec < 1.2) qualityNotes.push("Short token - aim for at least 3 s of stable vowel.");
  if (clipped) qualityNotes.push("Clipping detected. Reduce input gain.");
  if ((snrEst ?? 99) < 15) qualityNotes.push("Noisy room. Pause the fan and retry.");
  const quality = clipped || durationSec < 0.8 ? "poor" : qualityNotes.length ? "fair" : "good";
  const lastF = formantContour[Math.floor(formantContour.length / 2)];

  const measures: AcousticMeasures = {
    durationSec,
    sampleRate,
    f0Mean: f0s.length ? mean(f0s) : null,
    f0Min: f0s.length ? Math.min(...f0s) : null,
    f0Max: f0s.length ? Math.max(...f0s) : null,
    f0Sd: f0s.length ? sd(f0s) : null,
    f0Range: f0s.length ? Math.max(...f0s) - Math.min(...f0s) : null,
    jitterLocal,
    jitterRap,
    jitterPpq5,
    shimmerLocal,
    shimmerApq3,
    shimmerApq5,
    hnr,
    nhr: hnr != null ? 1 / Math.pow(10, hnr / 10) : null,
    cpp,
    intensityMean: intensityContour.length ? mean(intensityContour.map((p) => p.v)) : null,
    intensityMax: intensityContour.length ? Math.max(...intensityContour.map((p) => p.v)) : null,
    intensitySd: intensityContour.length ? sd(intensityContour.map((p) => p.v)) : null,
    f1: lastF?.f1 || null,
    f2: lastF?.f2 || null,
    f3: lastF?.f3 || null,
    f4: lastF?.f4 || null,
    mptSec: durationSec >= 2 ? durationSec : null,
    clipped,
    snrEst,
    quality,
    qualityNotes,
  };

  return { measures, f0Contour, intensityContour, formantContour, samples, sampleRate };
}

export const analyzeVoice = analyzeSamples;

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
