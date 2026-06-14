import { z } from "zod";

export const CreateMemoSchema = z.object({
  title: z.string().min(1).max(200),
  chosesADire: z.string().default(""),
  activitesPge: z.string().default(""),
  activitesBachelor: z.string().default(""),
  autres: z.string().default(""),
});

export const UpdateMemoSchema = CreateMemoSchema.partial();

export type CreateMemoInput = z.infer<typeof CreateMemoSchema>;
export type UpdateMemoInput = z.infer<typeof UpdateMemoSchema>;
