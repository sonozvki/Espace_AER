import { z } from "zod";

export const CreateMemoSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().default(""),
});

export const UpdateMemoSchema = CreateMemoSchema.partial();

export type CreateMemoInput = z.infer<typeof CreateMemoSchema>;
export type UpdateMemoInput = z.infer<typeof UpdateMemoSchema>;
