'use client';

import { useEffect, useState } from 'react';
import Pusher from 'pusher-js';

let pusherClient: Pusher | null = null;

function getPusherClient() {
  if (!pusherClient) {
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

    if (!key || !cluster) {
      return null;
    }

    pusherClient = new Pusher(key, {
      cluster,
    });
  }

  return pusherClient;
}

export function PusherStatus() {
  const [connectionState, setConnectionState] = useState<string>('initializing');
  const [socketId, setSocketId] = useState<string | null>(null);

  useEffect(() => {
    const pusher = getPusherClient();
    if (!pusher) {
      setConnectionState('unavailable');
      return;
    }

    // État initial
    setConnectionState(pusher.connection.state);

    // Écouter les changements d'état
    const stateChangeHandler = (states: any) => {
      setConnectionState(states.current);
      if (states.current === 'connected') {
        setSocketId(pusher.connection.socket_id);
      }
    };

    pusher.connection.bind('state_change', stateChangeHandler);

    return () => {
      pusher.connection.unbind('state_change', stateChangeHandler);
    };
  }, []);

  const getStatusColor = () => {
    switch (connectionState) {
      case 'connected':
        return 'bg-green-500';
      case 'connecting':
        return 'bg-yellow-500 animate-pulse';
      case 'unavailable':
      case 'failed':
        return 'bg-red-500';
      case 'disconnected':
        return 'bg-gray-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusText = () => {
    switch (connectionState) {
      case 'connected':
        return 'Connecté';
      case 'connecting':
        return 'Connexion...';
      case 'unavailable':
        return 'Non disponible';
      case 'failed':
        return 'Échec';
      case 'disconnected':
        return 'Déconnecté';
      default:
        return 'Initialisation...';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-3 border border-gray-200 z-50">
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${getStatusColor()}`} />
        <div className="text-sm">
          <div className="font-semibold text-gray-700">Pusher</div>
          <div className="text-xs text-gray-500">{getStatusText()}</div>
          {socketId && (
            <div className="text-xs text-gray-400 mt-1">
              Socket: {socketId.substring(0, 8)}...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
