import { Elysia, t } from "elysia";
import { z } from "zod";
import { resourcesService } from "./resources.service";
import { CreateResourceSchema, UploadResourceSchema, MAX_FILE_SIZE, PDF_MIME } from "./resources.schemas";
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
      if (!parsed.success) return httpStatus(400, { error: z.flattenError(parsed.error) });
      return httpStatus(201, await resourcesService.createResource(parsed.data));
    },
    { body: t.Any() }
  )
  .post(
    "/upload",
    async ({ body }) => {
      const { file, ...fields } = body;
      const parsed = UploadResourceSchema.safeParse(fields);
      if (!parsed.success) return httpStatus(400, { error: z.flattenError(parsed.error) });
      if (file.type !== PDF_MIME || !file.name.toLowerCase().endsWith(".pdf"))
        return httpStatus(400, { error: "Seuls les fichiers PDF sont acceptés" });
      if (file.size > MAX_FILE_SIZE)
        return httpStatus(400, { error: "Fichier trop volumineux (10 Mo max)" });
      return httpStatus(201, await resourcesService.createFileResource(parsed.data, file));
    },
    {
      body: t.Object({
        title: t.String(),
        description: t.Optional(t.String()),
        category: t.Optional(t.String()),
        file: t.File(),
      }),
    }
  )
  .get(
    "/:id/file",
    async ({ params }) => {
      const file = await resourcesService.getResourceFile(Number(params.id));
      if (!file?.fileData) throw httpStatus(404, { error: "Fichier introuvable" });
      return new Response(new Uint8Array(file.fileData), {
        headers: {
          "Content-Type": file.fileMime ?? PDF_MIME,
          "Content-Disposition": `inline; filename="${encodeURIComponent(file.fileName ?? "document.pdf")}"`,
          "Cache-Control": "private, max-age=3600",
        },
      });
    },
    { params: t.Object({ id: t.String() }) }
  )
  .delete(
    "/:id",
    async ({ params }) => {
      await resourcesService.deleteResource(Number(params.id));
      return httpStatus(204);
    },
    { params: t.Object({ id: t.String() }) }
  );
