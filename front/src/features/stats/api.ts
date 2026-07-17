import { apiFetch } from "@/lib/api";

export type GuardStat = {
  userId: number;
  name: string;
  email: string;
  count: number;
};

export const statsApi = {
  guards: () => apiFetch<GuardStat[]>("/api/stats/guards"),
};
