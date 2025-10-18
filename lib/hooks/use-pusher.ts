'use client';

import { useEffect, useRef } from 'react';
import Pusher from 'pusher-js';
import { PUSHER_CHANNELS, PUSHER_EVENTS } from '../pusher-server';

let pusherClient: Pusher | null = null;

function getPusherClient() {
  if (!pusherClient) {
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

    if (!key || !cluster) {
      console.warn('[Pusher Client] Not configured');
      return null;
    }

    pusherClient = new Pusher(key, {
      cluster,
    });
  }

  return pusherClient;
}

interface UsePusherOptions {
  onWeaponsChange?: () => void;
  onWeaponTypesChange?: () => void;
  onUsersChange?: () => void;
  enabled?: boolean;
}

/**
 * Hook pour écouter les événements Pusher en temps réel
 * Remplace le polling - 0 appel à la DB !
 */
export function usePusher(options: UsePusherOptions = {}) {
  const {
    onWeaponsChange,
    onWeaponTypesChange,
    onUsersChange,
    enabled = true,
  } = options;

  const callbacksRef = useRef({ onWeaponsChange, onWeaponTypesChange, onUsersChange });

  // Mettre à jour les callbacks refs
  useEffect(() => {
    callbacksRef.current = { onWeaponsChange, onWeaponTypesChange, onUsersChange };
  }, [onWeaponsChange, onWeaponTypesChange, onUsersChange]);

  useEffect(() => {
    if (!enabled) return;

    const pusher = getPusherClient();
    if (!pusher) {
      console.warn('[Pusher Client] Not available, using manual refresh only');
      return;
    }

    // S'abonner au canal des armes
    if (callbacksRef.current.onWeaponsChange) {
      const weaponsChannel = pusher.subscribe(PUSHER_CHANNELS.WEAPONS);

      weaponsChannel.bind(PUSHER_EVENTS.WEAPON_CREATED, () => {
        console.log('[Pusher] Weapon created, refreshing...');
        callbacksRef.current.onWeaponsChange?.();
      });

      weaponsChannel.bind(PUSHER_EVENTS.WEAPON_UPDATED, () => {
        console.log('[Pusher] Weapon updated, refreshing...');
        callbacksRef.current.onWeaponsChange?.();
      });

      weaponsChannel.bind(PUSHER_EVENTS.WEAPON_DELETED, () => {
        console.log('[Pusher] Weapon deleted, refreshing...');
        callbacksRef.current.onWeaponsChange?.();
      });
    }

    // S'abonner au canal des types d'armes
    if (callbacksRef.current.onWeaponTypesChange) {
      const weaponTypesChannel = pusher.subscribe(PUSHER_CHANNELS.WEAPON_TYPES);

      weaponTypesChannel.bind(PUSHER_EVENTS.WEAPON_TYPE_CREATED, () => {
        console.log('[Pusher] Weapon type created, refreshing...');
        callbacksRef.current.onWeaponTypesChange?.();
      });

      weaponTypesChannel.bind(PUSHER_EVENTS.WEAPON_TYPE_UPDATED, () => {
        console.log('[Pusher] Weapon type updated, refreshing...');
        callbacksRef.current.onWeaponTypesChange?.();
      });

      weaponTypesChannel.bind(PUSHER_EVENTS.WEAPON_TYPE_DELETED, () => {
        console.log('[Pusher] Weapon type deleted, refreshing...');
        callbacksRef.current.onWeaponTypesChange?.();
      });
    }

    // S'abonner au canal des utilisateurs
    if (callbacksRef.current.onUsersChange) {
      const usersChannel = pusher.subscribe(PUSHER_CHANNELS.USERS);

      usersChannel.bind(PUSHER_EVENTS.USER_UPDATED, () => {
        console.log('[Pusher] User updated, refreshing...');
        callbacksRef.current.onUsersChange?.();
      });

      usersChannel.bind(PUSHER_EVENTS.USER_DELETED, () => {
        console.log('[Pusher] User deleted, refreshing...');
        callbacksRef.current.onUsersChange?.();
      });
    }

    // Cleanup
    return () => {
      if (callbacksRef.current.onWeaponsChange) {
        pusher.unsubscribe(PUSHER_CHANNELS.WEAPONS);
      }
      if (callbacksRef.current.onWeaponTypesChange) {
        pusher.unsubscribe(PUSHER_CHANNELS.WEAPON_TYPES);
      }
      if (callbacksRef.current.onUsersChange) {
        pusher.unsubscribe(PUSHER_CHANNELS.USERS);
      }
    };
  }, [enabled]);
}
