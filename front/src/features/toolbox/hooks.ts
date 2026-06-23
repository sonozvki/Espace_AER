import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notifications } from "@mantine/notifications";
import { toolboxApi } from "./api";
import type { CreateResourceInput } from "./types";

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
