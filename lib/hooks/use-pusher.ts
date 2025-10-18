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

    console.log('[Pusher Client] Initializing with cluster:', cluster);
    pusherClient = new Pusher(key, {
      cluster,
    });

    // Log des événements de connexion
    pusherClient.connection.bind('connecting', () => {
      console.log('[Pusher] 🔄 Connexion en cours...');
    });

    pusherClient.connection.bind('connected', () => {
      console.log('[Pusher] ✅ Connecté avec succès! Socket ID:', pusherClient?.connection.socket_id);
    });

    pusherClient.connection.bind('unavailable', () => {
      console.warn('[Pusher] ⚠️ Connexion non disponible');
    });

    pusherClient.connection.bind('failed', () => {
      console.error('[Pusher] ❌ Connexion échouée');
    });

    pusherClient.connection.bind('disconnected', () => {
      console.warn('[Pusher] ⚠️ Déconnecté');
    });

    pusherClient.connection.bind('error', (err: any) => {
      console.error('[Pusher] ❌ Erreur de connexion:', err);
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
      console.log('[Pusher] 📡 Souscription au canal:', PUSHER_CHANNELS.WEAPONS);
      const weaponsChannel = pusher.subscribe(PUSHER_CHANNELS.WEAPONS);

      weaponsChannel.bind('pusher:subscription_succeeded', () => {
        console.log('[Pusher] ✅ Souscription réussie:', PUSHER_CHANNELS.WEAPONS);
      });

      weaponsChannel.bind('pusher:subscription_error', (err: any) => {
        console.error('[Pusher] ❌ Erreur de souscription:', PUSHER_CHANNELS.WEAPONS, err);
      });

      weaponsChannel.bind(PUSHER_EVENTS.WEAPON_CREATED, (data: any) => {
        console.log('[Pusher] 🔫 Weapon created:', data);
        callbacksRef.current.onWeaponsChange?.();
      });

      weaponsChannel.bind(PUSHER_EVENTS.WEAPON_UPDATED, (data: any) => {
        console.log('[Pusher] 🔄 Weapon updated:', data);
        callbacksRef.current.onWeaponsChange?.();
      });

      weaponsChannel.bind(PUSHER_EVENTS.WEAPON_DELETED, (data: any) => {
        console.log('[Pusher] 🗑️ Weapon deleted:', data);
        callbacksRef.current.onWeaponsChange?.();
      });
    }

    // S'abonner au canal des types d'armes
    if (callbacksRef.current.onWeaponTypesChange) {
      console.log('[Pusher] 📡 Souscription au canal:', PUSHER_CHANNELS.WEAPON_TYPES);
      const weaponTypesChannel = pusher.subscribe(PUSHER_CHANNELS.WEAPON_TYPES);

      weaponTypesChannel.bind('pusher:subscription_succeeded', () => {
        console.log('[Pusher] ✅ Souscription réussie:', PUSHER_CHANNELS.WEAPON_TYPES);
      });

      weaponTypesChannel.bind(PUSHER_EVENTS.WEAPON_TYPE_CREATED, (data: any) => {
        console.log('[Pusher] 📦 Weapon type created:', data);
        callbacksRef.current.onWeaponTypesChange?.();
      });

      weaponTypesChannel.bind(PUSHER_EVENTS.WEAPON_TYPE_UPDATED, (data: any) => {
        console.log('[Pusher] 🔄 Weapon type updated:', data);
        callbacksRef.current.onWeaponTypesChange?.();
      });

      weaponTypesChannel.bind(PUSHER_EVENTS.WEAPON_TYPE_DELETED, (data: any) => {
        console.log('[Pusher] 🗑️ Weapon type deleted:', data);
        callbacksRef.current.onWeaponTypesChange?.();
      });
    }

    // S'abonner au canal des utilisateurs
    if (callbacksRef.current.onUsersChange) {
      console.log('[Pusher] 📡 Souscription au canal:', PUSHER_CHANNELS.USERS);
      const usersChannel = pusher.subscribe(PUSHER_CHANNELS.USERS);

      usersChannel.bind('pusher:subscription_succeeded', () => {
        console.log('[Pusher] ✅ Souscription réussie:', PUSHER_CHANNELS.USERS);
      });

      usersChannel.bind(PUSHER_EVENTS.USER_UPDATED, (data: any) => {
        console.log('[Pusher] 👤 User updated:', data);
        callbacksRef.current.onUsersChange?.();
      });

      usersChannel.bind(PUSHER_EVENTS.USER_DELETED, (data: any) => {
        console.log('[Pusher] 🗑️ User deleted:', data);
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
