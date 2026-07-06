import type { User } from "@/features/shared/types";

export type Absence = {
  id: number;
  date: string;
  user: User;
  userId: number;
};
