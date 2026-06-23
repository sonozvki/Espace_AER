import { apiFetch } from "@/lib/api";
import type { Memo, CreateMemoInput } from "./types";

export const memosApi = {
  list: () => apiFetch<Memo[]>("/memos"),

  get: (id: number) => apiFetch<Memo>(`/memos/${id}`),

  create: (body: CreateMemoInput) =>
    apiFetch<Memo>("/memos", { method: "POST", body: JSON.stringify(body) }),

  update: (id: number, body: Partial<CreateMemoInput>) =>
    apiFetch<Memo>(`/memos/${id}`, { method: "PATCH", body: JSON.stringify(body) }),

  delete: (id: number) => apiFetch<void>(`/memos/${id}`, { method: "DELETE" }),
};
