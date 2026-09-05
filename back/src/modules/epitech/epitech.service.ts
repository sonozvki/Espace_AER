import { prisma } from "@/db/prisma";
import { decrypt } from "@/lib/crypto";
import { schoolYear } from "@/lib/dates";

const INTRA_BASE = "https://intra.epitech.eu";

type RawEvent = {
  codemodule?: string;
  titlemodule?: string;
  acti_title?: string;
  type_title?: string;
  start?: string;
  end?: string;
  codeevent?: string;
  codeacti?: string;
  room?: { code?: string } | null;
  status_manager?: string | null;
};

export type EpitechActivity = {
  id: string;
  module: string;
  moduleTitle: string;
  title: string;
  type: string;
  start: string;
  end: string;
  room: string | null;
  status: string | null;
};

export type IntraStudent = {
  login: string;
  firstName: string;
  lastName: string;
  semester: number | null;
  gpa: number | null;
  credits: number | null;
  netsoulHours: number | null;
};

export type IntraModuleNote = {
  codemodule: string;
  codeinstance: string | null;
  title: string;
  grade: string | null;
  credits: number | null;
  note: number | null;
  scolaryear: number | null;
  semester: number | null;
  cycle: string | null;
  begin: string | null;
};

export type IntraActivityNote = {
  title: string;
  codemodule: string;
  note: number | null;
  comment: string | null;
};

export type IntraStudentNotes = {
  modules: IntraModuleNote[];
  activities: IntraActivityNote[];
};

export class EpitechTokenMissingError extends Error {}
export class EpitechTokenInvalidError extends Error {}
export class EpitechUpstreamError extends Error {}

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";

export async function getUserCookie(userId: number): Promise<string> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { epitechToken: true } });
  if (!user?.epitechToken) throw new EpitechTokenMissingError();
  return decrypt(user.epitechToken);
}

