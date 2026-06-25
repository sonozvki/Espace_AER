import { apiFetch } from "@/lib/api";

export type WhitelistEntry = {
  id: number;
  email: string;
  role: "ADMIN";
  createdAt: string;
};

export const whitelistApi = {
  list: () => apiFetch<WhitelistEntry[]>("/auth/whitelist"),
  add: (email: string) =>
    apiFetch<WhitelistEntry>("/auth/whitelist", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
  remove: (email: string) =>
    apiFetch<void>(`/auth/whitelist/${encodeURIComponent(email)}`, { method: "DELETE" }),
};
