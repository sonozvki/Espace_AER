import { SignJWT, jwtVerify } from "jose";
import type { User } from "@prisma/client";

const secret = new TextEncoder().encode(process.env["JWT_SECRET"] ?? "");
const COOKIE = "aer_session";
const TTL = 60 * 60 * 24 * 7; // 7 jours

export async function createSession(user: User): Promise<string> {
  return new SignJWT({ sub: String(user.id), role: user.role, email: user.email })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(`${TTL}s`)
    .setIssuedAt()
    .sign(secret);
}

export async function verifySession(token: string) {
  const { payload } = await jwtVerify(token, secret);
  return payload as { sub: string; role: string; email: string };
}

export function sessionCookieOptions(token: string) {
  return {
    name: COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env["NODE_ENV"] === "production",
    sameSite: "lax" as const,
    maxAge: TTL,
    path: "/",
  };
}

export { COOKIE };
