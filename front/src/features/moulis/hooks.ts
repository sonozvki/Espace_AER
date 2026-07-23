import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchModules, fetchProjects, fetchGroups, fetchGroupDetail, fetchGroupTrend, triggerAll, triggerGroup } from "./api";

export function useMoulisModules() {
  return useQuery({
    queryKey: ["moulis", "modules"],
    queryFn: fetchModules,
    staleTime: 10 * 60 * 1000,
  });
}

export function useMoulisProjects(module: string | null) {
  return useQuery({
    queryKey: ["moulis", "projects", module],
    queryFn: () => fetchProjects(module!),
    enabled: !!module,
    staleTime: 10 * 60 * 1000,
  });
}

export function useMoulisGroups(module: string | null, project: string | null) {
  return useQuery({
    queryKey: ["moulis", "groups", module, project],
    queryFn: () => fetchGroups(module!, project!),
    enabled: !!module && !!project,
    staleTime: 2 * 60 * 1000,
  });
}

export function useMoulisGroupDetail(module: string | null, project: string | null, group: string | null) {
  return useQuery({
    queryKey: ["moulis", "detail", module, project, group],
    queryFn: () => fetchGroupDetail(module!, project!, group!),
    enabled: !!module && !!project && !!group,
    staleTime: 2 * 60 * 1000,
  });
}

export function useMoulisGroupTrend(module: string | null, project: string | null, group: string | null) {
  return useQuery({
    queryKey: ["moulis", "trend", module, project, group],
    queryFn: () => fetchGroupTrend(module!, project!, group!),
    enabled: !!module && !!project && !!group,
    staleTime: 5 * 60 * 1000,
  });
}

export function useTriggerAll(module: string, project: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => triggerAll(module, project),
    onSuccess: () => {
      setTimeout(() => qc.invalidateQueries({ queryKey: ["moulis", "groups", module, project] }), 3000);
    },
  });
}

export function useTriggerGroup(module: string, project: string, group: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => triggerGroup(module, project, group),
    onSuccess: () => {
      setTimeout(() => qc.invalidateQueries({ queryKey: ["moulis", "groups", module, project] }), 3000);
    },
  });
}
