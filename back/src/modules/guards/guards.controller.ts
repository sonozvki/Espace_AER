import { Elysia, t } from "elysia";
import { guardsService } from "./guards.service";
import { GenerateGuardsSchema, AssignGuardSchema } from "./guards.schemas";
import { verifySession, COOKIE } from "@/auth/session";

export const guardsController = new Elysia({ prefix: "/guards" })
  .derive(async ({ cookie, set }) => {
    const token = cookie[COOKIE]?.value;
    if (!token) { set.status = 401; throw new Error("Non authentifié"); }
    return { session: await verifySession(token) };
  })

  .get("/", () => guardsService.listGuards())

  .post("/generate", async ({ body, session, set }) => {
    if (session.role !== "ADMIN") { set.status = 403; return { error: "Réservé aux admins" }; }
    const parsed = GenerateGuardsSchema.safeParse(body);
    if (!parsed.success) { set.status = 400; return { error: parsed.error.flatten() }; }
    const result = await guardsService.generateYear(parsed.data.year);
    set.status = 201;
    return { created: result.count };
  }, { body: t.Any() })

  .patch("/:id/assign", async ({ params, body, set }) => {
    const parsed = AssignGuardSchema.safeParse(body);
    if (!parsed.success) { set.status = 400; return { error: parsed.error.flatten() }; }
    try {
      return await guardsService.assign(Number(params.id), parsed.data.aerId);
    } catch (err) {
      if (err instanceof Error && err.message === "PAST_GUARD") {
        set.status = 422;
        return { error: "Impossible de modifier une garde passée" };
      }
      if (err instanceof Error && err.message === "NOT_FOUND") {
        set.status = 404;
        return { error: "Garde introuvable" };
      }
      throw err;
    }
  }, { params: t.Object({ id: t.String() }), body: t.Any() });
