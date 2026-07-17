import { useQuery } from "@tanstack/react-query";
import { statsApi } from "./api";

export function useGuardStats() {
  return useQuery({
    queryKey: ["stats", "guards"],
    queryFn: statsApi.guards,
    staleTime: 5 * 60 * 1000,
  });
}
