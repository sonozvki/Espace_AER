import { prisma } from "@/db/prisma";

export async function findWhitelistEntry(email: string) {
  return prisma.whitelist.findUnique({ where: { email } });
}

export async function addToWhitelist(email: string) {
  return prisma.whitelist.create({ data: { email, role: "ADMIN" } });
}

export async function removeFromWhitelist(email: string) {
  return prisma.whitelist.delete({ where: { email } });
}

/**
 * Synchronise la whitelist DB depuis la variable d'env WHITELIST_ADMINS.
 * Format : WHITELIST_ADMINS=email1@epitech.eu,email2@epitech.eu
 */
export async function syncWhitelistFromEnv() {
  const emails = parseEmails(process.env["WHITELIST_ADMINS"]);
  if (emails.length === 0) return;

  for (const email of emails) {
    await prisma.whitelist.upsert({
      where: { email },
      update: { role: "ADMIN" },
      create: { email, role: "ADMIN" },
    });
  }

  console.log(`Whitelist seeded from env: ${emails.length} admin(s)`);
}

function parseEmails(raw?: string): string[] {
  return (raw ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}
