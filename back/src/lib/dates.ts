export function schoolYear(): number {
  const now = new Date();
  return now.getMonth() < 8 ? now.getFullYear() - 1 : now.getFullYear();
}

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}
