import { apiFetch } from "@/lib/api";
import type { Memo, CreateMemoInput } from "./types";

export const memosApi = {
  list: () => apiFetch<Memo[]>("/api/memos"),

  get: (id: number) => apiFetch<Memo>(`/api/memos/${id}`),

  create: (body: CreateMemoInput) =>
    apiFetch<Memo>("/api/memos", { method: "POST", body: JSON.stringify(body) }),

  update: (id: number, body: Partial<CreateMemoInput>) =>
    apiFetch<Memo>(`/api/memos/${id}`, { method: "PATCH", body: JSON.stringify(body) }),

  delete: (id: number) => apiFetch<void>(`/api/memos/${id}`, { method: "DELETE" }),
};
