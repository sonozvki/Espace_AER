import { resourcesRepository } from "./resources.repository";
import type { CreateResourceInput } from "./resources.schemas";

export const resourcesService = {
  listResources() {
    return resourcesRepository.findAll();
  },
  createResource(data: CreateResourceInput) {
    return resourcesRepository.create(data);
  },
  deleteResource(id: number) {
    return resourcesRepository.delete(id);
  },
};
