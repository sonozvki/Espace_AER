import { prisma } from "@/db/prisma";
import type { CreateMemoInput, UpdateMemoInput } from "./memos.schemas";

export const memosRepository = {
  findAll() {
    return prisma.memo.findMany({ orderBy: { createdAt: "desc" } });
  },

  findById(id: number) {
    return prisma.memo.findUnique({ where: { id } });
  },

  create(data: CreateMemoInput) {
    return prisma.memo.create({ data });
  },

  update(id: number, data: UpdateMemoInput) {
    return prisma.memo.update({ where: { id }, data });
  },

  delete(id: number) {
    return prisma.memo.delete({ where: { id } });
  },
};
