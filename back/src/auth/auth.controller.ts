import { Elysia, t } from "elysia";
import { getAuthorizationUrl, handleCallback, handleStudentCallback } from "@/auth/auth.service";
import {
  createSession, verifySession, sessionCookieOptions, COOKIE,
  createStudentSession, STUDENT_COOKIE,
} from "@/auth/session";
import { getGuardViewer } from "@/auth/viewer";
import { prisma } from "@/db/prisma";
import { httpStatus } from "@/lib/http";
import { addToWhitelist, removeFromWhitelist } from "@/auth/whitelist";
import { encrypt } from "@/lib/crypto";
import { z } from "zod";
import {
  getCurrentYear, isActiveAer, canTakeGuards, aerRole, arrivingGeneration,
} from "@/modules/school-year/school-year.service";

const WhitelistBodySchema = z.object({
  email: z.email(),
});

const EpitechTokenBodySchema = z.object({
  token: z.string().min(10),
});

const FRONTEND = process.env["FRONTEND_URL"] ?? "http://localhost:5173";

async function getSession(cookie: Record<string, { value?: unknown }>) {
  const token = cookie[COOKIE]?.value as string | undefined;
  if (!token) return null;
  try { return await verifySession(token); } catch { return null; }
}

type OAuthFlow = "aer" | "student";

function startOAuth(cookie: Record<string, { set: (o: Record<string, unknown>) => void } | undefined>, flow: OAuthFlow) {
  const { url, state, codeVerifier } = getAuthorizationUrl();
  const isProd = process.env["NODE_ENV"] === "production";
  const opts = { httpOnly: true, secure: isProd, sameSite: "lax" as const, maxAge: 600, path: "/" };
  cookie["oauth_state"]!.set({ value: state, ...opts });
  cookie["oauth_verifier"]!.set({ value: codeVerifier, ...opts });
  // Même app Azure et même redirect URI pour les deux flux : le flux est mémorisé ici
  cookie["oauth_flow"]!.set({ value: flow, ...opts });
  return url.toString();
}

