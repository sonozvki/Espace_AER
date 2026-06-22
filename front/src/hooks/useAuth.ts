import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export type AuthUser = {
  id: number;
  email: string;
  name: string;
  role: "AER" | "ADMIN";
};

export function useAuth() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: async (): Promise<AuthUser> => {
      const { data, error } = await api.auth.me.get();
      if (error) throw error;
      return data as AuthUser;
    },
    retry: false,
  });

  return {
    user: data ?? null,
    isLoading,
    isAuthenticated: !!data && !error,
  };
}
