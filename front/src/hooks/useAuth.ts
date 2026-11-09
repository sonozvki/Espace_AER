import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export type AuthUser = {
  id: number;
  email: string;
  name: string;
  role: "ADMIN";
  hasEpitechToken: boolean;
  aerSince: number | null;
  aerRole: "tek2" | "tek3" | "tek5" | "ancien";
  /** false pour un ancien AER : plus de stats */
  isActiveAer: boolean;
  /** seuls les tek2/tek3 prennent des gardes (pas les tek5 ni les anciens) */
  canTakeGuards: boolean;
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
