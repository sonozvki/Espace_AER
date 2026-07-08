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

// Mise à jour des métadonnées uniquement (le fichier PDF n'est pas remplaçable)
export const UpdateResourceSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  url: z.string().url().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
});

export type UpdateResourceInput = z.infer<typeof UpdateResourceSchema>;

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 Mo
export const PDF_MIME = "application/pdf";
