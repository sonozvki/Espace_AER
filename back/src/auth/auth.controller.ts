import { Elysia, t, redirect } from "elysia";
import { getAuthorizationUrl, handleCallback } from "@/auth/auth.service";
import { createSession, verifySession, sessionCookieOptions, COOKIE } from "@/auth/session";
import { prisma } from "@/db/prisma";
import { httpStatus } from "@/lib/http";
import { addToWhitelist, removeFromWhitelist } from "@/auth/whitelist";
import { encrypt } from "@/lib/crypto";
import { z } from "zod";

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

export const authController = new Elysia({ prefix: "/auth" })
  .get("/login", async ({ cookie }) => {
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
    const { url, state, codeVerifier } = getAuthorizationUrl();
    const isProd = process.env["NODE_ENV"] === "production";
    cookie["oauth_state"]!.set({ value: state, httpOnly: true, secure: isProd, sameSite: "lax" as const, maxAge: 600, path: "/" });
    cookie["oauth_verifier"]!.set({ value: codeVerifier, httpOnly: true, secure: isProd, sameSite: "lax" as const, maxAge: 600, path: "/" });
    return redirect(url.toString());
  })

  .get(
    "/callback",
    async ({ query, cookie }) => {
      if (query.error) {
        return redirect(`${FRONTEND}/login?error=${encodeURIComponent(String(query.error))}`);
      }
      const storedState = cookie["oauth_state"]?.value as string | undefined;
      const codeVerifier = cookie["oauth_verifier"]?.value as string | undefined;
      if (!storedState || !codeVerifier || query.state !== storedState || !query.code) {
        return httpStatus(400, { error: "OAuth state invalide" });
      }
      try {
        const user = await handleCallback(query.code, codeVerifier);
        const token = await createSession(user);
        cookie[COOKIE]!.set(sessionCookieOptions(token));
        return redirect(FRONTEND);
      } catch (err) {
        if (err instanceof Error && err.message === "UNAUTHORIZED") {
          return redirect(`${FRONTEND}/login?error=unauthorized`);
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
    return prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: "asc" },
    });
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
