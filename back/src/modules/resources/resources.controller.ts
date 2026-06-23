import { Elysia, t } from "elysia";
import { resourcesService } from "./resources.service";
import { CreateResourceSchema } from "./resources.schemas";
import { verifySession, COOKIE } from "@/auth/session";
import { httpStatus } from "@/lib/http";

export const resourcesController = new Elysia({ prefix: "/resources" })
  .derive(async ({ cookie }) => {
    const token = cookie[COOKIE]?.value as string | undefined;
    if (!token) throw httpStatus(401, { error: "Non authentifié" });
    try {
      return { session: await verifySession(token) };
    } catch {
      throw httpStatus(401, { error: "Session invalide" });
    }
  })
  .get("/", () => resourcesService.listResources())
  .post(
    "/",
    async ({ body }) => {
      const parsed = CreateResourceSchema.safeParse(body);
      if (!parsed.success) return httpStatus(400, { error: parsed.error.flatten() });
      return httpStatus(201, await resourcesService.createResource(parsed.data));
    },
    { body: t.Any() }
  )
  .delete(
    "/:id",
    async ({ params }) => {
      await resourcesService.deleteResource(Number(params.id));
      return httpStatus(204);
    },
    { params: t.Object({ id: t.String() }) }
  );
