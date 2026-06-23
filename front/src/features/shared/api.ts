import { apiFetch } from "@/lib/api";
import type { User } from "./types";

export const usersApi = {
  list: () => apiFetch<User[]>("/auth/users"),
};
