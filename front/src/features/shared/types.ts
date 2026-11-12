export type Role = "ADMIN";

export type User = {
  id: number;
  email: string;
  name: string;
  role: Role;
  /** Génération AER (année scolaire de début) */
  aerSince?: number | null;
  /** AER faisant partie des générations actives (/auth/users) */
  active?: boolean;
  /** Idem, pour l'utilisateur connecté (/auth/me) */
  isActiveAer?: boolean;
  /** tek2/tek3 uniquement (/auth/me et /auth/users) */
  canTakeGuards?: boolean;
};
