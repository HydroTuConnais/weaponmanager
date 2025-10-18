import Pusher from 'pusher';

// Singleton Pusher instance côté serveur
let pusherInstance: Pusher | null = null;

export function getPusherServer() {
  if (!pusherInstance) {
    const appId = process.env.PUSHER_APP_ID;
    const key = process.env.PUSHER_KEY;
    const secret = process.env.PUSHER_SECRET;
    const cluster = process.env.PUSHER_CLUSTER;

    // Si Pusher n'est pas configuré, retourner null (mode dev sans pusher)
    if (!appId || !key || !secret || !cluster) {
      console.warn('[Pusher] Not configured, real-time updates disabled');
      return null;
    }

    pusherInstance = new Pusher({
      appId,
      key,
      secret,
      cluster,
      useTLS: true,
    });
  }

  return pusherInstance;
}

// Events types
export const PUSHER_EVENTS = {
  WEAPON_CREATED: 'weapon-created',
  WEAPON_UPDATED: 'weapon-updated',
  WEAPON_DELETED: 'weapon-deleted',
  WEAPON_TYPE_CREATED: 'weapon-type-created',
  WEAPON_TYPE_UPDATED: 'weapon-type-updated',
  WEAPON_TYPE_DELETED: 'weapon-type-deleted',
  USER_UPDATED: 'user-updated',
  USER_DELETED: 'user-deleted',
} as const;

// Channels
export const PUSHER_CHANNELS = {
  WEAPONS: 'weapons',
  WEAPON_TYPES: 'weapon-types',
  USERS: 'users',
} as const;

// Helper functions pour trigger des events
export async function triggerWeaponUpdate(event: keyof typeof PUSHER_EVENTS, data?: any) {
  const pusher = getPusherServer();
  if (!pusher) return; // Pusher non configuré

  try {
    await pusher.trigger(PUSHER_CHANNELS.WEAPONS, PUSHER_EVENTS[event], data || {});
    console.log(`[Pusher] Triggered ${event}`);
  } catch (error) {
    console.error('[Pusher] Error triggering event:', error);
  }
}

export async function triggerWeaponTypeUpdate(event: keyof typeof PUSHER_EVENTS, data?: any) {
  const pusher = getPusherServer();
  if (!pusher) return;

  try {
    await pusher.trigger(PUSHER_CHANNELS.WEAPON_TYPES, PUSHER_EVENTS[event], data || {});
    console.log(`[Pusher] Triggered ${event}`);
  } catch (error) {
    console.error('[Pusher] Error triggering event:', error);
  }
}

export async function triggerUserUpdate(event: keyof typeof PUSHER_EVENTS, data?: any) {
  const pusher = getPusherServer();
  if (!pusher) return;

  try {
    await pusher.trigger(PUSHER_CHANNELS.USERS, PUSHER_EVENTS[event], data || {});
    console.log(`[Pusher] Triggered ${event}`);
  } catch (error) {
    console.error('[Pusher] Error triggering event:', error);
  }
}
