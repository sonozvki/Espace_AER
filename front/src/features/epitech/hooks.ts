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
    // Évite de frapper l'intra à chaque retour de focus (rate-limiting)
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 min
    retry: (count, err) => {
      // no_token et token_invalid sont définitifs, inutile de réessayer
      if (
        err instanceof EpitechApiError &&
        (err.reason === "no_token" || err.reason === "token_invalid")
      )
        return false;
      return count < 2;
    },
  });
}
