/** In-place radix-2 FFT. n must be a power of 2. */
export function fft(re: Float32Array, im: Float32Array) {
  const n = re.length;
  let j = 0;
  for (let i = 0; i < n; i++) {
    if (i < j) {
      const tr = re[j]!;
      re[j] = re[i]!;
      re[i] = tr;
      const ti = im[j]!;
      im[j] = im[i]!;
      im[i] = ti;
    }
    let m = n >> 1;
    while (m >= 1 && j >= m) {
      j -= m;
      m >>= 1;
    }
    j += m;
  }
  for (let size = 2; size <= n; size <<= 1) {
    const half = size >> 1;
    const step = (-2 * Math.PI) / size;
    for (let i = 0; i < n; i += size) {
      for (let k = 0; k < half; k++) {
        const angle = step * k;
        const wr = Math.cos(angle);
        const wi = Math.sin(angle);
        const ir = re[i + k + half]!;
        const ii = im[i + k + half]!;
        const tr = wr * ir - wi * ii;
        const ti = wr * ii + wi * ir;
        re[i + k + half] = re[i + k]! - tr;
        im[i + k + half] = im[i + k]! - ti;
        re[i + k] += tr;
        im[i + k] += ti;
      }
    }
  }
}

export function nextPow2(n: number) {
  let p = 1;
  while (p < n) p <<= 1;
  return p;
}
