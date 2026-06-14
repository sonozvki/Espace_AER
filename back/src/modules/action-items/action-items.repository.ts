import { prisma } from "@/db/prisma";
import type { CreateActionItemInput, UpdateActionItemInput } from "./action-items.schemas";

export const actionItemsRepository = {
  findAll() {
    return prisma.actionItem.findMany({
      orderBy: { createdAt: "desc" },
      include: { assignee: true, memo: true },
    });
  },

  findById(id: number) {
    return prisma.actionItem.findUnique({
      where: { id },
      include: { assignee: true, memo: true },
    });
  },

  create(data: CreateActionItemInput) {
    return prisma.actionItem.create({
      data: {
        memoId: data.memoId,
        content: data.content,
        deadline: data.deadline ? new Date(data.deadline) : undefined,
        assigneeId: data.assigneeId,
      },
      include: { assignee: true },
    });
  },

  update(id: number, data: UpdateActionItemInput) {
    return prisma.actionItem.update({
      where: { id },
      data: {
        ...data,
        deadline: data.deadline !== undefined ? (data.deadline ? new Date(data.deadline) : null) : undefined,
      },
      include: { assignee: true },
    });
  },

  delete(id: number) {
    return prisma.actionItem.delete({ where: { id } });
  },
};
