import { decodeBlob } from "@/lib/audio/dsp";
import { loadAudio } from "@/lib/audio/idb";
import { synthVowel } from "@/lib/audio/synth";
import type { Recording } from "@/lib/types";

export async function loadRecordingAudio(rec: Recording): Promise<{ samples: Float32Array; sampleRate: number; synthetic: boolean }> {
  if (rec.hasAudio) {
    const blob = await loadAudio(rec.id);
    if (blob && blob.size > 64) {
      const decoded = await decodeBlob(blob);
      return { ...decoded, synthetic: false };
    }
  }
  const f0 = rec.measures.f0Mean ?? (rec.task.includes("a") ? 180 : 150);
  const breathy = (rec.measures.hnr ?? 20) < 12 ? 0.12 : 0.035;
  const synth = synthVowel({
    f0,
    duration: Math.max(1.2, rec.durationSec || 3),
    f1: rec.measures.f1 ?? 730,
    f2: rec.measures.f2 ?? 1090,
    f3: rec.measures.f3 ?? 2440,
    breathy,
  });
  return { ...synth, synthetic: true };
}
