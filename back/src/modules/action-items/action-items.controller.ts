import { Elysia, t } from "elysia";
import { actionItemsService } from "./action-items.service";
import { CreateActionItemSchema, UpdateActionItemSchema } from "./action-items.schemas";
import { verifySession, COOKIE } from "@/auth/session";

export const actionItemsController = new Elysia({ prefix: "/action-items" })
  .derive(async ({ cookie, set }) => {
    const token = cookie[COOKIE]?.value;
    if (!token) { set.status = 401; throw new Error("Non authentifié"); }
    return { session: await verifySession(token) };
  })

  .get("/", () => actionItemsService.listActionItems())

  .get("/:id", async ({ params, set }) => {
    const item = await actionItemsService.getActionItem(Number(params.id));
    if (!item) { set.status = 404; return { error: "Action introuvable" }; }
    return item;
  }, { params: t.Object({ id: t.String() }) })

  .post("/", async ({ body, set }) => {
    const parsed = CreateActionItemSchema.safeParse(body);
    if (!parsed.success) { set.status = 400; return { error: parsed.error.flatten() }; }
    set.status = 201;
    return actionItemsService.createActionItem(parsed.data);
  }, { body: t.Any() })

  .patch("/:id", async ({ params, body, set }) => {
    const parsed = UpdateActionItemSchema.safeParse(body);
    if (!parsed.success) { set.status = 400; return { error: parsed.error.flatten() }; }
    return actionItemsService.updateActionItem(Number(params.id), parsed.data);
  }, { params: t.Object({ id: t.String() }), body: t.Any() })

  .delete("/:id", async ({ params, set }) => {
    await actionItemsService.deleteActionItem(Number(params.id));
    set.status = 204;
  }, { params: t.Object({ id: t.String() }) });
