import { MicrosoftEntraId } from "arctic";
import { prisma } from "@/db/prisma";
import { findWhitelistEntry } from "@/auth/whitelist";

// Only instantiate if credentials are configured (not required in dev mode)
const microsoft = process.env["MICROSOFT_CLIENT_ID"]
  ? new MicrosoftEntraId(
      process.env["MICROSOFT_TENANT_ID"]!,
      process.env["MICROSOFT_CLIENT_ID"]!,
      process.env["MICROSOFT_CLIENT_SECRET"]!,
      process.env["MICROSOFT_REDIRECT_URI"]!
    )
  : null;

export function getAuthorizationUrl(): { url: URL; state: string; codeVerifier: string } {
  if (!microsoft) throw new Error("Microsoft OAuth not configured");
  const state = crypto.randomUUID();
  const codeVerifier = generateCodeVerifier();
  const url = microsoft.createAuthorizationURL(state, codeVerifier, ["openid", "profile", "email"]);
  return { url, state, codeVerifier };
}

export async function handleCallback(code: string, codeVerifier: string) {
  if (!microsoft) throw new Error("Microsoft OAuth not configured");
  const tokens = await microsoft.validateAuthorizationCode(code, codeVerifier);
  const idToken = tokens.idToken();

  const claims = decodeJwtPayload(idToken) as {
    email?: string;
    preferred_username?: string;
    name?: string;
  };
  const email = claims.email ?? claims.preferred_username ?? "";
  const name = claims.name ?? email;

  const whitelist = await findWhitelistEntry(email);
  if (!whitelist) throw new Error("UNAUTHORIZED");

  return prisma.user.upsert({
    where: { email },
    update: { name, role: whitelist.role },
    create: { email, name, role: whitelist.role },
  });
}

function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

function decodeJwtPayload(token: string): Record<string, unknown> {
  const payload = token.split(".")[1];
  if (!payload) return {};
  return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
}
