import { resourcesRepository } from "./resources.repository";
import type { CreateResourceInput, UploadResourceInput, UpdateResourceInput } from "./resources.schemas";

export const resourcesService = {
  listResources() {
    return resourcesRepository.findAll();
  },
  createResource(data: CreateResourceInput) {
    return resourcesRepository.create(data);
  },
  async createFileResource(data: UploadResourceInput, file: File) {
    const fileData = new Uint8Array(await file.arrayBuffer());
    return resourcesRepository.createFile(data, {
      fileName: file.name,
      fileMime: file.type || "application/pdf",
      fileSize: fileData.byteLength,
      fileData,
    });
  },
  getResourceFile(id: number) {
    return resourcesRepository.findFile(id);
  },
  updateResource(id: number, data: UpdateResourceInput) {
    return resourcesRepository.update(id, data);
  },
  deleteResource(id: number) {
    return resourcesRepository.delete(id);
  },
};
