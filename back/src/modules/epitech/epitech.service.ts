import { prisma } from "@/db/prisma";
import { decrypt } from "@/lib/crypto";

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
};

export type IntraModuleNote = {
  codemodule: string;
  title: string;
  grade: string | null;
  credits: number | null;
  note: number | null;
  scolaryear: number | null;
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

async function intraCookieFetch<T>(userId: number, path: string): Promise<T> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { epitechToken: true },
  });
  if (!user?.epitechToken) throw new EpitechTokenMissingError();

  const cookie = decrypt(user.epitechToken);
  console.log(`[intraCookieFetch] cookie len=${cookie.length} starts=${cookie.slice(0, 8)}`);
  let res: Response;
  try {
    res = await fetch(`${INTRA_BASE}${path}`, {
      headers: {
        Cookie: `user=${cookie}`,
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
      },
      redirect: "follow",
    });
  } catch (err) {
    console.error(`[intraCookieFetch] network error on ${path}:`, err);
    throw new EpitechUpstreamError();
  }

  console.log(`[intraCookieFetch] ${res.status} on ${path}`);
  if (res.status === 401 || res.status === 403) throw new EpitechTokenInvalidError();
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`[intraCookieFetch] upstream error ${res.status} on ${path}: ${body.slice(0, 200)}`);
    throw new EpitechUpstreamError();
  }

  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new EpitechTokenInvalidError();
  }
}

function schoolYear() {
  const now = new Date();
  // L'année scolaire démarre en septembre : avant sept = année précédente
  return now.getMonth() < 8 ? now.getFullYear() - 1 : now.getFullYear();
}

export async function getIntraPromos(
  userId: number,
  location = "FR/NCE",
  year?: number
): Promise<string[]> {
  const path = `/user/filter/promo?format=json&location=${location}&year=${year ?? schoolYear()}&active=true`;
  const data = await intraCookieFetch<unknown>(userId, path);
  console.log("[getIntraPromos] raw:", JSON.stringify(data).slice(0, 300));
  if (!Array.isArray(data)) return [];
  return data.map((d) => (typeof d === "string" ? d : String((d as Record<string, unknown>)["promo"] ?? (d as Record<string, unknown>)["code"] ?? d)));
}

export async function getIntraStudents(
  userId: number,
  params: { location: string; year?: number; promo: string }
): Promise<IntraStudent[]> {
  // Ne pas encoder les slashes (location FR/NCE, promo bachelor/classic)
  const path = `/user/filter/user?format=json&location=${params.location}&year=${params.year ?? schoolYear()}&active=true&promo=${params.promo}&offset=0`;

  const list = await intraCookieFetch<{ items?: Record<string, unknown>[]; total?: number }>(userId, path);
  console.log("[getIntraStudents] total:", list.total, "items:", list.items?.length ?? 0, "keys:", Object.keys(list));
  const students = list.items ?? [];

  const enriched = await Promise.all(
    students.map(async (s) => {
      const login = String(s["login"] ?? "");
      try {
        const profile = await intraCookieFetch<Record<string, unknown>>(
          userId,
          `/user/${encodeURIComponent(login)}/?format=json`
        );
        const gpaArr = Array.isArray(profile["gpa"])
          ? (profile["gpa"] as { gpa: string }[])
          : [];
        const gpaRaw = gpaArr[0]?.gpa ? Number(gpaArr[0].gpa) : null;
        return {
          login,
          firstName: String(profile["firstname"] ?? s["prenom"] ?? ""),
          lastName: String(profile["lastname"] ?? s["nom"] ?? ""),
          semester: typeof profile["semester"] === "number" ? profile["semester"] : null,
          gpa: gpaRaw !== null && !Number.isNaN(gpaRaw) ? gpaRaw : null,
          credits: typeof profile["credits"] === "number" ? profile["credits"] : null,
        };
      } catch {
        return {
          login,
          firstName: String(s["prenom"] ?? ""),
          lastName: String(s["nom"] ?? ""),
          semester: null,
          gpa: null,
          credits: null,
        };
      }
    })
  );

  return enriched;
}

export async function getMyActivities(
  userId: number,
  start: string,
  end: string
): Promise<EpitechActivity[]> {
  const url = `/planning/load?format=json&start=${start}&end=${end}`;
  let data: unknown;
  try {
    data = await intraCookieFetch<unknown>(userId, url);
  } catch (err) {
    throw err;
  }

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

  const modules = ((raw["modules"] ?? []) as Record<string, unknown>[]).map((m) => ({
    codemodule: String(m["codemodule"] ?? ""),
    title: String(m["title"] ?? ""),
    grade: m["grade"] != null ? String(m["grade"]) : null,
    credits: typeof m["credits"] === "number" ? m["credits"] : null,
    note: m["note"] != null ? Number(m["note"]) : null,
    scolaryear: typeof m["scolaryear"] === "number" ? m["scolaryear"] : null,
  }));

  const activities = ((raw["notes"] ?? []) as Record<string, unknown>[]).map((n) => ({
    title: String(n["title"] ?? ""),
    codemodule: String(n["codemodule"] ?? ""),
    note: n["note"] != null ? Number(n["note"]) : null,
    comment: n["comment"] != null ? String(n["comment"]) : null,
  }));

  return { modules, activities };
}
