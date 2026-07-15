import { apiFetch } from "@/lib/api";

export type IntraStudent = {
  login: string;
  firstName: string;
  lastName: string;
  semester: number | null;
  gpa: number | null;
  credits: number | null;
};

export type IntraModuleNote = {
  codemodule: string;
  title: string;
  grade: string | null;
  credits: number | null;
  note: number | null;
  scolaryear: number | null;
};

export type IntraActivityNote = {
  title: string;
  codemodule: string;
  note: number | null;
  comment: string | null;
};

export type IntraStudentNotes = {
  modules: IntraModuleNote[];
  activities: IntraActivityNote[];
};

export const suiviApi = {
  promos: (location = "FR/NCE", year?: number) => {
    const qs = new URLSearchParams({ location });
    if (year) qs.set("year", String(year));
    return apiFetch<string[]>(`/api/epitech/intra/promos?${qs}`);
  },

  students: (promo: string, location = "FR/NCE", year?: number) => {
    const qs = new URLSearchParams({ promo, location });
    if (year) qs.set("year", String(year));
    return apiFetch<IntraStudent[]>(`/api/epitech/intra/students?${qs}`);
  },

  studentNotes: (login: string) =>
    apiFetch<IntraStudentNotes>(`/api/epitech/intra/student/${encodeURIComponent(login)}/notes`),
};
