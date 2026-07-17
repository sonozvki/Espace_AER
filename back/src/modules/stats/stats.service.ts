import { prisma } from "@/db/prisma";

function schoolYearBounds() {
  const now = new Date();
  const year = now.getMonth() < 8 ? now.getFullYear() - 1 : now.getFullYear();
  return {
    start: new Date(`${year}-09-25T00:00:00.000Z`),
    end: new Date(`${year + 1}-09-24T23:59:59.999Z`),
  };
}

export type GuardStat = {
  userId: number;
  name: string;
  email: string;
  count: number;
};

export async function getGuardStats(): Promise<GuardStat[]> {
  const { start, end } = schoolYearBounds();

  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true },
  });

  const counts = await prisma.guard.groupBy({
    by: ["guardAerId"],
    where: {
      date: { gte: start, lte: end },
      guardAerId: { not: null },
    },
    _count: { id: true },
  });

  const countMap = new Map(counts.map((c) => [c.guardAerId, c._count.id]));

  return users
    .map((u) => ({
      userId: u.id,
      name: u.name,
      email: u.email,
      count: countMap.get(u.id) ?? 0,
    }))
    .sort((a, b) => b.count - a.count);
}
