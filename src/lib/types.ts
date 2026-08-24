export type Sex = "female" | "male" | "other";
export type LanguageCode = "en" | "hi" | "kn" | "ta" | "te" | "ml" | "mr" | "bn" | "gu" | "pa" | "ur";
export type ClinicianRole = "slp" | "student" | "faculty";
export type DiagnosisCategory = "organic" | "functional" | "neurological" | "psychogenic" | "normal" | "pending";
export type RecordingTask =
  | "sustained-a" | "sustained-i" | "sustained-u" | "mpt" | "s-prolong" | "z-prolong"
  | "pitch-glide" | "capev-sentences" | "spontaneous" | "reading" | "singing" | "cough" | "other";
export type QualityBand = "good" | "fair" | "poor";
export type MeasureStatus = "within" | "borderline" | "outside" | "na";

export interface ClinicProfile {
  name: string; clinician: string; credentials: string; college: string;
  city: string; state: string; role: ClinicianRole;
}
export interface Patient {
  id: string; mrn: string; name: string; age: number; sex: Sex; occupation: string;
  city: string; state: string; languages: LanguageCode[]; primaryLanguage: LanguageCode;
  phone?: string; referredBy?: string; diagnosis: string; diagnosisCategory: DiagnosisCategory;
  chiefComplaint: string; vocalHistory: string; medicalHistory: string;
  createdAt: string; updatedAt: string; isDemo?: boolean;
}
export interface AcousticMeasures {
  durationSec: number; sampleRate: number;
  f0Mean: number | null; f0Min: number | null; f0Max: number | null; f0Sd: number | null; f0Range: number | null;
  jitterLocal: number | null; jitterRap: number | null; jitterPpq5: number | null;
  shimmerLocal: number | null; shimmerApq3: number | null; shimmerApq5: number | null;
  hnr: number | null; nhr: number | null; cpp: number | null;
  intensityMean: number | null; intensityMax: number | null; intensitySd: number | null;
  f1: number | null; f2: number | null; f3: number | null; f4: number | null;
  mptSec?: number | null; szRatio?: number | null;
  clipped: boolean; snrEst: number | null; quality: QualityBand; qualityNotes: string[];
}
export interface ContourPoint { t: number; v: number; }
export interface Recording {
  id: string; patientId: string; protocolId: string; task: RecordingTask; label: string;
  language: LanguageCode; createdAt: string; durationSec: number; sampleRate: number;
  hasAudio: boolean; isDemo?: boolean; quality: QualityBand; measures: AcousticMeasures;
  f0Contour: ContourPoint[]; intensityContour: ContourPoint[]; notes?: string;
}
export interface Assessment {
  id: string; patientId: string; type: "grbas" | "cape-v" | "vhi-30" | "vhi-10" | "rsi" | "vrqol";
  createdAt: string; scores: Record<string, number>; extra?: Record<string, string>; notes?: string; ratedBy?: string;
}
export interface SessionNote {
  id: string; patientId: string; createdAt: string; title: string; body: string; type: "eval" | "therapy" | "followup";
}
export interface TherapyGoal {
  id: string; patientId: string; goal: string; target: string; status: "active" | "met" | "discontinued"; baseline?: string; current?: string;
}
export interface Protocol {
  id: string; name: string; short: string; duration: string; tasks: RecordingTask[];
  description: string; studentTip: string; inspiredBy: string;
}
