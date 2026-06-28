import { apiFetch } from "@/lib/api";
import type { EpitechActivity } from "./types";

// Erreur typée pour distinguer "pas de token" / "token invalide" côté UI
export class EpitechApiError extends Error {
  constructor(public reason: "no_token" | "token_invalid" | "unknown") {
    super(reason);
  }
}

function fmtDate(d: Date): string {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

export const epitechApi = {
  activities: async (start: Date, end: Date): Promise<EpitechActivity[]> => {
    try {
      return await apiFetch<EpitechActivity[]>(
        `/api/epitech/activities?start=${fmtDate(start)}&end=${fmtDate(end)}`
      );
    } catch (err) {
      const reason =
        err && typeof err === "object" && "error" in err
          ? (err as { error: string }).error
          : "unknown";
      if (reason === "no_token") throw new EpitechApiError("no_token");
      if (reason === "token_invalid") throw new EpitechApiError("token_invalid");
      throw new EpitechApiError("unknown");
    }
  },
};
