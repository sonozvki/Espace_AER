export type Resource = {
  id: number;
  title: string;
  url: string | null;
  description: string;
  category: string;
  fileName: string | null;
  fileMime: string | null;
  fileSize: number | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateResourceInput = {
  title: string;
  url: string;
  description: string;
  category: string;
};

export type UploadResourceInput = {
  title: string;
  description: string;
  category: string;
  file: File;
};

// Métadonnées uniquement — le fichier PDF d'une ressource n'est pas remplaçable
export type UpdateResourceInput = {
  title: string;
  url?: string;
  description: string;
  category: string;
};

export const CATEGORIES = [
  "Intra Epitech",
  "Discord",
  "Documents",
  "Outils",
  "Divers",
] as const;
