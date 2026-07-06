import { guardsRepository } from "./guards.repository";
import { startOfDay } from "@/lib/dates";

export const guardsService = {
  listGuards() {
    return guardsRepository.findAll();
  },

  getGuard(id: number) {
    return guardsRepository.findById(id);
  },

  generateYear(year: number) {
    const dates: Date[] = [];
    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      if (d.getDay() !== 0) dates.push(new Date(d)); // skip Sunday
    }
    return guardsRepository.createMany(dates);
  },

  async assign(id: number, aerId: number | null) {
    const guard = await guardsRepository.findById(id);
    if (!guard) throw new Error("NOT_FOUND");
    if (startOfDay(guard.date) < startOfDay(new Date())) throw new Error("PAST_GUARD");
    return guardsRepository.assign(id, aerId);
  },

  // Utilisé par le module absences : libère la garde d'un AER sur une date donnée
  async unassignUserOnDate(date: Date, userId: number) {
    const guard = await guardsRepository.findByDate(date);
    if (guard?.aerId === userId) await guardsRepository.assign(guard.id, null);
  },
};
