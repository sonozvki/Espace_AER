import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notifications } from "@mantine/notifications";
import { actionItemsApi } from "./api";
import type { CreateActionItemInput, UpdateActionItemInput } from "./types";

const QUERY_KEY = ["action-items"];

export function useActionItems() {
  return useQuery({ queryKey: QUERY_KEY, queryFn: actionItemsApi.list });
}

export function useCreateActionItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateActionItemInput) => actionItemsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      notifications.show({ message: "Action créée", color: "green" });
    },
    onError: () => notifications.show({ message: "Erreur lors de la création", color: "red" }),
  });
}

export function useUpdateActionItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateActionItemInput }) =>
      actionItemsApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
    onError: () => notifications.show({ message: "Erreur lors de la mise à jour", color: "red" }),
  });
}

export function useDeleteActionItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => actionItemsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      notifications.show({ message: "Action supprimée", color: "orange" });
    },
    onError: () => notifications.show({ message: "Erreur lors de la suppression", color: "red" }),
  });
}
