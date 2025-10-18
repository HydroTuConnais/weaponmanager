// Types partagés pour l'application

export interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
  role: 'USER' | 'ADMIN';
  discordId?: string;
  createdAt: Date | string;
  updatedAt?: Date | string;
  discordNickname?: string;
  weapons?: any[];
}

export interface WeaponType {
  id: string;
  name: string;
  image: string;
  category?: string;
}

export interface Weapon {
  id: string;
  serialNumber: string;
  name: string;
  weaponTypeId: string;
  weaponType: WeaponType;
  description?: string;
  status: 'AVAILABLE' | 'ASSIGNED' | 'MAINTENANCE' | 'RETIRED';
  ammunition: number;
  assignedTo?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface Log {
  id: string;
  action: string;
  timestamp: string;
  notes?: string;
  weapon: {
    id: string;
    name: string;
    serialNumber: string;
  };
  user: {
    id: string;
    name: string;
    email: string;
  };
}
