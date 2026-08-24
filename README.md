# Phonometrix

Clinical voice laboratory for speech-language pathologists. Record, analyse, and document voice with Praat-style acoustics — on a laptop in clinic or a phone on the ward.

Install as a PWA from the browser (Add to Home Screen). Case files stay on the device. Nothing is uploaded.

## Measures

Sustained-vowel report modelled on Praat and Dr. Speech:

- F0 mean / min / max / SD
- Jitter local, RAP, PPQ5
- Shimmer local, APQ
- HNR, CPP
- Formants F1–F3 (LPC)
- Spectrogram + F0 contour
- GRBAS, CAPE-V, VHI
- MPT and s/z ratio

## Not a medical device

Numbers are browser implementations of Praat-like algorithms. They will not bit-match a particular Praat or Dr. Speech version. Persistent dysphonia needs laryngoscopy. Use this app to document, teach, and keep a case file — re-run vowels in Praat for a thesis methods section.

## Local development

```bash
npm install
npm run dev
```

```bash
npm run typecheck
npm run build
npm run preview
```

Node 22+. Production build uses the Vercel/Nitro preset already configured in Vite.

## Privacy

Recordings live in IndexedDB on the clinician’s device. Patient metadata is stored locally. No cloud EHR is required.
