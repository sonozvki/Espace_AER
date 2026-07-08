import { z } from "zod";

export const CreateResourceSchema = z.object({
  title: z.string().min(1).max(200),
  url: z.string().url(),
  description: z.string().default(""),
  category: z.string().default("Divers"),
});

export type CreateResourceInput = z.infer<typeof CreateResourceSchema>;

export const UploadResourceSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().default(""),
  category: z.string().default("Divers"),
});

export type UploadResourceInput = z.infer<typeof UploadResourceSchema>;

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 Mo
export const PDF_MIME = "application/pdf";
