import type { User } from "@/features/shared/types";

export type ActionStatus = "PENDING" | "IN_PROGRESS" | "DONE" | "CANCELLED";

export type ActionItem = {
  id: number;
  content: string;
  status: ActionStatus;
  deadline: string | null;
  memoId: number;
  memo: { id: number; title: string };
  assignee: User | null;
  assigneeId: number | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateActionItemInput = {
  memoId: number;
  content: string;
  deadline?: string;
  assigneeId?: number;
};

export type UpdateActionItemInput = {
  content?: string;
  status?: ActionStatus;
  deadline?: string | null;
  assigneeId?: number | null;
};

export const STATUS_LABELS: Record<ActionStatus, string> = {
  PENDING: "À faire",
  IN_PROGRESS: "En cours",
  DONE: "Fait",
  CANCELLED: "Annulé",
};

export const STATUS_COLORS: Record<ActionStatus, string> = {
  PENDING: "orange",
  IN_PROGRESS: "blue",
  DONE: "green",
  CANCELLED: "gray",
};

export const STATUS_ORDER: ActionStatus[] = ["PENDING", "IN_PROGRESS", "DONE", "CANCELLED"];
