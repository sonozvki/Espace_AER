import { Elysia, t } from "elysia";
import { absencesService } from "./absences.service";
import { CreateAbsenceSchema } from "./absences.schemas";
import { verifySession, COOKIE } from "@/auth/session";
import { httpStatus } from "@/lib/http";

export const absencesController = new Elysia({ prefix: "/absences" })
  .derive(async ({ cookie }) => {
    const token = cookie[COOKIE]?.value as string | undefined;
    if (!token) throw httpStatus(401, { error: "Non authentifié" });
    return { session: await verifySession(token) };
  })

  .get("/", () => absencesService.listAbsences())

  .post("/", async ({ body, session }) => {
    const parsed = CreateAbsenceSchema.safeParse(body);
    if (!parsed.success) return httpStatus(400, { error: parsed.error.flatten() });
    try {
      const absence = await absencesService.declare(parsed.data.date, Number(session.sub));
      return httpStatus(201, absence);
    } catch (err) {
      if (err instanceof Error && err.message === "PAST_DATE")
        return httpStatus(422, { error: "Impossible de se déclarer absent sur une date passée" });
      if (err instanceof Error && err.message === "INVALID_DATE")
        return httpStatus(400, { error: "Date invalide" });
      throw err;
    }
  }, { body: t.Any() })

  .delete("/:id", async ({ params, session }) => {
    try {
      await absencesService.cancel(Number(params.id), Number(session.sub));
      return httpStatus(204);
    } catch (err) {
      if (err instanceof Error && err.message === "NOT_FOUND")
        return httpStatus(404, { error: "Absence introuvable" });
      if (err instanceof Error && err.message === "FORBIDDEN")
        return httpStatus(403, { error: "Tu ne peux annuler que tes propres absences" });
      throw err;
    }
  }, { params: t.Object({ id: t.String() }) });
