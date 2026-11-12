import { COOKIE, STUDENT_COOKIE, verifySession, verifyStudentSession } from "@/auth/session";
import { prisma } from "@/db/prisma";

export type GuardViewer = { kind: "student" | "aer"; name: string; email: string };

type Cookies = Record<string, { value?: unknown } | undefined>;

/**
 * Personne autorisée à voir le planning des gardes côté étudiants :
 * session étudiante (compte Microsoft Epitech) ou session AER.
 */
export async function getGuardViewer(cookie: Cookies): Promise<GuardViewer | null> {
  const studentToken = cookie[STUDENT_COOKIE]?.value as string | undefined;
  if (studentToken) {
    try {
      const s = await verifyStudentSession(studentToken);
      return { kind: "student", ...s };
    } catch { /* jeton expiré ou invalide : on tente la session AER */ }
  }

  const aerToken = cookie[COOKIE]?.value as string | undefined;
  if (aerToken) {
    try {
      const s = await verifySession(aerToken);
      const user = await prisma.user.findUnique({ where: { id: Number(s.sub) }, select: { name: true, email: true } });
      if (user) return { kind: "aer", ...user };
    } catch { /* idem */ }
  }
  return null;
}
