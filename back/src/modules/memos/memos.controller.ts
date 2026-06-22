import { Elysia, t } from "elysia";
import { memosService } from "./memos.service";
import { CreateMemoSchema, UpdateMemoSchema } from "./memos.schemas";
import { verifySession, COOKIE } from "@/auth/session";
import { httpStatus } from "@/lib/http";

export const memosController = new Elysia({ prefix: "/memos" })
  .derive(async ({ cookie }) => {
    const token = cookie[COOKIE]?.value as string | undefined;
    if (!token) throw httpStatus(401, { error: "Non authentifié" });
    return { session: await verifySession(token) };
  })

  .get("/", () => memosService.listMemos())

  .get("/:id", async ({ params }) => {
    const memo = await memosService.getMemo(Number(params.id));
    if (!memo) return httpStatus(404, { error: "Mémo introuvable" });
    return memo;
  }, { params: t.Object({ id: t.String() }) })

  .post("/", async ({ body }) => {
    const parsed = CreateMemoSchema.safeParse(body);
    if (!parsed.success) return httpStatus(400, { error: parsed.error.flatten() });
    return httpStatus(201, await memosService.createMemo(parsed.data));
  }, { body: t.Any() })

  .patch("/:id", async ({ params, body }) => {
    const parsed = UpdateMemoSchema.safeParse(body);
    if (!parsed.success) return httpStatus(400, { error: parsed.error.flatten() });
    return memosService.updateMemo(Number(params.id), parsed.data);
  }, { params: t.Object({ id: t.String() }), body: t.Any() })

  .delete("/:id", async ({ params }) => {
    await memosService.deleteMemo(Number(params.id));
    return httpStatus(204);
  }, { params: t.Object({ id: t.String() }) });
