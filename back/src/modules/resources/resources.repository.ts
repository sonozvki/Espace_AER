import { prisma } from "@/db/prisma";
import type { CreateResourceInput, UploadResourceInput, UpdateResourceInput } from "./resources.schemas";

// fileData est exclu des listes : le binaire n'est chargé que via findFile()
const LIST_SELECT = {
  id: true,
  title: true,
  url: true,
  description: true,
  category: true,
  fileName: true,
  fileMime: true,
  fileSize: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const resourcesRepository = {
  findAll() {
    return prisma.resource.findMany({
      select: LIST_SELECT,
      orderBy: [{ category: "asc" }, { createdAt: "asc" }],
    });
  },
  create(data: CreateResourceInput) {
    return prisma.resource.create({ data, select: LIST_SELECT });
  },
  createFile(
    data: UploadResourceInput,
    file: { fileName: string; fileMime: string; fileSize: number; fileData: Uint8Array<ArrayBuffer> }
  ) {
    return prisma.resource.create({ data: { ...data, ...file }, select: LIST_SELECT });
  },
  findFile(id: number) {
    return prisma.resource.findUnique({
      where: { id },
      select: { fileName: true, fileMime: true, fileData: true },
    });
  },
  update(id: number, data: UpdateResourceInput) {
    return prisma.resource.update({ where: { id }, data, select: LIST_SELECT });
  },
  delete(id: number) {
    return prisma.resource.delete({ where: { id }, select: { id: true } });
  },
};
