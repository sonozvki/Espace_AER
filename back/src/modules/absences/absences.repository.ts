import { prisma } from "@/db/prisma";

export const absencesRepository = {
  findAll() {
    return prisma.absence.findMany({
      orderBy: { date: "asc" },
      include: { user: true },
    });
  },

  findById(id: number) {
    return prisma.absence.findUnique({ where: { id }, include: { user: true } });
  },

  create(date: Date, userId: number) {
    return prisma.absence.upsert({
      where: { date_userId: { date, userId } },
      update: {},
      create: { date, userId },
      include: { user: true },
    });
  },

  delete(id: number) {
    return prisma.absence.delete({ where: { id } });
  },
};
