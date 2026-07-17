import { apiFetch } from "@/lib/api";

export const accountApi = {
  setEpitechToken: (token: string) =>
    apiFetch<{ hasEpitechToken: boolean }>("/auth/epitech-token", {
      method: "PUT",
      body: JSON.stringify({ token }),
    }),

  clearEpitechToken: () =>
    apiFetch<{ hasEpitechToken: boolean }>("/auth/epitech-token", { method: "DELETE" }),
};
