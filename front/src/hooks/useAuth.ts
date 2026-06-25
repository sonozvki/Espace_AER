import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export type AuthUser = {
  id: number;
  email: string;
  name: string;
  role: "AER" | "ADMIN";
};

export function useAuth() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => apiFetch<AuthUser>("/auth/me"),
    retry: false,
  });

  return {
    user: data ?? null,
    isLoading,
    isAuthenticated: !!data && !error,
  };
}
