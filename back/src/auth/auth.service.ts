import { MicrosoftEntraId, generateCodeVerifier, generateState } from "arctic";
import { prisma } from "@/db/prisma";
import { findWhitelistEntry } from "@/auth/whitelist";
import { getCurrentYear } from "@/modules/school-year/school-year.service";

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
  const state = generateState();
  const codeVerifier = generateCodeVerifier();
  const url = microsoft.createAuthorizationURL(state, codeVerifier, ["openid", "profile", "email"]);
  url.searchParams.set("prompt", "select_account");
  return { url, state, codeVerifier };
}

/** Échange le code OAuth contre l'identité Microsoft (commun aux flux AER et étudiant). */
async function exchangeCode(code: string, codeVerifier: string): Promise<{ email: string; name: string }> {
  if (!microsoft) throw new Error("Microsoft OAuth not configured");
  const tokens = await microsoft.validateAuthorizationCode(code, codeVerifier);
  const idToken = tokens.idToken();

  const claims = decodeJwtPayload(idToken) as {
    email?: string;
    preferred_username?: string;
    name?: string;
  };
  // Casse conservée : la whitelist et la table User sont indexées sur l'email tel quel
  const email = claims.email ?? claims.preferred_username ?? "";
  return { email, name: claims.name ?? email };
}

/** Flux AER : l'email doit être dans la whitelist. */
export async function handleCallback(code: string, codeVerifier: string) {
  const { email, name } = await exchangeCode(code, codeVerifier);

  const whitelist = await findWhitelistEntry(email);
  if (!whitelist) throw new Error("UNAUTHORIZED");

  return prisma.user.upsert({
    where: { email },
    update: { name, role: whitelist.role },
    // Un nouvel AER rejoint la génération de l'année courante
    create: { email, name, role: whitelist.role, aerSince: await getCurrentYear() },
  });
}

// Domaines acceptés pour les étudiants (le tenant Microsoft restreint déjà aux comptes Epitech)
const STUDENT_DOMAINS = (process.env["STUDENT_EMAIL_DOMAINS"] ?? "epitech.eu")
  .split(",")
  .map((d) => d.trim().toLowerCase())
  .filter(Boolean);

export function isStudentEmail(email: string): boolean {
  const domain = email.toLowerCase().split("@")[1];
  return !!domain && STUDENT_DOMAINS.includes(domain);
}

/** Flux étudiant : tout compte Microsoft Epitech. Aucun User n'est créé en base. */
export async function handleStudentCallback(code: string, codeVerifier: string) {
  const identity = await exchangeCode(code, codeVerifier);
  if (!isStudentEmail(identity.email)) throw new Error("UNAUTHORIZED");
  return identity;
}

function decodeJwtPayload(token: string): Record<string, unknown> {
  const payload = token.split(".")[1];
  if (!payload) return {};
  return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
}
