import { Elysia, t } from "elysia";
import { verifySession, COOKIE } from "@/auth/session";
import { httpStatus } from "@/lib/http";
import {
  getMyActivities,
  EpitechTokenMissingError,
  EpitechTokenInvalidError,
  EpitechUpstreamError,
} from "./epitech.service";

export const epitechController = new Elysia({ prefix: "/epitech" })
  .derive(async ({ cookie }) => {
    const token = cookie[COOKIE]?.value as string | undefined;
    if (!token) throw httpStatus(401, { error: "Non authentifié" });
    return { session: await verifySession(token) };
  })

  .get(
    "/activities",
    async ({ session, query }) => {
      try {
        return await getMyActivities(Number(session.sub), query.start, query.end);
      } catch (err) {
        if (err instanceof EpitechTokenMissingError)
          return httpStatus(409, { error: "no_token" });
        if (err instanceof EpitechTokenInvalidError)
          return httpStatus(502, { error: "token_invalid" });
        if (err instanceof EpitechUpstreamError)
          return httpStatus(503, { error: "upstream_error" });
        throw err;
      }
    },
    {
      query: t.Object({
        start: t.String(), // "YYYY-MM-DD"
        end: t.String(),
      }),
    }
  );
