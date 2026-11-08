import { prisma } from "@/db/prisma";
import { schoolYearFromDate } from "@/lib/dates";
import type { Prisma } from "@prisma/client";

/** Nombre de générations d'AER actives en même temps (FIFO). */
export const AER_GENERATIONS = 2;

export type SchoolYearInfo = { year: number; startDate: Date };

export type SchoolYearBounds = {
  year: number;
  start: Date;
  /** null = année courante, pas encore terminée */
  end: Date | null;
};

let currentCache: SchoolYearInfo | null = null;

export async function getCurrentSchoolYear(): Promise<SchoolYearInfo> {
  if (currentCache) return currentCache;
  let row = await prisma.schoolYear.findFirst({ orderBy: { year: "desc" } });
  if (!row) {
    const year = schoolYearFromDate();
    row = await prisma.schoolYear.upsert({
      where: { year },
      create: { year, startDate: new Date(`${year}-09-25T00:00:00.000Z`) },
      update: {},
    });
  }
  currentCache = { year: row.year, startDate: row.startDate };
  return currentCache;
}

export async function getCurrentYear(): Promise<number> {
  return (await getCurrentSchoolYear()).year;
}

export async function listSchoolYears(): Promise<SchoolYearInfo[]> {
  await getCurrentSchoolYear(); // garantit qu'au moins une année existe
  const rows = await prisma.schoolYear.findMany({ orderBy: { year: "desc" } });
  return rows.map((r) => ({ year: r.year, startDate: r.startDate }));
}

/** Bornes d'une année : [startDate, startDate de l'année suivante[ ; année courante si year absent. */
export async function getSchoolYearBounds(year?: number): Promise<SchoolYearBounds> {
  const current = await getCurrentSchoolYear();
  const target = year ?? current.year;
  const row = await prisma.schoolYear.findUnique({ where: { year: target } });
  const next = await prisma.schoolYear.findFirst({
    where: { year: { gt: target } },
    orderBy: { year: "asc" },
  });
  const start = row?.startDate ?? new Date(`${target}-09-25T00:00:00.000Z`);
  const end = next ? new Date(next.startDate.getTime() - 1) : null;
  return { year: target, start, end };
}

/** Un AER est actif pour l'année Y s'il fait partie des AER_GENERATIONS dernières générations. */
export function isActiveAer(aerSince: number | null, year: number): boolean {
  if (aerSince === null) return true;
  return aerSince <= year && aerSince > year - AER_GENERATIONS;
}

export function activeAerWhere(year: number): Prisma.UserWhereInput {
  return {
    OR: [
      { aerSince: null },
      { aerSince: { lte: year, gt: year - AER_GENERATIONS } },
    ],
  };
}

/** Promo du trombi après un passage d'année : tek1 → tek2, tek2 → tek3… (autres promos inchangées). */
export function nextPromo(promo: string): string {
  const m = promo.match(/^(tek)(\d+)$/i);
  if (!m) return promo;
  return `${m[1]}${Number(m[2]) + 1}`;
}

export type RolloverPreview = {
  from: number;
  to: number;
  leavingAers: { id: number; name: string; email: string; aerSince: number | null }[];
  promoShifts: { from: string; to: string; count: number }[];
};

export async function previewRollover(): Promise<RolloverPreview> {
  const { year } = await getCurrentSchoolYear();
  const to = year + 1;
  const [users, promos] = await Promise.all([
    prisma.user.findMany({
      where: activeAerWhere(year),
      select: { id: true, name: true, email: true, aerSince: true },
      orderBy: { name: "asc" },
    }),
    prisma.studentCache.groupBy({ by: ["promo"], _count: { id: true } }),
  ]);
  return {
    from: year,
    to,
    // Actifs cette année mais plus l'année suivante → sortent de la FIFO
    leavingAers: users.filter((u) => u.aerSince !== null && !isActiveAer(u.aerSince, to)),
    promoShifts: promos
      .filter((p) => nextPromo(p.promo) !== p.promo)
      .map((p) => ({ from: p.promo, to: nextPromo(p.promo), count: p._count.id }))
      .sort((a, b) => a.from.localeCompare(b.from, undefined, { numeric: true })),
  };
}

export class RolloverConflictError extends Error {}

export async function rolloverSchoolYear(userId: number, startDate: Date): Promise<RolloverPreview> {
  const preview = await previewRollover();
  const current = await getCurrentSchoolYear();
  if (startDate <= current.startDate) {
    throw new RolloverConflictError("La date de début doit être postérieure au début de l'année courante");
  }
  if (startDate > new Date()) {
    throw new RolloverConflictError("La date de début ne peut pas être dans le futur");
  }

  // Ordre décroissant (tek3 avant tek2 avant tek1) : chaque promo cible est libérée
  // avant d'être remplie, donc la contrainte unique (login, promo, location) n'est jamais violée.
  const shifts = [...preview.promoShifts].sort((a, b) =>
    b.from.localeCompare(a.from, undefined, { numeric: true })
  );

  try {
    await prisma.$transaction([
      prisma.schoolYear.create({ data: { year: preview.to, startDate } }),
      ...shifts.map((s) =>
        prisma.studentCache.updateMany({ where: { promo: s.from }, data: { promo: s.to } })
      ),
      prisma.auditLog.create({
        data: {
          userId,
          action: "school_year.rollover",
          metadata: {
            from: preview.from,
            to: preview.to,
            startDate: startDate.toISOString().slice(0, 10),
            leavingAers: preview.leavingAers.map((u) => u.email),
            promoShifts: preview.promoShifts,
          },
        },
      }),
    ]);
  } catch (err) {
    if ((err as { code?: string }).code === "P2002") {
      throw new RolloverConflictError("Cette année scolaire existe déjà");
    }
    throw err;
  } finally {
    currentCache = null;
  }

  return preview;
}

export async function listAers(year?: number) {
  const current = await getCurrentYear();
  const y = year ?? current;
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, aerSince: true },
    orderBy: [{ aerSince: "desc" }, { name: "asc" }],
  });
  return users.map((u) => ({ ...u, active: isActiveAer(u.aerSince, y) }));
}

export async function setAerGeneration(userId: number, aerSince: number) {
  return prisma.user.update({
    where: { id: userId },
    data: { aerSince },
    select: { id: true, name: true, email: true, aerSince: true },
  });
}
