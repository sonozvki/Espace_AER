import { apiFetch } from "@/lib/api";
import type { Absence } from "./types";

export const absencesApi = {
  list: () => apiFetch<Absence[]>("/api/absences"),

  declare: (date: string) =>
    apiFetch<Absence>("/api/absences", {
      method: "POST",
      body: JSON.stringify({ date }),
    }),

  cancel: (id: number) =>
    apiFetch<void>(`/api/absences/${id}`, { method: "DELETE" }),
};
