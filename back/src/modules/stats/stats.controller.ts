import { Elysia } from "elysia";
import { verifySession, COOKIE } from "@/auth/session";
import { getGuardStats } from "./stats.service";

export const statsController = new Elysia({ prefix: "/stats" })
  .derive(async ({ cookie }) => {
    const token = cookie[COOKIE]?.value as string | undefined;
    if (!token) throw new Response(null, { status: 401 });
    return { session: await verifySession(token) };
  })

  .get("/guards", async () => {
    return await getGuardStats();
  });
