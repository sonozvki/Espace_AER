import { Elysia, t } from "elysia";
import { getAuthorizationUrl, handleCallback } from "@/auth/auth.service";
import { createSession, verifySession, sessionCookieOptions, COOKIE } from "@/auth/session";
import { prisma } from "@/db/prisma";

const STATE_TTL = 600; // 10 minutes

export const authController = new Elysia({ prefix: "/auth" })
  .get("/login", async ({ set, cookie }) => {
    const { url, state, codeVerifier } = await getAuthorizationUrl();
    cookie["oauth_state"]!.set({ value: state, httpOnly: true, maxAge: STATE_TTL, path: "/" });
    cookie["oauth_verifier"]!.set({ value: codeVerifier, httpOnly: true, maxAge: STATE_TTL, path: "/" });
    set.redirect = url.toString();
  })

  .get(
    "/callback",
    async ({ query, cookie, set }) => {
      const storedState = cookie["oauth_state"]?.value;
      const codeVerifier = cookie["oauth_verifier"]?.value;

      if (!storedState || query.state !== storedState || !codeVerifier || !query.code) {
        set.status = 400;
        return { error: "Invalid OAuth state" };
      }

      try {
        const user = await handleCallback(query.code, codeVerifier);
        const token = await createSession(user);
        const opts = sessionCookieOptions(token);
        cookie[COOKIE]!.set(opts);
        set.redirect = process.env["FRONTEND_URL"] ?? "http://localhost:5173";
      } catch (err) {
        if (err instanceof Error && err.message === "UNAUTHORIZED") {
          set.status = 403;
          return { error: "Email non autorisé" };
        }
        set.status = 500;
        return { error: "Erreur d'authentification" };
      }
    },
    { query: t.Object({ code: t.Optional(t.String()), state: t.Optional(t.String()), error: t.Optional(t.String()) }) }
  )

  .get("/me", async ({ cookie, set }) => {
    const token = cookie[COOKIE]?.value;
    if (!token) { set.status = 401; return { error: "Non authentifié" }; }
    try {
      const claims = await verifySession(token);
      const user = await prisma.user.findUnique({ where: { id: Number(claims.sub) } });
      if (!user) { set.status = 401; return { error: "Utilisateur introuvable" }; }
      return { id: user.id, email: user.email, name: user.name, role: user.role };
    } catch {
      set.status = 401;
      return { error: "Session invalide" };
    }
  })

  .post("/logout", ({ cookie, set }) => {
    cookie[COOKIE]!.set({ value: "", maxAge: 0, path: "/" });
    set.status = 204;
  });
