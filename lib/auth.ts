// Mock current user — replace with real auth context when backend is ready.

export interface User {
  name: string;
  email: string;
  avatar: string;
  initials: string;
}

export const currentUser: User = {
  name: "Tahlia Chen",
  email: "tahlia@clever.dev",
  avatar: "TC",
  initials: "TC",
};
