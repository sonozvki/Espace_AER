import { apiFetch, BASE_URL } from "@/lib/api";
import type { GroupSummary, GroupDetail, TriggerParams } from "./types";

export const fetchModules = () => apiFetch<string[]>("/api/moulis/modules");

export const fetchProjects = (module: string) =>
  apiFetch<string[]>(`/api/moulis/projects?module=${encodeURIComponent(module)}`);

export const fetchGroups = (module: string, project: string) =>
  apiFetch<GroupSummary[]>(
    `/api/moulis/groups?module=${encodeURIComponent(module)}&project=${encodeURIComponent(project)}`
  );

export const fetchGroupDetail = (module: string, project: string, group: string) =>
  apiFetch<GroupDetail>(
    `/api/moulis/groups/${encodeURIComponent(group)}?module=${encodeURIComponent(module)}&project=${encodeURIComponent(project)}`
  );

export const fetchGroupTrend = (module: string, project: string, group: string) =>
  apiFetch<import("./types").BuildTrend[]>(
    `/api/moulis/groups/${encodeURIComponent(group)}/trend?module=${encodeURIComponent(module)}&project=${encodeURIComponent(project)}`
  );

/** Récupère un fichier généré par un build (proxy back → Jenkins). */
export async function fetchArtifact(
  module: string, project: string, group: string, build: number, path: string
): Promise<Blob> {
  const qs = new URLSearchParams({ module, project, build: String(build), path });
  const res = await fetch(
    `${BASE_URL}/api/moulis/groups/${encodeURIComponent(group)}/artifact?${qs}`,
    { credentials: "include" }
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.blob();
}

const triggerInit = (params: TriggerParams): RequestInit => ({
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(params),
});

export const triggerAll = (module: string, project: string, params: TriggerParams) =>
  apiFetch<{ triggered: boolean }>(`/api/moulis/trigger?module=${encodeURIComponent(module)}&project=${encodeURIComponent(project)}`, triggerInit(params));

export const triggerGroup = (module: string, project: string, group: string, params: TriggerParams) =>
  apiFetch<{ triggered: boolean }>(`/api/moulis/trigger/${encodeURIComponent(group)}?module=${encodeURIComponent(module)}&project=${encodeURIComponent(project)}`, triggerInit(params));
