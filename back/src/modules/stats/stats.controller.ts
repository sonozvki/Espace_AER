import { Elysia, t } from "elysia";
import { verifySession, COOKIE } from "@/auth/session";
import { httpStatus } from "@/lib/http";
import { getGuardStats, getAerNetsoulStats, getAerActivityStats } from "./stats.service";
import { EpitechTokenMissingError } from "@/modules/epitech/epitech.service";

const yearQuery = t.Object({ year: t.Optional(t.String()) });

function parseYear(raw: string | undefined): number | undefined {
  const n = Number(raw);
  return raw && Number.isInteger(n) ? n : undefined;
}

export const statsController = new Elysia({ prefix: "/stats" })
  .derive(async ({ cookie }) => {
    const token = cookie[COOKIE]?.value as string | undefined;
    if (!token) throw httpStatus(401, { error: "Non authentifié" });
    return { session: await verifySession(token) };
  })

  .get("/guards", async ({ query }) => getGuardStats(parseYear(query.year)), { query: yearQuery })

  .get("/netsoul", async ({ session, query }) => {
    try {
      return await getAerNetsoulStats(Number(session.sub), parseYear(query.year));
    } catch (e) {
      if (e instanceof EpitechTokenMissingError) return httpStatus(409, { error: "no_token" });
      throw e;
    }
  }, { query: yearQuery })

  .get("/activities", async ({ query }) => getAerActivityStats(parseYear(query.year)), { query: yearQuery });
