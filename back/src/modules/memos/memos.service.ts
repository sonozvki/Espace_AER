import { memosRepository } from "./memos.repository";
import type { CreateMemoInput, UpdateMemoInput } from "./memos.schemas";

export const memosService = {
  listMemos() {
    return memosRepository.findAll();
  },

  getMemo(id: number) {
    return memosRepository.findById(id);
  },

  createMemo(data: CreateMemoInput) {
    return memosRepository.create(data);
  },

  updateMemo(id: number, data: UpdateMemoInput) {
    return memosRepository.update(id, data);
  },

  deleteMemo(id: number) {
    return memosRepository.delete(id);
  },
};
