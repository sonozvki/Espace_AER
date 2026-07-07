import { useMutation, useQueryClient } from "@tanstack/react-query";
import { notifications } from "@mantine/notifications";
import { accountApi } from "./api";

export function useSetEpitechToken() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (token: string) => accountApi.setEpitechToken(token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["auth", "me"] });
      notifications.show({ message: "Token Epitech enregistré", color: "green" });
    },
    onError: () =>
      notifications.show({ message: "Erreur lors de l'enregistrement du token", color: "red" }),
  });
}

export function useClearEpitechToken() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => accountApi.clearEpitechToken(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["auth", "me"] });
      notifications.show({ message: "Token Epitech supprimé", color: "orange" });
    },
    onError: () =>
      notifications.show({ message: "Erreur lors de la suppression du token", color: "red" }),
  });
}
