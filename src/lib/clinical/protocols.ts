import type { Protocol, RecordingTask } from "@/lib/types";

export const TASK_META: Record<RecordingTask, { label: string; prompt: string; minSec: number; icon: string }> = {
  "sustained-a": { label: "Sustained /aː/", prompt: "Sustain /aː/ at habitual pitch for at least 4 seconds.", minSec: 3, icon: "A" },
  "sustained-i": { label: "Sustained /iː/", prompt: "Sustain /iː/ at comfortable pitch for at least 4 seconds.", minSec: 3, icon: "I" },
  "sustained-u": { label: "Sustained /uː/", prompt: "Sustain /uː/ at comfortable pitch for at least 4 seconds.", minSec: 3, icon: "U" },
  mpt: { label: "Maximum phonation time", prompt: "Sustain /aː/ as long as possible on one breath.", minSec: 2, icon: "MPT" },
  "s-prolong": { label: "Maximum /s/", prompt: "Sustain a voiceless /s/ as long as possible.", minSec: 2, icon: "s" },
  "z-prolong": { label: "Maximum /z/", prompt: "Sustain voiced /z/ as long as possible.", minSec: 2, icon: "z" },
  "pitch-glide": { label: "Pitch glide", prompt: "Glide from lowest to highest on /iː/.", minSec: 3, icon: "G" },
  "capev-sentences": { label: "CAPE-V sentences", prompt: "Read the six CAPE-V sentences.", minSec: 8, icon: "Cv" },
  spontaneous: { label: "Spontaneous speech", prompt: "Speak for 20–30 seconds about a typical day.", minSec: 12, icon: "Sp" },
  reading: { label: "Reading passage", prompt: "Read the passage in your primary language.", minSec: 15, icon: "Rd" },
  singing: { label: "Sung sample", prompt: "Sing a familiar scale or short ālāp / sargam.", minSec: 6, icon: "Sg" },
  cough: { label: "Vegetative cough", prompt: "A strong, natural cough.", minSec: 0.4, icon: "Kh" },
  other: { label: "Free recording", prompt: "Record any clinical sample.", minSec: 1, icon: "•" },
};

export const PROTOCOLS: Protocol[] = [
  { id: "voice-battery", name: "Standard voice battery", short: "Clinic workhorse", duration: "8–12 min", tasks: ["sustained-a", "mpt", "s-prolong", "z-prolong", "capev-sentences", "reading", "spontaneous"], description: "Sustained vowel, MPT, s/z, CAPE-V sentences, reading and spontaneous speech.", studentTip: "Record the sustained /aː/ twice. Analyse the more stable token.", inspiredBy: "Dr. Speech + AIISH Mysore battery" },
  { id: "praat-core", name: "Praat core acoustics", short: "Perturbation set", duration: "3 min", tasks: ["sustained-a", "sustained-i", "sustained-u"], description: "Three corner vowels at habitual pitch.", studentTip: "If jitter is high but CPP is preserved, suspect a short or unsteady vowel.", inspiredBy: "Praat Voice report" },
  { id: "puberphonia", name: "Puberphonia work-up", short: "Mutational falsetto", duration: "7 min", tasks: ["sustained-a", "spontaneous", "cough", "pitch-glide", "reading"], description: "Contrast speaking F0 with vegetative cough.", studentTip: "Document cough F0 vs speech F0 before therapy.", inspiredBy: "Indian SLP clinic pathway" },
];

export function protocolById(id: string): Protocol {
  return PROTOCOLS.find((p) => p.id === id) ?? PROTOCOLS[0]!;
}
