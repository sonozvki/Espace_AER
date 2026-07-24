import { useQuery } from "@tanstack/react-query";
import { fetchModules, fetchProjects, fetchGroups, fetchGroupDetail, fetchGroupTrend } from "./api";

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

export function useMoulisGroups(module: string | null, project: string | null, forcePollUntil?: number | null) {
  return useQuery({
    queryKey: ["moulis", "groups", module, project],
    queryFn: () => fetchGroups(module!, project!),
    enabled: !!module && !!project,
    staleTime: 0,
    refetchInterval: (query) => {
      if (forcePollUntil && Date.now() < forcePollUntil) return 5_000;
      const data = query.state.data;
      if (Array.isArray(data) && data.some((g) => g.building)) return 5_000;
      return false;
    },
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
