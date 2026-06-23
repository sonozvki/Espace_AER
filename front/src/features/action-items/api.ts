import { apiFetch } from "@/lib/api";
import type { ActionItem, CreateActionItemInput, UpdateActionItemInput } from "./types";

export const actionItemsApi = {
  list: () => apiFetch<ActionItem[]>("/api/action-items"),

  create: (body: CreateActionItemInput) =>
    apiFetch<ActionItem>("/api/action-items", { method: "POST", body: JSON.stringify(body) }),

  update: (id: number, body: UpdateActionItemInput) =>
    apiFetch<ActionItem>(`/api/action-items/${id}`, { method: "PATCH", body: JSON.stringify(body) }),

  delete: (id: number) => apiFetch<void>(`/api/action-items/${id}`, { method: "DELETE" }),
};
