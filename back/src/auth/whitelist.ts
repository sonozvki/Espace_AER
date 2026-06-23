import { prisma } from "@/db/prisma";

export async function findWhitelistEntry(email: string) {
  return prisma.whitelist.findUnique({ where: { email } });
}

export async function addToWhitelist(email: string, role: "AER" | "ADMIN") {
  return prisma.whitelist.create({ data: { email, role } });
}

export async function removeFromWhitelist(email: string) {
  return prisma.whitelist.delete({ where: { email } });
}

/**
 * Synchronise la whitelist DB depuis les variables d'env WHITELIST_ADMINS et WHITELIST_AERS.
 * Appelé au démarrage du serveur. Les emails absents de l'env sont supprimés de la DB.
 * Format : WHITELIST_ADMINS=email1@epitech.eu,email2@epitech.eu
 */
export async function syncWhitelistFromEnv() {
  const admins = parseEmails(process.env["WHITELIST_ADMINS"]);
  const aers = parseEmails(process.env["WHITELIST_AERS"]);

  if (admins.length === 0 && aers.length === 0) return;

  const entries = [
    ...admins.map((email) => ({ email, role: "ADMIN" as const })),
    ...aers.map((email) => ({ email, role: "AER" as const })),
  ];

  for (const entry of entries) {
    await prisma.whitelist.upsert({
      where: { email: entry.email },
      update: { role: entry.role },
      create: entry,
    });
  }

  console.log(`Whitelist seeded from env: ${admins.length} admin(s), ${aers.length} AER(s)`);
}

function parseEmails(raw?: string): string[] {
  return (raw ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}
