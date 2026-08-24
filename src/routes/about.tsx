import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/about")({ component: AboutPage });

function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8 space-y-6">
      <div>
        <p className="text-[11px] uppercase tracking-[0.2em] text-primary">Phonometrix 1.0</p>
        <h1 className="font-display text-4xl mt-1">A new voice laboratory</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Phonometrix is independent software for speech-language pathologists and student
          clinicians in India. It is not Praat, not Speech Analyzer, and not affiliated with
          the University of Amsterdam or SIL International.
        </p>
      </div>
      <section className="rounded-2xl border border-border bg-card p-5 space-y-3 text-sm leading-relaxed">
        <h2 className="font-display text-xl">What it takes from Praat 7</h2>
        <p className="text-muted-foreground">
          Praat 7.0.01 (Boersma, Weenink &amp; Shchupak) is the reference method set: spectrogram,
          pitch, formants, intensity, jitter, shimmer, HNR, pulses, and a Voice report.
          Phonometrix re-implements those kinds of measures in the browser.
        </p>
        <p className="text-muted-foreground">
          Numbers will not bit-match a particular Praat version. Quote Phonometrix as Phonometrix — never as “Praat output.”
        </p>
      </section>
      <section className="rounded-2xl border border-border bg-card p-5 space-y-3 text-sm leading-relaxed">
        <h2 className="font-display text-xl">What is Indian about it</h2>
        <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
          <li>Adult working ranges for Indian clinic F0 (female ~190–230 Hz, male ~110–150 Hz).</li>
          <li>Elicitation in Hindi, Kannada, Tamil, Telugu, Malayalam, Marathi, Bengali, Gujarati, Punjabi, Urdu, and English.</li>
          <li>Standard voice battery used in Indian SLP colleges.</li>
          <li>On-device storage — no cloud EHR required.</li>
          <li>Student mode: norms labelled as working ranges, not diagnosis.</li>
        </ul>
      </section>
      <section className="rounded-2xl border border-border bg-card p-5 space-y-3 text-sm leading-relaxed">
        <h2 className="font-display text-xl">What it does not do</h2>
        <p className="text-muted-foreground">
          No articulatory synthesis, no OT learning, no Praat scripting, no cochleagram.
          Not a medical device. Persistent dysphonia still needs ENT examination.
        </p>
      </section>
      <Button asChild>
        <Link to="/patients/new">Create a participant</Link>
      </Button>
    </div>
  );
}
