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
  event_registered?: boolean;
  prof_inst?: Array<{ login?: string; title?: string }> | null;
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
  registered: boolean;
};

// Pas de token enregistré pour cet utilisateur
export class EpitechTokenMissingError extends Error {}
// Cookie présent mais refusé par l'intra (expiré / invalide)
export class EpitechTokenInvalidError extends Error {}

/**
 * Récupère les activités du planning intra où l'utilisateur est assigné
 * (son login Epitech apparaît dans prof_inst), sur la plage [start, end].
 * Les dates sont au format "YYYY-MM-DD".
 */
export async function getAssignedActivities(
  userId: number,
  email: string,
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
    res = await fetch(url, { headers: { Cookie: `user=${cookie}` } });
  } catch {
    throw new EpitechTokenInvalidError();
  }
  if (!res.ok) throw new EpitechTokenInvalidError();

  const data: unknown = await res.json().catch(() => null);
  if (!Array.isArray(data)) throw new EpitechTokenInvalidError();

  const myLogin = email.toLowerCase();
  const events = data as RawEvent[];

  return events
    .filter((e) =>
      (e.prof_inst ?? []).some((p) => p.login?.toLowerCase() === myLogin)
    )
    .map((e) => ({
      id: e.codeevent ?? e.codeacti ?? `${e.codemodule ?? "?"}-${e.start ?? ""}`,
      module: e.codemodule ?? "",
      moduleTitle: e.titlemodule ?? "",
      title: e.acti_title ?? "",
      type: e.type_title ?? "",
      start: e.start ?? "",
      end: e.end ?? "",
      room: e.room?.code ?? null,
      registered: !!e.event_registered,
    }))
    .sort((a, b) => a.start.localeCompare(b.start));
}
