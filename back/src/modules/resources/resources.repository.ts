import { prisma } from "@/db/prisma";
import type { CreateResourceInput } from "./resources.schemas";

export const resourcesRepository = {
  findAll() {
    return prisma.resource.findMany({
      orderBy: [{ category: "asc" }, { createdAt: "asc" }],
    });
  },
  create(data: CreateResourceInput) {
    return prisma.resource.create({ data });
  },
  delete(id: number) {
    return prisma.resource.delete({ where: { id } });
  },
};
