import { Elysia, t } from "elysia";
import { prisma } from "@/db/prisma";
import { httpStatus } from "@/lib/http";
import { getGuardViewer } from "@/auth/viewer";

/**
 * Routes destinées aux étudiants : session étudiante (compte Microsoft Epitech) ou AER.
 * N'exposer ici que le strict nécessaire : pas d'email, pas d'absences ni d'indispos.
 */

const MAX_DAYS = 14;

/** Date du jour à Paris au format YYYY-MM-DD (les gardes sont stockées en @db.Date). */
function todayInParis(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** "John Doe" → "John D." */
function publicName(name: string): string {
  const [first, ...rest] = name.trim().split(/\s+/);
  const last = rest.at(-1);
  return last ? `${first} ${last[0]!.toUpperCase()}.` : first ?? "";
}

export type PublicGuardDay = {
  date: string;
  aer: string | null;
  publicHolidayName: string | null;
  schoolHolidayName: string | null;
};

export const studentController = new Elysia({ prefix: "/student" })
  .derive(async ({ cookie }) => {
    const viewer = await getGuardViewer(cookie);
    if (!viewer) throw httpStatus(401, { error: "Non authentifié" });
    return { viewer };
  })
  .get(
  "/guards",
  async ({ query, set }) => {
    const days = Math.min(Math.max(Number(query.days ?? 7) || 7, 1), MAX_DAYS);
    const today = todayInParis();
    const start = new Date(`${today}T00:00:00.000Z`);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + days - 1);

    const guards = await prisma.guard.findMany({
      where: { date: { gte: start, lte: end } },
      orderBy: { date: "asc" },
      select: {
        date: true,
        isPublicHoliday: true,
        publicHolidayName: true,
        isSchoolHoliday: true,
        schoolHolidayName: true,
        guardAer: { select: { name: true } },
      },
    });

    set.headers["Cache-Control"] = "private, max-age=60";
    return {
      today,
      days: guards.map(
        (g): PublicGuardDay => ({
          date: g.date.toISOString().slice(0, 10),
          aer: g.guardAer ? publicName(g.guardAer.name) : null,
          publicHolidayName: g.isPublicHoliday ? (g.publicHolidayName ?? "Jour férié") : null,
          schoolHolidayName: g.isSchoolHoliday ? (g.schoolHolidayName ?? "Vacances") : null,
        })
      ),
    };
  },
  { query: t.Object({ days: t.Optional(t.String()) }) }
);
