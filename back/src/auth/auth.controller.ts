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

  .get("/users", async ({ cookie }) => {
    const token = cookie[COOKIE]?.value as string | undefined;
    if (!token) return httpStatus(401, { error: "Non authentifié" });
    try {
      await verifySession(token);
    } catch {
      return httpStatus(401, { error: "Session invalide" });
    }
    return prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: "asc" },
    });
  })

  .post("/logout", ({ cookie }) => {
    cookie[COOKIE]!.set({ value: "", maxAge: 0, path: "/" });
    return httpStatus(204);
  });
