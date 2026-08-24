import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Assessment, ClinicProfile, Patient, Recording, SessionNote, TherapyGoal } from "@/lib/types";
import { DEFAULT_CLINIC, SEED_ASSESSMENTS, SEED_GOALS, SEED_NOTES, SEED_PATIENTS, SEED_RECORDINGS } from "@/lib/clinical/seed";
import { uid } from "@/lib/utils";

interface ClinicState {
  hydrated: boolean;
  clinic: ClinicProfile;
  patients: Patient[];
  recordings: Recording[];
  assessments: Assessment[];
  notes: SessionNote[];
  goals: TherapyGoal[];
  setHydrated: () => void;
  updateClinic: (p: Partial<ClinicProfile>) => void;
  addPatient: (p: Omit<Patient, "id" | "createdAt" | "updatedAt" | "mrn"> & { mrn?: string }) => string;
  updatePatient: (id: string, p: Partial<Patient>) => void;
  removePatient: (id: string) => void;
  addRecording: (r: Omit<Recording, "id" | "createdAt"> & { id?: string; createdAt?: string }) => string;
  addAssessment: (a: Omit<Assessment, "id" | "createdAt">) => string;
  addNote: (n: Omit<SessionNote, "id" | "createdAt">) => string;
  addGoal: (g: Omit<TherapyGoal, "id">) => string;
  updateGoal: (id: string, g: Partial<TherapyGoal>) => void;
  resetDemo: () => void;
}

const demoSlice = () => ({
  clinic: DEFAULT_CLINIC,
  patients: SEED_PATIENTS,
  recordings: SEED_RECORDINGS,
  assessments: SEED_ASSESSMENTS,
  notes: SEED_NOTES,
  goals: SEED_GOALS,
});

export const useClinicStore = create<ClinicState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      ...demoSlice(),
      setHydrated: () => set({ hydrated: true }),
      updateClinic: (p) => set({ clinic: { ...get().clinic, ...p } }),
      addPatient: (p) => {
        const id = uid("p");
        const now = new Date().toISOString();
        const patient: Patient = { ...p, id, mrn: p.mrn || `PMX-${Math.floor(1000 + Math.random() * 9000)}`, createdAt: now, updatedAt: now };
        set({ patients: [patient, ...get().patients] });
        return id;
      },
      updatePatient: (id, p) => set({ patients: get().patients.map((x) => (x.id === id ? { ...x, ...p, updatedAt: new Date().toISOString() } : x)) }),
      removePatient: (id) => set({
        patients: get().patients.filter((p) => p.id !== id),
        recordings: get().recordings.filter((r) => r.patientId !== id),
        assessments: get().assessments.filter((a) => a.patientId !== id),
        notes: get().notes.filter((n) => n.patientId !== id),
        goals: get().goals.filter((g) => g.patientId !== id),
      }),
      addRecording: (r) => {
        const id = r.id ?? uid("r");
        const rec: Recording = { ...r, id, createdAt: r.createdAt ?? new Date().toISOString() };
        set({ recordings: [rec, ...get().recordings] });
        return id;
      },
      addAssessment: (a) => { const id = uid("a"); set({ assessments: [{ ...a, id, createdAt: new Date().toISOString() }, ...get().assessments] }); return id; },
      addNote: (n) => { const id = uid("n"); set({ notes: [{ ...n, id, createdAt: new Date().toISOString() }, ...get().notes] }); return id; },
      addGoal: (g) => { const id = uid("g"); set({ goals: [...get().goals, { ...g, id }] }); return id; },
      updateGoal: (id, g) => set({ goals: get().goals.map((x) => (x.id === id ? { ...x, ...g } : x)) }),
      resetDemo: () => set(demoSlice()),
    }),
    {
      name: "phonometrix-clinic-v1",
      partialize: (s) => ({ clinic: s.clinic, patients: s.patients, recordings: s.recordings, assessments: s.assessments, notes: s.notes, goals: s.goals }),
      onRehydrateStorage: () => (state) => {
        if (state && state.patients.length === 0) state.resetDemo();
        state?.setHydrated();
      },
    },
  ),
);

export function usePatient(id: string | undefined) {
  return useClinicStore((s) => s.patients.find((p) => p.id === id));
}
