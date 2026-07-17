import { apiFetch } from "@/lib/api";

export type GuardStat = {
  userId: number;
  name: string;
  email: string;
  count: number;
};

export type AerNetsoulStat = {
  userId: number;
  name: string;
  email: string;
  studentLogin: string;
  totalHours: number | null;
};

export type AerActivityItem = {
  title: string;
  type: string;
  moduleTitle: string;
  start: string;
};

export type AerActivityStat = {
  userId: number;
  name: string;
  email: string;
  count: number | null;
  activities: AerActivityItem[] | null;
};

export const statsApi = {
  guards: () => apiFetch<GuardStat[]>("/api/stats/guards"),
  netsoul: () => apiFetch<AerNetsoulStat[]>("/api/stats/netsoul"),
  activities: () => apiFetch<AerActivityStat[]>("/api/stats/activities"),
};
