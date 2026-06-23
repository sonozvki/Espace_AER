import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toolboxApi } from "./api";
import type { CreateResourceInput } from "./types";

export function useResources() {
  return useQuery({ queryKey: ["resources"], queryFn: toolboxApi.list });
}

export function useCreateResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateResourceInput) => toolboxApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["resources"] }),
  });
}

export function useDeleteResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => toolboxApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["resources"] }),
  });
}
