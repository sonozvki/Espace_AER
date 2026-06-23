import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notifications } from "@mantine/notifications";
import { memosApi } from "./api";
import type { CreateMemoInput } from "./types";

const QUERY_KEY = ["memos"];

export function useMemos() {
  return useQuery({ queryKey: QUERY_KEY, queryFn: memosApi.list });
}

export function useMemo(id: number | null) {
  return useQuery({
    queryKey: [...QUERY_KEY, id],
    queryFn: () => memosApi.get(id!),
    enabled: id !== null,
  });
}

export function useCreateMemo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMemoInput) => memosApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      notifications.show({ message: "Mémo créé", color: "green" });
    },
    onError: () => notifications.show({ message: "Erreur lors de la création", color: "red" }),
  });
}

export function useUpdateMemo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateMemoInput> }) =>
      memosApi.update(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      qc.invalidateQueries({ queryKey: [...QUERY_KEY, id] });
      notifications.show({ message: "Mémo enregistré", color: "green" });
    },
    onError: () => notifications.show({ message: "Erreur lors de la sauvegarde", color: "red" }),
  });
}

export function useDeleteMemo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => memosApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      notifications.show({ message: "Mémo supprimé", color: "orange" });
    },
    onError: () => notifications.show({ message: "Erreur lors de la suppression", color: "red" }),
  });
}
