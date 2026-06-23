import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Remplis avec les emails Epitech des 6 AERs + l'équipe pédago si besoin
const WHITELIST: { email: string; role: "AER" | "ADMIN" }[] = [
  { email: "aryan1@epitech.eu", role: "ADMIN" },
  // { email: "aer2.prenom@epitech.eu", role: "AER" },
  // { email: "aer3.prenom@epitech.eu", role: "AER" },
];

async function main() {
  for (const entry of WHITELIST) {
    await prisma.whitelist.upsert({
      where: { email: entry.email },
      update: {},
      create: entry,
    });
    console.log(`✅ Whitelist: ${entry.email} (${entry.role})`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
