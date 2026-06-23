import { apiFetch } from "@/lib/api";
import type { Guard } from "./types";

export const guardsApi = {
  list: () => apiFetch<Guard[]>("/guards"),

  generateYear: (year: number) =>
    apiFetch<{ created: number }>("/guards/generate", {
      method: "POST",
      body: JSON.stringify({ year }),
    }),

  assign: (id: number, aerId: number | null) =>
    apiFetch<Guard>(`/guards/${id}/assign`, {
      method: "PATCH",
      body: JSON.stringify({ aerId }),
    }),
};
