import { prisma } from "@/db/prisma";
import { decrypt } from "@/lib/crypto";
import { isoDay } from "@/lib/dates";
import { getUserCookie, fetchIntra, EpitechTokenMissingError } from "@/modules/epitech/epitech.service";
import { getSchoolYearBounds, activeAerWhere, guardAerWhere } from "@/modules/school-year/school-year.service";

/**
 * Bornes et AER concernés pour une année scolaire (courante par défaut).
 * Les AER sortis de la FIFO n'apparaissent plus dans les stats de l'année courante,
 * mais restent visibles dans les stats des années où ils étaient actifs.
 */
async function statsScope(year?: number) {
  const bounds = await getSchoolYearBounds(year);
  const end = bounds.end ?? new Date();
  return {
    start: bounds.start,
    end,
    startDay: isoDay(bounds.start),
    endDay: isoDay(end < new Date() ? end : new Date()),
    userWhere: activeAerWhere(bounds.year),
    // Les tek5 ne font pas de gardes : absents des stats de gardes
    guardUserWhere: guardAerWhere(bounds.year),
  };
}

function deriveStudentLogin(aerEmail: string): string {
  // prénom1.nom@epitech.eu → prénom.nom@epitech.eu
  return aerEmail.replace(/\d+/, "");
}

// Gardes

export type GuardStat = {
  userId: number;
  name: string;
  email: string;
  count: number;
};

export async function getGuardStats(year?: number): Promise<GuardStat[]> {
  const { start, end, guardUserWhere } = await statsScope(year);

  const users = await prisma.user.findMany({
    where: guardUserWhere,
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

// Netsoul

export type AerNetsoulStat = {
  userId: number;
  name: string;
  email: string;
  studentLogin: string;
  totalHours: number | null;
};

export async function getAerNetsoulStats(requestingUserId: number, year?: number): Promise<AerNetsoulStat[]> {
  const { startDay: start, endDay: end, userWhere } = await statsScope(year);

  let cookie: string;
  try {
    cookie = await getUserCookie(requestingUserId);
  } catch {
    throw new EpitechTokenMissingError();
  }

  const users = await prisma.user.findMany({
    where: userWhere,
    select: { id: true, name: true, email: true },
  });

  const results = await Promise.all(
    users.map(async (u) => {
      const studentLogin = deriveStudentLogin(u.email);
      try {
        const netsoul = await fetchIntra<number[][]>(
          cookie,
          `/user/${encodeURIComponent(studentLogin)}/netsoul?format=json&start=${start}&end=${end}`
        );
        const secs = netsoul.reduce((acc, row) => acc + (row[1] && row[1] > 0 ? row[1] : 0), 0);
        return { userId: u.id, name: u.name, email: u.email, studentLogin, totalHours: Math.round(secs / 3600) };
      } catch {
        return { userId: u.id, name: u.name, email: u.email, studentLogin, totalHours: null };
      }
    })
  );

  return results.sort((a, b) => (b.totalHours ?? -1) - (a.totalHours ?? -1));
}

// Activités

export type AerActivityItem = {
  title: string;
  type: string;
  moduleTitle: string;
  start: string;
};

export type AerActivityStat = {
  userId: number;
  name: string;
  email: string;
  count: number | null;
  activities: AerActivityItem[] | null;
};

type RawEvent = {
  titlemodule?: string;
  acti_title?: string;
  type_title?: string;
  start?: string;
  status_manager?: string | null;
};

export async function getAerActivityStats(year?: number): Promise<AerActivityStat[]> {
  const { startDay: start, endDay: end, userWhere } = await statsScope(year);

  const users = await prisma.user.findMany({
    where: userWhere,
    select: { id: true, name: true, email: true, epitechToken: true },
  });

  const results = await Promise.all(
    users.map(async (u) => {
      if (!u.epitechToken) {
        return { userId: u.id, name: u.name, email: u.email, count: null, activities: null };
      }

      try {
        const cookie = decrypt(u.epitechToken);
        const data = await fetchIntra<RawEvent[]>(
          cookie,
          `/planning/load?format=json&start=${start}&end=${end}`
        );
        const staffActivities = (Array.isArray(data) ? data : [])
          .filter((e) => e.status_manager != null && e.status_manager !== "")
          .map((e) => ({
            title: e.acti_title ?? "",
            type: e.type_title ?? "",
            moduleTitle: e.titlemodule ?? "",
            start: e.start ?? "",
          }))
          .sort((a, b) => a.start.localeCompare(b.start));

        return {
          userId: u.id,
          name: u.name,
          email: u.email,
          count: staffActivities.length,
          activities: staffActivities,
        };
      } catch {
        return { userId: u.id, name: u.name, email: u.email, count: null, activities: null };
      }
    })
  );

  return results.sort((a, b) => (b.count ?? -1) - (a.count ?? -1));
}
