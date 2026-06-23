export type Role = "AER" | "ADMIN";

export type User = {
  id: number;
  email: string;
  name: string;
  role: Role;
};
