import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notifications } from "@mantine/notifications";
import { schoolYearApi, yearLabel } from "./api";

export function useSchoolYear() {
  return useQuery({ queryKey: ["school-year"], queryFn: schoolYearApi.get, staleTime: 5 * 60 * 1000 });
}

export function useAerGenerations() {
  return useQuery({ queryKey: ["school-year", "aers"], queryFn: schoolYearApi.aers });
}

export function useRolloverPreview(enabled: boolean) {
  return useQuery({
    queryKey: ["school-year", "preview"],
    queryFn: schoolYearApi.preview,
    enabled,
    staleTime: 0,
  });
}

export function useSetAerGeneration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, aerSince }: { id: number; aerSince: number }) =>
      schoolYearApi.setGeneration(id, aerSince),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["school-year"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      qc.invalidateQueries({ queryKey: ["auth", "me"] });
      qc.invalidateQueries({ queryKey: ["users"] });
    },
    onError: () => notifications.show({ message: "Erreur lors de la mise à jour", color: "red" }),
  });
}

export function useRollover() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (startDate: string) => schoolYearApi.rollover(startDate),
    onSuccess: (data) => {
      // L'année courante conditionne presque tout : stats, trombi, moulis, gardes
      qc.invalidateQueries();
      notifications.show({ message: `Année ${yearLabel(data.to)} démarrée`, color: "green" });
    },
    onError: (err) =>
      notifications.show({
        message: (err as { error?: string })?.error ?? "Erreur lors du passage d'année",
        color: "red",
      }),
  });
}
