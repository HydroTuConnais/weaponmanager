import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Weapon, WeaponType, User, Log } from '@/lib/types';

// ============================================
// QUERY KEYS - Centralisés pour éviter les erreurs
// ============================================
export const queryKeys = {
  weapons: ['weapons'] as const,
  weaponTypes: ['weapon-types'] as const,
  users: ['users'] as const,
  logs: ['logs'] as const,
  discordRole: (userId: string) => ['discord-role', userId] as const,
};

// ============================================
// WEAPONS QUERIES & MUTATIONS
// ============================================

export function useWeapons() {
  return useQuery({
    queryKey: queryKeys.weapons,
    queryFn: async (): Promise<Weapon[]> => {
      const response = await fetch('/api/weapons');
      if (!response.ok) throw new Error('Failed to fetch weapons');
      return response.json();
    },
  });
}

export function useCreateWeapon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      serialNumber: string;
      name: string;
      type: string;
      description: string;
      status: Weapon['status'];
      ammunition: number;
      userId?: string;
    }) => {
      const response = await fetch('/api/weapons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create weapon');
      return response.json();
    },
    onSuccess: () => {
      // Invalide le cache pour forcer un refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.weapons });
    },
  });
}

export function useUpdateWeapon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<{
      serialNumber: string;
      name: string;
      type: string;
      description: string;
      status: Weapon['status'];
      ammunition: number;
    }> }) => {
      const response = await fetch(`/api/weapons/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update weapon');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.weapons });
    },
  });
}

export function useDeleteWeapon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/weapons/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete weapon');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.weapons });
    },
  });
}

export function useAssignWeapon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { weaponId: string; userId: string }) => {
      const response = await fetch('/api/weapons/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to assign weapon');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.weapons });
      queryClient.invalidateQueries({ queryKey: queryKeys.users });
    },
  });
}

export function useReturnWeapon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { weaponId: string; userId: string }) => {
      const response = await fetch('/api/weapons/return', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to return weapon');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.weapons });
      queryClient.invalidateQueries({ queryKey: queryKeys.users });
    },
  });
}

// ============================================
// WEAPON TYPES QUERIES & MUTATIONS
// ============================================

export function useWeaponTypes() {
  return useQuery({
    queryKey: queryKeys.weaponTypes,
    queryFn: async (): Promise<WeaponType[]> => {
      const response = await fetch('/api/weapon-types');
      if (!response.ok) throw new Error('Failed to fetch weapon types');
      return response.json();
    },
  });
}

export function useCreateWeaponType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      category?: string;
      image: string;
      userId?: string;
    }) => {
      const response = await fetch('/api/weapon-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create weapon type');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.weaponTypes });
    },
  });
}

export function useUpdateWeaponType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: {
      id: string;
      data: Partial<{ name: string; category: string; image: string }>
    }) => {
      const response = await fetch(`/api/weapon-types/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update weapon type');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.weaponTypes });
    },
  });
}

export function useDeleteWeaponType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/weapon-types/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete weapon type');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.weaponTypes });
    },
  });
}

// ============================================
// USERS QUERIES & MUTATIONS
// ============================================

export function useUsers() {
  return useQuery({
    queryKey: queryKeys.users,
    queryFn: async (): Promise<User[]> => {
      const response = await fetch('/api/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: {
      id: string;
      data: Partial<{ role: 'USER' | 'ADMIN'; name: string }>
    }) => {
      const response = await fetch(`/api/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update user');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete user');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users });
    },
  });
}

// ============================================
// LOGS QUERIES
// ============================================

export function useLogs() {
  return useQuery({
    queryKey: queryKeys.logs,
    queryFn: async (): Promise<Log[]> => {
      const response = await fetch('/api/logs');
      if (!response.ok) throw new Error('Failed to fetch logs');
      return response.json();
    },
    refetchInterval: 10000, // Refetch automatique toutes les 10 secondes
  });
}

// ============================================
// DISCORD ROLE QUERIES
// ============================================

export function useDiscordRoleCheck(userId: string) {
  return useQuery({
    queryKey: queryKeys.discordRole(userId),
    queryFn: async () => {
      const response = await fetch('/api/verify-discord-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      // Si 401, le token a expiré - déconnexion nécessaire
      if (response.status === 401) {
        const data = await response.json();
        return data; // Retourne { hasRole: false, tokenExpired: true, message: "..." }
      }

      // Si 403, l'utilisateur n'a pas le rôle (comportement attendu)
      if (response.status === 403) {
        const data = await response.json();
        return data; // Retourne { hasRole: false, message: "..." }
      }

      if (!response.ok) throw new Error('Failed to verify Discord role');
      return response.json();
    },
    enabled: !!userId, // Ne lance la query que si userId est défini
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false, // Pas de retry pour cette requête
  });
}
