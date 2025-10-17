export interface UserWithRole {
  id: string;
  email: string;
  name?: string;
  image?: string;
  role?: 'USER' | 'ADMIN';
}

export function getUserRole(user: any): 'USER' | 'ADMIN' | null {
  if (!user) return null;
  return (user as UserWithRole).role || 'USER';
}

export function isAdmin(user: any): boolean {
  return getUserRole(user) === 'ADMIN';
}
