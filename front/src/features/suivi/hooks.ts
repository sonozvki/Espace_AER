import { useQuery } from "@tanstack/react-query";
import { suiviApi } from "./api";

const INTRA_STALE = 30 * 60 * 1000; // 30 min pr fetch les données Epitech (c lent)

export function useIntraPromos(location = "FR/NCE") {
  return useQuery({
    queryKey: ["suivi", "promos", location],
    queryFn: () => suiviApi.promos(location),
    staleTime: INTRA_STALE,
    retry: false,
  });
}

export function useIntraStudents(promo: string | null, location = "FR/NCE") {
  return useQuery({
    queryKey: ["suivi", "students", promo, location],
    queryFn: () => suiviApi.students(promo!, location),
    enabled: !!promo,
    staleTime: INTRA_STALE,
    retry: false,
  });
}

export function useStudentNotes(login: string | null) {
  return useQuery({
    queryKey: ["suivi", "notes", login],
    queryFn: () => suiviApi.studentNotes(login!),
    enabled: !!login,
    staleTime: INTRA_STALE,
    retry: false,
  });
}
