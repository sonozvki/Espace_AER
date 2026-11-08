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

const yearQs = (year?: number) => (year ? `?year=${year}` : "");

export const statsApi = {
  guards: (year?: number) => apiFetch<GuardStat[]>(`/api/stats/guards${yearQs(year)}`),
  netsoul: (year?: number) => apiFetch<AerNetsoulStat[]>(`/api/stats/netsoul${yearQs(year)}`),
  activities: (year?: number) => apiFetch<AerActivityStat[]>(`/api/stats/activities${yearQs(year)}`),
};
