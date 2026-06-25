import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notifications } from "@mantine/notifications";
import { whitelistApi } from "./api";

export function useWhitelist() {
  return useQuery({ queryKey: ["whitelist"], queryFn: whitelistApi.list });
}

export function useAddToWhitelist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (email: string) => whitelistApi.add(email),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["whitelist"] });
      notifications.show({ message: "Email ajouté à la whitelist", color: "green" });
    },
    onError: () => notifications.show({ message: "Erreur lors de l'ajout", color: "red" }),
  });
}

export function useRemoveFromWhitelist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (email: string) => whitelistApi.remove(email),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["whitelist"] });
      notifications.show({ message: "Email retiré de la whitelist", color: "orange" });
    },
    onError: () => notifications.show({ message: "Erreur lors de la suppression", color: "red" }),
  });
}
