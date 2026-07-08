export type Role = "ADMIN";

export type User = {
  id: number;
  email: string;
  name: string;
  role: Role;
};
