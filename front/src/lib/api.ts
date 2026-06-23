import { treaty } from "@elysiajs/eden";
import type { App } from "@back/server";

export const BASE_URL = import.meta.env["VITE_API_URL"] ?? "http://localhost:8081";

// Eden Treaty client — type-safe for simple routes (GET /memos, GET /auth/me, etc.)
export const api = treaty<App>(BASE_URL, {
  fetch: { credentials: "include" },
});

// Generic fetch wrapper for routes with path params or when Eden Treaty types are inconvenient
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: "include",
    ...init,
    headers: {
      ...(init?.body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });
  if (res.status === 204) return undefined as T;
  const data: unknown = await res.json();
  if (!res.ok) throw data;
  return data as T;
}
