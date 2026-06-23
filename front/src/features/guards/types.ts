import type { User } from "@/features/shared/types";

export type Guard = {
  id: number;
  date: string;
  aer: User | null;
  aerId: number | null;
};
