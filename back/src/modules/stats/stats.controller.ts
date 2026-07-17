import { Elysia } from "elysia";
import { verifySession, COOKIE } from "@/auth/session";
import { httpStatus } from "@/lib/http";
import { getGuardStats, getAerNetsoulStats, getAerActivityStats } from "./stats.service";
import { EpitechTokenMissingError } from "@/modules/epitech/epitech.service";

export const statsController = new Elysia({ prefix: "/stats" })
  .derive(async ({ cookie }) => {
    const token = cookie[COOKIE]?.value as string | undefined;
    if (!token) throw httpStatus(401, { error: "Non authentifié" });
    return { session: await verifySession(token) };
  })

  .get("/guards", async () => {
    return await getGuardStats();
  })

  .get("/netsoul", async ({ session }) => {
    try {
      return await getAerNetsoulStats(Number(session.sub));
    } catch (e) {
      if (e instanceof EpitechTokenMissingError) return httpStatus(409, { error: "no_token" });
      throw e;
    }
  })

  .get("/activities", async () => {
    return await getAerActivityStats();
  });
