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
