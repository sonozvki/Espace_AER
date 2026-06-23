import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notifications } from "@mantine/notifications";
import { guardsApi } from "./api";
import { usersApi } from "@/features/shared/api";

const QUERY_KEY = ["guards"];

export function useGuards() {
  return useQuery({ queryKey: QUERY_KEY, queryFn: guardsApi.list });
}

export function useUsers() {
  return useQuery({ queryKey: ["users"], queryFn: usersApi.list });
}

export function useGenerateGuards() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (year: number) => guardsApi.generateYear(year),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      notifications.show({ message: `${data.created} gardes générées`, color: "green" });
    },
    onError: () => notifications.show({ message: "Erreur lors de la génération", color: "red" }),
  });
}

export function useAssignGuard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, aerId }: { id: number; aerId: number | null }) =>
      guardsApi.assign(id, aerId),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
    onError: (err: unknown) => {
      const msg =
        err && typeof err === "object" && "error" in err
          ? String((err as { error: string }).error)
          : "Erreur";
      notifications.show({ message: msg, color: "red" });
    },
  });
}
