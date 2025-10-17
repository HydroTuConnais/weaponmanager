import { create } from 'zustand';

export interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
  role: 'USER' | 'ADMIN';
  discordId?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface UserStore {
  users: User[];
  currentUser: User | null;
  setUsers: (users: User[]) => void;
  setCurrentUser: (user: User | null) => void;
  updateUser: (id: string, user: Partial<User>) => void;
  deleteUser: (id: string) => void;
}

export const useUserStore = create<UserStore>((set) => ({
  users: [],
  currentUser: null,
  setUsers: (users) => set({ users }),
  setCurrentUser: (user) => set({ currentUser: user }),
  updateUser: (id, updatedUser) =>
    set((state) => ({
      users: state.users.map((u) => (u.id === id ? { ...u, ...updatedUser } : u)),
    })),
  deleteUser: (id) =>
    set((state) => ({
      users: state.users.filter((u) => u.id !== id),
    })),
}));
