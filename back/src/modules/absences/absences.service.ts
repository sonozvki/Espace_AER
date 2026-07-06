import { absencesRepository } from "./absences.repository";
import { guardsService } from "@/modules/guards/guards.service";
import { startOfDay } from "@/lib/dates";

export const absencesService = {
  listAbsences() {
    return absencesRepository.findAll();
  },

  async declare(dateStr: string, userId: number) {
    const date = new Date(`${dateStr}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime())) throw new Error("INVALID_DATE");
    if (startOfDay(date) < startOfDay(new Date())) throw new Error("PAST_DATE");
    // Si l'AER tenait la garde ce jour-là, on la libère pour qu'un autre puisse la prendre
    await guardsService.unassignUserOnDate(date, userId);
    return absencesRepository.create(date, userId);
  },

  async cancel(id: number, userId: number) {
    const absence = await absencesRepository.findById(id);
    if (!absence) throw new Error("NOT_FOUND");
    if (absence.userId !== userId) throw new Error("FORBIDDEN");
    return absencesRepository.delete(id);
  },
};
