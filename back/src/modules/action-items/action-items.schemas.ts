import { z } from "zod";

export const CreateActionItemSchema = z.object({
  memoId: z.number().int(),
  content: z.string().min(1),
  deadline: z.string().datetime().optional(),
  assigneeId: z.number().int().optional(),
});

export const UpdateActionItemSchema = z.object({
  content: z.string().min(1).optional(),
  status: z.enum(["PENDING", "IN_PROGRESS", "DONE", "CANCELLED"]).optional(),
  deadline: z.string().datetime().nullable().optional(),
  assigneeId: z.number().int().nullable().optional(),
});

export type CreateActionItemInput = z.infer<typeof CreateActionItemSchema>;
export type UpdateActionItemInput = z.infer<typeof UpdateActionItemSchema>;