export async function fetchIntra<T>(cookie: string, path: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${INTRA_BASE}${path}`, {
      headers: { Cookie: `user=${cookie}`, "User-Agent": UA },
      redirect: "follow",
    });
  } catch (err) {
    console.error(`[fetchIntra] network error on ${path}:`, err);
    throw new EpitechUpstreamError();
  }

  if (res.status === 401 || res.status === 403) throw new EpitechTokenInvalidError();
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`[fetchIntra] ${res.status} on ${path}: ${body.slice(0, 200)}`);
    throw new EpitechUpstreamError();
  }

  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new EpitechTokenInvalidError();
  }
}

async function intraCookieFetch<T>(userId: number, path: string): Promise<T> {
  const cookie = await getUserCookie(userId);
  return fetchIntra<T>(cookie, path);
}

export async function getIntraPromos(
  userId: number,
  location = "FR/NCE"
): Promise<string[]> {
  const path = `/user/filter/promo?format=json&location=${location}&year=${schoolYear()}&active=true`;
  const data = await intraCookieFetch<unknown>(userId, path);
  if (!Array.isArray(data)) return [];
  return data.map((d) => (typeof d === "string" ? d : String((d as Record<string, unknown>)["promo"] ?? (d as Record<string, unknown>)["code"] ?? d)));
}

export async function getIntraStudents(
  userId: number,
  params: { location: string; promo: string }
): Promise<IntraStudent[]> {
  const path = `/user/filter/user?format=json&location=${params.location}&year=${schoolYear()}&active=true&promo=${params.promo}&offset=0`;

  const cookie = await getUserCookie(userId);
  const list = await fetchIntra<{ items?: Record<string, unknown>[]; total?: number }>(cookie, path);
  const students = list.items ?? [];

  const netsoulStart = `${schoolYear()}-09-25`;
  const netsoulEnd = new Date().toISOString().slice(0, 10);

  const enriched = await Promise.all(
    students.map(async (s) => {
      const login = String(s["login"] ?? "");
      try {
        const [profile, netsoul] = await Promise.all([
          fetchIntra<Record<string, unknown>>(cookie, `/user/${encodeURIComponent(login)}/?format=json`),
          fetchIntra<number[][]>(cookie, `/user/${encodeURIComponent(login)}/netsoul?format=json&start=${netsoulStart}&end=${netsoulEnd}`).catch(() => null),
        ]);

        const gpaArr = Array.isArray(profile["gpa"]) ? (profile["gpa"] as { gpa: string }[]) : [];
        const gpaRaw = gpaArr[0]?.gpa ? Number(gpaArr[0].gpa) : null;

        // Netsoul : somme des secondes actives (index 1), divisée par 3600
        const netsoulSecs = netsoul ? netsoul.reduce((acc, row) => acc + (row[1] && row[1] > 0 ? row[1] : 0), 0) : null;

        return {
          login,
          firstName: String(profile["firstname"] ?? s["prenom"] ?? ""),
          lastName: String(profile["lastname"] ?? s["nom"] ?? ""),
          semester: typeof profile["semester"] === "number" ? profile["semester"] : null,
          gpa: gpaRaw !== null && !Number.isNaN(gpaRaw) ? gpaRaw : null,
          credits: typeof profile["credits"] === "number" ? profile["credits"] : null,
          netsoulHours: netsoulSecs !== null ? Math.round(netsoulSecs / 3600) : null,
        };
      } catch {
        return {
          login,
          firstName: String(s["prenom"] ?? ""),
          lastName: String(s["nom"] ?? ""),
          semester: null,
          gpa: null,
          credits: null,
          netsoulHours: null,
        };
      }
    })
  );

  return enriched;
}

export async function getStudentsFromCache(promo: string, location: string): Promise<IntraStudent[]> {
  const rows = await prisma.studentCache.findMany({
    where: { promo, location },
    orderBy: { lastName: "asc" },
  });
  return rows.map((r) => ({
    login: r.login,
    firstName: r.firstName,
    lastName: r.lastName,
    semester: r.semester,
    gpa: r.gpa,
    credits: r.credits,
    netsoulHours: r.netsoulHours,
  }));
}

export async function saveStudentsToCache(students: IntraStudent[], promo: string, location: string): Promise<void> {
  await prisma.$transaction(
    students.map((s) =>
      prisma.studentCache.upsert({
        where: { login_promo_location: { login: s.login, promo, location } },
        create: { login: s.login, promo, location, firstName: s.firstName, lastName: s.lastName, semester: s.semester, gpa: s.gpa, credits: s.credits, netsoulHours: s.netsoulHours, syncedAt: new Date() },
        update: { firstName: s.firstName, lastName: s.lastName, semester: s.semester, gpa: s.gpa, credits: s.credits, netsoulHours: s.netsoulHours, syncedAt: new Date() },
      })
    )
  );
}

export async function getMyActivities(
  userId: number,
  start: string,
  end: string
): Promise<EpitechActivity[]> {
  const url = `/planning/load?format=json&start=${start}&end=${end}`;
  const data = await intraCookieFetch<unknown>(userId, url);
  const events: RawEvent[] = Array.isArray(data) ? (data as RawEvent[]) : [];

  return events
    .filter((e) => e.status_manager != null && e.status_manager !== "")
    .map((e) => ({
      id: e.codeevent ?? e.codeacti ?? `${e.codemodule ?? "?"}-${e.start ?? ""}`,
      module: e.codemodule ?? "",
      moduleTitle: e.titlemodule ?? "",
      title: e.acti_title ?? "",
      type: e.type_title ?? "",
      start: e.start ?? "",
      end: e.end ?? "",
      room: e.room?.code ?? null,
      status: e.status_manager ?? null,
    }))
    .sort((a, b) => a.start.localeCompare(b.start));
}

export async function getStudentNotes(userId: number, login: string): Promise<IntraStudentNotes> {
  const raw = await intraCookieFetch<Record<string, unknown>>(
    userId,
    `/user/${encodeURIComponent(login)}/notes?format=json`
  );

  const modules = ((raw["modules"] ?? []) as Record<string, unknown>[]).map((m) => {
    const codemodule = String(m["codemodule"] ?? "");
    const codeinstance = m["codeinstance"] != null ? String(m["codeinstance"]) : null;
    // Semestre dérivé du codemodule : centaines du suffixe numérique (G-CPE-100→1, G-ING-200→2, G-ENG-001→0)
    const numMatch = codemodule.match(/-(\d+)$/);
    const semester = numMatch ? Math.floor(Number(numMatch[1]) / 100) : null;

    return {
      codemodule,
      codeinstance,
      title: String(m["title"] ?? ""),
      grade: m["grade"] != null ? String(m["grade"]) : null,
      credits: m["credits"] != null ? Number(m["credits"]) : null,
      note: m["note"] != null ? Number(m["note"]) : null,
      scolaryear: typeof m["scolaryear"] === "number" ? m["scolaryear"] : null,
      semester,
      cycle: m["cycle"] != null ? String(m["cycle"]) : null,
      begin: m["begin"] != null ? String(m["begin"]) : null,
    };
  });

  const activities = ((raw["notes"] ?? []) as Record<string, unknown>[]).map((n) => ({
    title: String(n["title"] ?? ""),
    codemodule: String(n["codemodule"] ?? ""),
    note: n["note"] != null ? Number(n["note"]) : null,
    comment: n["comment"] != null ? String(n["comment"]) : null,
  }));

  return { modules, activities };
}
