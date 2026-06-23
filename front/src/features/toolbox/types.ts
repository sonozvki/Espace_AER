export type Resource = {
  id: number;
  title: string;
  url: string;
  description: string;
  category: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateResourceInput = {
  title: string;
  url: string;
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
