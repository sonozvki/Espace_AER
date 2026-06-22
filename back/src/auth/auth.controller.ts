import { Elysia } from "elysia";
// import { getAuthorizationUrl, handleCallback } from "@/auth/auth.service"; // temporary deactivated for easier debug
import { createSession, verifySession, sessionCookieOptions, COOKIE } from "@/auth/session";
import { prisma } from "@/db/prisma";
import { httpStatus } from "@/lib/http";

export const authController = new Elysia({ prefix: "/auth" })
  // temporary deactivated for easier debug — Microsoft OAuth remplacé par un login dev direct
  .get("/login", async ({ set, cookie }) => {
    const devUser = await prisma.user.upsert({
      where: { email: "dev@aer.local" },
      update: {},
      create: { email: "dev@aer.local", name: "Dev AER", role: "ADMIN" },
    });
    const token = await createSession(devUser);
    cookie[COOKIE]!.set(sessionCookieOptions(token));
    set.redirect = process.env["FRONTEND_URL"] ?? "http://localhost:5173";
  })

  // temporary deactivated for easier debug
  // .get("/callback", async ({ query, cookie, set }) => {
  //   const storedState = cookie["oauth_state"]?.value;
  //   const codeVerifier = cookie["oauth_verifier"]?.value;
  //   if (!storedState || query.state !== storedState || !codeVerifier || !query.code) {
  //     return httpStatus(400, { error: "Invalid OAuth state" });
  //   }
  //   try {
  //     const user = await handleCallback(query.code, codeVerifier);
  //     const token = await createSession(user);
  //     cookie[COOKIE]!.set(sessionCookieOptions(token));
  //     set.redirect = process.env["FRONTEND_URL"] ?? "http://localhost:5173";
  //   } catch (err) {
  //     if (err instanceof Error && err.message === "UNAUTHORIZED") return httpStatus(403, { error: "Email non autorisé" });
  //     return httpStatus(500, { error: "Erreur d'authentification" });
  //   }
  // }, { query: t.Object({ code: t.Optional(t.String()), state: t.Optional(t.String()), error: t.Optional(t.String()) }) })

  .get("/me", async ({ cookie }) => {
    const token = cookie[COOKIE]?.value as string | undefined;
    if (!token) return httpStatus(401, { error: "Non authentifié" });
    try {
      const claims = await verifySession(token);
      const user = await prisma.user.findUnique({ where: { id: Number(claims.sub) } });
      if (!user) return httpStatus(401, { error: "Utilisateur introuvable" });
      return { id: user.id, email: user.email, name: user.name, role: user.role };
    } catch {
      return httpStatus(401, { error: "Session invalide" });
    }
  })

  .post("/logout", ({ cookie }) => {
    cookie[COOKIE]!.set({ value: "", maxAge: 0, path: "/" });
    return httpStatus(204);
  });
