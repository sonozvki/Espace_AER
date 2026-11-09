import { apiFetch } from "@/lib/api";

export type SchoolYearInfo = { year: number; startDate: string };

export type SchoolYearState = {
  current: SchoolYearInfo;
  years: SchoolYearInfo[];
  /** Nombre de générations d'AER actives en même temps */
  generations: number;
};

/** Rôle d'un AER pour l'année scolaire courante */
export type AerRole = "tek2" | "tek3" | "tek5" | "ancien";

export type AerMember = {
  id: number;
  name: string;
  email: string;
  /** Année civile d'arrivée en tek2 (février) */
  aerSince: number | null;
  /** Année scolaire où l'AER est tek5 */
  tek5Year: number | null;
  role: AerRole;
  active: boolean;
  canTakeGuards: boolean;
};

export type RolloverPreview = {
  from: number;
  to: number;
  leavingAers: { id: number; name: string; email: string; role: AerRole }[];
  promoShifts: { from: string; to: string; count: number }[];
};

/** 2026 → "2026-2027" */
export function yearLabel(year: number) {
  return `${year}-${year + 1}`;
}

export const schoolYearApi = {
  get: () => apiFetch<SchoolYearState>("/api/school-year"),
  aers: () => apiFetch<AerMember[]>("/api/school-year/aers"),
  setRole: (id: number, role: AerRole) =>
    apiFetch<AerMember>(`/api/school-year/aers/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    }),
  preview: () => apiFetch<RolloverPreview>("/api/school-year/rollover/preview"),
  rollover: (startDate: string) =>
    apiFetch<RolloverPreview>("/api/school-year/rollover", {
      method: "POST",
      body: JSON.stringify({ startDate }),
    }),
};
