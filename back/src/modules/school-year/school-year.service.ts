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

/*
 * Rôles AER pendant l'année scolaire Y (sept. Y → août Y+1) :
 *   - tek2 : aerSince = Y+1, 1re année AER, arrivent en février Y+1 (fév. → juil.)
 *   - tek3 : aerSince = Y,   2e année AER, arrivés en février Y (piscine → mars)
 *   - tek5 : tek5Year = Y,   retour de l'étranger (sept. → mars), ne font pas de gardes
 *   - ancien : tout le reste (garde l'accès, hors stats et gardes)
 * aerSince = année civile d'arrivée en tek2 ; le passage d'année fait sortir la génération
 * la plus ancienne (FIFO) et les tek5 de l'année écoulée.
 */

export type AerFields = { aerSince: number | null; tek5Year: number | null };
export type AerRole = "tek2" | "tek3" | "tek5" | "ancien";

/** Génération des AER qui arrivent en février de l'année scolaire `year`. */
export function arrivingGeneration(year: number): number {
  return year + 1;
}

function isRegularGeneration(aerSince: number | null, year: number): boolean {
  if (aerSince === null) return false;
  const newest = arrivingGeneration(year);
  return aerSince <= newest && aerSince > newest - AER_GENERATIONS;
}

export function aerRole(u: AerFields, year: number): AerRole {
  if (u.tek5Year === year) return "tek5";
  if (isRegularGeneration(u.aerSince, year)) {
    return u.aerSince === arrivingGeneration(year) ? "tek2" : "tek3";
  }
  return "ancien";
}

/** AER en fonction l'année Y (tek2, tek3 ou tek5) : stats logtime/activités, équipe. */
export function isActiveAer(u: AerFields, year: number): boolean {
  return aerRole(u, year) !== "ancien";
}

/** Seuls les tek2/tek3 prennent des gardes. */
export function canTakeGuards(u: AerFields, year: number): boolean {
  const role = aerRole(u, year);
  return role === "tek2" || role === "tek3";
}

function regularWhere(year: number): Prisma.UserWhereInput {
  return { aerSince: { lte: arrivingGeneration(year), gt: arrivingGeneration(year) - AER_GENERATIONS } };
}

export function activeAerWhere(year: number): Prisma.UserWhereInput {
  return { OR: [regularWhere(year), { tek5Year: year }] };
}

export function guardAerWhere(year: number): Prisma.UserWhereInput {
  return {
    AND: [regularWhere(year), { OR: [{ tek5Year: null }, { tek5Year: { not: year } }] }],
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
  leavingAers: { id: number; name: string; email: string; role: AerRole }[];
  promoShifts: { from: string; to: string; count: number }[];
};

export async function previewRollover(): Promise<RolloverPreview> {
  const { year } = await getCurrentSchoolYear();
  const to = year + 1;
  const [users, promos] = await Promise.all([
    prisma.user.findMany({
      where: activeAerWhere(year),
      select: { id: true, name: true, email: true, aerSince: true, tek5Year: true },
      orderBy: { name: "asc" },
    }),
    prisma.studentCache.groupBy({ by: ["promo"], _count: { id: true } }),
  ]);
  return {
    from: year,
    to,
    // Actifs cette année mais plus l'année suivante → tek3 sortants (FIFO) et tek5 de l'année
    leavingAers: users
      .filter((u) => !isActiveAer(u, to))
      .map((u) => ({ id: u.id, name: u.name, email: u.email, role: aerRole(u, year) })),
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

const ROLE_ORDER: Record<AerRole, number> = { tek2: 0, tek3: 1, tek5: 2, ancien: 3 };

export async function listAers(year?: number) {
  const y = year ?? (await getCurrentYear());
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, aerSince: true, tek5Year: true },
    orderBy: { name: "asc" },
  });
  return users
    .map((u) => ({
      ...u,
      role: aerRole(u, y),
      active: isActiveAer(u, y),
      canTakeGuards: canTakeGuards(u, y),
    }))
    .sort((a, b) => ROLE_ORDER[a.role] - ROLE_ORDER[b.role]);
}

/** Change le rôle d'un AER pour l'année courante en gardant aerSince et tek5Year cohérents. */
export async function setAerRole(userId: number, role: AerRole) {
  const year = await getCurrentYear();
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { aerSince: true, tek5Year: true },
  });
  const regular = isRegularGeneration(user.aerSince, year);

  const data: AerFields = (() => {
    switch (role) {
      case "tek2":
        return { aerSince: arrivingGeneration(year), tek5Year: null };
      case "tek3":
        return { aerSince: year, tek5Year: null };
      case "tek5":
        // Génération d'origine conservée si elle est ancienne (ex. ancien AER tek3 revenu en tek5)
        return { aerSince: regular ? null : user.aerSince, tek5Year: year };
      case "ancien":
        return {
          aerSince: regular ? arrivingGeneration(year) - AER_GENERATIONS : user.aerSince,
          tek5Year: user.tek5Year === year ? null : user.tek5Year,
        };
    }
  })();

  return prisma.user.update({
    where: { id: userId },
    data,
    select: { id: true, name: true, email: true, aerSince: true, tek5Year: true },
  });
}
