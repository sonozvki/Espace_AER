export type GuardUser = {
  id: number;
  name: string;
  email: string;
  role: "ADMIN";
};

export type Guard = {
  id: number;
  date: string;
  guardAer: GuardUser | null;
  guardAerId: number | null;
  absentAers: GuardUser[];
  unavailableAers: GuardUser[];
  isPublicHoliday: boolean;
  publicHolidayName: string | null;
  isSchoolHoliday: boolean;
  schoolHolidayName: string | null;
};
