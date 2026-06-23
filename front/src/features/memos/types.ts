import type { User } from "@/features/shared/types";

export type ActionStatus = "PENDING" | "IN_PROGRESS" | "DONE" | "CANCELLED";

export type ActionItem = {
  id: number;
  content: string;
  status: ActionStatus;
  deadline: string | null;
  memoId: number;
  assignee: User | null;
  assigneeId: number | null;
  createdAt: string;
};

export type Memo = {
  id: number;
  title: string;
  chosesADire: string;
  activitesPge: string;
  activitesBachelor: string;
  autres: string;
  createdAt: string;
  updatedAt: string;
  actionItems: ActionItem[];
};

export type CreateMemoInput = {
  title: string;
  chosesADire: string;
  activitesPge: string;
  activitesBachelor: string;
  autres: string;
};
