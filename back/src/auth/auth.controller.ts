import { Elysia, t } from "elysia";
import { getAuthorizationUrl, handleCallback } from "@/auth/auth.service";
import { createSession, verifySession, sessionCookieOptions, COOKIE } from "@/auth/session";
import { prisma } from "@/db/prisma";
import { httpStatus } from "@/lib/http";
import { addToWhitelist, removeFromWhitelist } from "@/auth/whitelist";
import { z } from "zod";

const WhitelistBodySchema = z.object({
  email: z.string().email(),
});

const FRONTEND = process.env["FRONTEND_URL"] ?? "http://localhost:5173";

async function getSession(cookie: Record<string, { value?: unknown }>) {
  const token = cookie[COOKIE]?.value as string | undefined;
  if (!token) return null;
  try { return await verifySession(token); } catch { return null; }
}

export const authController = new Elysia({ prefix: "/auth" })
  .get("/login", async ({ cookie, redirect }) => {
    // Dev mode: no Microsoft credentials → auto-login as ADMIN
    if (!process.env["MICROSOFT_CLIENT_ID"]) {
      const devUser = await prisma.user.upsert({
        where: { email: "dev@aer.local" },
        update: {},
        create: { email: "dev@aer.local", name: "Dev AER", role: "ADMIN" },
      });
      const token = await createSession(devUser);
      cookie[COOKIE]!.set(sessionCookieOptions(token));
      return redirect(FRONTEND);
    }
    // Production: redirect to Microsoft OAuth
    const { url, state, codeVerifier } = getAuthorizationUrl();
    cookie["oauth_state"]!.set({ value: state, httpOnly: true, sameSite: "lax" as const, maxAge: 600, path: "/" });
    cookie["oauth_verifier"]!.set({ value: codeVerifier, httpOnly: true, sameSite: "lax" as const, maxAge: 600, path: "/" });
    return redirect(url.toString());
  })

  .get(
    "/callback",
    async ({ query, cookie, set, redirect }) => {
      console.log("[auth/callback] hit", new Date().toISOString(), "code prefix:", query.code?.slice(0, 8));
      if (query.error) {
        set.redirect = `${FRONTEND}/login?error=${encodeURIComponent(query.error)}`;
        return;
      }
      const storedState = cookie["oauth_state"]?.value as string | undefined;
      const codeVerifier = cookie["oauth_verifier"]?.value as string | undefined;
      console.log("[auth/callback] storedState:", !!storedState, "verifier len:", codeVerifier?.length, "verifier prefix:", codeVerifier?.slice(0, 6), "stateMatch:", query.state === storedState);
      if (!storedState || !codeVerifier || query.state !== storedState || !query.code) {
        return httpStatus(400, { error: "OAuth state invalide" });
      }
      try {
        const user = await handleCallback(query.code, codeVerifier);
        console.log("[auth/callback] user ok:", user.id, user.email);
        const token = await createSession(user);
        console.log("[auth/callback] session created, setting cookie...");
        cookie[COOKIE]!.set(sessionCookieOptions(token));
        console.log("[auth/callback] cookie set, redirecting to", FRONTEND);
        return redirect(FRONTEND);
      } catch (err) {
        if (err instanceof Error && err.message === "UNAUTHORIZED") {
          return redirect(`${FRONTEND}/login?error=unauthorized`);
        }
        console.error("[auth/callback] CAUGHT ERROR:", err);
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

  .get("/me", async ({ cookie }) => {
    const session = await getSession(cookie);
    if (!session) return httpStatus(401, { error: "Non authentifié" });
    const user = await prisma.user.findUnique({ where: { id: Number(session.sub) } });
    if (!user) return httpStatus(401, { error: "Utilisateur introuvable" });
    return { id: user.id, email: user.email, name: user.name, role: user.role };
  })

  .get("/users", async ({ cookie }) => {
    const session = await getSession(cookie);
    if (!session) return httpStatus(401, { error: "Non authentifié" });
    return prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: "asc" },
    });
  })

  // Whitelist management — ADMIN only
  .get("/whitelist", async ({ cookie }) => {
    const session = await getSession(cookie);
    if (!session) return httpStatus(401, { error: "Non authentifié" });
    if (session.role !== "ADMIN") return httpStatus(403, { error: "Réservé aux admins" });
    return prisma.whitelist.findMany({ orderBy: { createdAt: "asc" } });
  })

  .post(
    "/whitelist",
    async ({ cookie, body }) => {
      const session = await getSession(cookie);
      if (!session) return httpStatus(401, { error: "Non authentifié" });
      if (session.role !== "ADMIN") return httpStatus(403, { error: "Réservé aux admins" });
      const parsed = WhitelistBodySchema.safeParse(body);
      if (!parsed.success) return httpStatus(400, { error: parsed.error.flatten() });
      return addToWhitelist(parsed.data.email);
    },
    { body: t.Any() }
  )

  .delete(
    "/whitelist/:email",
    async ({ cookie, params }) => {
      const session = await getSession(cookie);
      if (!session) return httpStatus(401, { error: "Non authentifié" });
      if (session.role !== "ADMIN") return httpStatus(403, { error: "Réservé aux admins" });
      return removeFromWhitelist(decodeURIComponent(params.email));
    },
    { params: t.Object({ email: t.String() }) }
  )

  .post("/logout", ({ cookie }) => {
    cookie[COOKIE]!.set({ value: "", maxAge: 0, path: "/" });
    return httpStatus(204);
  });
