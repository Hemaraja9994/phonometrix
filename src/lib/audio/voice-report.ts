import type { AcousticMeasures, ContourPoint, Sex } from "@/lib/types";

function n(v: number | null | undefined, digits: number, unit = "", scale = 1) {
  if (v == null || Number.isNaN(v)) return "undefined";
  return `${(v * scale).toFixed(digits)}${unit ? " " + unit : ""}`;
}

function median(xs: number[]) {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)] ?? null;
}

export function indianSettings(sex: Sex, age: number) {
  if (age < 12) return { fMin: 150, fMax: 600, maxFormant: 8000, label: "child" };
  if (sex === "male") return { fMin: 60, fMax: 350, maxFormant: 5000, label: "adult male" };
  if (sex === "female") return { fMin: 100, fMax: 500, maxFormant: 5500, label: "adult female" };
  return { fMin: 75, fMax: 500, maxFormant: 5500, label: "adult" };
}

export function formatVoiceReport(
  measures: AcousticMeasures,
  f0Contour: ContourPoint[],
  opts: { sex: Sex; age: number; label: string; t0?: number; t1?: number },
) {
  const t0 = opts.t0 ?? 0;
  const t1 = opts.t1 ?? measures.durationSec;
  const dur = Math.max(0, t1 - t0);
  const voiced = f0Contour.filter((p) => p.t >= t0 && p.t <= t1);
  const f0s = voiced.map((p) => p.v);
  const med = median(f0s);
  const nPulses = f0s.length;
  const nPeriods = Math.max(0, nPulses - 1);
  let breaks = 0;
  let breakDur = 0;
  const meanP = measures.f0Mean ? 1 / measures.f0Mean : 0.005;
  for (let i = 1; i < voiced.length; i++) {
    const dt = voiced[i]!.t - voiced[i - 1]!.t;
    if (dt > 1.25 * meanP * 4) {
      breaks++;
      breakDur += dt;
    }
  }
  const degree = dur > 0 ? (breakDur / dur) * 100 : 0;
  const jitterAbs =
    measures.jitterLocal != null && measures.f0Mean
      ? (measures.jitterLocal / 100) * (1 / measures.f0Mean)
      : null;
  const jitterDdp = measures.jitterRap != null ? measures.jitterRap * 3 : null;
  const shimmerDb =
    measures.shimmerLocal != null ? 20 * Math.log10(1 + measures.shimmerLocal / 100) : null;
  const shimmerDda = measures.shimmerApq3 != null ? measures.shimmerApq3 * 3 : null;
  const band = indianSettings(opts.sex, opts.age);

  return `Phonometrix Voice report
Sound: ${opts.label}
Aligned to Praat 7.0.01 Pulses → Voice report (in-browser YIN / LPC — not bit-matched)

Time range of selection: ${t0.toFixed(6)} – ${t1.toFixed(6)} seconds
   Duration: ${dur.toFixed(6)} seconds

Pitch:
   Median pitch: ${n(med, 3, "Hz")}
   Mean pitch: ${n(measures.f0Mean, 3, "Hz")}
   Minimum pitch: ${n(measures.f0Min, 3, "Hz")}
   Maximum pitch: ${n(measures.f0Max, 3, "Hz")}
   Standard deviation: ${n(measures.f0Sd, 3, "Hz")}

Pulses:
   Number of pulses: ${nPulses}
   Number of periods: ${nPeriods}
   Number of voice breaks: ${breaks}
   Degree of voice breaks: ${degree.toFixed(3)}%  ( ${n(breakDur, 6, "seconds")} / ${n(dur, 6, "seconds")} )

Voicing:
   Fraction of locally unvoiced frames: ${n(
     measures.durationSec > 0 ? 100 - (nPulses / Math.max(1, measures.durationSec / 0.01)) * 100 : null,
     3,
     "%",
   )}

Jitter:
   Jitter (local): ${n(measures.jitterLocal, 3, "%")}
   Jitter (local, absolute): ${n(jitterAbs, 9, "seconds")}
   Jitter (rap): ${n(measures.jitterRap, 3, "%")}
   Jitter (ppq5): ${n(measures.jitterPpq5, 3, "%")}
   Jitter (ddp): ${n(jitterDdp, 3, "%")}

Shimmer:
   Shimmer (local): ${n(measures.shimmerLocal, 3, "%")}
   Shimmer (local, dB): ${n(shimmerDb, 3, "dB")}
   Shimmer (apq3): ${n(measures.shimmerApq3, 3, "%")}
   Shimmer (apq5): ${n(measures.shimmerApq5, 3, "%")}
   Shimmer (dda): ${n(shimmerDda, 3, "%")}

Harmonicity of the voiced parts only:
   Mean HNR: ${n(measures.hnr, 3, "dB")}
   Mean NHR: ${n(measures.nhr, 6, "")}

Formants (LPC, max ${band.maxFormant} Hz · ${band.label}):
   F1: ${n(measures.f1, 0, "Hz")}
   F2: ${n(measures.f2, 0, "Hz")}
   F3: ${n(measures.f3, 0, "Hz")}
   F4: ${n(measures.f4, 0, "Hz")}

Intensity:
   Mean: ${n(measures.intensityMean, 2, "dB")}
   Maximum: ${n(measures.intensityMax, 2, "dB")}

Indian working range (${band.label}):
   Pitch floor…ceiling used: ${band.fMin}–${band.fMax} Hz
   Adult clinic F0 band: female 190–230 Hz · male 110–150 Hz
   Path flags (MDVP-style, use as prompts only): jitter local > 1.04% · RAP > 0.68% · shimmer local > 3.81%

Phonometrix is independent software. Quote these as Phonometrix measures, never as Praat output.
`;
}
