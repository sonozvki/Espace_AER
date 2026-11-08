import { apiFetch } from "@/lib/api";

export type SchoolYearInfo = { year: number; startDate: string };

export type SchoolYearState = {
  current: SchoolYearInfo;
  years: SchoolYearInfo[];
  /** Nombre de générations d'AER actives en même temps */
  generations: number;
};

export type AerGeneration = {
  id: number;
  name: string;
  email: string;
  aerSince: number | null;
  active: boolean;
};

export type RolloverPreview = {
  from: number;
  to: number;
  leavingAers: { id: number; name: string; email: string; aerSince: number | null }[];
  promoShifts: { from: string; to: string; count: number }[];
};

/** 2026 → "2026-2027" */
export function yearLabel(year: number) {
  return `${year}-${year + 1}`;
}

export const schoolYearApi = {
  get: () => apiFetch<SchoolYearState>("/api/school-year"),
  aers: () => apiFetch<AerGeneration[]>("/api/school-year/aers"),
  setGeneration: (id: number, aerSince: number) =>
    apiFetch<AerGeneration>(`/api/school-year/aers/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ aerSince }),
    }),
  preview: () => apiFetch<RolloverPreview>("/api/school-year/rollover/preview"),
  rollover: (startDate: string) =>
    apiFetch<RolloverPreview>("/api/school-year/rollover", {
      method: "POST",
      body: JSON.stringify({ startDate }),
    }),
};
