import { Elysia, t } from "elysia";
import { verifySession, COOKIE } from "@/auth/session";
import { httpStatus } from "@/lib/http";
import {
  AER_GENERATIONS,
  getCurrentSchoolYear,
  listSchoolYears,
  listAers,
  previewRollover,
  rolloverSchoolYear,
  setAerRole,
  RolloverConflictError,
} from "./school-year.service";

export const schoolYearController = new Elysia({ prefix: "/school-year" })
  .derive(async ({ cookie }) => {
    const token = cookie[COOKIE]?.value as string | undefined;
    if (!token) throw httpStatus(401, { error: "Non authentifié" });
    return { session: await verifySession(token) };
  })

  .get("/", async () => {
    const [current, years] = await Promise.all([getCurrentSchoolYear(), listSchoolYears()]);
    return { current, years, generations: AER_GENERATIONS };
  })

  .get(
    "/aers",
    async ({ query }) => listAers(query.year ? Number(query.year) : undefined),
    { query: t.Object({ year: t.Optional(t.String()) }) }
  )

  .patch(
    "/aers/:id",
    async ({ session, params, body }) => {
      if (session.role !== "ADMIN") return httpStatus(403, { error: "Accès refusé" });
      return setAerRole(Number(params.id), body.role);
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({
        role: t.Union([t.Literal("tek2"), t.Literal("tek3"), t.Literal("tek5"), t.Literal("ancien")]),
      }),
    }
  )

  .get("/rollover/preview", async () => previewRollover())

  .post(
    "/rollover",
    async ({ session, body }) => {
      if (session.role !== "ADMIN") return httpStatus(403, { error: "Accès refusé" });
      const startDate = new Date(`${body.startDate}T00:00:00.000Z`);
      if (Number.isNaN(startDate.getTime())) return httpStatus(400, { error: "Date invalide" });
      try {
        return await rolloverSchoolYear(Number(session.sub), startDate);
      } catch (err) {
        if (err instanceof RolloverConflictError) return httpStatus(409, { error: err.message });
        throw err;
      }
    },
    { body: t.Object({ startDate: t.String({ pattern: "^\\d{4}-\\d{2}-\\d{2}$" }) }) }
  );
