import { useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useClinicStore } from "@/lib/store";
import type { DiagnosisCategory, LanguageCode, Sex } from "@/lib/types";
import { toast } from "sonner";

const LANGS: { id: LanguageCode; label: string }[] = [
  { id: "en", label: "English" },
  { id: "hi", label: "Hindi" },
  { id: "kn", label: "Kannada" },
  { id: "ta", label: "Tamil" },
  { id: "te", label: "Telugu" },
  { id: "ml", label: "Malayalam" },
  { id: "mr", label: "Marathi" },
  { id: "bn", label: "Bengali" },
  { id: "gu", label: "Gujarati" },
  { id: "pa", label: "Punjabi" },
  { id: "ur", label: "Urdu" },
];

const field =
  "mt-1 w-full h-11 rounded-xl border border-border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring/50";
const area =
  "mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/50 min-h-[88px]";

export function NewParticipantForm({ onCreated }: { onCreated?: (id: string) => void }) {
  const addPatient = useClinicStore((s) => s.addPatient);
  const navigate = useNavigate();
  const [sex, setSex] = useState<Sex>("female");
  const [lang, setLang] = useState<LanguageCode>("en");
  const [busy, setBusy] = useState(false);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") || "").trim();
    const age = Number(fd.get("age"));
    if (!name || !age) {
      toast.error("Name and age are required.");
      return;
    }
    setBusy(true);
    const id = addPatient({
      name,
      age,
      sex,
      occupation: String(fd.get("occupation") || "\u2014"),
      city: String(fd.get("city") || ""),
      state: String(fd.get("state") || ""),
      languages: [lang],
      primaryLanguage: lang,
      phone: String(fd.get("phone") || "") || undefined,
      referredBy: String(fd.get("referredBy") || "") || undefined,
      diagnosis: String(fd.get("diagnosis") || "Pending evaluation"),
      diagnosisCategory: (String(fd.get("category") || "pending") as DiagnosisCategory),
      chiefComplaint: String(fd.get("complaint") || ""),
      vocalHistory: String(fd.get("vocalHistory") || ""),
      medicalHistory: String(fd.get("medicalHistory") || ""),
      mrn: String(fd.get("mrn") || "") || undefined,
    });
    toast.success(`${name} added to Objects.`);
    onCreated?.(id);
    void navigate({ to: "/record", search: { patient: id } });
    setBusy(false);
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <fieldset className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <legend className="text-[11px] uppercase tracking-[0.16em] text-primary px-1">Identity</legend>
        <label className="block text-sm">Full name *
          <input name="name" required className={field} placeholder="e.g. Ananya Rao" autoComplete="name" />
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <label className="block text-sm">Age (years) *
            <input name="age" type="number" required min={1} max={120} className={field} placeholder="34" />
          </label>
          <label className="block text-sm">Sex *
            <select className={field} value={sex} onChange={(e) => setSex(e.target.value as Sex)}>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other / unspecified</option>
            </select>
          </label>
          <label className="block text-sm">File / MRN
            <input name="mrn" className={field} placeholder="auto" />
          </label>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block text-sm">Occupation
            <input name="occupation" className={field} placeholder="Teacher, vocalist, BPO…" />
          </label>
          <label className="block text-sm">Phone
            <input name="phone" className={field} placeholder="optional" />
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm">City
            <input name="city" className={field} placeholder="Bengaluru" />
          </label>
          <label className="block text-sm">State
            <input name="state" className={field} placeholder="Karnataka" />
          </label>
        </div>
      </fieldset>
      <fieldset className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <legend className="text-[11px] uppercase tracking-[0.16em] text-primary px-1">Language</legend>
        <label className="block text-sm">Primary language
          <select className={field} value={lang} onChange={(e) => setLang(e.target.value as LanguageCode)}>
            {LANGS.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
          </select>
        </label>
      </fieldset>
      <fieldset className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <legend className="text-[11px] uppercase tracking-[0.16em] text-primary px-1">Clinical details</legend>
        <label className="block text-sm">Referred by
          <input name="referredBy" className={field} placeholder="ENT / self / teacher" />
        </label>
        <label className="block text-sm">Chief complaint
          <textarea name="complaint" className={area} placeholder="Hoarseness 6 weeks, worse in the evening…" />
        </label>
        <label className="block text-sm">Vocal history
          <textarea name="vocalHistory" className={area} placeholder="Onset, duration, variability, voice use, singing, teaching load…" />
        </label>
        <label className="block text-sm">Medical history
          <textarea name="medicalHistory" className={area} placeholder="GERD, thyroid, intubation, smoking, asthma, medication…" />
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block text-sm">Working diagnosis
            <input name="diagnosis" className={field} placeholder="Pending evaluation" />
          </label>
          <label className="block text-sm">Category
            <select name="category" className={field} defaultValue="pending">
              <option value="pending">Pending</option>
              <option value="organic">Organic</option>
              <option value="functional">Functional</option>
              <option value="neurological">Neurological</option>
              <option value="psychogenic">Psychogenic</option>
              <option value="normal">Within normal limits</option>
            </select>
          </label>
        </div>
      </fieldset>
      <Button type="submit" className="w-full h-12" disabled={busy}>Create participant and open recorder</Button>
      <p className="text-xs text-muted-foreground">Stored on this device only. Sex is used for F0 and perturbation working ranges (Indian adult clinic bands).</p>
    </form>
  );
}
