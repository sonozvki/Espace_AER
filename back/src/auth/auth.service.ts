import { MicrosoftEntraId } from "arctic";
import { prisma } from "@/db/prisma";
import { findWhitelistEntry } from "@/auth/whitelist";

export const microsoft = new MicrosoftEntraId(
  process.env["MICROSOFT_TENANT_ID"]!,
  process.env["MICROSOFT_CLIENT_ID"]!,
  process.env["MICROSOFT_CLIENT_SECRET"]!,
  process.env["MICROSOFT_REDIRECT_URI"]!
);

export async function getAuthorizationUrl(): Promise<{ url: URL; state: string; codeVerifier: string }> {
  const state = crypto.randomUUID();
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const url = await microsoft.createAuthorizationURL(state, codeVerifier, {
    scopes: ["openid", "profile", "email"],
  });
  url.searchParams.set("code_challenge", codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  return { url, state, codeVerifier };
}

export async function handleCallback(code: string, codeVerifier: string) {
  const tokens = await microsoft.validateAuthorizationCode(code, codeVerifier);
  const idToken = tokens.idToken();

  const claims = decodeJwtPayload(idToken) as { email?: string; preferred_username?: string; name?: string };
  const email = claims.email ?? claims.preferred_username ?? "";
  const name = claims.name ?? email;

  const whitelist = await findWhitelistEntry(email);
  if (!whitelist) throw new Error("UNAUTHORIZED");

  const user = await prisma.user.upsert({
    where: { email },
    update: { name, role: whitelist.role },
    create: { email, name, role: whitelist.role },
  });

  return user;
}

function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

function decodeJwtPayload(token: string): Record<string, unknown> {
  const payload = token.split(".")[1];
  if (!payload) return {};
  return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
}
