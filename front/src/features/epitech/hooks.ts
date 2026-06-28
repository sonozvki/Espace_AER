import { useQuery } from "@tanstack/react-query";
import { epitechApi, EpitechApiError } from "./api";

/**
 * Active uniquement si l'utilisateur a un token enregistré.
 * Récupère ses activités Epitech assignées sur la plage de dates donnée.
 */
export function useEpitechActivities(start: Date, end: Date, enabled: boolean) {
  return useQuery({
    queryKey: ["epitech", "activities", start.toISOString().slice(0, 10), end.toISOString().slice(0, 10)],
    queryFn: () => epitechApi.activities(start, end),
    enabled,
    retry: (count, err) => {
      // Inutile de réessayer si le token manque ou est invalide
      if (err instanceof EpitechApiError && err.reason !== "unknown") return false;
      return count < 2;
    },
  });
}
