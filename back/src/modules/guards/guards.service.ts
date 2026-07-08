import { guardsRepository } from "./guards.repository";
import { startOfDay } from "@/lib/dates";

interface SchoolHolidayPeriod {
  description: string;
  start_date: string;
  end_date: string;
}

// Iterate over a date range using noon UTC to avoid DST/TZ day-boundary issues
function* dateRange(startStr: string, endStr: string): Generator<string> {
  const d = new Date(`${startStr}T12:00:00Z`);
  const end = new Date(`${endStr}T12:00:00Z`);
  while (d <= end) {
    yield d.toISOString().substring(0, 10);
    d.setUTCDate(d.getUTCDate() + 1);
  }
}

async function fetchPublicHolidays(year: number): Promise<Record<string, string>> {
  try {
    const res = await fetch(
      `https://calendrier.api.gouv.fr/jours-feries/metropole/${year}.json`
    );
    if (!res.ok) return {};
    return res.json() as Promise<Record<string, string>>;
  } catch {
    return {};
  }
}

async function fetchSchoolHolidays(year: number): Promise<Map<string, string>> {
  const byDate = new Map<string, string>();
  try {
    const url = new URL(
      "https://data.education.gouv.fr/api/explore/v2.1/catalog/datasets/fr-en-calendrier-scolaire/records"
    );
    url.searchParams.set("where", `location="Zone B"`);
    url.searchParams.set("limit", "100");
    const res = await fetch(url.toString());
    if (!res.ok) return byDate;

    const data = (await res.json()) as { results?: SchoolHolidayPeriod[] };
    for (const period of data.results ?? []) {
      const startStr = period.start_date.substring(0, 10);
      const endStr = period.end_date.substring(0, 10);
      for (const key of dateRange(startStr, endStr)) {
        if (key.startsWith(String(year))) {
          byDate.set(key, period.description);
        }
      }
    }
  } catch {
    // fall through with empty map — calendar still works without vacation data
  }
  return byDate;
}

export const guardsService = {
  listGuards() {
    return guardsRepository.findAll();
  },

  getGuard(id: number) {
    return guardsRepository.findById(id);
  },

  async generateYear(year: number) {
    const [publicHolidays, schoolHolidayByDate] = await Promise.all([
      fetchPublicHolidays(year),
      fetchSchoolHolidays(year),
    ]);

    const guards: Array<{
      date: Date;
      isPublicHoliday: boolean;
      publicHolidayName: string | null;
      isSchoolHoliday: boolean;
      schoolHolidayName: string | null;
    }> = [];

    for (const key of dateRange(`${year}-01-01`, `${year}-12-31`)) {
      const dow = new Date(`${key}T12:00:00Z`).getUTCDay();
      if (dow === 0) continue; // skip Sunday
      guards.push({
        date: new Date(`${key}T00:00:00.000Z`),
        isPublicHoliday: key in publicHolidays,
        publicHolidayName: publicHolidays[key] ?? null,
        isSchoolHoliday: schoolHolidayByDate.has(key),
        schoolHolidayName: schoolHolidayByDate.get(key) ?? null,
      });
    }

    return guardsRepository.upsertMany(guards);
  },

  async assign(id: number, guardAerId: number | null) {
    const guard = await guardsRepository.findById(id);
    if (!guard) throw new Error("NOT_FOUND");
    if (startOfDay(guard.date) < startOfDay(new Date())) throw new Error("PAST_GUARD");
    return guardsRepository.assign(id, guardAerId);
  },

  async declareAbsent(guardId: number, userId: number) {
    const guard = await guardsRepository.findById(guardId);
    if (!guard) throw new Error("NOT_FOUND");
    if (startOfDay(guard.date) < startOfDay(new Date())) throw new Error("PAST_GUARD");
    // Si cet AER tenait la garde, on la libère
    if (guard.guardAerId === userId) await guardsRepository.assign(guardId, null);
    return guardsRepository.addAbsent(guardId, userId);
  },

  async cancelAbsent(guardId: number, userId: number) {
    const guard = await guardsRepository.findById(guardId);
    if (!guard) throw new Error("NOT_FOUND");
    if (startOfDay(guard.date) < startOfDay(new Date())) throw new Error("PAST_GUARD");
    if (!guard.absentAers.some((u) => u.id === userId)) throw new Error("NOT_ABSENT");
    return guardsRepository.removeAbsent(guardId, userId);
  },

  async declareUnavailable(guardId: number, userId: number) {
    const guard = await guardsRepository.findById(guardId);
    if (!guard) throw new Error("NOT_FOUND");
    if (startOfDay(guard.date) < startOfDay(new Date())) throw new Error("PAST_GUARD");
    if (guard.guardAerId === userId) await guardsRepository.assign(guardId, null);
    return guardsRepository.addUnavailable(guardId, userId);
  },

  async cancelUnavailable(guardId: number, userId: number) {
    const guard = await guardsRepository.findById(guardId);
    if (!guard) throw new Error("NOT_FOUND");
    if (startOfDay(guard.date) < startOfDay(new Date())) throw new Error("PAST_GUARD");
    if (!guard.unavailableAers.some((u) => u.id === userId)) throw new Error("NOT_UNAVAILABLE");
    return guardsRepository.removeUnavailable(guardId, userId);
  },
};
