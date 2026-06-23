import { apiFetch } from "@/lib/api";
import type { ActionItem, CreateActionItemInput, UpdateActionItemInput } from "./types";

export const actionItemsApi = {
  list: () => apiFetch<ActionItem[]>("/action-items"),

  create: (body: CreateActionItemInput) =>
    apiFetch<ActionItem>("/action-items", { method: "POST", body: JSON.stringify(body) }),

  update: (id: number, body: UpdateActionItemInput) =>
    apiFetch<ActionItem>(`/action-items/${id}`, { method: "PATCH", body: JSON.stringify(body) }),

  delete: (id: number) => apiFetch<void>(`/action-items/${id}`, { method: "DELETE" }),
};
