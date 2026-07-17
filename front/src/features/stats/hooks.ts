import { useQuery } from "@tanstack/react-query";
import { statsApi } from "./api";

export function useGuardStats() {
  return useQuery({
    queryKey: ["stats", "guards"],
    queryFn: statsApi.guards,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAerNetsoulStats() {
  return useQuery({
    queryKey: ["stats", "netsoul"],
    queryFn: statsApi.netsoul,
    staleTime: 10 * 60 * 1000,
  });
}

export function useAerActivityStats() {
  return useQuery({
    queryKey: ["stats", "activities"],
    queryFn: statsApi.activities,
    staleTime: 10 * 60 * 1000,
  });
}
