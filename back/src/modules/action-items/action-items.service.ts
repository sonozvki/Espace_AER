import { actionItemsRepository } from "./action-items.repository";
import type { CreateActionItemInput, UpdateActionItemInput } from "./action-items.schemas";

export const actionItemsService = {
  listActionItems() {
    return actionItemsRepository.findAll();
  },

  getActionItem(id: number) {
    return actionItemsRepository.findById(id);
  },

  createActionItem(data: CreateActionItemInput) {
    return actionItemsRepository.create(data);
  },

  updateActionItem(id: number, data: UpdateActionItemInput) {
    return actionItemsRepository.update(id, data);
  },

  deleteActionItem(id: number) {
    return actionItemsRepository.delete(id);
  },
};
