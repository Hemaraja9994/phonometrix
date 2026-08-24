/** Source-filter /a:/ so demo tokens have a real spectrogram and pulses. */
export function synthVowel(opts: {
  f0: number;
  duration: number;
  f1?: number;
  f2?: number;
  f3?: number;
  sr?: number;
  breathy?: number;
}): { samples: Float32Array; sampleRate: number } {
  const sr = opts.sr ?? 16000;
  const n = Math.max(1, Math.floor(opts.duration * sr));
  const samples = new Float32Array(n);
  const f0 = Math.max(70, opts.f0);
  const poles = [
    { f: opts.f1 ?? 730, bw: 80 },
    { f: opts.f2 ?? 1090, bw: 90 },
    { f: opts.f3 ?? 2440, bw: 120 },
  ].map((p) => {
    const r = Math.exp((-Math.PI * p.bw) / sr);
    return { a1: 2 * r * Math.cos((2 * Math.PI * p.f) / sr), a2: -(r * r), y1: 0, y2: 0 };
  });
  const period = sr / f0;
  let phase = 0;
  const breathy = opts.breathy ?? 0.04;
  for (let i = 0; i < n; i++) {
    phase += 1;
    let src = 0;
    if (phase >= period) {
      phase -= period;
      src = 1 - phase / period;
    }
    src += (Math.random() * 2 - 1) * breathy;
    let y = src;
    for (const p of poles) {
      const out = y + p.a1 * p.y1 + p.a2 * p.y2;
      p.y2 = p.y1;
      p.y1 = out;
      y = out;
    }
    const env = i < sr * 0.04 ? i / (sr * 0.04) : i > n - sr * 0.08 ? (n - i) / (sr * 0.08) : 1;
    samples[i] = Math.max(-0.95, Math.min(0.95, y * 0.012 * env));
  }
  return { samples, sampleRate: sr };
}

export function encodeWav(samples: Float32Array, sampleRate: number): Blob {
  const n = samples.length;
  const buf = new ArrayBuffer(44 + n * 2);
  const v = new DataView(buf);
  const w = (o: number, s: string) => {
    for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i));
  };
  w(0, "RIFF");
  v.setUint32(4, 36 + n * 2, true);
  w(8, "WAVE");
  w(12, "fmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, sampleRate, true);
  v.setUint32(28, sampleRate * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  w(36, "data");
  v.setUint32(40, n * 2, true);
  for (let i = 0; i < n; i++) {
    const s = Math.max(-1, Math.min(1, samples[i] ?? 0));
    v.setInt16(44 + i * 2, (s * 32767) | 0, true);
  }
  return new Blob([buf], { type: "audio/wav" });
}
