/**
 * Année scolaire déduite de la date (bascule au 25 septembre).
 * Uniquement utilisée comme valeur initiale : la source de vérité est la table SchoolYear
 * (voir modules/school-year).
 */
export function schoolYearFromDate(now = new Date()): number {
  const year = now.getFullYear();
  const switchDate = new Date(year, 8, 25); // 25 septembre
  return now < switchDate ? year - 1 : year;
}

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}
