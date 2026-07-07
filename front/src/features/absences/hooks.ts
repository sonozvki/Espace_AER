import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notifications } from "@mantine/notifications";
import { absencesApi } from "./api";

const QUERY_KEY = ["absences"];

function errorMessage(err: unknown) {
  return err && typeof err === "object" && "error" in err
    ? String((err as { error: string }).error)
    : "Erreur";
}

export function useAbsences() {
  return useQuery({ queryKey: QUERY_KEY, queryFn: absencesApi.list });
}

export function useDeclareAbsence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (date: string) => absencesApi.declare(date),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      // La déclaration libère la garde du jour si l'AER la tenait
      qc.invalidateQueries({ queryKey: ["guards"] });
      notifications.show({ message: "Absence déclarée", color: "red" });
    },
    onError: (err: unknown) =>
      notifications.show({ message: errorMessage(err), color: "red" }),
  });
}

export function useCancelAbsence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => absencesApi.cancel(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      notifications.show({ message: "Absence annulée", color: "green" });
    },
    onError: (err: unknown) =>
      notifications.show({ message: errorMessage(err), color: "red" }),
  });
}
