import { prisma } from "@/db/prisma";

const AER_SELECT = { select: { id: true, name: true, email: true, role: true } } as const;

const GUARD_INCLUDE = {
  guardAer: AER_SELECT,
  absentAers: AER_SELECT,
} as const;

interface GuardInput {
  date: Date;
  isPublicHoliday?: boolean;
  publicHolidayName?: string | null;
  isSchoolHoliday?: boolean;
  schoolHolidayName?: string | null;
}

export const guardsRepository = {
  findAll() {
    return prisma.guard.findMany({
      orderBy: { date: "asc" },
      include: GUARD_INCLUDE,
    });
  },

  findById(id: number) {
    return prisma.guard.findUnique({ where: { id }, include: GUARD_INCLUDE });
  },

  findByDate(date: Date) {
    return prisma.guard.findUnique({ where: { date }, include: GUARD_INCLUDE });
  },

  async upsertMany(guards: GuardInput[]) {
    const results = await prisma.$transaction(
      guards.map((g) =>
        prisma.guard.upsert({
          where: { date: g.date },
          create: {
            date: g.date,
            isPublicHoliday: g.isPublicHoliday ?? false,
            publicHolidayName: g.publicHolidayName ?? null,
            isSchoolHoliday: g.isSchoolHoliday ?? false,
            schoolHolidayName: g.schoolHolidayName ?? null,
          },
          update: {
            isPublicHoliday: g.isPublicHoliday ?? false,
            publicHolidayName: g.publicHolidayName ?? null,
            isSchoolHoliday: g.isSchoolHoliday ?? false,
            schoolHolidayName: g.schoolHolidayName ?? null,
          },
        })
      )
    );
    return { created: results.length };
  },

  assign(id: number, guardAerId: number | null) {
    return prisma.guard.update({ where: { id }, data: { guardAerId }, include: GUARD_INCLUDE });
  },

  addAbsent(id: number, userId: number) {
    return prisma.guard.update({
      where: { id },
      data: { absentAers: { connect: { id: userId } } },
      include: GUARD_INCLUDE,
    });
  },

  removeAbsent(id: number, userId: number) {
    return prisma.guard.update({
      where: { id },
      data: { absentAers: { disconnect: { id: userId } } },
      include: GUARD_INCLUDE,
    });
  },
};
