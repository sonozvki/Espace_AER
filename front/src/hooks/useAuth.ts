import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useAuth() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const { data, error } = await api.auth.me.get();
      if (error) throw error;
      return data;
    },
    retry: false,
  });

  return {
    user: data ?? null,
    isLoading,
    isAuthenticated: !!data && !error,
  };
}
