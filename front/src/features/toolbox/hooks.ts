import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notifications } from "@mantine/notifications";
import { toolboxApi } from "./api";
import type { CreateResourceInput, UploadResourceInput, UpdateResourceInput } from "./types";

export function useResources() {
  return useQuery({ queryKey: ["resources"], queryFn: toolboxApi.list });
}

export function useCreateResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateResourceInput) => toolboxApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["resources"] });
      notifications.show({ message: "Ressource ajoutée", color: "green" });
    },
    onError: () => notifications.show({ message: "Erreur lors de l'ajout", color: "red" }),
  });
}

export function useUploadResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UploadResourceInput) => toolboxApi.upload(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["resources"] });
      notifications.show({ message: "PDF ajouté", color: "green" });
    },
    onError: () => notifications.show({ message: "Erreur lors de l'upload", color: "red" }),
  });
}

export function useUpdateResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data, file }: { id: number; data: UpdateResourceInput; file?: File | null }) => {
      if (file) await toolboxApi.replaceFile(id, file);
      return toolboxApi.update(id, data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["resources"] });
      notifications.show({ message: "Ressource modifiée", color: "green" });
    },
    onError: () => notifications.show({ message: "Erreur lors de la modification", color: "red" }),
  });
}

export function useDeleteResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => toolboxApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["resources"] });
      notifications.show({ message: "Ressource supprimée", color: "orange" });
    },
    onError: () => notifications.show({ message: "Erreur lors de la suppression", color: "red" }),
  });
}
