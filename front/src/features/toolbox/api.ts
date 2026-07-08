import { apiFetch, BASE_URL } from "@/lib/api";
import type { Resource, CreateResourceInput, UploadResourceInput, UpdateResourceInput } from "./types";

export const toolboxApi = {
  list: () => apiFetch<Resource[]>("/api/resources"),
  create: (body: CreateResourceInput) =>
    apiFetch<Resource>("/api/resources", { method: "POST", body: JSON.stringify(body) }),
  upload: ({ file, ...fields }: UploadResourceInput) => {
    const form = new FormData();
    Object.entries(fields).forEach(([key, value]) => form.append(key, value));
    form.append("file", file);
    return apiFetch<Resource>("/api/resources/upload", { method: "POST", body: form });
  },
  fileUrl: (id: number) => `${BASE_URL}/api/resources/${id}/file`,
  update: (id: number, body: UpdateResourceInput) =>
    apiFetch<Resource>(`/api/resources/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  delete: (id: number) => apiFetch<void>(`/api/resources/${id}`, { method: "DELETE" }),
};
