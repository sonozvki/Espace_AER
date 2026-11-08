import { useQuery } from "@tanstack/react-query";
import { statsApi } from "./api";

// year absent = année scolaire courante
export function useGuardStats(year?: number) {
  return useQuery({
    queryKey: ["stats", "guards", year ?? "current"],
    queryFn: () => statsApi.guards(year),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAerNetsoulStats(year?: number) {
  return useQuery({
    queryKey: ["stats", "netsoul", year ?? "current"],
    queryFn: () => statsApi.netsoul(year),
    staleTime: 10 * 60 * 1000,
  });
}

export function useAerActivityStats(year?: number) {
  return useQuery({
    queryKey: ["stats", "activities", year ?? "current"],
    queryFn: () => statsApi.activities(year),
    staleTime: 10 * 60 * 1000,
  });
}
