import { apiFetch } from "@/lib/api";
import type { Guard } from "./types";

export const guardsApi = {
  list: () => apiFetch<Guard[]>("/api/guards"),

  generateYear: (year: number) =>
    apiFetch<{ created: number }>("/api/guards/generate", {
      method: "POST",
      body: JSON.stringify({ year }),
    }),

  assign: (id: number, guardAerId: number | null) =>
    apiFetch<Guard>(`/api/guards/${id}/assign`, {
      method: "PATCH",
      body: JSON.stringify({ guardAerId }),
    }),

  addAbsent: (id: number) =>
    apiFetch<Guard>(`/api/guards/${id}/absent`, { method: "POST" }),

  removeAbsent: (id: number) =>
    apiFetch<Guard>(`/api/guards/${id}/absent`, { method: "DELETE" }),
};
