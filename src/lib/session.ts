export type Role = "nurse" | "agency" | "admin";

export interface SessionUser {
  id: string;
  name: string;
  role: Role;
  agencyId?: string | null;
}

export const HOME_BY_ROLE: Record<Role, string> = {
  nurse: "/nurse",
  agency: "/agency",
  admin: "/admin",
};
