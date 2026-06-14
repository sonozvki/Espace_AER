import { prisma } from "@/db/prisma";

export const guardsRepository = {
  findAll() {
    return prisma.guard.findMany({
      orderBy: { date: "asc" },
      include: { aer: true },
    });
  },

  findById(id: number) {
    return prisma.guard.findUnique({ where: { id }, include: { aer: true } });
  },

  findByDate(date: Date) {
    return prisma.guard.findUnique({ where: { date }, include: { aer: true } });
  },

  createMany(dates: Date[]) {
    return prisma.guard.createMany({
      data: dates.map((date) => ({ date })),
      skipDuplicates: true,
    });
  },

  assign(id: number, aerId: number | null) {
    return prisma.guard.update({ where: { id }, data: { aerId }, include: { aer: true } });
  },
};
