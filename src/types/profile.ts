export type UserRole = "USER" | "ADMIN";
export type UserStatus = "ACTIVE" | "SUSPENDED";

export interface UserProfile {
  uid: string;
  fullName: string;
  email: string;
  role: UserRole;
  organizationId: string | null;
  organizationName: string | null;
  status: UserStatus;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface UserProfileUpdate {
  fullName: string;
}
