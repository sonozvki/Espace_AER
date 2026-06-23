import { apiFetch } from "@/lib/api";
import type { Resource, CreateResourceInput } from "./types";

export const toolboxApi = {
  list: () => apiFetch<Resource[]>("/resources"),
  create: (body: CreateResourceInput) =>
    apiFetch<Resource>("/resources", { method: "POST", body: JSON.stringify(body) }),
  delete: (id: number) => apiFetch<void>(`/resources/${id}`, { method: "DELETE" }),
};
