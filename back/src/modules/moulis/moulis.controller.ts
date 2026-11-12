import { Elysia, t } from "elysia";
import { verifySession, COOKIE } from "@/auth/session";
import { httpStatus } from "@/lib/http";
import {
  getModules,
  getProjects,
  getGroupSummaries,
  getGroupDetail,
  getGroupTrend,
  getGroupArtifact,
  triggerAll,
  triggerGroup,
} from "./moulis.service";
import type { TriggerParams } from "./moulis.types";

const triggerBody = t.Object({
  visibility: t.Union([t.Literal("Private"), t.Literal("Public")]),
  delivery: t.Union([t.Literal("Git"), t.Literal("Ramassage"), t.Literal("Bttf")]),
  force: t.Boolean(),
  checkoutDatetime: t.String(),
});

export const moulisController = new Elysia({ prefix: "/moulis" })
  .derive(async ({ cookie }) => {
    const token = cookie[COOKIE]?.value as string | undefined;
    if (!token) throw httpStatus(401, { error: "Non authentifié" });
    return { session: await verifySession(token) };
  })

  .get("/modules", async () => getModules())

  .get(
    "/projects",
    async ({ query }) => getProjects(query.module),
    { query: t.Object({ module: t.String() }) }
  )

  .get(
    "/groups",
    async ({ query }) => getGroupSummaries(query.module, query.project),
    { query: t.Object({ module: t.String(), project: t.String() }) }
  )

  .get(
    "/groups/:group",
    async ({ query, params }) => {
      const detail = await getGroupDetail(query.module, query.project, params.group);
      if (!detail) throw httpStatus(404, { error: "Groupe introuvable" });
      return detail;
    },
    {
      query: t.Object({ module: t.String(), project: t.String() }),
      params: t.Object({ group: t.String() }),
    }
  )

  .get(
    "/groups/:group/trend",
    async ({ query, params }) =>
      getGroupTrend(query.module, query.project, params.group, query.limit ? Number(query.limit) : 20),
    {
      query: t.Object({ module: t.String(), project: t.String(), limit: t.Optional(t.String()) }),
      params: t.Object({ group: t.String() }),
    }
  )

  .get(
    "/groups/:group/artifact",
    async ({ query, params }) => {
      const build = Number(query.build);
      if (!Number.isInteger(build) || build <= 0) throw httpStatus(400, { error: "Build invalide" });
      const file = await getGroupArtifact(query.module, query.project, params.group, build, query.path);
      if (!file) throw httpStatus(404, { error: "Fichier introuvable" });
      const disposition = query.download === "1" ? "attachment" : "inline";
      return new Response(file.body, {
        headers: {
          "Content-Type": file.contentType,
          "Content-Disposition": `${disposition}; filename*=UTF-8''${encodeURIComponent(file.fileName)}`,
          "X-Content-Type-Options": "nosniff",
          "Cache-Control": "private, max-age=300",
        },
      });
    },
    {
      query: t.Object({
        module: t.String(),
        project: t.String(),
        build: t.String(),
        path: t.String(),
        download: t.Optional(t.String()),
      }),
      params: t.Object({ group: t.String() }),
    }
  )

  .post(
    "/trigger",
    async ({ query, body }) => {
      const ok = await triggerAll(query.module, query.project, body as TriggerParams);
      if (!ok) throw httpStatus(502, { error: "Échec du déclenchement Jenkins" });
      return { triggered: true };
    },
    { query: t.Object({ module: t.String(), project: t.String() }), body: triggerBody }
  )

  .post(
    "/trigger/:group",
    async ({ query, params, body }) => {
      const ok = await triggerGroup(query.module, query.project, params.group, body as TriggerParams);
      if (!ok) throw httpStatus(502, { error: "Échec du déclenchement Jenkins" });
      return { triggered: true };
    },
    {
      query: t.Object({ module: t.String(), project: t.String() }),
      params: t.Object({ group: t.String() }),
      body: triggerBody,
    }
  );
