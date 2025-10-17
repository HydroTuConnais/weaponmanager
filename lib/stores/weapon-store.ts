import { create } from 'zustand';

export interface Weapon {
  id: string;
  serialNumber: string;
  name: string;
  type: string;
  description?: string;
  status: 'AVAILABLE' | 'ASSIGNED' | 'MAINTENANCE' | 'RETIRED';
  assignedToId?: string;
  ammunition: number;
  createdAt: Date;
  updatedAt: Date;
}

interface WeaponStore {
  weapons: Weapon[];
  setWeapons: (weapons: Weapon[]) => void;
  addWeapon: (weapon: Weapon) => void;
  updateWeapon: (id: string, weapon: Partial<Weapon>) => void;
  deleteWeapon: (id: string) => void;
  assignWeapon: (weaponId: string, userId: string) => void;
  returnWeapon: (weaponId: string) => void;
}

export const useWeaponStore = create<WeaponStore>((set) => ({
  weapons: [],
  setWeapons: (weapons) => set({ weapons }),
  addWeapon: (weapon) => set((state) => ({ weapons: [...state.weapons, weapon] })),
  updateWeapon: (id, updatedWeapon) =>
    set((state) => ({
      weapons: state.weapons.map((w) => (w.id === id ? { ...w, ...updatedWeapon } : w)),
    })),
  deleteWeapon: (id) =>
    set((state) => ({
      weapons: state.weapons.filter((w) => w.id !== id),
    })),
  assignWeapon: (weaponId, userId) =>
    set((state) => ({
      weapons: state.weapons.map((w) =>
        w.id === weaponId ? { ...w, assignedToId: userId, status: 'ASSIGNED' as const } : w
      ),
    })),
  returnWeapon: (weaponId) =>
    set((state) => ({
      weapons: state.weapons.map((w) =>
        w.id === weaponId ? { ...w, assignedToId: undefined, status: 'AVAILABLE' as const } : w
      ),
    })),
}));
