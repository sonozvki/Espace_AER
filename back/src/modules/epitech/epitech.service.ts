import { prisma } from "@/db/prisma";
import { decrypt } from "@/lib/crypto";

const INTRA_BASE = "https://intra.epitech.eu";

// Structure (partielle) d'un event renvoyé par intra.epitech.eu/planning/load
type RawEvent = {
  codemodule?: string;
  titlemodule?: string;
  acti_title?: string;
  type_title?: string;
  start?: string;
  end?: string;
  codeevent?: string;
  codeacti?: string;
  room?: { code?: string } | null;
  // Renseigné (non-null) uniquement sur les activités où l'AER s'est inscrit
  // (valeurs observées : "accept", "eat", ...). C'est notre signal d'assignation.
  status_manager?: string | null;
};

export type EpitechActivity = {
  id: string;
  module: string;
  moduleTitle: string;
  title: string;
  type: string;
  start: string;
  end: string;
  room: string | null;
  status: string | null; // status_manager brut (statut de l'AER sur l'activité)
};

// Pas de token enregistré pour cet utilisateur
export class EpitechTokenMissingError extends Error {}
// Cookie présent mais refusé par l'intra avec 401/403 (expiré / invalide)
export class EpitechTokenInvalidError extends Error {}
// Erreur réseau ou réponse inattendue de l'intra (throttle, maintenance, etc.)
export class EpitechUpstreamError extends Error {}

/**
 * Récupère les activités du planning intra où l'AER est inscrit
 * (status_manager non-null), sur la plage [start, end].
 * Les dates sont au format "YYYY-MM-DD".
 */
export async function getMyActivities(
  userId: number,
  start: string,
  end: string
): Promise<EpitechActivity[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { epitechToken: true },
  });
  if (!user?.epitechToken) throw new EpitechTokenMissingError();

  const cookie = decrypt(user.epitechToken);
  const url = `${INTRA_BASE}/planning/load?format=json&start=${start}&end=${end}`;

  let res: Response;
  try {
    res = await fetch(url, {
      headers: { Cookie: `user=${cookie}` },
      redirect: "manual",
    });
  } catch {
    throw new EpitechUpstreamError();
  }

  // 401/403 = cookie refusé par l'intra → token invalide
  if (res.status === 401 || res.status === 403) throw new EpitechTokenInvalidError();
  // Redirection (302 vers login) = session refusée
  if (res.status >= 300 && res.status < 400) throw new EpitechTokenInvalidError();
  // Autre erreur HTTP (5xx, throttle…) = problème upstream transitoire
  if (!res.ok) throw new EpitechUpstreamError();

  const bodyText = await res.text();
  let data: unknown;
  try {
    data = JSON.parse(bodyText);
  } catch {
    // Réponse non-JSON (HTML de login) = session refusée
    throw new EpitechTokenInvalidError();
  }

  // Planning vide : l'intra renvoie {} (objet) au lieu de []. On le traite
  // comme une liste vide, ce n'est pas une erreur de token.
  const events: RawEvent[] = Array.isArray(data) ? (data as RawEvent[]) : [];

  return events
    .filter((e) => e.status_manager != null && e.status_manager !== "")
    .map((e) => ({
      id: e.codeevent ?? e.codeacti ?? `${e.codemodule ?? "?"}-${e.start ?? ""}`,
      module: e.codemodule ?? "",
      moduleTitle: e.titlemodule ?? "",
      title: e.acti_title ?? "",
      type: e.type_title ?? "",
      start: e.start ?? "",
      end: e.end ?? "",
      room: e.room?.code ?? null,
      status: e.status_manager ?? null,
    }))
    .sort((a, b) => a.start.localeCompare(b.start));
}
