import { apiFetch } from "@/lib/api";
import type { Resource, CreateResourceInput } from "./types";

export const toolboxApi = {
  list: () => apiFetch<Resource[]>("/api/resources"),
  create: (body: CreateResourceInput) =>
    apiFetch<Resource>("/api/resources", { method: "POST", body: JSON.stringify(body) }),
  delete: (id: number) => apiFetch<void>(`/api/resources/${id}`, { method: "DELETE" }),
};
