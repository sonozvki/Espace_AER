import { Elysia, t } from "elysia";
import { actionItemsService } from "./action-items.service";
import { CreateActionItemSchema, UpdateActionItemSchema } from "./action-items.schemas";
import { verifySession, COOKIE } from "@/auth/session";
import { httpStatus } from "@/lib/http";

export const actionItemsController = new Elysia({ prefix: "/action-items" })
  .derive(async ({ cookie }) => {
    const token = cookie[COOKIE]?.value as string | undefined;
    if (!token) throw httpStatus(401, { error: "Non authentifié" });
    return { session: await verifySession(token) };
  })

  .get("/", () => actionItemsService.listActionItems())

  .get("/:id", async ({ params }) => {
    const item = await actionItemsService.getActionItem(Number(params.id));
    if (!item) return httpStatus(404, { error: "Action introuvable" });
    return item;
  }, { params: t.Object({ id: t.String() }) })

  .post("/", async ({ body }) => {
    const parsed = CreateActionItemSchema.safeParse(body);
    if (!parsed.success) return httpStatus(400, { error: parsed.error.flatten() });
    return httpStatus(201, await actionItemsService.createActionItem(parsed.data));
  }, { body: t.Any() })

  .patch("/:id", async ({ params, body }) => {
    const parsed = UpdateActionItemSchema.safeParse(body);
    if (!parsed.success) return httpStatus(400, { error: parsed.error.flatten() });
    return actionItemsService.updateActionItem(Number(params.id), parsed.data);
  }, { params: t.Object({ id: t.String() }), body: t.Any() })

  .delete("/:id", async ({ params }) => {
    await actionItemsService.deleteActionItem(Number(params.id));
    return httpStatus(204);
  }, { params: t.Object({ id: t.String() }) });
