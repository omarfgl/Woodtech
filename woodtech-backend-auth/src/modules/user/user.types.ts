export type UserRole = "user" | "admin";

export type UserProfile = {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  emailVerified: boolean;
};
