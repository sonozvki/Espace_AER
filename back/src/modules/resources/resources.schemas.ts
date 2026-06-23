import { z } from "zod";

export const CreateResourceSchema = z.object({
  title: z.string().min(1).max(200),
  url: z.string().url(),
  description: z.string().default(""),
  category: z.string().default("Divers"),
});

export type CreateResourceInput = z.infer<typeof CreateResourceSchema>;
