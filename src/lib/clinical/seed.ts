import type { Assessment, ClinicProfile, Patient, Recording, SessionNote, TherapyGoal, AcousticMeasures } from "@/lib/types";

function contour(mean: number, n: number, wobble: number, start = 0.2, step = 0.01) {
  return Array.from({ length: n }, (_, i) => ({
    t: start + i * step,
    v: mean + Math.sin(i * 0.35) * wobble + (i % 7) * wobble * 0.04,
  }));
}

function vowelMeasures(p: Partial<AcousticMeasures> & { durationSec: number }): AcousticMeasures {
  return {
    sampleRate: 22050,
    f0Mean: null, f0Min: null, f0Max: null, f0Sd: null, f0Range: null,
    jitterLocal: null, jitterRap: null, jitterPpq5: null,
    shimmerLocal: null, shimmerApq3: null, shimmerApq5: null,
    hnr: null, nhr: null, cpp: null,
    intensityMean: -18, intensityMax: -12, intensitySd: 1.4,
    f1: null, f2: null, f3: null, f4: null,
    clipped: false, snrEst: 28, quality: "good", qualityNotes: [],
    ...p,
  };
}

export const DEFAULT_CLINIC: ClinicProfile = {
  name: "Phonometrix Teaching Clinic",
  clinician: "Student Clinician",
  credentials: "MASLP intern",
  college: "Speech and Hearing, Bengaluru",
  city: "Bengaluru",
  state: "Karnataka",
  role: "student",
};

export const SEED_PATIENTS: Patient[] = [
  {
    id: "p-meera", mrn: "PMX-1042", name: "Meera Krishnan", age: 34, sex: "female",
    occupation: "Government school teacher", city: "Bengaluru", state: "Karnataka",
    languages: ["kn", "en", "ta"], primaryLanguage: "kn", referredBy: "ENT — St. John's",
    diagnosis: "Bilateral vocal nodules", diagnosisCategory: "organic",
    chiefComplaint: "Hoarse, tired voice by third period.",
    vocalHistory: "Eight years of 6–7 periods/day, no amplification.",
    medicalHistory: "Allergic rhinitis in monsoon. Non-smoker.",
    createdAt: "2026-06-12T09:10:00.000Z", updatedAt: "2026-08-18T11:00:00.000Z", isDemo: true,
  },
  {
    id: "p-rohan", mrn: "PMX-1188", name: "Rohan Deshpande", age: 21, sex: "male",
    occupation: "Engineering student", city: "Pune", state: "Maharashtra",
    languages: ["mr", "en", "hi"], primaryLanguage: "mr", referredBy: "ENT clinic",
    diagnosis: "Puberphonia (mutational falsetto)", diagnosisCategory: "functional",
    chiefComplaint: "Voice has not dropped. Avoids viva voce.",
    vocalHistory: "Speaks in a high register since Class 10. Cough is lower.",
    medicalHistory: "Endocrine work-up normal. Non-smoker.",
    createdAt: "2026-07-02T08:00:00.000Z", updatedAt: "2026-08-20T10:30:00.000Z", isDemo: true,
  },
];

export const SEED_RECORDINGS: Recording[] = [
  {
    id: "r-meera-a", patientId: "p-meera", protocolId: "voice-battery", task: "sustained-a",
    label: "Sustained /aː/ — eval 1", language: "kn", createdAt: "2026-06-12T09:22:00.000Z",
    durationSec: 4.3, sampleRate: 22050, hasAudio: true, isDemo: true, quality: "good",
    measures: vowelMeasures({
      durationSec: 4.3, f0Mean: 196, f0Min: 184, f0Max: 208, f0Sd: 8.2, f0Range: 24,
      jitterLocal: 1.84, jitterRap: 1.12, jitterPpq5: 1.21, shimmerLocal: 5.62, shimmerApq3: 4.8, shimmerApq5: 6.1,
      hnr: 13.8, nhr: 0.24, cpp: 8.2, f1: 720, f2: 1180, f3: 2680, f4: 3550, quality: "good",
    }),
    f0Contour: contour(196, 180, 7), intensityContour: contour(-17, 180, 1.6),
    notes: "Mid-vowel window used. Mild roughness audible.",
  },
  {
    id: "r-rohan-a", patientId: "p-rohan", protocolId: "puberphonia", task: "sustained-a",
    label: "Speaking /aː/ (habitual)", language: "mr", createdAt: "2026-07-02T08:18:00.000Z",
    durationSec: 5.1, sampleRate: 22050, hasAudio: true, isDemo: true, quality: "good",
    measures: vowelMeasures({
      durationSec: 5.1, f0Mean: 218, f0Min: 209, f0Max: 226, f0Sd: 3.4, f0Range: 17,
      jitterLocal: 0.38, jitterRap: 0.22, jitterPpq5: 0.25, shimmerLocal: 1.92, shimmerApq3: 1.4, shimmerApq5: 1.7,
      hnr: 22.1, nhr: 0.07, cpp: 16.4, f1: 690, f2: 1240, f3: 2590, quality: "good",
    }),
    f0Contour: contour(218, 200, 2.4), intensityContour: contour(-19, 200, 0.8),
    notes: "Habitual falsetto. Periodicity is excellent.",
  },
];

export const SEED_ASSESSMENTS: Assessment[] = [];
export const SEED_NOTES: SessionNote[] = [];
export const SEED_GOALS: TherapyGoal[] = [];