export const authController = new Elysia({ prefix: "/auth" })
  .get("/login", async ({ cookie, redirect }) => {
    // Dev mode: no Microsoft credentials → auto-login as ADMIN
    if (!process.env["MICROSOFT_CLIENT_ID"]) {
      const devUser = await prisma.user.upsert({
        where: { email: "dev@aer.local" },
        update: {},
        create: { email: "dev@aer.local", name: "Dev AER", role: "ADMIN", aerSince: arrivingGeneration(await getCurrentYear()) },
      });
      const token = await createSession(devUser);
      cookie[COOKIE]!.set(sessionCookieOptions(token));
      return redirect(FRONTEND);
    }
    return redirect(startOAuth(cookie, "aer"));
  })

  // Connexion étudiant (tout compte Microsoft Epitech) : donne accès uniquement aux routes /api/student
  .get("/student/login", async ({ cookie, redirect }) => {
    if (!process.env["MICROSOFT_CLIENT_ID"]) {
      const token = await createStudentSession({ email: "etudiant.dev@epitech.eu", name: "Étudiant Dev" });
      cookie[STUDENT_COOKIE]!.set(sessionCookieOptions(token, STUDENT_COOKIE));
      return redirect(`${FRONTEND}/garde`);
    }
    return redirect(startOAuth(cookie, "student"));
  })

  .get(
    "/callback",
    async ({ query, cookie, redirect }) => {
      const flow: OAuthFlow = cookie["oauth_flow"]?.value === "student" ? "student" : "aer";
      cookie["oauth_flow"]?.set({ value: "", maxAge: 0, path: "/" });
      const errorPage = flow === "student" ? `${FRONTEND}/garde` : `${FRONTEND}/login`;

      if (query.error) {
        return redirect(`${errorPage}?error=${encodeURIComponent(String(query.error))}`);
      }
      const storedState = cookie["oauth_state"]?.value as string | undefined;
      const codeVerifier = cookie["oauth_verifier"]?.value as string | undefined;
      if (!storedState || !codeVerifier || query.state !== storedState || !query.code) {
        return httpStatus(400, { error: "OAuth state invalide" });
      }
      try {
        if (flow === "student") {
          const student = await handleStudentCallback(query.code, codeVerifier);
          const token = await createStudentSession(student);
          cookie[STUDENT_COOKIE]!.set(sessionCookieOptions(token, STUDENT_COOKIE));
          return redirect(`${FRONTEND}/garde`);
        }
        const user = await handleCallback(query.code, codeVerifier);
        const token = await createSession(user);
        cookie[COOKIE]!.set(sessionCookieOptions(token));
        return redirect(FRONTEND);
      } catch (err) {
        if (err instanceof Error && err.message === "UNAUTHORIZED") {
          return redirect(`${errorPage}?error=unauthorized`);
        }
        console.error("[auth/callback] error:", err);
        return httpStatus(500, { error: "Erreur d'authentification" });
      }
    },
    {
      query: t.Object({
        code: t.Optional(t.String()),
        state: t.Optional(t.String()),
        error: t.Optional(t.String()),
      }),
    }
  )

  // Qui consulte la page des gardes : un étudiant connecté, ou un AER (qui y a aussi accès)
  .get("/student/me", async ({ cookie }) => {
    const viewer = await getGuardViewer(cookie);
    if (!viewer) return httpStatus(401, { error: "Non authentifié" });
    return viewer;
  })

  .post("/student/logout", ({ cookie }) => {
    cookie[STUDENT_COOKIE]!.set({ value: "", maxAge: 0, path: "/" });
    return httpStatus(204);
  })

  .get("/me", async ({ cookie }) => {
    const session = await getSession(cookie);
    if (!session) return httpStatus(401, { error: "Non authentifié" });
    const user = await prisma.user.findUnique({ where: { id: Number(session.sub) } });
    if (!user) return httpStatus(401, { error: "Utilisateur introuvable" });
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      hasEpitechToken: !!user.epitechToken,
      aerSince: user.aerSince,
      ...(await (async () => {
        const year = await getCurrentYear();
        return {
          aerRole: aerRole(user, year),
          isActiveAer: isActiveAer(user, year),
          canTakeGuards: canTakeGuards(user, year),
        };
      })()),
    };
  })

  .put(
    "/epitech-token",
    async ({ cookie, body }) => {
      const session = await getSession(cookie);
      if (!session) return httpStatus(401, { error: "Non authentifié" });
      const parsed = EpitechTokenBodySchema.safeParse(body);
      if (!parsed.success) return httpStatus(400, { error: "Token invalide" });
      const token = parsed.data.token.trim().replace(/^user=/i, "").trim();
      await prisma.user.update({
        where: { id: Number(session.sub) },
        data: { epitechToken: encrypt(token) },
      });
      return { hasEpitechToken: true };
    },
    { body: t.Any() }
  )

  .delete("/epitech-token", async ({ cookie }) => {
    const session = await getSession(cookie);
    if (!session) return httpStatus(401, { error: "Non authentifié" });
    await prisma.user.update({
      where: { id: Number(session.sub) },
      data: { epitechToken: null },
    });
    return { hasEpitechToken: false };
  })

  .get("/users", async ({ cookie }) => {
    const session = await getSession(cookie);
    if (!session) return httpStatus(401, { error: "Non authentifié" });
    if (session.role !== "ADMIN") return httpStatus(403, { error: "Accès refusé" });
    const year = await getCurrentYear();
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, aerSince: true, tek5Year: true },
      orderBy: { name: "asc" },
    });
    return users.map((u) => ({
      ...u,
      active: isActiveAer(u, year),
      canTakeGuards: canTakeGuards(u, year),
    }));
  })

  .get("/whitelist", async ({ cookie }) => {
    const session = await getSession(cookie);
    if (!session) return httpStatus(401, { error: "Non authentifié" });
    if (session.role !== "ADMIN") return httpStatus(403, { error: "Accès refusé" });
    return prisma.whitelist.findMany({ orderBy: { createdAt: "asc" } });
  })

  .post(
    "/whitelist",
    async ({ cookie, body }) => {
      const session = await getSession(cookie);
      if (!session) return httpStatus(401, { error: "Non authentifié" });
      if (session.role !== "ADMIN") return httpStatus(403, { error: "Accès refusé" });
      const parsed = WhitelistBodySchema.safeParse(body);
      if (!parsed.success) return httpStatus(400, { error: z.flattenError(parsed.error) });
      return addToWhitelist(parsed.data.email);
    },
    { body: t.Any() }
  )

  .delete(
    "/whitelist/:email",
    async ({ cookie, params }) => {
      const session = await getSession(cookie);
      if (!session) return httpStatus(401, { error: "Non authentifié" });
      if (session.role !== "ADMIN") return httpStatus(403, { error: "Accès refusé" });
      const email = decodeURIComponent(params.email);
      const parsed = WhitelistBodySchema.safeParse({ email });
      if (!parsed.success) return httpStatus(400, { error: "Email invalide" });
      return removeFromWhitelist(parsed.data.email);
    },
    { params: t.Object({ email: t.String() }) }
  )

  .post("/logout", ({ cookie }) => {
    cookie[COOKIE]!.set({ value: "", maxAge: 0, path: "/" });
    return httpStatus(204);
  });
