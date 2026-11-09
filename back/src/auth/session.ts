import { SignJWT, jwtVerify } from "jose";
import type { User } from "@prisma/client";
import { httpStatus } from "@/lib/http";

const secret = new TextEncoder().encode(process.env["JWT_SECRET"] ?? "");
const COOKIE = "aer_session";
const TTL = 60 * 60 * 24 * 7; // 7 jours

/**
 * Sessions étudiantes : cookie ET audience distincts. Les routes AER ne lisent que
 * `aer_session` et exigent role=ADMIN, donc un jeton étudiant n'y donne jamais accès.
 */
const STUDENT_COOKIE = "aer_student_session";
const STUDENT_AUDIENCE = "student";

export class InvalidSessionError extends Error {}

export async function createSession(user: User): Promise<string> {
  return new SignJWT({ sub: String(user.id), role: user.role, email: user.email })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(`${TTL}s`)
    .setIssuedAt()
    .sign(secret);
}

/**
 * Session AER uniquement : refuse tout jeton qui n'est pas un jeton AER (ex. jeton étudiant).
 * Jeton invalide, expiré ou étudiant → 401 (et non une 500 remontée par jose).
 */
export async function verifySession(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret);
    if (payload["role"] !== "ADMIN" || payload.aud !== undefined) throw new InvalidSessionError();
    return payload as { sub: string; role: string; email: string };
  } catch {
    throw httpStatus(401, { error: "Session invalide" });
  }
}

export type StudentSession = { email: string; name: string };

export async function createStudentSession(student: StudentSession): Promise<string> {
  return new SignJWT({ role: "STUDENT", name: student.name, email: student.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(student.email)
    .setAudience(STUDENT_AUDIENCE)
    .setExpirationTime(`${TTL}s`)
    .setIssuedAt()
    .sign(secret);
}

export async function verifyStudentSession(token: string): Promise<StudentSession> {
  const { payload } = await jwtVerify(token, secret, { audience: STUDENT_AUDIENCE });
  if (payload["role"] !== "STUDENT") throw new InvalidSessionError();
  return { email: String(payload["email"] ?? ""), name: String(payload["name"] ?? "") };
}

export function sessionCookieOptions(token: string, name = COOKIE) {
  const isProd = process.env["NODE_ENV"] === "production";
  return {
    name,
    value: token,
    httpOnly: true,
    secure: isProd,
    sameSite: (isProd ? "strict" : "lax") as "strict" | "lax",
    maxAge: TTL,
    path: "/",
  };
}

export { COOKIE, STUDENT_COOKIE };
