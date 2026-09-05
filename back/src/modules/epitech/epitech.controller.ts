import { Elysia, t } from "elysia";
import { verifySession, COOKIE } from "@/auth/session";
import { httpStatus } from "@/lib/http";
import {
  getMyActivities,
  getIntraPromos,
  getIntraStudents,
  getStudentsFromCache,
  saveStudentsToCache,
  getStudentNotes,
  EpitechTokenMissingError,
  EpitechTokenInvalidError,
  EpitechUpstreamError,
} from "./epitech.service";

function handleEpitechError(err: unknown) {
  if (err instanceof EpitechTokenMissingError) return httpStatus(409, { error: "no_token" });
  if (err instanceof EpitechTokenInvalidError) return httpStatus(502, { error: "token_invalid" });
  if (err instanceof EpitechUpstreamError) return httpStatus(503, { error: "upstream_error" });
  throw err;
}

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
        return handleEpitechError(err);
      }
    },
    {
      query: t.Object({ start: t.String(), end: t.String() }),
    }
  )

  .get(
    "/intra/promos",
    async ({ session, query }) => {
      try {
        return await getIntraPromos(Number(session.sub), query.location ?? "FR/NCE");
      } catch (err) {
        return handleEpitechError(err);
      }
    },
    {
      query: t.Object({
        location: t.Optional(t.String()),
      }),
    }
  )

  .get(
    "/intra/students",
    async ({ session, query }) => {
      const location = query.location ?? "FR/NCE";
      const promo = query.promo;

      const cached = await getStudentsFromCache(promo, location);
      if (cached.length > 0) return cached;

      try {
        const students = await getIntraStudents(Number(session.sub), { location, promo });
        saveStudentsToCache(students, promo, location).catch(() => {});
        return students;
      } catch (err) {
        return handleEpitechError(err);
      }
    },
    {
      query: t.Object({
        promo: t.String(),
        location: t.Optional(t.String()),
      }),
    }
  )

  .get(
    "/intra/student/:login/notes",
    async ({ session, params }) => {
      try {
        return await getStudentNotes(Number(session.sub), decodeURIComponent(params.login));
      } catch (err) {
        return handleEpitechError(err);
      }
    },
    { params: t.Object({ login: t.String() }) }
  );
