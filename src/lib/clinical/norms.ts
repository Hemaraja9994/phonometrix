import type { AcousticMeasures, Sex } from "@/lib/types";

export interface NormBand {
  key: keyof AcousticMeasures;
  label: string;
  unit: string;
  digits: number;
  group: "pitch" | "perturbation" | "spectral" | "aero" | "formant";
  student: string;
  female: { low: number; high: number; typical: string };
  male: { low: number; high: number; typical: string };
}

export const NORMS: NormBand[] = [
  { key: "f0Mean", label: "Mean F0", unit: "Hz", digits: 0, group: "pitch", student: "Indian adult females often sit 190–230 Hz; males 110–150 Hz.", female: { low: 165, high: 255, typical: "~210 Hz" }, male: { low: 85, high: 180, typical: "~125 Hz" } },
  { key: "jitterLocal", label: "Jitter local", unit: "%", digits: 2, group: "perturbation", student: "Praat threshold often cited as 1.04%.", female: { low: 0, high: 1.04, typical: "< 0.6%" }, male: { low: 0, high: 1.04, typical: "< 0.5%" } },
  { key: "shimmerLocal", label: "Shimmer local", unit: "%", digits: 2, group: "perturbation", student: "Praat threshold ~3.81%.", female: { low: 0, high: 3.81, typical: "< 2.5%" }, male: { low: 0, high: 3.81, typical: "< 2.5%" } },
  { key: "hnr", label: "HNR", unit: "dB", digits: 1, group: "spectral", student: "Typical sustained vowels > 20 dB.", female: { low: 18, high: 40, typical: "> 20 dB" }, male: { low: 18, high: 40, typical: "> 20 dB" } },
  { key: "nhr", label: "NHR", unit: "", digits: 2, group: "spectral", student: "Typical < 0.19.", female: { low: 0, high: 0.19, typical: "< 0.15" }, male: { low: 0, high: 0.19, typical: "< 0.15" } },
  { key: "cpp", label: "CPP", unit: "dB", digits: 1, group: "spectral", student: "Use CPP when jitter/shimmer fail on severely hoarse voices.", female: { low: 10, high: 25, typical: "> 12 dB" }, male: { low: 10, high: 25, typical: "> 12 dB" } },
  { key: "mptSec", label: "MPT", unit: "s", digits: 1, group: "aero", student: "Three trials, report the longest.", female: { low: 12, high: 30, typical: "~15–20 s" }, male: { low: 15, high: 35, typical: "~20–25 s" } },
  { key: "szRatio", label: "s/z ratio", unit: "", digits: 2, group: "aero", student: "> 1.4 with a short /z/ suggests glottal incompetence.", female: { low: 0.8, high: 1.4, typical: "~1.0" }, male: { low: 0.8, high: 1.4, typical: "~1.0" } },
];

export function bandFor(sex: Sex, key: keyof AcousticMeasures) {
  const n = NORMS.find((x) => x.key === key);
  if (!n) return null;
  return sex === "male" ? n.male : n.female;
}

export function statusFor(value: number | null | undefined, sex: Sex, key: keyof AcousticMeasures): "within" | "borderline" | "outside" | "na" {
  if (value == null || Number.isNaN(value)) return "na";
  const band = bandFor(sex, key);
  if (!band) return "na";
  const span = band.high - band.low || 1;
  if (value >= band.low && value <= band.high) return "within";
  if (value >= band.low - 0.15 * span && value <= band.high + 0.15 * span) return "borderline";
  return "outside";
}

export const INDIAN_NORM_NOTES = [
  { title: "Why Western cut-offs are a starting point", body: "Most published jitter/shimmer thresholds were derived on Western adult cohorts. Treat flags as prompts to listen, not as diagnoses." },
  { title: "Puberphonia", body: "A high F0 flag in a 19-year-old male is a clinical clue. Confirm with cough, laugh and Gutzmann." },
];
