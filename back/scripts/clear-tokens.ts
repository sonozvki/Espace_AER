import { prisma } from "@/db/prisma";

const result = await prisma.user.updateMany({ data: { epitechToken: null } });
console.log(`Cleared ${result.count} token(s)`);

const users = await prisma.user.findMany({ select: { id: true, email: true, epitechToken: true } });
for (const u of users) {
  console.log(`  id=${u.id} ${u.email} token=${u.epitechToken === null ? "NULL" : u.epitechToken.slice(0, 20) + "..."}`);
}

await prisma.$disconnect();
