import { Elysia, t } from "elysia";
import { memosService } from "./memos.service";
import { CreateMemoSchema, UpdateMemoSchema } from "./memos.schemas";
import { verifySession, COOKIE } from "@/auth/session";

export const memosController = new Elysia({ prefix: "/memos" })
  .derive(async ({ cookie, set }) => {
    const token = cookie[COOKIE]?.value;
    if (!token) { set.status = 401; throw new Error("Non authentifié"); }
    return { session: await verifySession(token) };
  })

  .get("/", () => memosService.listMemos())

  .get("/:id", async ({ params, set }) => {
    const memo = await memosService.getMemo(Number(params.id));
    if (!memo) { set.status = 404; return { error: "Mémo introuvable" }; }
    return memo;
  }, { params: t.Object({ id: t.String() }) })

  .post("/", async ({ body, set }) => {
    const parsed = CreateMemoSchema.safeParse(body);
    if (!parsed.success) { set.status = 400; return { error: parsed.error.flatten() }; }
    set.status = 201;
    return memosService.createMemo(parsed.data);
  }, { body: t.Any() })

  .patch("/:id", async ({ params, body, set }) => {
    const parsed = UpdateMemoSchema.safeParse(body);
    if (!parsed.success) { set.status = 400; return { error: parsed.error.flatten() }; }
    return memosService.updateMemo(Number(params.id), parsed.data);
  }, { params: t.Object({ id: t.String() }), body: t.Any() })

  .delete("/:id", async ({ params, set }) => {
    await memosService.deleteMemo(Number(params.id));
    set.status = 204;
  }, { params: t.Object({ id: t.String() }) });
