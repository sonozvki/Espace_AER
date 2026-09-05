import { apiFetch } from "@/lib/api";

export type IntraStudent = {
  login: string;
  firstName: string;
  lastName: string;
  semester: number | null;
  gpa: number | null;
  credits: number | null;
  netsoulHours: number | null;
};

export type IntraModuleNote = {
  codemodule: string;
  codeinstance: string | null;
  title: string;
  grade: string | null;
  credits: number | null;
  note: number | null;
  scolaryear: number | null;
  semester: number | null;
  cycle: string | null;
  begin: string | null;
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
  promos: (location = "FR/NCE") =>
    apiFetch<string[]>(`/api/epitech/intra/promos?${new URLSearchParams({ location })}`),

  students: (promo: string, location = "FR/NCE") =>
    apiFetch<IntraStudent[]>(`/api/epitech/intra/students?${new URLSearchParams({ promo, location })}`),

  studentNotes: (login: string) =>
    apiFetch<IntraStudentNotes>(`/api/epitech/intra/student/${encodeURIComponent(login)}/notes`),
};
