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
  // Remplace le PDF d'une ressource fichier ; null si la ressource n'existe pas ou est un lien
  async replaceResourceFile(id: number, file: File) {
    const existing = await resourcesRepository.findMeta(id);
    if (!existing?.fileName) return null;
    const fileData = new Uint8Array(await file.arrayBuffer());
    return resourcesRepository.updateFile(id, {
      fileName: file.name,
      fileMime: file.type || "application/pdf",
      fileSize: fileData.byteLength,
      fileData,
    });
  },
  deleteResource(id: number) {
    return resourcesRepository.delete(id);
  },
};
