import { Elysia, t } from "elysia";
import { verifySession, COOKIE } from "@/auth/session";
import { httpStatus } from "@/lib/http";
import {
  getModules,
  getProjects,
  getGroupSummaries,
  getGroupDetail,
  getGroupTrend,
  triggerAll,
  triggerGroup,
  getRawBanana,
} from "./moulis.service";

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
    "/debug-banana",
    async ({ query }) => getRawBanana(query.module, query.project, query.group),
    { query: t.Object({ module: t.String(), project: t.String(), group: t.String() }) }
  )

  .post(
    "/trigger",
    async ({ query }) => {
      const ok = await triggerAll(query.module, query.project);
      if (!ok) throw httpStatus(502, { error: "Échec du déclenchement Jenkins" });
      return { triggered: true };
    },
    { query: t.Object({ module: t.String(), project: t.String() }) }
  )

  .post(
    "/trigger/:group",
    async ({ query, params }) => {
      const ok = await triggerGroup(query.module, query.project, params.group);
      if (!ok) throw httpStatus(502, { error: "Échec du déclenchement Jenkins" });
      return { triggered: true };
    },
    {
      query: t.Object({ module: t.String(), project: t.String() }),
      params: t.Object({ group: t.String() }),
    }
  );
