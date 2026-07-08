import { Elysia, t } from "elysia";
import { z } from "zod";
import { guardsService } from "./guards.service";
import { GenerateGuardsSchema, AssignGuardSchema } from "./guards.schemas";
import { verifySession, COOKIE } from "@/auth/session";
import { httpStatus } from "@/lib/http";

function sessionUserId(sub: string): number {
  const id = Number(sub);
  if (!Number.isInteger(id) || id <= 0) throw httpStatus(401, { error: "Session invalide" });
  return id;
}

export const guardsController = new Elysia({ prefix: "/guards" })
  .derive(async ({ cookie }) => {
    const token = cookie[COOKIE]?.value as string | undefined;
    if (!token) throw httpStatus(401, { error: "Non authentifié" });
    return { session: await verifySession(token) };
  })

  .get("/", () => guardsService.listGuards())

  .post("/generate", async ({ body }) => {
    const parsed = GenerateGuardsSchema.safeParse(body);
    if (!parsed.success) return httpStatus(400, { error: z.flattenError(parsed.error) });
    const result = await guardsService.generateYear(parsed.data.year);
    return httpStatus(201, { created: result.created });
  }, { body: t.Any() })

  .patch("/:id/assign", async ({ params, body }) => {
    const parsed = AssignGuardSchema.safeParse(body);
    if (!parsed.success) return httpStatus(400, { error: z.flattenError(parsed.error) });
    try {
      return await guardsService.assign(Number(params.id), parsed.data.guardAerId);
    } catch (err) {
      if (err instanceof Error && err.message === "PAST_GUARD")
        return httpStatus(422, { error: "Impossible de modifier une garde passée" });
      if (err instanceof Error && err.message === "NOT_FOUND")
        return httpStatus(404, { error: "Garde introuvable" });
      throw err;
    }
  }, { params: t.Object({ id: t.String() }), body: t.Any() })

  .post("/:id/absent", async ({ params, session }) => {
    try {
      return await guardsService.declareAbsent(Number(params.id), sessionUserId(session.sub));
    } catch (err) {
      if (err instanceof Error && err.message === "NOT_FOUND")
        return httpStatus(404, { error: "Garde introuvable" });
      if (err instanceof Error && err.message === "PAST_GUARD")
        return httpStatus(422, { error: "Impossible de déclarer une absence sur une garde passée" });
      throw err;
    }
  }, { params: t.Object({ id: t.String() }) })

  .post("/:id/unavailable", async ({ params, session }) => {
    try {
      return await guardsService.declareUnavailable(Number(params.id), sessionUserId(session.sub));
    } catch (err) {
      if (err instanceof Error && err.message === "NOT_FOUND")
        return httpStatus(404, { error: "Garde introuvable" });
      if (err instanceof Error && err.message === "PAST_GUARD")
        return httpStatus(422, { error: "Impossible de déclarer une indisponibilité sur une garde passée" });
      throw err;
    }
  }, { params: t.Object({ id: t.String() }) })

  .delete("/:id/unavailable", async ({ params, session }) => {
    try {
      return await guardsService.cancelUnavailable(Number(params.id), sessionUserId(session.sub));
    } catch (err) {
      if (err instanceof Error && err.message === "NOT_FOUND")
        return httpStatus(404, { error: "Garde introuvable" });
      if (err instanceof Error && err.message === "PAST_GUARD")
        return httpStatus(422, { error: "Impossible de modifier une garde passée" });
      if (err instanceof Error && err.message === "NOT_UNAVAILABLE")
        return httpStatus(409, { error: "Tu n'es pas déclaré indisponible ce jour" });
      throw err;
    }
  }, { params: t.Object({ id: t.String() }) })

  .delete("/:id/absent", async ({ params, session }) => {
    try {
      return await guardsService.cancelAbsent(Number(params.id), sessionUserId(session.sub));
    } catch (err) {
      if (err instanceof Error && err.message === "NOT_FOUND")
        return httpStatus(404, { error: "Garde introuvable" });
      if (err instanceof Error && err.message === "PAST_GUARD")
        return httpStatus(422, { error: "Impossible de modifier une garde passée" });
      if (err instanceof Error && err.message === "NOT_ABSENT")
        return httpStatus(409, { error: "Tu n'es pas déclaré absent ce jour" });
      throw err;
    }
  }, { params: t.Object({ id: t.String() }) });
